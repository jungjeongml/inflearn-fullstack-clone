import { useCallback, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  CheckCircle2,
  BookOpen,
  Clock3,
  Heart,
  Play,
  Signal,
  ShoppingCart,
  UserRound,
  Users,
} from "lucide-react";
import { CourseDetailDto } from "@/generated/openapi-client";
import { User } from "next-auth";
import { formatPrice } from "../_utils/utils";

type FloatingMenuProps = {
  user?: User;
  course: CourseDetailDto;
  discountRate: number | null;
  displayPrice: number;
  instructorName: string;
  totalDurationText: string;
  levelText: string;
};

export function FloatingMenu({
  user,
  course,
  discountRate,
  displayPrice,
  instructorName,
  totalDurationText,
  levelText,
}: FloatingMenuProps) {
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(course.isEnrolled);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const getFavoriteQuery = useQuery({
    queryKey: ["favorite", course.id],
    queryFn: () => api.getFavorite(course.id),
  });

  const cartItemsQuery = useQuery({
    queryFn: () => api.getCartItems(),
    queryKey: ["cart-items"],
  });

  const addToCartMutation = useMutation({
    mutationFn: () => api.addToCart(course.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart-items"] });
      toast.success(`${course.title}이(가) 장바구니에 담겼습니다.`);
    },
  });

  const addFavoriteMutation = useMutation({
    mutationFn: () => api.addFavorite(course.id),
    onSuccess: () => {
      getFavoriteQuery.refetch();
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: () => api.removeFavorite(course.id),
    onSuccess: () => {
      getFavoriteQuery.refetch();
    },
  });

  const isFavoriteDisabled =
    addFavoriteMutation.isPending || removeFavoriteMutation.isPending;
  const isCourseInCart =
    cartItemsQuery.data?.data?.items?.some(
      (item) => item.courseId === course.id,
    ) ?? false;

  const handleFavorite = useCallback(() => {
    if (user) {
      if (getFavoriteQuery.data?.data?.isFavorite) {
        removeFavoriteMutation.mutate();
      } else {
        addFavoriteMutation.mutate();
      }
    } else {
      alert("로그인 후 이용해주세요.");
    }
  }, [user, getFavoriteQuery, removeFavoriteMutation, addFavoriteMutation]);

  const handleCart = useCallback(() => {
    if (!user) {
      alert("로그인 후 이용해주세요");
      return;
    }
    if (isCourseInCart) {
      router.push("/carts");
    } else {
      addToCartMutation.mutate();
    }
  }, [user, isCourseInCart, router, addToCartMutation]);

  const enrollMutation = useMutation({
    mutationFn: () => api.enrollCourse(course.id),
    onSuccess: () => {
      setIsEnrolled(true);
      setEnrollDialogOpen(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEnroll = useCallback(() => {
    if (isEnrolled) {
      alert("이미 수강신청한 강의입니다.");
      return;
    }

    if (!user) {
      alert("로그인 후 이용해주세요.");
      return;
    }

    if (course.price > 0) {
      alert("결제 기능은 구현 예정입니다.");
      return;
    }

    enrollMutation.mutate();
  }, [isEnrolled, user, course, enrollMutation]);

  const handleStartLearning = () => {
    setEnrollDialogOpen(false);
    router.push(`/courses/lecture?courseId=${course.id}`);
  };

  return (
    <>
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="relative aspect-video bg-gray-900">
            {course.thumbnailUrl ? (
              <Image
                src={course.thumbnailUrl}
                alt={course.title}
                fill
                className="object-cover"
                sizes="340px"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-gray-400">
                강의 이미지
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="flex size-12 items-center justify-center rounded-full bg-white text-gray-900">
                <Play className="ml-0.5 size-6 fill-current" />
              </span>
            </div>
          </div>

          <div className="p-5">
            {course.price > 0 && (
              <div className="mb-4">
                {discountRate && (
                  <p className="mb-1 text-sm font-bold text-red-500">
                    {discountRate}% 할인
                  </p>
                )}
                <div className="flex items-end gap-2">
                  <strong className="text-2xl font-bold">
                    ₩{formatPrice(displayPrice)}
                  </strong>
                  {course.discountPrice
                    ? course.discountPrice < course.price && (
                        <span className="pb-0.5 text-sm text-gray-400 line-through">
                          ₩{formatPrice(course.price)}
                        </span>
                      )
                    : null}
                </div>
              </div>
            )}
            {course.price === 0 && (
              <div className="mb-4">
                <p className="text-2xl font-bold text-green-500">무료 </p>
              </div>
            )}
            <div className="space-y-2">
              {isEnrolled ? (
                <Button
                  type="button"
                  className={`flex h-12 w-full items-center justify-center bg-primary text-base font-bold text-white`}
                  onClick={() => {
                    router.push(`/courses/lecture?courseId=${course.id}`);
                  }}
                >
                  <span className="translate-y-px">학습으로 이동하기</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  className={`flex h-12 w-full items-center justify-center bg-primary text-base font-bold text-white ${enrollMutation.isPending && "cursor-not-allowed"}`}
                  onClick={handleEnroll}
                  disabled={enrollMutation.isPending}
                >
                  <span className="translate-y-px">수강신청 하기</span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                className={`h-11 w-full border-gray-200 bg-white font-semibold text-gray-800 hover:border-[#00c471] hover:text-[#00a85f] ${addToCartMutation.isPending && "cursor-not-allowed"}`}
                onClick={handleCart}
                disabled={addToCartMutation.isPending}
              >
                <ShoppingCart className="mr-1 size-4" />
                {isCourseInCart ? "수강 바구니로 이동" : "바구니에 담기"}
              </Button>
              <Button
                onClick={handleFavorite}
                disabled={isFavoriteDisabled}
                type="button"
                variant="outline"
                className={`h-11 w-full border-gray-200 bg-white font-semibold text-gray-800 hover:border-[#00c471] hover:text-[#00a85f] ${getFavoriteQuery.data?.data?.isFavorite ? "border-red-500 text-red-500 hover:border-red-500 hover:text-red-500" : ""}, ${isFavoriteDisabled && "cursor-not-allowed"}`}
              >
                <Heart
                  className={`mr-1 size-4 ${getFavoriteQuery.data?.data?.isFavorite ? "fill-red-500 text-red-500" : ""} ${isFavoriteDisabled && "cursor-not-allowed"}`}
                />
                {getFavoriteQuery.data?.data?.favoriteCount ?? 0}
              </Button>
            </div>

            <Separator className="my-5" />

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <UserRound className="size-4" />
                  지식공유자
                </dt>
                <dd className="font-medium">{instructorName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <BookOpen className="size-4" />
                  강의 수
                </dt>
                <dd className="font-medium">{course.totalLectures}개</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Clock3 className="size-4" />
                  수강 시간
                </dt>
                <dd className="font-medium">{totalDurationText}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Signal className="size-4" />
                  난이도
                </dt>
                <dd className="font-medium">{levelText}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-gray-500">
                  <Users className="size-4" />
                  수강생
                </dt>
                <dd className="font-medium">
                  {course.totalEnrollments.toLocaleString()}명
                </dd>
              </div>
            </dl>

            <div className="mt-5 rounded-md bg-emerald-50 p-3 text-xs leading-5 text-emerald-800">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-4" />이 강의에서 배울 수 있어요
              </p>
              <p className="mt-1">
                섹션별 커리큘럼과 실습 흐름을 따라가며 핵심 개념을 차근차근
                익힙니다.
              </p>
            </div>
          </div>
        </div>
      </aside>

      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] gap-0 rounded-2xl p-0 sm:max-w-[520px]">
          <div className="px-6 py-7 sm:px-7">
            <DialogHeader className="gap-0">
              <DialogTitle className="text-xl font-bold leading-none text-gray-900">
                수강신청 완료
              </DialogTitle>
              <DialogDescription className="mt-6 text-base leading-7 text-gray-700">
                수강신청이 완료되었어요.
                <br />
                강의실로 이동하여 바로 학습하시겠어요?
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-6 -mx-0 -mb-0 flex-row justify-end gap-3 rounded-none border-t-0 bg-transparent p-0">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 min-w-24 rounded-lg border-gray-200 bg-white px-6 text-base font-bold text-gray-900 hover:bg-gray-50"
                >
                  취소
                </Button>
              </DialogClose>
              <Button
                type="button"
                className="h-12 min-w-36 rounded-lg bg-[#00c471] px-6 text-base font-bold text-white hover:bg-[#00ad63]"
                onClick={handleStartLearning}
              >
                바로 학습 시작
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
