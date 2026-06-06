import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { CourseReview as CourseReviewEntity } from "@/generated/openapi-client";
import { getInitial, getReviewUserName } from "../_utils/utils";

export function RecentReviewsSection({
  recentReviews,
  averageRating,
}: {
  recentReviews: CourseReviewEntity[];
  averageRating: number;
}) {
  return (
    <section>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#00a85f]">Course Reviews</p>
          <h2 className="mt-1 text-2xl font-bold">최근 수강평</h2>
        </div>
        <span className="text-sm text-gray-500">
          평균 {averageRating.toFixed(1)}점
        </span>
      </div>

      {recentReviews.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {recentReviews.map((review) => {
            const reviewerName = getReviewUserName(review);

            return (
              <article
                key={review.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      {review.user?.image && (
                        <AvatarImage
                          src={review.user.image}
                          alt={reviewerName}
                        />
                      )}
                      <AvatarFallback>
                        {getInitial(reviewerName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{reviewerName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                    <Star className="size-4 fill-current" />
                    {review.rating.toFixed(1)}
                  </span>
                </div>
                <p className="line-clamp-4 text-sm leading-6 text-gray-700">
                  {review.content}
                </p>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          아직 등록된 수강평이 없습니다.
        </div>
      )}
    </section>
  );
}
