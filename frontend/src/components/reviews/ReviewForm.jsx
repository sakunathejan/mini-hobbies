import { Loader2, Star, Upload, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { createReview } from "../../services/reviewService.js";
import StarRating from "./StarRating.jsx";

const ReviewForm = ({ productId, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error("Please select a rating."); return; }
    if (comment.trim().length < 10) { toast.error("Comment must be at least 10 characters."); return; }

    setSaving(true);
    try {
      await createReview({ productId, rating, title: title.trim(), comment: comment.trim(), images });
      toast.success("Review submitted for moderation.");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-base font-black text-gray-900">Write your review</h3>

      <div className="mt-4">
        <label className="text-sm font-semibold text-gray-700">Rating</label>
        <div className="mt-1">
          <StarRating rating={rating} interactive onChange={setRating} size="lg" />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold text-gray-700">Title <span className="text-gray-400">(optional)</span></label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Summarize your experience" className="input mt-1 w-full text-sm" />
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold text-gray-700">Review</label>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={5000} placeholder="What did you like or dislike? (min 10 characters)" className="input mt-1 w-full text-sm resize-y" required />
        <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/5000</p>
      </div>

      <div className="mt-4">
        <label className="text-sm font-semibold text-gray-700">Images <span className="text-gray-400">(optional)</span></label>
        <div className="mt-1 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img src={img.url} alt="" className="h-16 w-16 rounded-lg border object-cover" />
              <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white"><X className="h-3 w-3" /></button>
            </div>
          ))}
          <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-600">
            <Upload className="h-5 w-5" />
            <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => {
              const files = Array.from(e.target.files);
              files.forEach((f) => {
                const reader = new FileReader();
                reader.onload = (ev) => setImages((prev) => [...prev, { url: ev.target.result }]);
                reader.readAsDataURL(f);
              });
            }} />
          </label>
        </div>
        <p className="mt-1 text-xs text-gray-400">Add up to 5 images to show what you received.</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="btn-primary min-h-[44px] text-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
          Submit Review
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary min-h-[44px] text-sm">Cancel</button>
      </div>
    </form>
  );
};

export default ReviewForm;
