"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Maximize,
  MessageCircleQuestion,
  NotebookTabs,
  Pause,
  Play,
  RotateCcw,
  Search,
  Share2,
  Smile,
  Star,
  Subtitles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type {
  CourseDetailDto,
  Lecture as LectureEntity,
  Section as SectionEntity,
} from "@/generated/openapi-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type StorageInfo = {
  cloudFront?: {
    url?: string;
  };
};

type MenuItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  action: "curriculum" | "planned";
};

const SIDE_MENU_ITEMS: MenuItem[] = [
  { label: "커리큘럼", icon: ListChecks, action: "curriculum" },
  { label: "Q&A", icon: MessageCircleQuestion, action: "planned" },
  { label: "노트", icon: NotebookTabs, action: "planned" },
  { label: "채팅", icon: Smile, action: "planned" },
  { label: "스크립트", icon: Subtitles, action: "planned" },
];

export default function UI({
  course,
  lectureId,
}: {
  course: CourseDetailDto;
  lectureId?: string;
}) {
  const router = useRouter();
  const [isCurriculumOpen, setIsCurriculumOpen] = useState(true);
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

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
    lectures.find((lecture) => lecture.id === lectureId) ?? lectures[0];
  const currentIndex = currentLecture
    ? lectures.findIndex((lecture) => lecture.id === currentLecture.id)
    : -1;
  const previousLecture = currentIndex > 0 ? lectures[currentIndex - 1] : null;
  const nextLecture =
    currentIndex >= 0 && currentIndex < lectures.length - 1
      ? lectures[currentIndex + 1]
      : null;
  const videoUrl = getVideoUrl(currentLecture);

  useEffect(() => {
    if (!playerRef.current) return;

    playerRef.current.volume = volume;
    playerRef.current.muted = isMuted;
    playerRef.current.playbackRate = playbackRate;
  }, [isMuted, playbackRate, volume]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      void player.play().catch((error: unknown) => {
        if (isAbortError(error)) return;
        console.error(error);
      });
      return;
    }

    player.pause();
  }, [isPlaying, videoUrl]);

  const goToLecture = (lecture?: LectureEntity | null) => {
    if (!lecture) return;
    router.push(
      `/courses/lecture?courseId=${course.id}&lectureId=${lecture.id}`,
    );
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.action === "curriculum") {
      setIsCurriculumOpen(true);
      return;
    }

    alert("구현 예정");
  };

  const updateDuration = () => {
    const player = playerRef.current;
    if (!player || Number.isNaN(player.duration)) return;
    setDuration(player.duration);
  };

  const playPlayer = (player: HTMLVideoElement) => {
    void player.play().catch((error: unknown) => {
      if (isAbortError(error)) return;
      console.error(error);
    });
  };

  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    updateDuration();

    if (isPlaying) {
      playPlayer(event.currentTarget);
    }
  };

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;

    setIsPlaying(player.paused);
  };

  const seekTo = (seconds: number) => {
    const player = playerRef.current;
    if (!player) return;

    player.currentTime = seconds;
    setCurrentTime(seconds);
  };

  const changeVolume = (nextVolume: number) => {
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  };

  const toggleFullscreen = () => {
    void playerShellRef.current?.requestFullscreen?.();
  };

  return (
    <main className="h-screen overflow-hidden bg-[#111416] text-white w-screen absolute top-0 left-1/2 -translate-x-1/2">
      <div
        className={cn(
          "grid h-full transition-[grid-template-columns] duration-300",
          isCurriculumOpen
            ? "grid-cols-[minmax(0,1fr)_400px_68px]"
            : "grid-cols-1",
        )}
      >
        <section className="group/player relative flex min-w-0 flex-col bg-[#131314]">
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

          <div
            ref={playerShellRef}
            className="relative box-border flex min-h-0 flex-1 flex-col bg-[#111416]"
          >
            {videoUrl ? (
              <>
                <div className="relative flex min-h-0 flex-1 basis-0 items-center justify-center overflow-hidden">
                  <ReactPlayer
                    ref={playerRef}
                    className="lecture-react-player"
                    src={videoUrl}
                    autoPlay
                    controls={false}
                    muted={isMuted}
                    playsInline
                    width="100%"
                    height="100%"
                    style={{ backgroundColor: "#111416" }}
                    onDurationChange={updateDuration}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onTimeUpdate={(event) =>
                      setCurrentTime(event.currentTarget.currentTime)
                    }
                  />
                </div>
                <PlayerControls
                  currentTime={currentTime}
                  duration={duration}
                  isMuted={isMuted}
                  isPlaying={isPlaying}
                  playbackRate={playbackRate}
                  volume={volume}
                  previousLecture={previousLecture}
                  nextLecture={nextLecture}
                  onComplete={() => alert("구현 예정")}
                  onFullscreen={toggleFullscreen}
                  onLectureChange={goToLecture}
                  onPlaybackRateChange={setPlaybackRate}
                  onSeek={seekTo}
                  onToggleMuted={() => setIsMuted((prev) => !prev)}
                  onTogglePlay={togglePlay}
                  onVolumeChange={changeVolume}
                />
              </>
            ) : (
              <div className="flex h-full w-full flex-1 items-center justify-center px-6 text-center text-sm text-zinc-400">
                재생할 강의 영상이 없습니다.
              </div>
            )}
          </div>

          {!isCurriculumOpen && (
            <CollapsedSideMenu
              className="pointer-events-none absolute right-4 top-1/2 z-30 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/player:pointer-events-auto group-hover/player:opacity-100"
              onItemClick={handleMenuClick}
            />
          )}
        </section>

        {isCurriculumOpen && (
          <>
            <CurriculumPanel
              course={course}
              sections={sections}
              currentLectureId={currentLecture?.id}
              onClose={() => setIsCurriculumOpen(false)}
              onLectureClick={goToLecture}
            />
            <ExpandedSideRail onItemClick={handleMenuClick} />
          </>
        )}
      </div>
    </main>
  );
}

function PlayerControls({
  currentTime,
  duration,
  isMuted,
  isPlaying,
  nextLecture,
  playbackRate,
  previousLecture,
  volume,
  onComplete,
  onFullscreen,
  onLectureChange,
  onPlaybackRateChange,
  onSeek,
  onToggleMuted,
  onTogglePlay,
  onVolumeChange,
}: {
  currentTime: number;
  duration: number;
  isMuted: boolean;
  isPlaying: boolean;
  nextLecture: LectureEntity | null;
  playbackRate: number;
  previousLecture: LectureEntity | null;
  volume: number;
  onComplete: () => void;
  onFullscreen: () => void;
  onLectureChange: (lecture?: LectureEntity | null) => void;
  onPlaybackRateChange: (rate: number) => void;
  onSeek: (seconds: number) => void;
  onToggleMuted: () => void;
  onTogglePlay: () => void;
  onVolumeChange: (volume: number) => void;
}) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative z-30 shrink-0 bg-[#111416] px-4 pb-3 pt-2 shadow-[0_-12px_28px_rgba(0,0,0,0.28)]">
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(currentTime, duration || currentTime)}
        className="lecture-progress-range h-1.5 w-full cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--primary) ${progress}%, rgba(255,255,255,0.35) ${progress}%)`,
        }}
        onChange={(event) => onSeek(Number(event.target.value))}
        aria-label="재생 위치"
      />

      <div className="mt-3 flex items-center justify-between gap-4 text-white">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full hover:bg-white/15"
            onClick={onTogglePlay}
            aria-label={isPlaying ? "일시정지" : "재생"}
          >
            {isPlaying ? (
              <Pause className="size-5 fill-white" />
            ) : (
              <Play className="size-5 fill-white" />
            )}
          </button>

          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full hover:bg-white/15"
            onClick={onToggleMuted}
            aria-label={isMuted ? "음소거 해제" : "음소거"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="size-5" />
            ) : (
              <Volume2 className="size-5" />
            )}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            className="lecture-volume-range h-1.5 w-24 cursor-pointer"
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label="음량"
          />

          <span className="w-28 text-xs tabular-nums text-white/85">
            {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={playbackRate}
            className="h-8 rounded-md border border-white/15 bg-black/40 px-2 text-xs font-semibold text-white outline-none hover:bg-white/10"
            onChange={(event) =>
              onPlaybackRateChange(Number(event.target.value))
            }
            aria-label="재생 속도"
          >
            {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
              <option
                key={rate}
                value={rate}
                className="bg-zinc-950 text-white"
              >
                {rate}x
              </option>
            ))}
          </select>

          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full hover:bg-white/15"
            onClick={onFullscreen}
            aria-label="전체 화면"
          >
            <Maximize className="size-5" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 rounded-full border border-white/10 bg-[#272b31] px-4 text-white hover:bg-[#333841] hover:text-white"
          onClick={() => onLectureChange(previousLecture)}
          disabled={!previousLecture}
        >
          <ChevronLeft className="size-4" />
          이전
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 rounded-full border border-white/10 bg-[#272b31] px-4 text-white hover:bg-[#333841] hover:text-white"
          onClick={() => onLectureChange(nextLecture)}
          disabled={!nextLecture}
        >
          다음
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-8 rounded-full bg-emerald-600/40 px-4 text-emerald-100 hover:bg-emerald-600/55"
          onClick={onComplete}
        >
          <CheckCircle2 className="size-4 fill-emerald-500 text-emerald-200" />
          봤어요
        </Button>
      </div>
    </div>
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

function ExpandedSideRail({
  onItemClick,
}: {
  onItemClick: (item: MenuItem) => void;
}) {
  return (
    <aside className="flex h-full flex-col items-center border-l border-zinc-200 bg-white py-3 text-zinc-500">
      {SIDE_MENU_ITEMS.map((item, index) => (
        <SideMenuButton
          key={item.label}
          item={item}
          active={index === 0}
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

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function formatCompactDuration(seconds?: number) {
  const totalSeconds = seconds ?? 0;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatPlayerTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";

  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
