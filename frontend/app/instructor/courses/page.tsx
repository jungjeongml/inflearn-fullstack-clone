import * as api from "@/lib/api";
import UI from "./ui";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "강의 관리 | 인프런",
  description: "인프런 강의 관리 페이지입니다.",
};

export default async function InstructorCoursesPage() {
  const { data: courses } = await api.getAllInstructorCourses();

  return <UI courses={courses ?? []} />;
}
