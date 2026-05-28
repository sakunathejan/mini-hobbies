import { ExternalLink, Flame, Loader2, MessageCircle, Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../components/ui/ConfirmDialog.jsx";
import StarRating from "../../components/reviews/StarRating.jsx";
import { approveReview, deleteReview, featureReview, getAdminReviews, rejectReview, respondToReview } from "../../services/adminReviewService.js";
import { formatCurrency } from "../../utils/formatters.js";

const TABS = ["pending", "approved", "rejected", "all"];
const PER_PAGE = 20;

const statusStyles = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
};

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processing, setProcessing] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [respondTarget, setRespondTarget] = useState(null);
  const [respondText, setRespondText] = useState("");
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewImg, setPreviewImg] = useState(null);

  const fetch = async (p = 1) => {
    setLoading(true);
    try {
      const result = await getAdminReviews({ status: tab === "all" ? undefined : tab, page: p, limit: PER_PAGE });
      setReviews(result.reviews);
      setTotalPages(result.pages);
      setPage(p);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to load reviews.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [tab]);

  const changeTab = (t) => { setTab(t); };

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      await approveReview(id);
      setReviews(reviews.filter((r) => r._id !== id));
      toast.success("Review approved.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not approve.");
    } finally {
      setProcessing("");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setProcessing("reject");
    try {
      await rejectReview(rejectTarget._id, rejectReason);
      setReviews(reviews.filter((r) => r._id !== rejectTarget._id));
      toast.success("Review rejected.");
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not reject.");
    } finally {
      setProcessing("");
    }
  };

  const handleFeature = async (id) => {
    setProcessing(id);
    try {
      const result = await featureReview(id);
      setReviews(reviews.map((r) => r._id === id ? { ...r, isFeatured: result.review.isFeatured } : r));
      toast.success(result.review.isFeatured ? "Review featured." : "Review unfeatured.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not toggle feature.");
    } finally {
      setProcessing("");
    }
  };

  const handleRespond = async () => {
    if (!respondTarget || !respondText.trim()) return;
    setProcessing("respond");
    try {
      await respondToReview(respondTarget._id, respondText);
      setReviews(reviews.map((r) => r._id === respondTarget._id ? { ...r, adminResponse: respondText } : r));
      toast.success("Response added.");
      setRespondTarget(null);
      setRespondText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not respond.");
    } finally {
      setProcessing("");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setProcessing("delete");
    try {
      await deleteReview(deleteTarget._id);
      setReviews(reviews.filter((r) => r._id !== deleteTarget._id));
      toast.success("Review deleted.");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete.");
    } finally {
      setProcessing("");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black">Reviews</h1>
          <p className="mt-1 text-sm text-gray-600">Moderate customer product reviews.</p>
        </div>
      </div>

      <div className="mt-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => changeTab(t)} className={`flex-1 rounded-md px-4 py-2 text-sm font-bold capitalize transition ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t}</button>
        ))}
      </div>

      {loading && (
        <div className="mt-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      )}

      {!loading && reviews.length === 0 && (
        <p className="mt-8 rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">No {tab === "all" ? "" : tab} reviews found.</p>
      )}

      {!loading && reviews.length > 0 && (
        <>
          <div className="mt-6 space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{review.userId?.name || "Unknown"}</span>
                      <span className="text-xs text-gray-400">{review.userId?.email || ""}</span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[review.status] || "bg-gray-100 text-gray-700"}`}>{review.status}</span>
                      {review.isFeatured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"><Star className="h-3 w-3" /> Featured</span>}
                      {review.isVerifiedPurchase && <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Verified</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                    </div>
                    {review.title && <p className="mt-1 text-sm font-semibold text-gray-800">{review.title}</p>}
                    <p className="mt-0.5 text-sm text-gray-600">{review.comment}</p>
                    {review.images?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {review.images.map((img, i) => (
                          <button key={i} onClick={() => setPreviewImg(img.url)} className="overflow-hidden rounded-lg border border-gray-200">
                            <img src={img.url} alt="" className="h-14 w-14 object-cover hover:scale-110 transition" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {review.productId && (
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">{review.productId.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(review.productId.price)}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  {review.reactionCounts && Object.keys(review.reactionCounts).length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-orange-400" />
                      {Object.values(review.reactionCounts).reduce((a, b) => a + b, 0)} reactions
                    </span>
                  )}
                  {review.replyCount > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {review.replyCount} {review.replyCount === 1 ? "reply" : "replies"}
                    </span>
                  )}
                </div>

                {review.adminResponse && (
                  <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">
                    <p className="font-bold text-amber-800">Store response:</p>
                    <p className="mt-0.5 text-amber-700">{review.adminResponse}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {review.status !== "approved" && (
                    <button onClick={() => handleApprove(review._id)} disabled={processing === review._id} className="btn-primary text-xs min-h-[36px]">
                      {processing === review._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />} Approve
                    </button>
                  )}
                  {review.status !== "rejected" && (
                    <button onClick={() => setRejectTarget(review)} className="btn-secondary text-xs min-h-[36px] text-red-600 border-red-200 hover:bg-red-50">
                      Reject
                    </button>
                  )}
                  <button onClick={() => handleFeature(review._id)} disabled={processing === review._id} className={`btn-secondary text-xs min-h-[36px] ${review.isFeatured ? "bg-amber-50 border-amber-200 text-amber-700" : ""}`}>
                    {review.isFeatured ? "Unfeature" : "Feature"}
                  </button>
                  <button onClick={() => { setRespondTarget(review); setRespondText(review.adminResponse || ""); }} className="btn-secondary text-xs min-h-[36px]">
                    <MessageCircle className="h-3 w-3" /> Respond
                  </button>
                  {review.productId && (
                    <a href={`/products/${review.productId.slug}`} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs min-h-[36px]">
                      <ExternalLink className="h-3 w-3" /> View product
                    </a>
                  )}
                  <button onClick={() => setDeleteTarget(review)} className="rounded-md px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button disabled={page <= 1} onClick={() => fetch(page - 1)} className="btn-secondary min-h-[40px] px-3 text-sm disabled:opacity-40">Previous</button>
              <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => fetch(page + 1)} className="btn-secondary min-h-[40px] px-3 text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}

      <ConfirmDialog open={!!deleteTarget} title="Delete review?" message="This will permanently remove this review." confirmLabel="Delete" cancelLabel="Cancel" destructive onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setRejectTarget(null); setRejectReason(""); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">Reject review</h3>
              <button onClick={() => { setRejectTarget(null); setRejectReason(""); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <textarea className="input mt-4 w-full text-sm resize-y" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Optional reason (sent to customer)..." />
            <div className="mt-4 flex gap-3">
              <button onClick={handleReject} disabled={processing === "reject"} className="btn-primary text-sm min-h-[44px] bg-red-600 hover:bg-red-700">{processing === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Reject</button>
              <button onClick={() => { setRejectTarget(null); setRejectReason(""); }} className="btn-secondary text-sm min-h-[44px]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {respondTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => { setRespondTarget(null); setRespondText(""); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black">Respond to review</h3>
              <button onClick={() => { setRespondTarget(null); setRespondText(""); }}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <p className="mt-2 text-sm text-gray-500">Your response will be visible to the customer and on the product page.</p>
            <textarea className="input mt-4 w-full text-sm resize-y" rows={4} value={respondText} onChange={(e) => setRespondText(e.target.value)} placeholder="Write your response..." maxLength={2000} />
            <p className="mt-1 text-right text-xs text-gray-400">{respondText.length}/2000</p>
            <div className="mt-4 flex gap-3">
              <button onClick={handleRespond} disabled={processing === "respond" || !respondText.trim()} className="btn-primary text-sm min-h-[44px]">{processing === "respond" ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} Send response</button>
              <button onClick={() => { setRespondTarget(null); setRespondText(""); }} className="btn-secondary text-sm min-h-[44px]">Cancel</button>
            </div>
          </div>
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

export default AdminReviewsPage;
