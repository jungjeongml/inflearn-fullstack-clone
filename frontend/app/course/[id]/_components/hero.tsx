import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Play, Star, UserRound } from "lucide-react";
import { CourseDetailDto } from "@/generated/openapi-client";

type HeroSectionProps = {
  course: CourseDetailDto;
  categoryName: string;
  instructorName: string;
};

export function HeroSection({
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
