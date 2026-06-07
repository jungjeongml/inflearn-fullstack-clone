"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, MessageCircle, Star, Users } from "lucide-react";
import { useState } from "react";
import { getInitial } from "../_utils/utils";

type InstructorSectionProps = {
  instructorName: string;
  instructorImage?: string;
  totalEnrollments: number;
  averageRating: number;
  totalReviews: number;
  totalLectures: number;
  instructorBioHeadline: string;
  instructorBioRest: string;
};

export function InstructorSection({
  instructorName,
  instructorImage,
  totalEnrollments,
  averageRating,
  totalReviews,
  totalLectures,
  instructorBioHeadline,
  instructorBioRest,
}: InstructorSectionProps) {
  const [isBioExpanded, setIsBioExpanded] = useState(false);

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
            <p
              className={`text-lg leading-8 text-gray-700 ${
                isBioExpanded ? "" : "line-clamp-2"
              }`}
            >
              {instructorBioRest}
            </p>
          )}
          {instructorBioRest && !isBioExpanded && (
            <button
              type="button"
              className="text-lg font-medium text-gray-500"
              onClick={() => setIsBioExpanded(true)}
            >
              더보기
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
