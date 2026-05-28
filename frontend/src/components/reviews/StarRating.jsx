import { Star } from "lucide-react";

const StarRating = ({ rating = 0, size = "md", interactive, onChange, showValue }) => {
  const stars = [1, 2, 3, 4, 5];
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-5 w-5";

  return (
    <div className="inline-flex items-center gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
        >
          <Star
            className={`${sizeClass} ${star <= rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
          />
        </button>
      ))}
      {showValue && <span className="ml-1.5 text-sm font-bold text-gray-700">{rating.toFixed(1)}</span>}
    </div>
  );
};

export default StarRating;
