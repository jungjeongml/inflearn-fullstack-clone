"use client";
import type { CourseDetailDto } from "@/generated/openapi-client";
import { getLevelText } from "@/lib/level";
import { User } from "next-auth";
import {
  HeroSection,
  RecentReviewsSection,
  DescriptionSection,
  InstructorSection,
  CurriculumSection,
  ReviewsSection,
  FloatingMenu,
} from "./_components";
import {
  formatTotalDuration,
  getDiscountRate,
  getInstructorName,
  sortSections,
  splitInstructorBio,
} from "./_utils/utils";

const MOCK_INSTRUCTOR_BIO =
  "실무 중심의 커리큘럼으로 학습자가 바로 적용할 수 있는 지식을 전달하는 지식공유자입니다. 복잡한 개념을 작은 예제와 프로젝트 흐름으로 풀어내며, 끝까지 완주할 수 있는 강의를 만드는 데 집중합니다.";

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
