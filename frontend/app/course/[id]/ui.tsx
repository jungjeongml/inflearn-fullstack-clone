"use client";

import Image from "next/image";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Heart,
  Loader2,
  Lock,
  MessageCircle,
  MonitorPlay,
  PencilIcon,
  Play,
  ShoppingCart,
  Signal,
  Star,
  StarIcon,
  Trash2Icon,
  UserRound,
  Users,
} from "lucide-react";
import type {
  CourseDetailDto,
  CourseReview as CourseReviewEntity,
  Lecture as LectureEntity,
  Section as SectionEntity,
} from "@/generated/openapi-client";
import { getLevelText } from "@/lib/level";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { User } from "next-auth";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const MOCK_INSTRUCTOR_BIO =
  "실무 중심의 커리큘럼으로 학습자가 바로 적용할 수 있는 지식을 전달하는 지식공유자입니다. 복잡한 개념을 작은 예제와 프로젝트 흐름으로 풀어내며, 끝까지 완주할 수 있는 강의를 만드는 데 집중합니다.";

function splitInstructorBio(bio: string) {
  const normalizedBio = bio.trim();
  const lineParts = normalizedBio
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lineParts.length > 1) {
    return {
      headline: lineParts[0],
      rest: lineParts.slice(1).join(" "),
    };
  }

  const sentenceParts = normalizedBio.match(/[^.!?]+[.!?]?/g) ?? [
    normalizedBio,
  ];
  const trimmedSentences = sentenceParts
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return {
    headline: trimmedSentences[0] ?? "",
    rest: trimmedSentences.slice(1).join(" "),
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

function formatTotalDuration(seconds?: number) {
  const totalSeconds = seconds ?? 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

function formatLectureDuration(seconds?: number) {
  const totalSeconds = seconds ?? 0;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}분 ${remainingSeconds.toString().padStart(2, "0")}초`;
}

function getDiscountRate(price: number, discountPrice?: number) {
  if (!discountPrice || discountPrice >= price) return null;
  return Math.round(((price - discountPrice) / price) * 100);
}

function getInstructorName(course: CourseDetailDto) {
  return (
    course.instructor?.name || course.instructor?.email || "인프런 지식공유자"
  );
}

function getReviewUserName(review: CourseReviewEntity) {
  return review.user?.name || review.user?.email || "수강생";
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

function sortSections(sections: SectionEntity[]) {
  return [...sections].sort((a, b) => a.order - b.order);
}

function sortLectures(lectures: LectureEntity[]) {
  return [...lectures].sort((a, b) => a.order - b.order);
}

function NoticeAction({ children }: { children: React.ReactNode }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full border-gray-200 bg-white font-semibold text-gray-800 hover:border-[#00c471] hover:text-[#00a85f]"
      onClick={() => alert("구현 예정입니다.")}
    >
      {children}
    </Button>
  );
}

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={cn(
            "size-4",
            i < rounded
              ? "fill-yellow-400 stroke-yellow-400"
              : "stroke-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}

function InteractiveStarRating({
  rating,
  onRatingChange,
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= (hoverRating || rating);

        return (
          <button
            key={i}
            type="button"
            onClick={() => onRatingChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 transition-colors"
          >
            <StarIcon
              className={cn(
                "size-8 transition-colors",
                isActive
                  ? "fill-yellow-400 stroke-yellow-400"
                  : "stroke-gray-300 hover:stroke-yellow-400",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function ReviewModal({
  courseId,
  isOpen,
  onClose,
  setShowReviewModal,
  editingReview,
}: {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  setShowReviewModal: (show: boolean) => void;
  editingReview?: CourseReviewEntity;
}) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingReview) {
        setRating(editingReview.rating);
        setContent(editingReview.content);
      } else {
        setRating(0);
        setContent("");
      }
    }
  }, [isOpen, editingReview]);

  const createReviewMutation = useMutation({
    mutationFn: () =>
      api.createReview(courseId, {
        content,
        rating,
      }),
    onSuccess: () => {
      toast.success("수강평이 등록되었습니다.");
      setShowReviewModal(false);
      window.location.reload();
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: () =>
      api.updateReview(editingReview!.id, {
        content,
        rating,
      }),
    onSuccess: () => {
      toast.success("수강평이 수정되었습니다.");
      setShowReviewModal(false);
      window.location.reload();
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      alert("별점을 선택해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("수강평을 작성해주세요.");
      return;
    }

    if (editingReview) {
      updateReviewMutation.mutate();
    } else {
      createReviewMutation.mutate();
    }
  };

  const isLoading =
    createReviewMutation.isPending || updateReviewMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            {editingReview
              ? "수강평 수정하기"
              : "힘이 되는 수강평을 남겨주세요!"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <InteractiveStarRating rating={rating} onRatingChange={setRating} />
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="수강평을 작성해보세요!"
            className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <DialogFooter className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <span>{editingReview ? "수정하기" : "저장하기"}</span>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">수강평 삭제</DialogTitle>
          <DialogDescription className="text-center">
            정말로 이 수강평을 삭제하시겠습니까?
            <br />
            삭제된 수강평은 복구할 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "삭제"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type HeroSectionProps = {
  course: CourseDetailDto;
  categoryName: string;
  instructorName: string;
};

function HeroSection({
  course,
  categoryName,
  instructorName,
}: HeroSectionProps) {
  return (
    <section className="bg-[#0F1415] text-white">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-6 lg:py-12">
        <div className="flex min-w-0 flex-col justify-center">
          <Badge className="mb-4 w-fit bg-[#00c471] text-white hover:bg-[#00c471]">
            {categoryName}
          </Badge>
          <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-normal lg:text-4xl">
            {course.title}
          </h1>
          {course.shortDescription && (
            <p className="mt-4 max-w-3xl text-base leading-7 text-gray-300">
              {course.shortDescription}
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-300">
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="size-4 fill-current" />
              <strong>{course.averageRating.toFixed(1)}</strong>
            </span>
            <span>수강평 {course.totalReviews.toLocaleString()}개</span>
            <span>수강생 {course.totalEnrollments.toLocaleString()}명</span>
            <span className="flex items-center gap-1">
              <UserRound className="size-4" />
              {instructorName}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="group relative aspect-video overflow-hidden rounded-lg bg-black text-left shadow-2xl"
          onClick={() =>
            alert("미리보기 또는 강의 재생 기능은 구현 예정입니다.")
          }
        >
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(min-width: 1024px) 360px, 100vw"
              priority
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gray-800 text-sm text-gray-400">
              강의 이미지
            </div>
          )}
          <div className="absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/35" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-white/95 text-[#0F1415] shadow-lg transition-transform group-hover:scale-105">
              <Play className="ml-1 size-8 fill-current" />
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}

function RecentReviewsSection({
  recentReviews,
  averageRating,
}: {
  recentReviews: CourseReviewEntity[];
  averageRating: number;
}) {
  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#00a85f]">Course Reviews</p>
          <h2 className="mt-1 text-2xl font-bold">최근 수강평</h2>
        </div>
        <span className="text-sm text-gray-500">
          평균 {averageRating.toFixed(1)}점
        </span>
      </div>

      {recentReviews.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {recentReviews.map((review) => {
            const reviewerName = getReviewUserName(review);

            return (
              <article
                key={review.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {review.user?.image && (
                        <AvatarImage
                          src={review.user.image}
                          alt={reviewerName}
                        />
                      )}
                      <AvatarFallback>
                        {getInitial(reviewerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{reviewerName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                    <Star className="size-4 fill-current" />
                    {review.rating.toFixed(1)}
                  </span>
                </div>
                <p className="line-clamp-4 text-sm leading-6 text-gray-700">
                  {review.content}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          아직 등록된 수강평이 없습니다.
        </div>
      )}
    </section>
  );
}

function DescriptionSection({ description }: { description?: string }) {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">강의 소개</h2>
      <div
        className="prose prose-gray max-w-none prose-headings:font-bold prose-h2:text-2xl prose-p:leading-7 prose-li:my-1"
        dangerouslySetInnerHTML={{
          __html: description || "<p>강의 소개가 아직 등록되지 않았습니다.</p>",
        }}
      />
    </section>
  );
}

type InstructorSectionProps = {
  instructorName: string;
  instructorImage?: string;
  totalEnrollments: number;
  averageRating: number;
  totalReviews: number;
  totalLectures: number;
  instructorBio: string;
  instructorBioHeadline: string;
  instructorBioRest: string;
};

function InstructorSection({
  instructorName,
  instructorImage,
  totalEnrollments,
  averageRating,
  totalReviews,
  totalLectures,
  instructorBio,
  instructorBioHeadline,
  instructorBioRest,
}: InstructorSectionProps) {
  return (
    <section className="py-2">
      <div className="space-y-7">
        <div>
          <h2 className="text-2xl leading-tight text-gray-900">안녕하세요</h2>
          <h2 className="mt-1 text-2xl font-semibold leading-tight text-gray-900">
            {instructorName} 입니다.
          </h2>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar className="size-20 bg-[#07111B] ring-1 ring-gray-200">
            {instructorImage && (
              <AvatarImage src={instructorImage} alt={instructorName} />
            )}
            <AvatarFallback className="bg-[#07111B] text-xl font-bold text-[#55c8ff]">
              {getInitial(instructorName)}
            </AvatarFallback>
          </Avatar>

          <div className="grid grid-cols-1 gap-x-1 gap-y-3 text-sm text-gray-500 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {totalEnrollments.toLocaleString()}명
              </span>
              <span>수강생</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="size-4 fill-gray-400 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {averageRating.toFixed(1)}점
              </span>
              <span>강의 평점</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {totalReviews.toLocaleString()}개
              </span>
              <span>수강평</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {totalLectures}개
              </span>
              <span>강의</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-2xl font-base leading-9 text-gray-900">
            🚀 {instructorBioHeadline}
          </p>
          {instructorBioRest && (
            <p className="text-lg leading-8 text-gray-700">
              {instructorBioRest}
            </p>
          )}
          <button
            type="button"
            className="text-lg font-medium text-gray-500"
            onClick={() => alert(instructorBio)}
          >
            더보기
          </button>
        </div>
      </div>
    </section>
  );
}

function CurriculumSection({
  courseId,
  sections,
  totalLectures,
  totalDurationText,
}: {
  courseId: string;
  sections: SectionEntity[];
  totalLectures: number;
  totalDurationText: string;
}) {
  const router = useRouter();
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#00a85f]">Curriculum</p>
          <h2 className="mt-1 text-2xl font-bold">커리큘럼</h2>
        </div>
        <p className="text-sm text-gray-500">
          총 {totalLectures}개 수업 · {totalDurationText}
        </p>
      </div>

      <Accordion
        type="multiple"
        defaultValue={sections.slice(0, 2).map((section) => section.id)}
        className="rounded-lg border border-gray-200"
      >
        {sections.map((section) => {
          const lectures = sortLectures(section.lectures ?? []);
          const sectionDuration = lectures.reduce(
            (total, lecture) => total + (lecture.duration ?? 0),
            0,
          );

          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border-gray-200 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="pr-4">
                  <p className="text-base font-semibold">
                    섹션 {section.order}. {section.title}
                  </p>
                  <p className="mt-1 text-xs font-normal text-gray-500">
                    {lectures.length}개 수업 ·{" "}
                    {formatTotalDuration(sectionDuration)}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="divide-y divide-gray-100 rounded-md bg-gray-50">
                  {lectures.map((lecture) => (
                    <div
                      onClick={() => {
                        router.push(
                          `/courses/lecture?courseId=${courseId}&lectureId=${lecture.id}`,
                        );
                      }}
                      key={lecture.id}
                      className={`flex items-center justify-between gap-4 px-4 py-3 ${lecture.videoStorageInfo && "cursor-pointer"}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {lecture.isPreview ? (
                          <MonitorPlay className="size-4 shrink-0 text-gray-400" />
                        ) : (
                          <Lock className="size-4 shrink-0 text-gray-400" />
                        )}
                        <span
                          className={`truncate text-sm text-gray-800 ${lecture.videoStorageInfo && "underline"}`}
                        >
                          {lecture.order}. {lecture.title}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center">
                        {lecture.isPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="inline-flex h-7 items-center justify-center border-[#00c471] px-2.5 text-[#00a85f] hover:text-[#00a85f]"
                          >
                            <span className="flex h-full translate-y-[0.5px] items-center text-[13px] font-bold leading-none">
                              미리보기
                            </span>
                          </Button>
                        )}
                        <span className="w-16 text-right text-xs text-gray-500">
                          {formatLectureDuration(lecture.duration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}

function ReviewsSection({ courseId, user }: { courseId: string; user?: User }) {
  const [page, setPage] = useState(1);
  const sort: "latest" | "oldest" | "rating_high" | "rating_low" = "latest";
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<
    CourseReviewEntity | undefined
  >();
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const pageSize = 10;
  const [totalReviews, setTotalReviews] = useState<CourseReviewEntity[]>([]);
  const [myReviewExists, setMyReviewExists] = useState(false);

  const loadReviews = useCallback(
    async (pageNumber: number, reset = false) => {
      setIsLoading(true);
      try {
        const res = await api.getCourseReviews(
          courseId,
          pageNumber,
          pageSize,
          sort,
        );
        if (res.data?.reviews) {
          setTotalReviews((existingReviews) =>
            reset
              ? res.data!.reviews
              : [...existingReviews, ...res.data!.reviews],
          );
          setHasNext(res.data.hasNext);
          setMyReviewExists(res.data.myReviewExists);
        }
      } catch (error) {
        console.error("Failed to load reviews:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [courseId, sort, pageSize],
  );

  useEffect(() => {
    loadReviews(1, true);
    setPage(1);
  }, [loadReviews]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadReviews(nextPage, false);
  };

  const handleEditReview = (review: CourseReviewEntity) => {
    setEditingReview(review);
    setShowReviewModal(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    setDeletingReviewId(reviewId);
    setShowDeleteDialog(true);
  };

  const deleteReviewMutation = useMutation({
    mutationFn: () => api.deleteReview(deletingReviewId!),
    onSuccess: () => {
      toast.success("수강평이 삭제되었습니다.");
      setShowDeleteDialog(false);
      setDeletingReviewId(null);
      window.location.reload();
    },
    onError: () => {
      toast.error("수강평 삭제에 실패했습니다.");
    },
  });

  const confirmDeleteReview = () => {
    deleteReviewMutation.mutate();
  };

  const handleCloseModal = () => {
    setShowReviewModal(false);
    setEditingReview(undefined);
  };

  return (
    <section id="reviews" className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">수강평</h2>
        {user && !myReviewExists && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            수강평 남기기
          </button>
        )}
      </div>

      <div className="space-y-8">
        {totalReviews.map((r) => (
          <div key={r.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {r.user?.image && (
                  <Image
                    src={r.user.image}
                    alt={r.user.name || "user"}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{r.user?.name ?? "익명"}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <StarRating rating={r.rating} />
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* 수정/삭제 버튼 - 본인 리뷰만 */}
              {user && r.user?.id === user.id && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditReview(r)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {r.content}
            </p>
            {r.instructorReply && (
              <div className="ml-10 border-l-2 pl-4 border-primary">
                <p className="font-medium mb-1 text-primary">지식공유자 답변</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {r.instructorReply}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasNext && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className={cn(
              "px-6 py-2 text-sm font-medium border border-gray-300 rounded-md transition-colors",
              isLoading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50",
            )}
          >
            {isLoading ? "로딩 중..." : "더보기"}
          </button>
        </div>
      )}

      <ReviewModal
        courseId={courseId}
        isOpen={showReviewModal}
        onClose={handleCloseModal}
        setShowReviewModal={setShowReviewModal}
        editingReview={editingReview}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingReviewId(null);
        }}
        onConfirm={confirmDeleteReview}
        isLoading={deleteReviewMutation.isPending}
      />
    </section>
  );
}

type FloatingMenuProps = {
  user?: User;
  course: CourseDetailDto;
  discountRate: number | null;
  displayPrice: number;
  instructorName: string;
  totalDurationText: string;
  levelText: string;
};

function FloatingMenu({
  user,
  course,
  discountRate,
  displayPrice,
  instructorName,
  totalDurationText,
  levelText,
}: FloatingMenuProps) {
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(course.isEnrolled);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const getFavoriteQuery = useQuery({
    queryKey: ["favorite", course.id],
    queryFn: () => api.getFavorite(course.id),
  });

  const addFavoriteMutation = useMutation({
    mutationFn: () => api.addFavorite(course.id),
    onSuccess: () => {
      getFavoriteQuery.refetch();
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: () => api.removeFavorite(course.id),
    onSuccess: () => {
      getFavoriteQuery.refetch();
    },
  });

  const isFavoriteDisabled =
    addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  const handleFavorite = useCallback(() => {
    if (user) {
      if (getFavoriteQuery.data?.data?.isFavorite) {
        removeFavoriteMutation.mutate();
      } else {
        addFavoriteMutation.mutate();
      }
    } else {
      alert("로그인 후 이용해주세요.");
    }
  }, [user, getFavoriteQuery, removeFavoriteMutation, addFavoriteMutation]);

  const enrollMutation = useMutation({
    mutationFn: () => api.enrollCourse(course.id),
    onSuccess: () => {
      setIsEnrolled(true);
      setEnrollDialogOpen(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEnroll = useCallback(() => {
    if (isEnrolled) {
      alert("이미 수강신청한 강의입니다.");
      return;
    }

    if (!user) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    if (course.price > 0) {
      alert("결제 기능은 구현 예정입니다.");
      return;
    }

    enrollMutation.mutate();
  }, [isEnrolled, user, course, enrollMutation]);

  const handleStartLearning = () => {
    setEnrollDialogOpen(false);
    router.push(`/courses/lecture?courseId=${course.id}`);
  };

  return (
    <>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="relative aspect-video bg-gray-900">
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                fill
                className="object-cover"
                sizes="340px"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-gray-400">
                강의 이미지
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-gray-900">
                <Play className="ml-0.5 size-6 fill-current" />
              </span>
            </div>
          </div>

          <div className="p-5">
            {course.price > 0 && (
              <div className="mb-4">
                {discountRate && (
                  <p className="mb-1 text-sm font-bold text-red-500">
                    {discountRate}% 할인
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <strong className="text-2xl font-bold">
                    ₩{formatPrice(displayPrice)}
                  </strong>
                  {course.discountPrice
                    ? course.discountPrice < course.price && (
                        <span className="pb-0.5 text-sm text-gray-400 line-through">
                          ₩{formatPrice(course.price)}
                        </span>
                      )
                    : null}
                </div>
              </div>
            )}
            {course.price === 0 && (
              <div className="mb-4">
                <p className="text-2xl font-bold text-green-500">무료 </p>
              </div>
            )}
            <div className="space-y-2">
              {isEnrolled ? (
                <Button
                  type="button"
                  className={`flex h-12 w-full items-center justify-center bg-primary text-base font-bold text-white`}
                  onClick={() => {
                    router.push(`/courses/lecture?courseId=${course.id}`);
                  }}
                >
                  <span className="translate-y-px">학습으로 이동하기</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  className={`flex h-12 w-full items-center justify-center bg-primary text-base font-bold text-white ${enrollMutation.isPending && "cursor-not-allowed"}`}
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                >
                  <span className="translate-y-px">수강신청 하기</span>
                </Button>
              )}

              <NoticeAction>
                <ShoppingCart className="mr-1 size-4" />
                장바구니에 담기
              </NoticeAction>
              <Button
                onClick={handleFavorite}
                disabled={isFavoriteDisabled}
                type="button"
                variant="outline"
                className={`h-11 w-full border-gray-200 bg-white font-semibold text-gray-800 hover:border-[#00c471] hover:text-[#00a85f] ${getFavoriteQuery.data?.data?.isFavorite ? "border-red-500 text-red-500 hover:border-red-500 hover:text-red-500" : ""}, ${isFavoriteDisabled && "cursor-not-allowed"}`}
              >
                <Heart
                  className={`mr-1 size-4 ${getFavoriteQuery.data?.data?.isFavorite ? "fill-red-500 text-red-500" : ""} ${isFavoriteDisabled && "cursor-not-allowed"}`}
                />
                {getFavoriteQuery.data?.data?.favoriteCount ?? 0}
              </Button>
            </div>

            <Separator className="my-5" />

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <UserRound className="size-4" />
                  지식공유자
                </dt>
                <dd className="font-medium">{instructorName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <BookOpen className="size-4" />
                  강의 수
                </dt>
                <dd className="font-medium">{course.totalLectures}개</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Clock3 className="size-4" />
                  수강 시간
                </dt>
                <dd className="font-medium">{totalDurationText}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Signal className="size-4" />
                  난이도
                </dt>
                <dd className="font-medium">{levelText}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Users className="size-4" />
                  수강생
                </dt>
                <dd className="font-medium">
                  {course.totalEnrollments.toLocaleString()}명
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-md bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4" />이 강의에서 배울 수 있어요
              </p>
              <p className="mt-1">
                섹션별 커리큘럼과 실습 흐름을 따라가며 핵심 개념을 차근차근
                익힙니다.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] gap-0 rounded-2xl p-0 sm:max-w-[520px]">
          <div className="px-6 py-7 sm:px-7">
            <DialogHeader className="gap-0">
              <DialogTitle className="text-xl font-bold leading-none text-gray-900">
                수강신청 완료
              </DialogTitle>
              <DialogDescription className="mt-6 text-base leading-7 text-gray-700">
                수강신청이 완료되었어요.
                <br />
                강의실로 이동하여 바로 학습하시겠어요?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-6 -mx-0 -mb-0 flex-row justify-end gap-3 rounded-none border-t-0 bg-transparent p-0">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 min-w-24 rounded-lg border-gray-200 bg-white px-6 text-base font-bold text-gray-900 hover:bg-gray-50"
                >
                  취소
                </Button>
              </DialogClose>
              <Button
                type="button"
                className="h-12 min-w-36 rounded-lg bg-[#00c471] px-6 text-base font-bold text-white hover:bg-[#00ad63]"
                onClick={handleStartLearning}
              >
                바로 학습 시작
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function UI({
  course,
  user,
}: {
  course: CourseDetailDto;
  user?: User;
}) {
  const categoryName = course.categories?.[0]?.name ?? "강의";
  const instructorName = getInstructorName(course);
  const discountRate = getDiscountRate(course.price, course.discountPrice);
  const displayPrice =
    course.discountPrice && course.discountPrice > 0
      ? course.discountPrice
      : course.price;
  const recentReviews = [...(course.reviews ?? [])]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4);
  const sections = sortSections(course.sections ?? []);
  const totalDurationText = formatTotalDuration(course.totalDuration);
  const levelText = getLevelText(course.level);
  const instructorBio = course.instructor?.bio || MOCK_INSTRUCTOR_BIO;
  const { headline: instructorBioHeadline, rest: instructorBioRest } =
    splitInstructorBio(instructorBio);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <HeroSection
        course={course}
        categoryName={categoryName}
        instructorName={instructorName}
      />

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-6">
        <div className="min-w-0 space-y-14">
          <RecentReviewsSection
            recentReviews={recentReviews}
            averageRating={course.averageRating}
          />
          <DescriptionSection description={course.description} />
          <InstructorSection
            instructorName={instructorName}
            instructorImage={course.instructor?.image}
            totalEnrollments={course.totalEnrollments}
            averageRating={course.averageRating}
            totalReviews={course.totalReviews}
            totalLectures={course.totalLectures}
            instructorBio={instructorBio}
            instructorBioHeadline={instructorBioHeadline}
            instructorBioRest={instructorBioRest}
          />
          <CurriculumSection
            courseId={course.id}
            sections={sections}
            totalLectures={course.totalLectures}
            totalDurationText={totalDurationText}
          />
          <ReviewsSection courseId={course.id} user={user} />
        </div>

        <FloatingMenu
          user={user}
          course={course}
          discountRate={discountRate}
          displayPrice={displayPrice}
          instructorName={instructorName}
          totalDurationText={totalDurationText}
          levelText={levelText}
        />
      </main>
    </div>
  );
}
