import { ExternalLink, Flame, Loader2, MessageCircle, Pencil, Star, Trash2, X, X as XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "../ui/ConfirmDialog.jsx";
import { deleteMyReview, getMyReviews, updateReview } from "../../services/reviewService.js";
import StarRating from "./StarRating.jsx";

const statusStyles = {
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-800",
  rejected: "bg-red-50 text-red-700",
};

const MyReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 0, title: "", comment: "" });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const result = await getMyReviews();
      setReviews(result.reviews);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const startEdit = (review) => {
    setEditingId(review._id);
    setEditForm({ rating: review.rating, title: review.title || "", comment: review.comment });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({ rating: 0, title: "", comment: "" }); };

  const handleUpdate = async () => {
    if (editForm.rating === 0) { toast.error("Please select a rating."); return; }
    if (editForm.comment.trim().length < 10) { toast.error("Comment must be at least 10 characters."); return; }
    setSaving(true);
    try {
      await updateReview(editingId, editForm);
      toast.success("Review updated.");
      cancelEdit();
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMyReview(deleteTarget._id);
      setReviews(reviews.filter((r) => r._id !== deleteTarget._id));
      toast.success("Review deleted.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete.");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;

  return (
    <div>
      {reviews.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">You haven't written any reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review._id} className={`rounded-xl border p-4 ${review.status === "rejected" ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"}`}>
              {editingId === review._id ? (
                <div className="space-y-3">
                  <StarRating rating={editForm.rating} interactive onChange={(v) => setEditForm({ ...editForm, rating: v })} size="lg" />
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} maxLength={200} className="input w-full text-sm" placeholder="Review title" />
                  <textarea value={editForm.comment} onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })} rows={3} maxLength={5000} className="input w-full text-sm resize-y" />
                  <div className="flex gap-2">
                    <button onClick={handleUpdate} disabled={saving} className="btn-primary text-sm min-h-[36px]">{saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />} Save</button>
                    <button onClick={cancelEdit} className="btn-secondary text-sm min-h-[36px]"><X className="h-3 w-3" /> Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {review.productId && <span className="truncate text-sm font-bold text-gray-900">{review.productId.name}</span>}
                        <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${statusStyles[review.status] || "bg-gray-100 text-gray-700"}`}>{review.status}</span>
                      </div>
                      <div className="mt-1">
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      {review.title && <p className="mt-1 text-sm font-semibold text-gray-800">{review.title}</p>}
                      <p className="mt-0.5 text-sm text-gray-600">{review.comment}</p>
                      {review.images?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {review.images.map((img, i) => (
                            <button key={i} onClick={() => setPreviewImg(img.url)} className="overflow-hidden rounded-lg border border-gray-200">
                              <img src={img.url} alt="" className="h-14 w-14 object-cover hover:scale-110 transition" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      )}
                      {review.adminResponse && (
                        <div className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                          <span className="font-bold">Store: </span>{review.adminResponse}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        {review.reactionCounts && Object.keys(review.reactionCounts).length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-400" />
                            {Object.values(review.reactionCounts).reduce((a, b) => a + b, 0)} reactions
                          </span>
                        )}
                        {review.replyCount > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {review.replyCount} {review.replyCount === 1 ? "reply" : "replies"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {review.productId?.slug && (
                        <a href={`/products/${review.productId.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="View product">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {review.status !== "approved" && (
                        <>
                          <button onClick={() => startEdit(review)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setDeleteTarget(review)} className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!deleteTarget} title="Delete review?" message="This action cannot be undone." confirmLabel="Delete" cancelLabel="Cancel" destructive onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />

      {previewImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewImg(null)}>
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewImg(null)} className="absolute -right-3 -top-3 z-10 rounded-full bg-white p-1 shadow-lg"><XIcon className="h-5 w-5" /></button>
            <img src={previewImg} alt="" className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl" loading="lazy" />
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviewsSection;
