import CourseList from "@/components/course-list";
import { Metadata } from "next";

export const generateMetadata = async ({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page_number?: string }>;
}) => {
  const { slug } = await params;
  const { page_number } = await searchParams;

  return {
    title: `인프런 - ${slug} 검색 결과`,
    description: `인프런에서 "${slug}"에 대한 검색결과입니다. 다양한 IT 강의를 통해 지식을 쌓고 성장하세요.`,
  };
};

export default async function CoursesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page_number?: string }>;
}) {
  const { slug } = await params;
  const { page_number } = await searchParams;

  return (
    <div className="p-6">
      <CourseList
        category={slug}
        page={page_number ? parseInt(page_number) : 1}
      />
    </div>
  );
}
