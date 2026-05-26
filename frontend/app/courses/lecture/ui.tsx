"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bookmark,
  Check,
  Eye,
  Link2,
  ListChecks,
  MessageCircle,
  MessageCircleQuestion,
  NotebookTabs,
  Pencil,
  RotateCcw,
  Search,
  Share2,
  Smile,
  Star,
  Subtitles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import type {
  CourseComment,
  CourseDetailDto,
  CourseQuestion,
  LectureActivity as LectureActivityEntity,
  Lecture as LectureEntity,
  Section as SectionEntity,
} from "@/generated/openapi-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "./_components/video-player";
import { User } from "next-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { toast } from "sonner";

const CKEditor = dynamic(() => import("@/components/ckeditor"), {
  ssr: false,
});

type StorageInfo = {
  cloudFront?: {
    url?: string;
  };
};

type MenuItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  action: "curriculum" | "qna" | "planned";
};

const SIDE_MENU_ITEMS: MenuItem[] = [
  { label: "커리큘럼", icon: ListChecks, action: "curriculum" },
  { label: "Q&A", icon: MessageCircleQuestion, action: "qna" },
  { label: "노트", icon: NotebookTabs, action: "planned" },
  { label: "채팅", icon: Smile, action: "planned" },
  { label: "스크립트", icon: Subtitles, action: "planned" },
];

const CURRICULUM_OPEN_STORAGE_KEY = "lecture:isCurriculumOpen";
type ActivePanel = "curriculum" | "qna" | null;
type LectureQuestion = Omit<CourseQuestion, "user" | "comments"> & {
  user?: CourseQuestion["user"];
  comments?: CourseComment[];
  _count?: {
    comments?: number;
  };
};

export default function UI({
  course,
  lectureId,
  lectureActivities,
  user,
}: {
  course: CourseDetailDto;
  lectureId?: string;
  lectureActivities: LectureActivityEntity[];
  user?: User;
}) {
  const router = useRouter();
  const playerSectionRef = useRef<HTMLElement | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("curriculum");
  const currentLectureId = lectureId ?? course.sections[0].lectures[0].id;
  const isSidePanelOpen = activePanel !== null;

  useEffect(() => {
    const savedValue = localStorage.getItem(CURRICULUM_OPEN_STORAGE_KEY);

    if (savedValue === null) return;

    setActivePanel(savedValue === "true" ? "curriculum" : null);
  }, []);

  const sections = useMemo(() => sortSections(course.sections ?? []), [course]);
  const lectures = useMemo(() => {
    const lecturesById = new Map(
      (course.lectures ?? []).map((lecture) => [lecture.id, lecture]),
    );

    const sectionLectures = sections.flatMap((section) =>
      sortLectures(section.lectures ?? []).map((lecture) => ({
        ...lecture,
        ...lecturesById.get(lecture.id),
      })),
    );

    return sectionLectures.length > 0
      ? sectionLectures
      : sortLectures(course.lectures ?? []);
  }, [course.lectures, sections]);
  const currentLecture =
    lectures.find((lecture) => lecture.id === currentLectureId) ?? lectures[0];
  const currentIndex = currentLecture
    ? lectures.findIndex((lecture) => lecture.id === currentLectureId)
    : -1;
  const previousLecture = currentIndex > 0 ? lectures[currentIndex - 1] : null;
  const nextLecture =
    currentIndex >= 0 && currentIndex < lectures.length - 1
      ? lectures[currentIndex + 1]
      : null;
  const videoUrl = getVideoUrl(currentLecture);
  const currentLectureActivity = lectureActivities.find(
    (activity) => activity.lectureId === currentLectureId,
  );

  const goToLecture = (lecture?: LectureEntity | null) => {
    if (!lecture) return;
    router.push(
      `/courses/lecture?courseId=${course.id}&lectureId=${lecture.id}`,
    );
  };

  const updateCurriculumOpen = (nextValue: boolean) => {
    setActivePanel(nextValue ? "curriculum" : null);
    localStorage.setItem(CURRICULUM_OPEN_STORAGE_KEY, String(nextValue));
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.action === "curriculum") {
      updateCurriculumOpen(true);
      return;
    }

    if (item.action === "qna") {
      setActivePanel("qna");
      localStorage.setItem(CURRICULUM_OPEN_STORAGE_KEY, "false");
      return;
    }

    alert("구현 예정");
  };

  return (
    <main className="h-screen overflow-hidden bg-[#111416] text-white w-screen absolute top-0 left-1/2 -translate-x-1/2">
      <div
        className={cn(
          "grid h-full transition-[grid-template-columns] duration-300",
          isSidePanelOpen
            ? "grid-cols-[minmax(0,1fr)_400px_68px]"
            : "grid-cols-1",
        )}
      >
        <section
          ref={playerSectionRef}
          className="group/player relative flex min-w-0 flex-col bg-[#131314]"
        >
          <header className="absolute left-0 right-0 top-0 z-20 flex h-14 items-center justify-between bg-gradient-to-b from-black/55 to-transparent px-4">
            <div className="flex flex-1 h-full min-w-0 items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="text-white hover:bg-white/10 hover:text-white"
                onClick={() => router.back()}
                aria-label="뒤로가기"
              >
                <ArrowLeft className="size-6" />
              </Button>
              <h1 className="shrink truncate text-base font-bold pt-1">
                {currentLecture?.title ?? course.title}
              </h1>
            </div>
            <div className="flex items-center gap-6 text-sm font-semibold">
              <button
                type="button"
                className="flex items-center gap-1.5 text-white"
                onClick={() => alert("구현 예정")}
              >
                <Star className="size-4 fill-amber-400 text-amber-400" />
                수강평 작성하기
              </button>
              <button
                type="button"
                className="text-white"
                onClick={() => alert("구현 예정")}
                aria-label="공유하기"
              >
                <Share2 className="size-5 fill-white" />
              </button>
            </div>
          </header>

          <VideoPlayer
            videoUrl={videoUrl}
            previousLecture={previousLecture}
            nextLecture={nextLecture}
            onLectureChange={goToLecture}
            lecture={currentLecture}
            lectureActivity={currentLectureActivity}
            fullscreenTargetRef={playerSectionRef}
            courseId={course.id}
            user={user}
          />

          {!isSidePanelOpen && (
            <CollapsedSideMenu
              className="pointer-events-none absolute right-4 top-1/2 z-30 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/player:pointer-events-auto group-hover/player:opacity-100"
              onItemClick={handleMenuClick}
            />
          )}
        </section>

        {isSidePanelOpen && (
          <>
            {activePanel === "curriculum" && (
              <CurriculumPanel
                course={course}
                sections={sections}
                currentLectureId={currentLecture?.id}
                onClose={() => updateCurriculumOpen(false)}
                onLectureClick={goToLecture}
              />
            )}
            {activePanel === "qna" && (
              <QnaPanel
                courseId={course.id}
                onClose={() => setActivePanel(null)}
                user={user}
              />
            )}
            <ExpandedSideRail
              activeAction={activePanel}
              onItemClick={handleMenuClick}
            />
          </>
        )}
      </div>
    </main>
  );
}

function CurriculumPanel({
  course,
  sections,
  currentLectureId,
  onClose,
  onLectureClick,
}: {
  course: CourseDetailDto;
  sections: SectionEntity[];
  currentLectureId?: string;
  onClose: () => void;
  onLectureClick: (lecture: LectureEntity) => void;
}) {
  const orderedLectures = sections.flatMap((section) =>
    sortLectures(section.lectures ?? []),
  );
  const currentLectureIndex = orderedLectures.findIndex(
    (lecture) => lecture.id === currentLectureId,
  );

  return (
    <aside className="min-h-0 border-l border-zinc-200 bg-white text-zinc-950">
      <div className="flex h-16 items-center justify-between border-zinc-200 px-6">
        <h2 className="text-lg font-extrabold pt-0.5">커리큘럼</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-zinc-500 hover:text-zinc-900"
          onClick={onClose}
          aria-label="커리큘럼 닫기"
        >
          <X className="size-4" />
        </Button>
      </div>

      <Tabs defaultValue="lectures" className="h-[calc(100%-4rem)]">
        <TabsList
          variant="line"
          className="h-12 w-full justify-start gap-6 rounded-none border-b border-zinc-200 bg-white px-5 py-0"
        >
          <TabsTrigger
            value="lectures"
            className="h-hull flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 text-lg font-bold shadow-none after:hidden data-active:border-b-zinc-950 data-active:bg-transparent data-active:shadow-none"
          >
            수업
          </TabsTrigger>
          <TabsTrigger
            value="missions"
            className="h-full flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 text-lg font-bold shadow-none after:hidden data-active:border-b-zinc-950 data-active:bg-transparent data-active:shadow-none"
          >
            미션
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="h-full flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 text-lg font-bold shadow-none after:hidden data-active:border-b-zinc-950 data-active:bg-transparent data-active:shadow-none"
          >
            결과물
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100%-3rem)]">
          <div>
            {sections.map((section) => (
              <div key={section.id}>
                {sortLectures(section.lectures ?? []).map((lecture) => {
                  const active = lecture.id === currentLectureId;
                  const lectureIndex = orderedLectures.findIndex(
                    (orderedLecture) => orderedLecture.id === lecture.id,
                  );
                  const completed =
                    currentLectureIndex > -1 &&
                    lectureIndex < currentLectureIndex;

                  return (
                    <button
                      key={lecture.id}
                      type="button"
                      className={cn(
                        "flex min-h-[72px] w-full gap-3 border-b border-zinc-200 px-5 py-4 text-left transition-colors hover:bg-emerald-50/70",
                        active &&
                          "border-l-4 border-l-emerald-500 bg-emerald-50 pl-4",
                      )}
                      onClick={() => onLectureClick(lecture)}
                    >
                      <span
                        className={cn(
                          "mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg",
                          completed || active
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-zinc-100 text-zinc-300",
                        )}
                      >
                        {completed || active ? (
                          <Check className="size-4 stroke-[3]" />
                        ) : (
                          <RotateCcw className="size-4" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-sm font-medium leading-5 text-zinc-900">
                          {lecture.order}. {lecture.title}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {formatCompactDuration(lecture.duration)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
            <button
              type="button"
              className="flex min-h-[72px] w-full items-center gap-3 border-b border-zinc-200 px-5 py-4 text-left hover:bg-zinc-50"
              onClick={() => alert("구현 예정")}
            >
              <Search className="size-5 shrink-0 text-zinc-500" />
              <span>
                <span className="block text-sm font-medium text-zinc-900">
                  {course.title} 검색 & 이어보기 인증
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  미션 · 시작 전
                </span>
              </span>
            </button>
          </div>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}

function QnaPanel({
  courseId,
  onClose,
  user,
}: {
  courseId: string;
  onClose: () => void;
  user?: User;
}) {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "compose" | "detail">("list");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [answerContent, setAnswerContent] = useState("");
  const [isAnswerEditorOpen, setIsAnswerEditorOpen] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const currentUserId = getCurrentUserId(user);

  const questionsQuery = useQuery({
    queryKey: ["course-questions", courseId],
    queryFn: async () => {
      const result = await api.findAllQuestions(courseId);

      if (result.error) {
        throw new Error(getApiErrorMessage(result.error));
      }

      return (result.data ?? []) as LectureQuestion[];
    },
  });

  const questionDetailQuery = useQuery({
    queryKey: ["course-question", selectedQuestionId],
    enabled: view === "detail" && Boolean(selectedQuestionId),
    queryFn: async () => {
      if (!selectedQuestionId) return null;

      const result = await api.findOneQuestion(selectedQuestionId);

      if (result.error) {
        throw new Error(getApiErrorMessage(result.error));
      }

      return result.data as LectureQuestion;
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async () => {
      const result = await api.createQuestion(courseId, { title, content });

      if (result.error) {
        throw new Error(getApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["course-questions", courseId],
      });
      setTitle("");
      setContent("");
      setView("list");
      toast.success("질문이 등록되었습니다.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!editingQuestionId) return null;

      const result = await api.updateQuestion(editingQuestionId, {
        title,
        content,
      });

      if (result.error) {
        throw new Error(getApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: async (question) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["course-questions", courseId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["course-question", editingQuestionId],
        }),
      ]);
      setEditingQuestionId(null);
      setSelectedQuestionId(question?.id ?? selectedQuestionId);
      setView("detail");
      toast.success("질문이 수정되었습니다.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const result = await api.removeQuestion(questionId);

      if (result.error) {
        throw new Error(getApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["course-questions", courseId],
      });
      setSelectedQuestionId(null);
      setView("list");
      toast.success("질문이 삭제되었습니다.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedQuestionId) return null;

      const result = await api.createComment(selectedQuestionId, {
        content: answerContent,
      });

      if (result.error) {
        throw new Error(getApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["course-questions", courseId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["course-question", selectedQuestionId],
        }),
      ]);
      setAnswerContent("");
      setIsAnswerEditorOpen(false);
      toast.success("답변이 등록되었습니다.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async () => {
      if (!editingCommentId) return null;

      const result = await api.updateComment(editingCommentId, {
        content: answerContent,
      });

      if (result.error) {
        throw new Error(getApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["course-questions", courseId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["course-question", selectedQuestionId],
        }),
      ]);
      setAnswerContent("");
      setEditingCommentId(null);
      setIsAnswerEditorOpen(false);
      toast.success("답변이 수정되었습니다.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const result = await api.removeComment(commentId);

      if (result.error) {
        throw new Error(getApiErrorMessage(result.error));
      }

      return result.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["course-questions", courseId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["course-question", selectedQuestionId],
        }),
      ]);
      toast.success("답변이 삭제되었습니다.");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const questions = questionsQuery.data ?? [];
  const normalizedKeyword = searchKeyword.trim().toLowerCase();
  const filteredQuestions = questions.filter((question) => {
    if (!normalizedKeyword) return true;

    return `${question.title} ${stripHtml(question.content)}`
      .toLowerCase()
      .includes(normalizedKeyword);
  });
  const selectedQuestion = questionDetailQuery.data;
  const isSelectedQuestionOwner =
    Boolean(currentUserId) && selectedQuestion?.userId === currentUserId;

  const openDetail = (question: LectureQuestion) => {
    setSelectedQuestionId(question.id);
    setView("detail");
    setIsAnswerEditorOpen(false);
    setEditingQuestionId(null);
    setEditingCommentId(null);
    setAnswerContent("");
  };

  const openCreateQuestion = () => {
    setEditingQuestionId(null);
    setTitle("");
    setContent("");
    setView("compose");
  };

  const openEditQuestion = (question: LectureQuestion) => {
    setEditingQuestionId(question.id);
    setTitle(question.title);
    setContent(question.content);
    setView("compose");
  };

  const cancelCompose = () => {
    if (editingQuestionId) {
      setView("detail");
      setEditingQuestionId(null);
      return;
    }

    setTitle("");
    setContent("");
    setView("list");
  };

  const removeSelectedQuestion = () => {
    if (!selectedQuestion) return;
    if (!window.confirm("질문을 삭제하시겠습니까?")) return;

    removeQuestionMutation.mutate(selectedQuestion.id);
  };

  const openCreateAnswer = () => {
    setEditingCommentId(null);
    setAnswerContent("");
    setIsAnswerEditorOpen(true);
  };

  const openEditAnswer = (comment: CourseComment) => {
    setEditingCommentId(comment.id);
    setAnswerContent(comment.content);
    setIsAnswerEditorOpen(true);
  };

  const cancelAnswerEditor = () => {
    setAnswerContent("");
    setEditingCommentId(null);
    setIsAnswerEditorOpen(false);
  };

  const removeAnswer = (comment: CourseComment) => {
    if (!window.confirm("답변을 삭제하시겠습니까?")) return;

    removeCommentMutation.mutate(comment.id);
  };

  const submitQuestion = () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }

    if (!stripHtml(content).trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    if (editingQuestionId) {
      updateQuestionMutation.mutate();
      return;
    }

    createQuestionMutation.mutate();
  };

  const submitAnswer = () => {
    if (!stripHtml(answerContent).trim()) {
      toast.error("답변 내용을 입력해주세요.");
      return;
    }

    if (editingCommentId) {
      updateCommentMutation.mutate();
      return;
    }

    createCommentMutation.mutate();
  };

  return (
    <aside className="flex min-h-0 flex-col border-l border-zinc-200 bg-white text-zinc-950">
      {view === "list" && (
        <>
          <div className="flex h-14 items-center justify-between px-3">
            <h2 className="text-xl font-extrabold">Q&A</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-zinc-500 hover:text-zinc-900"
              onClick={onClose}
              aria-label="Q&A 닫기"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="px-3 pb-4 pt-1">
            <label className="relative block">
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="h-12 w-full rounded-md border border-zinc-300 bg-white pl-4 pr-11 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-500"
                placeholder="질문을 검색해보세요."
                aria-label="질문 검색"
              />
              <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-zinc-500" />
            </label>
          </div>

          <ScrollArea className="min-h-0 flex-1 px-3">
            {questionsQuery.isLoading ? (
              <div className="py-24 text-center text-sm text-zinc-500">
                질문을 불러오고 있습니다.
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center px-8 py-20 text-center">
                <div className="mb-7 flex h-16 w-20 items-center justify-center rounded-full bg-zinc-100 text-zinc-300 shadow-inner">
                  <MessageCircleQuestion className="size-10" />
                </div>
                <p className="text-sm leading-6 text-zinc-900">
                  현재 수업에는 질문이 없어요.
                  <br />
                  전체 질문에서 찾아보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-3 pb-5">
                {filteredQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    onClick={() => openDetail(question)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>

          <button
            type="button"
            className="h-16 w-full bg-emerald-500 text-base font-bold text-white transition-colors hover:bg-emerald-600 disabled:bg-zinc-300"
            onClick={openCreateQuestion}
            disabled={!user}
          >
            글 작성하기
          </button>
        </>
      )}

      {view === "compose" && (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex h-12 shrink-0 items-center justify-between px-3">
            <button
              type="button"
              className="text-sm font-semibold text-zinc-500 hover:text-zinc-900"
              onClick={cancelCompose}
            >
              취소
            </button>
            <Button
              type="button"
              size="sm"
              className="bg-emerald-500 font-bold hover:bg-emerald-600"
              onClick={submitQuestion}
              disabled={
                createQuestionMutation.isPending ||
                updateQuestionMutation.isPending
              }
            >
              확인
            </Button>
          </div>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
            <div className="w-full min-w-0 space-y-5 px-3 pb-5">
              <label className="block min-w-0">
                <span className="mb-2 block text-sm font-medium text-zinc-900">
                  제목
                </span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-emerald-500"
                  placeholder="제목에 핵심 내용을 요약해보세요."
                />
              </label>

              <div className="min-w-0">
                <span className="mb-2 block text-sm font-medium text-zinc-900">
                  내용
                </span>
                <div className="w-full min-w-0 overflow-hidden rounded-md border border-zinc-300 [&_.ck.ck-editor]:w-full [&_.ck-toolbar]:max-w-full [&_.ck-toolbar]:flex-wrap [&_.ck-editor-container]:max-w-none [&_.ck-editor-container]:p-0 [&_.ck-editor__editable]:min-h-[420px] [&_.ck-editor__editable]:text-sm">
                  <CKEditor value={content} onChange={setContent} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === "detail" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-12 items-center justify-between px-3">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-zinc-500 hover:text-zinc-900"
              onClick={() => setView("list")}
              aria-label="질문 목록으로 돌아가기"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-zinc-500 hover:text-zinc-900"
              onClick={onClose}
              aria-label="Q&A 닫기"
            >
              <X className="size-4" />
            </Button>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            {questionDetailQuery.isLoading || !selectedQuestion ? (
              <div className="px-4 py-24 text-center text-sm text-zinc-500">
                질문을 불러오고 있습니다.
              </div>
            ) : (
              <div>
                <div className="border-b border-zinc-200 px-3 pb-8 pt-1">
                  <p className="mb-2 text-sm font-semibold text-sky-500">
                    질문
                  </p>
                  <h2 className="text-lg font-medium leading-7 text-zinc-950">
                    {selectedQuestion.title}
                  </h2>
                  <p className="mt-5 text-xs text-zinc-500">
                    {getUserName(selectedQuestion.user)} ·{" "}
                    {formatQuestionDate(selectedQuestion.createdAt)} · 조회수{" "}
                    {getViewCount(selectedQuestion)}
                  </p>
                  {isSelectedQuestionOwner && (
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        onClick={() => openEditQuestion(selectedQuestion)}
                      >
                        <Pencil className="size-3.5" />
                        수정
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                        onClick={removeSelectedQuestion}
                        disabled={removeQuestionMutation.isPending}
                      >
                        <Trash2 className="size-3.5" />
                        삭제
                      </button>
                    </div>
                  )}
                  <div className="mt-5 flex gap-4">
                    <QuestionVotes />
                    <div
                      className="prose prose-zinc max-w-none text-sm leading-7 text-zinc-800"
                      dangerouslySetInnerHTML={{
                        __html: selectedQuestion.content,
                      }}
                    />
                  </div>
                  <div className="mt-8 flex justify-center gap-3">
                    <button
                      type="button"
                      className="flex size-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-emerald-500 hover:text-emerald-600"
                      aria-label="북마크"
                    >
                      <Bookmark className="size-5" />
                    </button>
                    <button
                      type="button"
                      className="flex size-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:border-emerald-500 hover:text-emerald-600"
                      aria-label="링크 복사"
                    >
                      <Link2 className="size-5" />
                    </button>
                  </div>
                </div>

                <div className="px-3 py-5">
                  <h3 className="mb-4 text-lg font-extrabold">
                    답변{" "}
                    <span className="text-emerald-600">
                      {selectedQuestion.comments?.length ?? 0}
                    </span>
                  </h3>

                  <div className="space-y-8">
                    {(selectedQuestion.comments ?? []).map((comment) => (
                      <AnswerItem
                        key={comment.id}
                        comment={comment}
                        isOwner={Boolean(currentUserId) && comment.userId === currentUserId}
                        onEdit={() => openEditAnswer(comment)}
                        onRemove={() => removeAnswer(comment)}
                        isRemoving={removeCommentMutation.isPending}
                      />
                    ))}
                  </div>

                  {!isAnswerEditorOpen && (
                    <button
                      type="button"
                      className="mt-6 text-sm font-semibold text-zinc-500 hover:text-emerald-600 disabled:text-zinc-300"
                      onClick={openCreateAnswer}
                      disabled={!user}
                    >
                      답글 달기
                    </button>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
          {isAnswerEditorOpen && (
            <div className="shrink-0 border-t border-zinc-200 bg-white px-3 py-3 shadow-[0_-8px_18px_rgba(0,0,0,0.04)]">
              <div className="overflow-hidden rounded-md border border-zinc-300 [&_.ck-editor-container]:max-w-none [&_.ck-editor-container]:p-0 [&_.ck-editor__editable]:max-h-[180px] [&_.ck-editor__editable]:min-h-[120px] [&_.ck-editor__editable]:text-sm">
                <CKEditor value={answerContent} onChange={setAnswerContent} />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    cancelAnswerEditor();
                  }}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-500 font-bold hover:bg-emerald-600"
                  onClick={submitAnswer}
                  disabled={
                    createCommentMutation.isPending ||
                    updateCommentMutation.isPending
                  }
                >
                  확인
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function QuestionCard({
  question,
  onClick,
}: {
  question: LectureQuestion;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full rounded-md border border-zinc-200 bg-white p-3 text-left shadow-sm transition-colors hover:border-emerald-400"
      onClick={onClick}
    >
      <span className="mb-3 inline-flex rounded bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-400">
        전체질문
      </span>
      <strong className="line-clamp-1 block text-base font-medium text-zinc-950">
        {question.title}
      </strong>
      <p className="mt-2 line-clamp-1 text-sm text-zinc-500">
        {stripHtml(question.content)}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-zinc-500">
        <span className="min-w-0 truncate">
          {getUserName(question.user)} ·{" "}
          {formatQuestionDate(question.createdAt)}
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <ThumbsUp className="size-4" />0
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-4" />
            {getViewCount(question)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-4" />
            {question._count?.comments ?? question.comments?.length ?? 0}
          </span>
        </span>
      </div>
    </button>
  );
}

function QuestionVotes() {
  return (
    <div className="flex w-8 shrink-0 flex-col items-center gap-2 text-zinc-300">
      <ThumbsUp className="size-6 fill-current" />
      <span className="text-sm font-bold text-zinc-900">0</span>
      <ThumbsDown className="size-6 fill-current" />
    </div>
  );
}

function AnswerItem({
  comment,
  isOwner,
  onEdit,
  onRemove,
  isRemoving,
}: {
  comment: CourseComment;
  isOwner: boolean;
  onEdit: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  return (
    <div className="flex gap-4">
      <QuestionVotes />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-500">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
              {getUserInitial(comment.user)}
            </span>
            <span className="truncate font-bold text-zinc-800">
              {getUserName(comment.user)}
            </span>
            <span className="shrink-0">{formatAnswerDate(comment.createdAt)}</span>
          </div>
          {isOwner && (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                onClick={onEdit}
              >
                <Pencil className="size-3.5" />
                수정
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-50"
                onClick={onRemove}
                disabled={isRemoving}
              >
                <Trash2 className="size-3.5" />
                삭제
              </button>
            </div>
          )}
        </div>
        <div
          className="prose prose-zinc max-w-none text-sm leading-7 text-zinc-800"
          dangerouslySetInnerHTML={{ __html: comment.content }}
        />
      </div>
    </div>
  );
}

function ExpandedSideRail({
  activeAction,
  onItemClick,
}: {
  activeAction: ActivePanel;
  onItemClick: (item: MenuItem) => void;
}) {
  return (
    <aside className="flex h-full flex-col items-center border-l border-zinc-200 bg-white py-3 text-zinc-500">
      {SIDE_MENU_ITEMS.map((item) => (
        <SideMenuButton
          key={item.label}
          item={item}
          active={item.action === activeAction}
          onClick={() => onItemClick(item)}
        />
      ))}
    </aside>
  );
}

function CollapsedSideMenu({
  className,
  onItemClick,
}: {
  className?: string;
  onItemClick: (item: MenuItem) => void;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md bg-white py-2 text-zinc-500 shadow-lg",
        className,
      )}
    >
      {SIDE_MENU_ITEMS.map((item) => (
        <SideMenuButton
          key={item.label}
          item={item}
          active={false}
          compact
          onClick={() => onItemClick(item)}
        />
      ))}
    </div>
  );
}

function SideMenuButton({
  item,
  active,
  compact = false,
  onClick,
}: {
  item: MenuItem;
  active: boolean;
  compact?: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      className={cn(
        "flex w-full flex-col items-center justify-center gap-1 px-2 py-3 text-xs font-medium transition-colors hover:text-emerald-600",
        compact ? "w-[68px]" : "w-[72px]",
        active && "text-emerald-600",
      )}
      onClick={onClick}
    >
      <Icon className={cn("size-6", active && "stroke-[2.5]")} />
      <span className="text-[11px] leading-none">{item.label}</span>
    </button>
  );
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string") return message;
  }

  return "요청을 처리하지 못했습니다.";
}

function getCurrentUserId(user?: User) {
  return (user as (User & { id?: string }) | undefined)?.id;
}

function stripHtml(value?: string) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getUserName(user?: Pick<CourseQuestion["user"], "name" | "email">) {
  return user?.name || user?.email || "작성자 없음";
}

function getUserInitial(user?: Pick<CourseQuestion["user"], "name" | "email">) {
  const name = getUserName(user);

  return name.charAt(0).toUpperCase();
}

function getViewCount(question: Pick<LectureQuestion, "id">) {
  void question;

  return 0;
}

function formatQuestionDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day}. ${hours}:${minutes}`;
}

function formatAnswerDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}. ${month}. ${day}.`;
}

function sortSections(sections: SectionEntity[]) {
  return [...sections].sort((a, b) => a.order - b.order);
}

function sortLectures(lectures: LectureEntity[]) {
  return [...lectures].sort((a, b) => a.order - b.order);
}

function getVideoUrl(lecture?: LectureEntity) {
  const rawStorageInfo = lecture?.videoStorageInfo;
  const storageInfo =
    typeof rawStorageInfo === "string"
      ? tryParseStorageInfo(rawStorageInfo)
      : (rawStorageInfo as StorageInfo | undefined);

  return storageInfo?.cloudFront?.url;
}

function tryParseStorageInfo(value: string) {
  try {
    return JSON.parse(value) as StorageInfo;
  } catch {
    return undefined;
  }
}

function formatCompactDuration(seconds?: number) {
  const totalSeconds = seconds ?? 0;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
