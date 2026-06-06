export function DescriptionSection({ description }: { description?: string }) {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold">강의 소개</h2>
      <div
        className="prose prose-gray max-w-none prose-headings:font-bold prose-h2:text-2xl prose-p:leading-7 prose-li:my-1"
        dangerouslySetInnerHTML={{
          __html: description || "<p>강의 소개가 아직 등록되지 않았습니다.</p>",
        }}
      />
    </section>
  );
}
