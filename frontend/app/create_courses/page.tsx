import UI from "./ui";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "강의 생성 | 인프런",
  description: "인프런 강의 생성 페이지입니다.",
};

export default function CreateCoursesPage() {
  return <UI />;
}
