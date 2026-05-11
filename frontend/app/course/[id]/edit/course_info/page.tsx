import { notFound } from "next/navigation";
import * as api from "@/lib/api";
import { Metadata } from "next";
import UI from "./ui";

export const metadata: Metadata = {
  title: "강의 정보 수정 | 인프런",
  description: "인프런 강의 정보 수정 페이지입니다.",
};

export default async function EditCourseInfoPage({
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
