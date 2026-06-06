import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { toast } from "sonner";
import { User } from "next-auth";
import Image from "next/image";
import { CourseReview as CourseReviewEntity } from "@/generated/openapi-client";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "../_utils/utils";
import { ReviewModal } from "./reviewModal";
import { StarRating } from "./starRating";
import { DeleteConfirmDialog } from "./deleteConfirmDialog";

export function ReviewsSection({
  courseId,
  user,
}: {
  courseId: string;
  user?: User;
}) {
  const [page, setPage] = useState(1);
  const sort: "latest" | "oldest" | "rating_high" | "rating_low" = "latest";
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<
    CourseReviewEntity | undefined
  >();
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const pageSize = 10;
  const [totalReviews, setTotalReviews] = useState<CourseReviewEntity[]>([]);
  const [myReviewExists, setMyReviewExists] = useState(false);

  const loadReviews = useCallback(
    async (pageNumber: number, reset = false) => {
      setIsLoading(true);
      try {
        const res = await api.getCourseReviews(
          courseId,
          pageNumber,
          pageSize,
          sort,
        );
        if (res.data?.reviews) {
          setTotalReviews((existingReviews) =>
            reset
              ? res.data!.reviews
              : [...existingReviews, ...res.data!.reviews],
          );
          setHasNext(res.data.hasNext);
          setMyReviewExists(res.data.myReviewExists);
        }
      } catch (error) {
        console.error("Failed to load reviews:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [courseId, sort, pageSize],
  );

  useEffect(() => {
    loadReviews(1, true);
    setPage(1);
  }, [loadReviews]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadReviews(nextPage, false);
  };

  const handleEditReview = (review: CourseReviewEntity) => {
    setEditingReview(review);
    setShowReviewModal(true);
  };

  const handleDeleteReview = (reviewId: string) => {
    setDeletingReviewId(reviewId);
    setShowDeleteDialog(true);
  };

  const refreshReviews = useCallback(() => {
    setPage(1);
    loadReviews(1, true);
  }, [loadReviews]);

  const deleteReviewMutation = useMutation({
    mutationFn: () => api.deleteReview(deletingReviewId!),
    onSuccess: () => {
      toast.success("수강평이 삭제되었습니다.");
      setShowDeleteDialog(false);
      setDeletingReviewId(null);
      refreshReviews();
    },
    onError: () => {
      toast.error("수강평 삭제에 실패했습니다.");
    },
  });

  const confirmDeleteReview = () => {
    deleteReviewMutation.mutate();
  };

  const handleCloseModal = () => {
    setShowReviewModal(false);
    setEditingReview(undefined);
  };

  return (
    <section id="reviews" className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">수강평</h2>
        {user && !myReviewExists && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            수강평 남기기
          </button>
        )}
      </div>

      <div className="space-y-8">
        {totalReviews.map((r) => (
          <div key={r.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {r.user?.image && (
                  <Image
                    src={r.user.image}
                    alt={r.user.name || "user"}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-medium">{r.user?.name ?? "익명"}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <StarRating rating={r.rating} />
                    <span>{formatDate(r.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* 수정/삭제 버튼 - 본인 리뷰만 */}
              {user && r.user?.id === user.id && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditReview(r)}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {r.content}
            </p>
            {r.instructorReply && (
              <div className="ml-10 border-l-2 pl-4 border-primary">
                <p className="font-medium mb-1 text-primary">지식공유자 답변</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {r.instructorReply}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasNext && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className={cn(
              "px-6 py-2 text-sm font-medium border border-gray-300 rounded-md transition-colors",
              isLoading
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-gray-50",
            )}
          >
            {isLoading ? "로딩 중..." : "더보기"}
          </button>
        </div>
      )}

      <ReviewModal
        courseId={courseId}
        isOpen={showReviewModal}
        onClose={handleCloseModal}
        onSaved={refreshReviews}
        editingReview={editingReview}
      />

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setDeletingReviewId(null);
        }}
        onConfirm={confirmDeleteReview}
        isLoading={deleteReviewMutation.isPending}
      />
    </section>
  );
}
