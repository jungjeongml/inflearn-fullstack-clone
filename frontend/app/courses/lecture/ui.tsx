import { CourseDetailDto } from "@/generated/openapi-client";

export default function UI({
  course,
  lectureId,
}: {
  course: CourseDetailDto;
  lectureId?: string;
}) {
  return (
    <div>
      <h1>{course.title}</h1>
      {lectureId ? (
        <p>Selected Lecture ID: {lectureId}</p>
      ) : (
        <p>No lecture selected.</p>
      )}
    </div>
  );
}
