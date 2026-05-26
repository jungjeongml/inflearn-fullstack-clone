"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";
import type { RefObject, SyntheticEvent } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Maximize,
  MessageSquareIcon,
  Minimize,
  Pause,
  Play,
  Volume2,
  VolumeX,
  StarIcon,
  Loader2,
} from "lucide-react";
import {
  Lecture as LectureEntity,
  LectureActivity as LectureActivityEntity,
  UpdateLectureActivityDto,
} from "@/generated/openapi-client";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";
import type { User } from "next-auth";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ReactPlayer는 브라우저 API를 사용하므로 서버 렌더링에서는 제외합니다.
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

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
}: {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  setShowReviewModal: (show: boolean) => void;
}) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (isOpen) {
      setRating(0);
      setContent("");
    }
  }, [isOpen]);

  const createReviewMutation = useMutation({
    mutationFn: () =>
      api.createReview(courseId, {
        content,
        rating,
      }),
    onSuccess: () => {
      toast.success("수강평이 등록되었습니다.");
      setShowReviewModal(false);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "수강평 등록에 실패했습니다.";

      toast.error(message);
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

    createReviewMutation.mutate();
  };

  const isLoading = createReviewMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            힘이 되는 수강평을 남겨주세요!
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
              <span>저장하기</span>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 강의 영상 재생 화면과 커스텀 컨트롤을 한 곳에서 관리하는 컴포넌트입니다.
export function VideoPlayer({
  videoUrl,
  previousLecture,
  nextLecture,
  onLectureChange,
  lecture,
  lectureActivity,
  fullscreenTargetRef,
  courseId,
  user,
}: {
  videoUrl?: string;
  previousLecture: LectureEntity | null;
  nextLecture: LectureEntity | null;
  onLectureChange: (lecture?: LectureEntity | null) => void;
  lecture: LectureEntity;
  lectureActivity?: LectureActivityEntity;
  fullscreenTargetRef?: RefObject<HTMLElement | null>;
  courseId: string;
  user?: User;
}) {
  const updateLectureActivityMutation = useMutation({
    mutationFn: (updateLectureActivityDto: UpdateLectureActivityDto) =>
      api.updateLectureActivity(lecture.id, updateLectureActivityDto),
    onSuccess: (result) => {
      console.log("Update Lecture Activity Success");
      console.log(result);
    },
  });
  // 실제 <video> 엘리먼트와 전체화면 대상 컨테이너를 제어하기 위한 ref입니다.
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const fullscreenTargetRefRef = useRef(fullscreenTargetRef);
  fullscreenTargetRefRef.current = fullscreenTargetRef;

  // 커스텀 컨트롤 UI와 실제 비디오 상태를 동기화하기 위한 재생 상태값입니다.
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(
    getLectureDuration(lecture.duration),
  );
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isPointerInside, setIsPointerInside] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(
    lectureActivity?.isCompleted ?? false,
  );
  const [isEnded, setIsEnded] = useState(false);
  const hasSeekOnReadyRef = useRef(false);
  const [isCenterPlayVisible, setIsCenterPlayVisible] = useState(false);
  const centerPlayTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setIsPointerInside(playerShellRef.current?.matches(":hover") ?? false);
  }, [videoUrl]);

  useEffect(() => {
    setIsCompleted(lectureActivity?.isCompleted ?? false);
    setIsEnded(false);
    setTotalDuration(getLectureDuration(lecture.duration));
  }, [lecture.id, lecture.duration, lectureActivity?.isCompleted]);

  // 강의가 바뀌면 저장된 시청 위치가 있을 경우 그 지점부터 이어 봅니다.
  useEffect(() => {
    if (!playerRef.current) return;

    const savedSeconds = lectureActivity?.duration ?? 0;
    playerRef.current.currentTime = savedSeconds;
    setCurrentTime(savedSeconds);
  }, [lecture.id, lectureActivity?.duration]);

  // 음소거, 볼륨, 배속 상태가 바뀌면 실제 비디오 엘리먼트에 반영합니다.
  useEffect(() => {
    if (!playerRef.current) return;

    playerRef.current.volume = volume;
    playerRef.current.muted = isMuted;
    playerRef.current.playbackRate = playbackRate;
  }, [isMuted, playbackRate, volume]);

  // 재생 상태가 바뀌거나 영상 URL이 바뀌면 실제 비디오의 play/pause를 실행합니다.
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      playPlayer(player);
      return;
    }

    player.pause();
  }, [isPlaying, videoUrl]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenTarget =
        fullscreenTargetRefRef.current?.current ?? playerShellRef.current;

      setIsFullscreen(document.fullscreenElement === fullscreenTarget);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (centerPlayTimerRef.current) {
        clearTimeout(centerPlayTimerRef.current);
      }
    };
  }, []);

  // 브라우저가 계산한 전체 영상 길이를 커스텀 progress bar에 반영합니다.
  const updateDuration = (player = playerRef.current) => {
    const nextDuration =
      getVideoDuration(player) ?? getLectureDuration(lecture.duration);
    if (nextDuration <= 0) return;

    setTotalDuration(nextDuration);
  };

  // 메타데이터 로드 후 영상 길이를 저장하고, 자동재생 상태라면 재생을 시작합니다.
  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    updateDuration(event.currentTarget);

    if (isPlaying) {
      playPlayer(event.currentTarget);
    }
  };

  // 재생/일시정지 버튼 클릭 시 실제 비디오 상태를 기준으로 다음 상태를 결정합니다.
  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;

    const playedRatio = getPlayedRatio(player, totalDuration);

    setIsPlaying(player.paused);
    updateLectureActivityMutation.mutate({
      duration: Math.floor(player.currentTime),
      isCompleted: playedRatio >= 0.95,
      lastWatchedAt: new Date().toISOString(),
      progress: Math.round(playedRatio * 100),
    });
  };

  // progress bar 조작 시 비디오의 현재 재생 위치를 이동합니다.
  const seekTo = (seconds: number) => {
    const player = playerRef.current;
    if (!player) return;

    setIsEnded(false);
    player.currentTime = seconds;
    setCurrentTime(seconds);
  };

  // 음량 슬라이더 조작 시 볼륨을 저장하고, 0이면 음소거 상태로 전환합니다.
  const changeVolume = (nextVolume: number) => {
    setVolume(nextVolume);
    setIsMuted(nextVolume === 0);
  };

  // 전체 플레이어 컨테이너를 브라우저 전체화면 대상으로 사용합니다.
  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    const fullscreenTarget =
      fullscreenTargetRef?.current ?? playerShellRef.current;

    void fullscreenTarget?.requestFullscreen?.();
  };

  const handleProgress = (event: SyntheticEvent<HTMLVideoElement>) => {
    const player = event.currentTarget;
    const playedRatio = getPlayedRatio(player, totalDuration);

    if (!player.ended) {
      setIsEnded(false);
    }
    updateDuration(player);
    setCurrentTime(player.currentTime);
    updateLectureActivityMutation.mutate({
      duration: Math.floor(player.currentTime),
      isCompleted: playedRatio >= 0.95,
      lastWatchedAt: new Date().toISOString(),
      progress: Math.round(playedRatio * 100),
    });
  };

  const handleEnded = () => {
    const endedTime =
      totalDuration || playerRef.current?.duration || currentTime;

    setIsEnded(true);
    setIsCompleted(true);
    setCurrentTime(endedTime);
    updateLectureActivityMutation.mutate({
      duration: Math.round(endedTime),
      isCompleted: true,
      lastWatchedAt: new Date().toISOString(),
      progress: 100,
    });
  };

  const showCenterPlayButton = () => {
    setIsCenterPlayVisible(true);

    if (centerPlayTimerRef.current) {
      clearTimeout(centerPlayTimerRef.current);
    }

    centerPlayTimerRef.current = setTimeout(() => {
      setIsCenterPlayVisible(false);
    }, 300);
  };

  const handlePlayerClick = () => {
    togglePlay();
    showCenterPlayButton();
  };

  return (
    <div
      ref={playerShellRef}
      className="relative box-border flex min-h-0 flex-1 flex-col bg-[#111416]"
      onPointerEnter={() => setIsPointerInside(true)}
      onPointerLeave={() => setIsPointerInside(false)}
    >
      {videoUrl ? (
        <>
          {/* 영상 영역은 남는 높이만 차지하고, 컨트롤 영역을 침범하지 않도록 분리합니다. */}
          <div
            className="relative flex min-h-0 flex-1 basis-0 items-center justify-center overflow-hidden"
            onClick={handlePlayerClick}
          >
            {
              <button
                type="button"
                className={cn(
                  "absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2  rounded-full bg-black/55 text-white size-20 flex items-center justify-center pointer-events-none",
                  isCenterPlayVisible ? "opacity-100" : "opacity-0",
                )}
                aria-label={isPlaying ? "일시정지" : "재생"}
              >
                {isPlaying ? (
                  <Pause className="size-10 fill-white" />
                ) : (
                  <Play className="size-10 fill-white" />
                )}
              </button>
            }
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
              style={{ backgroundColor: "#111416", objectFit: "contain" }}
              onCanPlay={(event) => updateDuration(event.currentTarget)}
              onDurationChange={(event) => updateDuration(event.currentTarget)}
              onLoadedMetadata={handleLoadedMetadata}
              // 브라우저 이벤트를 React 상태에 반영해 커스텀 버튼 표시를 맞춥니다.
              onPause={() => setIsPlaying(false)}
              onPlay={() => setIsPlaying(true)}
              onTimeUpdate={(event) =>
                setCurrentTime(event.currentTarget.currentTime)
              }
              onProgress={handleProgress}
              onEnded={handleEnded}
              onReady={() => {
                if (lectureActivity && !hasSeekOnReadyRef.current) {
                  hasSeekOnReadyRef.current = true;
                  seekTo(lectureActivity.duration);
                }
              }}
            />
          </div>
          {/* 커스텀 컨트롤 바는 영상 위에 겹쳐서 표시해 영상 레이아웃을 밀지 않습니다. */}
          <PlayerControls
            currentTime={currentTime}
            duration={totalDuration}
            isMuted={isMuted}
            isPlaying={isPlaying}
            isPointerInside={isPointerInside}
            isFullscreen={isFullscreen}
            isCompleted={isCompleted}
            isEnded={isEnded}
            playbackRate={playbackRate}
            volume={volume}
            previousLecture={previousLecture}
            nextLecture={nextLecture}
            onFullscreen={toggleFullscreen}
            onLectureChange={onLectureChange}
            onPlaybackRateChange={setPlaybackRate}
            onSeek={seekTo}
            onToggleMuted={() => setIsMuted((prev) => !prev)}
            onTogglePlay={togglePlay}
            onVolumeChange={changeVolume}
            courseId={courseId}
            user={user}
          />
        </>
      ) : (
        // 영상 URL이 없을 때 표시하는 fallback 화면입니다.
        <div className="flex h-full w-full flex-1 items-center justify-center px-6 text-center text-sm text-zinc-400">
          재생할 강의 영상이 없습니다.
        </div>
      )}
    </div>
  );
}

// 재생 조작 버튼, progress bar, 음량, 배속, 강의 이동 버튼을 렌더링합니다.
function PlayerControls({
  currentTime,
  duration,
  isMuted,
  isPlaying,
  isPointerInside,
  isFullscreen,
  isCompleted,
  isEnded,
  nextLecture,
  playbackRate,
  previousLecture,
  volume,
  onFullscreen,
  onLectureChange,
  onPlaybackRateChange,
  onSeek,
  onToggleMuted,
  onTogglePlay,
  onVolumeChange,
  courseId,
  user,
}: {
  currentTime: number;
  duration: number;
  isMuted: boolean;
  isPlaying: boolean;
  isPointerInside: boolean;
  isFullscreen: boolean;
  isCompleted: boolean;
  isEnded: boolean;
  nextLecture: LectureEntity | null;
  playbackRate: number;
  previousLecture: LectureEntity | null;
  volume: number;
  onFullscreen: () => void;
  onLectureChange: (lecture?: LectureEntity | null) => void;
  onPlaybackRateChange: (rate: number) => void;
  onSeek: (seconds: number) => void;
  onToggleMuted: () => void;
  onTogglePlay: () => void;
  onVolumeChange: (volume: number) => void;
  courseId: string;
  user?: User;
}) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  // 현재 재생 위치를 퍼센트로 계산해 progress bar의 채워진 영역에 사용합니다.
  const progress = getProgressPercent(currentTime, duration, isEnded);
  const progressValue = getProgressValue(currentTime, duration, isEnded);
  const volumeProgress = isMuted ? 0 : volume * 100;
  const handleSeekInput = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.FormEvent<HTMLInputElement>,
  ) => {
    onSeek(Number(event.currentTarget.value));
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-3 pt-10">
      <div className="pointer-events-auto mx-auto w-full">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-32 bg-gradient-to-t from-[#111416] via-[#111416]/85 to-transparent" />
        <div
          className={cn(
            "hidden group-hover/player:block",
            isPointerInside && "block",
          )}
        >
          {/* 영상 탐색용 progress bar입니다. 시각 요소는 직접 그리고, 투명 range가 입력만 담당합니다. */}
          <div className="relative h-4 w-full">
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-white/35">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span
              className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary"
              style={{ left: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={progressValue}
              className="absolute inset-0 h-4 w-full cursor-pointer opacity-0"
              onChange={handleSeekInput}
              onInput={handleSeekInput}
              aria-label="재생 위치"
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-4 text-white">
            <div className="flex h-8 min-w-0 items-center gap-3">
              {/* 재생/일시정지 토글 버튼입니다. */}
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

              {/* 음소거 토글 버튼입니다. */}
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

              {/* 음량 조절 슬라이더입니다. */}
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                className="lecture-volume-range h-1.5 w-24 cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--primary) ${volumeProgress}%, rgba(255,255,255,0.35) ${volumeProgress}%)`,
                }}
                onChange={(event) => onVolumeChange(Number(event.target.value))}
                aria-label="음량"
              />

              {/* 현재 시간과 전체 시간을 표시합니다. */}
              <span className="flex h-8 w-28 translate-y-px items-center text-xs leading-none tabular-nums text-white/85">
                {formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}
              </span>
            </div>

            <div className="flex h-8 items-center gap-2">
              {/* 수강평 버튼 */}
              {user && (
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-md transition-colors"
                  aria-label="수강평 작성"
                >
                  <MessageSquareIcon className="size-3" />
                  <span>수강평</span>
                </button>
              )}
              {/* 배속 선택 컨트롤입니다. */}
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

              {/* 전체화면 진입/종료 토글 버튼입니다. */}
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-full hover:bg-white/15"
                onClick={onFullscreen}
                aria-label={isFullscreen ? "전체 화면 종료" : "전체 화면"}
              >
                {isFullscreen ? (
                  <Minimize className="size-5" />
                ) : (
                  <Maximize className="size-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 현재 강의 기준으로 이전/다음 강의 이동과 수강 완료 액션을 제공합니다. */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 items-center rounded-full border border-white/10 bg-[#272b31] px-4 text-white hover:bg-[#333841] hover:text-white"
            onClick={() => onLectureChange(previousLecture)}
            disabled={!previousLecture}
          >
            <ChevronLeft className="size-4 translate-y-0" />
            <span className="leading-none">이전</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 items-center rounded-full border border-white/10 bg-[#272b31] px-4 text-white hover:bg-[#333841] hover:text-white"
            onClick={() => onLectureChange(nextLecture)}
            disabled={!nextLecture}
          >
            <span className="leading-none">다음</span>
            <ChevronRight className="size-4 translate-y-0" />
          </Button>
          <Button
            type="button"
            size="sm"
            disabled
            className={cn(
              "h-8 cursor-default items-center rounded-full border border-white/10 px-4 text-white opacity-100 disabled:opacity-100",
              isCompleted
                ? "bg-primary text-primary-foreground"
                : "bg-[#272b31] text-white",
            )}
          >
            <CheckCircle2
              className={cn(
                "size-4",
                isCompleted
                  ? "fill-emerald-500 text-emerald-200"
                  : "fill-zinc-500 text-zinc-300",
              )}
            />
            <span className="leading-none">봤어요</span>
          </Button>
        </div>
        {/* Review Modal */}
        <ReviewModal
          courseId={courseId}
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          setShowReviewModal={setShowReviewModal}
        />
      </div>
    </div>
  );
}

// play() Promise가 중단될 수 있어 AbortError만 안전하게 무시합니다.
function playPlayer(player: HTMLVideoElement) {
  void player.play().catch((error: unknown) => {
    if (isAbortError(error)) return;
    console.error(error);
  });
}

// pause() 등으로 play() 요청이 취소될 때 발생하는 브라우저 AbortError인지 확인합니다.
function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function getPlayedRatio(player: HTMLVideoElement, fallbackDuration = 0) {
  const duration = getVideoDuration(player) ?? fallbackDuration;
  if (!Number.isFinite(duration) || duration <= 0) return 0;

  return player.currentTime / duration;
}

function getVideoDuration(player?: HTMLVideoElement | null) {
  const duration = player?.duration ?? 0;
  if (!Number.isFinite(duration) || duration <= 0) return undefined;

  return duration;
}

function getLectureDuration(duration?: number) {
  if (!Number.isFinite(duration) || !duration || duration <= 0) return 0;

  return duration;
}

function getProgressPercent(
  currentTime: number,
  duration: number,
  isEnded: boolean,
) {
  if (isEnded) return 100;
  if (!Number.isFinite(duration) || duration <= 0) return 0;

  const progress = (currentTime / duration) * 100;

  return Math.min(100, Math.max(0, progress));
}

function getProgressValue(
  currentTime: number,
  duration: number,
  isEnded: boolean,
) {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  if (isEnded) return duration;

  return Math.min(currentTime, duration);
}

// 초 단위 시간을 플레이어에 표시하기 좋은 h:mm:ss 또는 m:ss 형식으로 변환합니다.
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
