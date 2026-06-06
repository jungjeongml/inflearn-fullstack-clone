import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, StarIcon } from "lucide-react";
import { CourseReview as CourseReviewEntity } from "@/generated/openapi-client";
import { cn } from "@/lib/utils";

function InteractiveStarRating({
  rating,
  onRatingChange,
}: {
  rating: number;
  onRatingChange: (rating: number) => void;
}) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const starValue = i + 1;
        const isActive = starValue <= (hoverRating || rating);

        return (
          <button
            key={i}
            type="button"
            onClick={() => onRatingChange(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 transition-colors"
          >
            <StarIcon
              className={cn(
                "size-8 transition-colors",
                isActive
                  ? "fill-yellow-400 stroke-yellow-400"
                  : "stroke-gray-300 hover:stroke-yellow-400",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

export function ReviewModal({
  courseId,
  isOpen,
  onClose,
  onSaved,
  editingReview,
}: {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingReview?: CourseReviewEntity;
}) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editingReview) {
        setRating(editingReview.rating);
        setContent(editingReview.content);
      } else {
        setRating(0);
        setContent("");
      }
    }
  }, [isOpen, editingReview]);

  const createReviewMutation = useMutation({
    mutationFn: () =>
      api.createReview(courseId, {
        content,
        rating,
    }),
    onSuccess: () => {
      toast.success("수강평이 등록되었습니다.");
      onSaved();
      onClose();
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: () =>
      api.updateReview(editingReview!.id, {
        content,
        rating,
    }),
    onSuccess: () => {
      toast.success("수강평이 수정되었습니다.");
      onSaved();
      onClose();
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      alert("별점을 선택해주세요.");
      return;
    }
    if (!content.trim()) {
      alert("수강평을 작성해주세요.");
      return;
    }

    if (editingReview) {
      updateReviewMutation.mutate();
    } else {
      createReviewMutation.mutate();
    }
  };

  const isLoading =
    createReviewMutation.isPending || updateReviewMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            {editingReview
              ? "수강평 수정하기"
              : "힘이 되는 수강평을 남겨주세요!"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <InteractiveStarRating rating={rating} onRatingChange={setRating} />
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="수강평을 작성해보세요!"
            className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <DialogFooter className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <span>{editingReview ? "수정하기" : "저장하기"}</span>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
