import * as api from "@/lib/api";
import UI from "./ui";
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "강의 관리 | 인프런",
  description: "인프런 강의 관리 페이지입니다.",
};

export default async function InstructorCoursesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  const { data: courses, error } = await api.getAllInstructorCourses();

  if (error) {
    console.error("Failed to fetch instructor courses:", error);
    return <UI courses={[]} errorMessage="강의 목록을 불러오지 못했습니다." />;
  }

  return <UI courses={courses ?? []} />;
}
