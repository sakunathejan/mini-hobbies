import { ChevronDown, ChevronUp, Loader2, MessageCircle, Pencil, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useCustomerAuth } from "../../context/CustomerAuthContext.jsx";
import { createReply, deleteReply, editReply, getReplies } from "../../services/reviewReplyService.js";

const ReplyItem = ({ reply, currentUserId, onReplyAdded, onEdit, onDelete, depth }) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.message);
  const [saving, setSaving] = useState(false);

  const isOwner = currentUserId && reply.userId?._id === currentUserId;

  const handleEdit = async () => {
    if (editText.trim().length === 0) return;
    setSaving(true);
    try {
      const result = await editReply(reply._id, editText.trim());
      onEdit(reply._id, result.reply.message);
      setEditing(false);
      toast.success("Reply updated.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReply(reply._id);
      onDelete(reply._id);
      toast.success("Reply deleted.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not delete.");
    }
  };

  return (
    <div className={`${depth > 0 ? "ml-6 border-l-2 border-amber-100 pl-4" : ""}`}>
      <div className="rounded-lg bg-gray-50 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-800">{reply.userId?.name || "Anonymous"}</span>
              <span className="text-[10px] text-gray-400">{new Date(reply.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              {reply.edited && <span className="text-[10px] text-gray-400">(edited)</span>}
            </div>
            {editing ? (
              <div className="mt-1">
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className="input w-full text-xs resize-y" maxLength={2000} />
                <div className="mt-1 flex gap-2">
                  <button onClick={handleEdit} disabled={saving} className="text-xs font-bold text-amber-600 hover:text-amber-700">{saving ? <Loader2 className="h-3 w-3 animate-spin inline" /> : null} Save</button>
                  <button onClick={() => { setEditing(false); setEditText(reply.message); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                </div>
              </div>
            ) : (
              <p className="mt-0.5 text-sm text-gray-600">{reply.message}</p>
            )}
          </div>
          {isOwner && !editing && (
            <div className="flex shrink-0 gap-1">
              <button onClick={() => setEditing(true)} className="rounded p-0.5 text-gray-300 hover:text-gray-500"><Pencil className="h-3 w-3" /></button>
              <button onClick={handleDelete} className="rounded p-0.5 text-red-300 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
            </div>
          )}
        </div>
      </div>
      {reply.replies?.length > 0 && depth === 0 && (
        <div className="mt-2 space-y-2">
          {reply.replies.map((child) => (
            <ReplyItem key={child._id} reply={child} currentUserId={currentUserId} onReplyAdded={onReplyAdded} onEdit={onEdit} onDelete={onDelete} depth={1} />
          ))}
        </div>
      )}
    </div>
  );
};

const ReviewReplyThread = ({ reviewId, reviewUserId }) => {
  const { customer, isAuthenticated } = useCustomerAuth();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [newReply, setNewReply] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState(null);

  const fetchReplies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getReplies(reviewId);
      setReplies(result.replies);
    } catch {} finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    if (expanded) fetchReplies();
  }, [expanded, fetchReplies]);

  const handleSubmit = async () => {
    if (newReply.trim().length === 0) return;
    setSending(true);
    try {
      await createReply(reviewId, newReply.trim(), replyTo?._id || null);
      toast.success("Reply added.");
      setNewReply("");
      setReplyTo(null);
      fetchReplies();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not add reply.");
    } finally {
      setSending(false);
    }
  };

  const handleEdit = (replyId, newMessage) => {
    setReplies(replies.map((r) => ({
      ...r,
      message: r._id === replyId ? newMessage : r.message,
      replies: r.replies?.map((c) => ({
        ...c,
        message: c._id === replyId ? newMessage : c.message,
      })),
    })));
  };

  const handleDelete = (replyId) => {
    setReplies(replies.filter((r) => r._id !== replyId).map((r) => ({
      ...r,
      replies: r.replies?.filter((c) => c._id !== replyId),
    })));
  };

  const handleReplyAdded = () => { fetchReplies(); };

  const currentUserId = customer?._id;

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700">
        <MessageCircle className="h-3 w-3" /> View discussion
        <ChevronDown className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/30 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Discussion</h4>
        <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-gray-600"><ChevronUp className="h-4 w-4" /></button>
      </div>

      {loading && (
        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>
      )}

      {!loading && replies.length === 0 && (
        <p className="py-3 text-center text-xs text-gray-400">No discussions yet. Start the conversation!</p>
      )}

      {!loading && replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <div key={reply._id}>
              <ReplyItem reply={reply} currentUserId={currentUserId} onReplyAdded={handleReplyAdded} onEdit={handleEdit} onDelete={handleDelete} depth={0} />
              {isAuthenticated && !replyTo && (
                <button
                  onClick={() => setReplyTo(reply)}
                  className="ml-6 mt-1 text-[10px] font-semibold text-amber-500 hover:text-amber-600"
                >
                  Reply
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAuthenticated && (
        <div className="mt-3">
          {replyTo && (
            <div className="mb-1 flex items-center gap-1 text-xs text-gray-500">
              <span>Replying to <strong>{replyTo.userId?.name || "Anonymous"}</strong></span>
              <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={2}
              placeholder={replyTo ? `Reply to ${replyTo.userId?.name || "Anonymous"}...` : "Share your thoughts..."}
              className="input flex-1 text-xs resize-y"
              maxLength={2000}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">{newReply.length}/2000</span>
            <button
              onClick={handleSubmit}
              disabled={sending || newReply.trim().length === 0}
              className="btn-primary text-xs min-h-[32px] px-3"
            >
              {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageCircle className="h-3 w-3" />}
              Send
            </button>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <p className="mt-2 text-center text-[10px] text-gray-400">Login to join the discussion.</p>
      )}
    </div>
  );
};

export default ReviewReplyThread;
