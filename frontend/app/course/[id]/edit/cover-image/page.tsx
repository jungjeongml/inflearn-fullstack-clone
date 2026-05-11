import * as api from "@/lib/api";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import UI from "./ui";

export const metadata: Metadata = {
  title: "커버 이미지 수정 | 인프런",
  description: "인프런 커버 이미지 수정 페이지입니다.",
};

export default async function EditCourseCoverImagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await api.getCourseById(id);

  if (!course.data || course.error) {
    notFound();
  }

  return <UI course={course.data} />;
}
