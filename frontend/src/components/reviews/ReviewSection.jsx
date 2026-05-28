import { Loader2, MessageCircle, Star, ThumbsUp, User, X, ArrowUpDown } from "lucide-react";
import { useCustomerAuth } from "../../context/CustomerAuthContext.jsx";
import { getProductReviews } from "../../services/reviewService.js";
import { useEffect, useState, useCallback, memo } from "react";
import ReviewForm from "./ReviewForm.jsx";
import StarRating from "./StarRating.jsx";
import CollectorReactions from "./CollectorReactions.jsx";
import ReviewReplyThread from "./ReviewReplyThread.jsx";

const SORTS = [
  { value: "-createdAt", label: "Latest" },
  { value: "-rating", label: "Highest Rated" },
  { value: "-reactionCount", label: "Most Reacted" },
];

const ReviewCard = memo(({ review, onImageClick, isAuthenticated, customerId }) => {
  const [showReplies, setShowReplies] = useState(false);
  const totalReactions = Object.values(review.reactionCounts || {}).reduce((a, b) => a + b, 0);

  return (
    <div className={`rounded-xl border p-4 ${review.isFeatured ? "border-amber-200 bg-amber-50/50" : "border-gray-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{review.userId?.name || "Anonymous"}</p>
            <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {review.isVerifiedPurchase && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              <ThumbsUp className="h-3 w-3" /> Verified
            </span>
          )}
          {review.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              <Star className="h-3 w-3" /> Featured
            </span>
          )}
        </div>
      </div>

      <div className="mt-2">
        <StarRating rating={review.rating} size="sm" />
      </div>

      {review.title && <h4 className="mt-2 text-sm font-bold text-gray-900">{review.title}</h4>}
      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{review.comment}</p>

      {review.images?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {review.images.map((img, i) => (
            <button key={i} onClick={() => onImageClick(img.url)} className="overflow-hidden rounded-lg border border-gray-200">
              <img src={img.url} alt="" className="h-16 w-16 object-cover hover:scale-110 transition" />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3">
        <CollectorReactions
          reviewId={review._id}
          reactionCounts={review.reactionCounts}
          userReactions={review.userReactions}
        />
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => setShowReplies(!showReplies)}
          className={`inline-flex items-center gap-1 text-xs font-semibold transition ${showReplies ? "text-amber-600" : "text-gray-400 hover:text-gray-600"}`}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          {review.replyCount > 0
            ? `View ${review.replyCount} ${review.replyCount === 1 ? "reply" : "replies"}`
            : isAuthenticated ? "Reply" : "View discussion"}
        </button>
      </div>

      {showReplies && (
        <ReviewReplyThread reviewId={review._id} reviewUserId={review.userId?._id} />
      )}

      {review.adminResponse && (
        <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/70 p-3">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">
            <MessageCircle className="h-3 w-3" /> Store response
          </p>
          <p className="mt-1 text-sm text-amber-900">{review.adminResponse}</p>
        </div>
      )}
    </div>
  );
});

const ReviewSection = ({ productId }) => {
  const { customer, isAuthenticated } = useCustomerAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const [sort, setSort] = useState("-createdAt");
  const [showSort, setShowSort] = useState(false);

  const fetchReviews = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const result = await getProductReviews(productId, { page: p, limit: 10, sort });
      setReviews(result.reviews);
      setTotal(result.total);
      setTotalPages(result.pages);
      setPage(p);
    } catch {} finally {
      setLoading(false);
    }
  }, [productId, sort]);

  useEffect(() => { if (productId) fetchReviews(); }, [fetchReviews, productId]);

  const handleReviewSubmitted = () => {
    setShowForm(false);
    fetchReviews(1);
  };

  const currentSort = SORTS.find((s) => s.value === sort) || SORTS[0];

  return (
    <div className="mt-12 border-t border-gray-200 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900">Customer Reviews</h2>
          {total > 0 && <p className="mt-1 text-sm text-gray-500">{total} review{total !== 1 ? "s" : ""}</p>}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setShowSort(!showSort)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-gray-300 hover:text-gray-700 transition">
              <ArrowUpDown className="h-3.5 w-3.5" /> {currentSort.label}
            </button>
            {showSort && (
              <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                {SORTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setSort(s.value); setShowSort(false); setPage(1); }}
                    className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition ${sort === s.value ? "bg-amber-50 text-amber-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {isAuthenticated && !showForm && (
            <button onClick={() => setShowForm(true)} className="btn-primary text-sm min-h-[44px]">
              <Star className="h-4 w-4" /> Write a Review
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="mt-6">
          <ReviewForm productId={productId} onSuccess={handleReviewSubmitted} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {showForm ? "" : "No reviews yet. Be the first to review this product!"}
          </p>
        ) : (
          reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              onImageClick={setPreviewImg}
              isAuthenticated={isAuthenticated}
              customerId={customer?._id}
            />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => fetchReviews(page - 1)} className="btn-secondary min-h-[40px] px-3 text-sm disabled:opacity-40">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => fetchReviews(page + 1)} className="btn-secondary min-h-[40px] px-3 text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)} className="absolute -right-3 -top-3 z-10 rounded-full bg-white p-1 shadow-lg"><X className="h-5 w-5" /></button>
            <img src={previewImg} alt="" className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
