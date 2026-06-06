import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <StarIcon
          key={i}
          className={cn(
            "size-4",
            i < rounded
              ? "fill-yellow-400 stroke-yellow-400"
              : "stroke-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}
