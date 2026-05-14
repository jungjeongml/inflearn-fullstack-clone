import * as api from "@/lib/api";
import UI from "./ui";
import { auth } from "@/auth";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const { id } = await params;
  const course = await api.getCourseById(id);

  return <UI user={session?.user} course={course.data!} />;
}
