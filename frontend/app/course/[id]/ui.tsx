"use client";

import Image from "next/image";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Heart,
  MessageCircle,
  MonitorPlay,
  Play,
  ShoppingCart,
  Signal,
  Star,
  UserRound,
  Users,
  Lock,
} from "lucide-react";
import type {
  CourseDetailDto,
  CourseReview,
  Lecture,
  Section,
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
import { Separator } from "@/components/ui/separator";

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

  const sentenceParts = normalizedBio.match(/[^.!?]+[.!?]?/g) ?? [normalizedBio];
  const trimmedSentences = sentenceParts
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  return {
    headline: trimmedSentences[0] ?? "",
    rest: trimmedSentences.slice(1).join(" "),
  };
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

function getReviewUserName(review: CourseReview) {
  return review.user?.name || review.user?.email || "수강생";
}

function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

function sortSections(sections: Section[]) {
  return [...sections].sort((a, b) => a.order - b.order);
}

function sortLectures(lectures: Lecture[]) {
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

export default function UI({ course }: { course: CourseDetailDto }) {
  const categoryName = course.categories?.[0]?.name ?? "강의";
  const instructorName = getInstructorName(course);
  const discountRate = getDiscountRate(course.price, course.discountPrice);
  const displayPrice = course.discountPrice ?? course.price;
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

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-6">
        <div className="min-w-0 space-y-14">
          <section>
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#00a85f]">
                  Course Reviews
                </p>
                <h2 className="mt-1 text-2xl font-bold">최근 수강평</h2>
              </div>
              <span className="text-sm text-gray-500">
                평균 {course.averageRating.toFixed(1)}점
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
                            <p className="text-sm font-semibold">
                              {reviewerName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString(
                                "ko-KR",
                              )}
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

          <section>
            <h2 className="mb-6 text-2xl font-bold">강의 소개</h2>
            <div
              className="prose prose-gray max-w-none prose-headings:font-bold prose-h2:text-2xl prose-p:leading-7 prose-li:my-1"
              dangerouslySetInnerHTML={{
                __html:
                  course.description ||
                  "<p>강의 소개가 아직 등록되지 않았습니다.</p>",
              }}
            />
          </section>

          <section className="py-2">
            <div className="space-y-7">
              <div>
                <h2 className="text-2xl leading-tight text-gray-900">
                  안녕하세요
                </h2>
                <h2 className="mt-1 text-2xl font-semibold leading-tight text-gray-900">
                  {instructorName} 입니다.
                </h2>
              </div>

              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <Avatar className="size-20 bg-[#07111B] ring-1 ring-gray-200">
                  {course.instructor?.image && (
                    <AvatarImage
                      src={course.instructor.image}
                      alt={instructorName}
                    />
                  )}
                  <AvatarFallback className="bg-[#07111B] text-xl font-bold text-[#55c8ff]">
                    {getInitial(instructorName)}
                  </AvatarFallback>
                </Avatar>

                <div className="grid grid-cols-1 gap-x-1 gap-y-3 text-sm text-gray-500 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {course.totalEnrollments.toLocaleString()}명
                    </span>
                    <span>수강생</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="size-4 fill-gray-400 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {course.averageRating.toFixed(1)}점
                    </span>
                    <span>강의 평점</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="size-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {course.totalReviews.toLocaleString()}개
                    </span>
                    <span>수강평</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {course.totalLectures}개
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

          <section>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#00a85f]">
                  Curriculum
                </p>
                <h2 className="mt-1 text-2xl font-bold">커리큘럼</h2>
              </div>
              <p className="text-sm text-gray-500">
                총 {course.totalLectures}개 수업 · {totalDurationText}
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
                            key={lecture.id}
                            className="flex items-center justify-between gap-4 px-4 py-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              {lecture.isPreview ? (
                                <MonitorPlay className="size-4 shrink-0 text-gray-400" />
                              ) : (
                                <Lock className="size-4 shrink-0 text-gray-400" />
                              )}
                              <span className="truncate text-sm text-gray-800">
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
                                  onClick={() =>
                                    alert("미리보기 기능은 구현 예정입니다.")
                                  }
                                >
                                  <span className="flex h-full items-center text-[13px] font-bold leading-none translate-y-[0.5px]">
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

          <section>
            <div className="mb-6">
              <p className="text-sm font-semibold text-[#00a85f]">Reviews</p>
              <h2 className="mt-1 text-2xl font-bold">수강평</h2>
            </div>
            <div className="mb-6 rounded-lg border border-gray-200 p-6 text-center">
              <div className="text-4xl font-bold">
                {course.averageRating.toFixed(1)}
              </div>
              <div className="mt-2 flex justify-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`size-5 ${
                      index < Math.round(course.averageRating)
                        ? "fill-current"
                        : ""
                    }`}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {course.totalReviews.toLocaleString()}개의 수강평
              </p>
            </div>

            <div className="space-y-5">
              {(course.reviews ?? []).map((review) => {
                const reviewerName = getReviewUserName(review);

                return (
                  <article
                    key={review.id}
                    className="border-b border-gray-200 pb-5 last:border-b-0"
                  >
                    <div className="mb-3 flex items-start gap-3">
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
                        <p className="font-semibold">{reviewerName}</p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex text-amber-400">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                className={`size-3 ${
                                  index < review.rating ? "fill-current" : ""
                                }`}
                              />
                            ))}
                          </span>
                          <span>
                            {new Date(review.createdAt).toLocaleDateString(
                              "ko-KR",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-7 text-gray-700">
                      {review.content}
                    </p>
                    {review.instructorReply && (
                      <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                        <p className="mb-1 font-semibold text-gray-900">
                          지식공유자 답변
                        </p>
                        {review.instructorReply}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>

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
                  {course.discountPrice &&
                    course.discountPrice < course.price && (
                      <span className="pb-0.5 text-sm text-gray-400 line-through">
                        ₩{formatPrice(course.price)}
                      </span>
                    )}
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  className="h-12 w-full bg-[#00c471] text-base font-bold text-white hover:bg-[#00ad63]"
                  onClick={() => alert("수강신청 기능은 구현 예정입니다.")}
                >
                  수강신청 하기
                </Button>
                <NoticeAction>
                  <ShoppingCart className="mr-1 size-4" />
                  장바구니에 담기
                </NoticeAction>
                <NoticeAction>
                  <Heart className="mr-1 size-4" />
                  즐겨찾기
                </NoticeAction>
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
      </main>
    </div>
  );
}
