import UI from "./ui";
import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "강의 생성 | 인프런",
  description: "인프런 강의 생성 페이지입니다.",
};

export default async function CreateCoursesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/signin");
  }

  return <UI />;
}
