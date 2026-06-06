"use client";

import { Controller, useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Course } from "@/generated/openapi-client";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type FormValues = {
  title: string;
  shortDescription: string;
  price: string;
  discountPrice: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  status: "PUBLISHED" | "DRAFT";
};

export default function EditCourseInfoUI({ course }: { course: Course }) {
  const router = useRouter();
  const form = useForm<FormValues>({
    defaultValues: {
      title: course.title ?? "",
      shortDescription: course.shortDescription ?? "",
      price: String(course.price ?? 0),
      discountPrice: course.discountPrice?.toString() ?? "0",
      level:
        (course.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED") ??
        "BEGINNER",
      status: (course.status as "PUBLISHED" | "DRAFT") ?? "DRAFT",
    },
  });

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
  } = form;

  const updateCourseMutation = useMutation({
    mutationFn: (data: FormValues) =>
      api.updateCourse(course.id, {
        ...data,
        price: Number(data.price || 0),
        discountPrice: Number(data.discountPrice || 0),
      }),
    onSuccess: () => {
      toast.success("강의 정보가 성공적으로 업데이트 되었습니다!");
      router.push(`/course/${course.id}/edit/curriculum`);
    },
  });

  return (
    <form
      onSubmit={handleSubmit((data: FormValues) =>
        updateCourseMutation.mutate(data),
      )}
      className="space-y-8 rounded-lg bg-white p-8 shadow w-xl"
    >
      <FieldGroup>
        <Field data-invalid={!!errors.title}>
          <FieldLabel htmlFor="title">
            강의 제목 <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            id="title"
            placeholder="강의 제목을 입력하세요"
            aria-invalid={!!errors.title}
            {...register("title", { required: "강의 제목을 입력해주세요." })}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <Field data-invalid={!!errors.shortDescription}>
          <FieldLabel htmlFor="shortDescription">
            강의 두줄 요약 <span className="text-red-500">*</span>
          </FieldLabel>
          <FieldDescription className="text-red-500">
            강의소개 상단에 보여집니다. 잠재 수강생들이 매력을 느낄만한 글을
            짧게 남겨주세요.
          </FieldDescription>
          <Textarea
            id="shortDescription"
            placeholder="ex) 이 강의를 통해 수강생은 컴퓨터 공학의 기초를 다질 수 있을 것으로 예상합니다."
            rows={3}
            aria-invalid={!!errors.shortDescription}
            {...register("shortDescription", {
              required: "강의 두줄 요약을 입력해주세요.",
            })}
          />
          <FieldError errors={[errors.shortDescription]} />
        </Field>

        <Field data-invalid={!!errors.price}>
          <FieldLabel htmlFor="price">
            강의 가격 <span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            id="price"
            type="number"
            min={0}
            placeholder="0"
            aria-invalid={!!errors.price}
            {...register("price", {
              required: "강의 가격을 입력해주세요.",
              min: {
                value: 0,
                message: "강의 가격은 0원 이상이어야 합니다.",
              },
            })}
          />
          <FieldError errors={[errors.price]} />
        </Field>

        <Field data-invalid={!!errors.discountPrice}>
          <FieldLabel htmlFor="discountPrice">강의 할인 가격</FieldLabel>
          <Input
            id="discountPrice"
            type="number"
            min={0}
            placeholder="할인 가격이 있다면 입력하세요"
            aria-invalid={!!errors.discountPrice}
            {...register("discountPrice", {
              min: {
                value: 0,
                message: "강의 할인 가격은 0원 이상이어야 합니다.",
              },
            })}
          />
          <FieldError errors={[errors.discountPrice]} />
        </Field>

        <FieldSet data-invalid={!!errors.level}>
          <FieldLegend>
            난이도 <span className="text-red-500">*</span>
          </FieldLegend>
          <Controller
            control={control}
            name="level"
            rules={{ required: "난이도를 선택해주세요." }}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-6"
                aria-invalid={!!errors.level}
              >
                <Field orientation="horizontal" className="w-fit">
                  <RadioGroupItem value="BEGINNER" id="level-beginner" />
                  <FieldLabel htmlFor="level-beginner">입문</FieldLabel>
                </Field>
                <Field orientation="horizontal" className="w-fit">
                  <RadioGroupItem
                    value="INTERMEDIATE"
                    id="level-intermediate"
                  />
                  <FieldLabel htmlFor="level-intermediate">초급</FieldLabel>
                </Field>
                <Field orientation="horizontal" className="w-fit">
                  <RadioGroupItem value="ADVANCED" id="level-advanced" />
                  <FieldLabel htmlFor="level-advanced">중급</FieldLabel>
                </Field>
              </RadioGroup>
            )}
          />
          <FieldError errors={[errors.level]} />
        </FieldSet>

        <FieldSet data-invalid={!!errors.status}>
          <FieldLegend>
            상태 <span className="text-red-500">*</span>
          </FieldLegend>
          <Controller
            control={control}
            name="status"
            rules={{ required: "상태를 선택해주세요." }}
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex gap-6"
                aria-invalid={!!errors.status}
              >
                <Field orientation="horizontal" className="w-fit">
                  <RadioGroupItem value="PUBLISHED" id="status-published" />
                  <FieldLabel htmlFor="status-published">공개</FieldLabel>
                </Field>
                <Field orientation="horizontal" className="w-fit">
                  <RadioGroupItem value="DRAFT" id="status-draft" />
                  <FieldLabel htmlFor="status-draft">임시저장</FieldLabel>
                </Field>
              </RadioGroup>
            )}
          />
          <FieldError errors={[errors.status]} />
        </FieldSet>
      </FieldGroup>

      <Button
        type="submit"
        className="mt-4 w-full"
        disabled={updateCourseMutation.isPending}
      >
        저장하기
      </Button>
    </form>
  );
}
