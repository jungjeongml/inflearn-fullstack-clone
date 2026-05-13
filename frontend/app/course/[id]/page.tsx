import * as api from "@/lib/api";
import UI from "./ui";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await api.getCourseById(id);

  return <UI course={course.data!} />;
}
