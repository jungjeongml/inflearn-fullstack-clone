import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Lock, MonitorPlay } from "lucide-react";
import { Section as SectionEntity } from "@/generated/openapi-client";
import {
  formatLectureDuration,
  formatTotalDuration,
  sortLectures,
} from "../_utils/utils";

export function CurriculumSection({
  courseId,
  sections,
  totalLectures,
  totalDurationText,
}: {
  courseId: string;
  sections: SectionEntity[];
  totalLectures: number;
  totalDurationText: string;
}) {
  const router = useRouter();
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#00a85f]">Curriculum</p>
          <h2 className="mt-1 text-2xl font-bold">커리큘럼</h2>
        </div>
        <p className="text-sm text-gray-500">
          총 {totalLectures}개 수업 · {totalDurationText}
        </p>
      </div>

      <Accordion
        type="multiple"
        defaultValue={sections.slice(0, 2).map((section) => section.id)}
        className="rounded-lg border border-gray-200"
      >
        {sections.map((section) => {
          const lectures = sortLectures(section.lectures ?? []);
          const sectionDuration = lectures.reduce(
            (total, lecture) => total + (lecture.duration ?? 0),
            0,
          );

          return (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border-gray-200 px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                <div className="pr-4">
                  <p className="text-base font-semibold">
                    섹션 {section.order}. {section.title}
                  </p>
                  <p className="mt-1 text-xs font-normal text-gray-500">
                    {lectures.length}개 수업 ·{" "}
                    {formatTotalDuration(sectionDuration)}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="divide-y divide-gray-100 rounded-md bg-gray-50">
                  {lectures.map((lecture) => (
                    <div
                      onClick={() => {
                        router.push(
                          `/courses/lecture?courseId=${courseId}&lectureId=${lecture.id}`,
                        );
                      }}
                      key={lecture.id}
                      className={`flex items-center justify-between gap-4 px-4 py-3 ${lecture.videoStorageInfo && "cursor-pointer"}`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {lecture.isPreview ? (
                          <MonitorPlay className="size-4 shrink-0 text-gray-400" />
                        ) : (
                          <Lock className="size-4 shrink-0 text-gray-400" />
                        )}
                        <span
                          className={`truncate text-sm text-gray-800 ${lecture.videoStorageInfo && "underline"}`}
                        >
                          {lecture.order}. {lecture.title}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center">
                        {lecture.isPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="inline-flex h-7 items-center justify-center border-[#00c471] px-2.5 text-[#00a85f] hover:text-[#00a85f]"
                          >
                            <span className="flex h-full translate-y-[0.5px] items-center text-[13px] font-bold leading-none">
                              미리보기
                            </span>
                          </Button>
                        )}
                        <span className="w-16 text-right text-xs text-gray-500">
                          {formatLectureDuration(lecture.duration)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
}
