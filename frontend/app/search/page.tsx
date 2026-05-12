import CourseList from "@/components/course-list";
import { Metadata } from "next";

export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page_number?: string }>;
}) => {
  const { q, page_number } = await searchParams;

  return {
    title: `인프런 - ${q || ""} 검색 결과`,
    description: `인프런에서 "${q || ""}"에 대한 검색결과입니다. 다양한 IT 강의를 통해 지식을 쌓고 성장하세요.`,
  };
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page_number?: string }>;
}) {
  const { q, page_number } = await searchParams;

  return (
    <div className="p-6">
      <CourseList
        q={q || ""}
        page={page_number ? parseInt(page_number, 10) : 1}
      />
    </div>
  );
}
