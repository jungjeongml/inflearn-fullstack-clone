import type {
  CourseDetailDto,
  CourseReview as CourseReviewEntity,
  Lecture as LectureEntity,
  Section as SectionEntity,
} from "@/generated/openapi-client";

export function formatPrice(price: number) {
  return new Intl.NumberFormat("ko-KR").format(price);
}

export function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "U";
}

export function formatTotalDuration(seconds?: number) {
  const totalSeconds = seconds ?? 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) return `${hours}시간 ${minutes}분`;
  return `${minutes}분`;
}

export function formatLectureDuration(seconds?: number) {
  const totalSeconds = seconds ?? 0;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}분 ${remainingSeconds.toString().padStart(2, "0")}초`;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function htmlToPlainText(html: string) {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function splitInstructorBio(bio: string) {
  const normalizedBio = htmlToPlainText(bio);
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

export function getDiscountRate(price: number, discountPrice?: number) {
  if (!discountPrice || discountPrice >= price) return null;
  return Math.round(((price - discountPrice) / price) * 100);
}

export function getInstructorName(course: CourseDetailDto) {
  return (
    course.instructor?.name || course.instructor?.email || "인프런 지식공유자"
  );
}

export function getReviewUserName(review: CourseReviewEntity) {
  return review.user?.name || review.user?.email || "수강생";
}

export function sortSections(sections: SectionEntity[]) {
  return [...sections].sort((a, b) => a.order - b.order);
}

export function sortLectures(lectures: LectureEntity[]) {
  return [...lectures].sort((a, b) => a.order - b.order);
}
