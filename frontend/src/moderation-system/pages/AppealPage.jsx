import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, Shield, Clock, CheckCircle, XCircle, Eye, MessageSquare, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { submitAppeal, getMyModerationStatus } from "../services/moderationService.js";

const STEPS = {
  pending: { icon: Clock, label: "Submitted", color: "text-yellow-600", bg: "bg-yellow-100" },
  under_review: { icon: Eye, label: "Under Review", color: "text-blue-600", bg: "bg-blue-100" },
  waiting_customer: { icon: MessageSquare, label: "Info Needed", color: "text-purple-600", bg: "bg-purple-100" },
  approved: { icon: CheckCircle, label: "Approved", color: "text-green-600", bg: "bg-green-100" },
  rejected: { icon: XCircle, label: "Rejected", color: "text-red-600", bg: "bg-red-100" },
  escalated: { icon: AlertTriangle, label: "Escalated", color: "text-orange-600", bg: "bg-orange-100" },
};

const AppealPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [existingAppeal, setExistingAppeal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyModerationStatus().then((s) => {
      if (s.case?.appealStatus && s.case.appealStatus !== "none") {
        setExistingAppeal(s.case);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) { toast.error("Please explain why you're appealing."); return; }
    if (message.trim().length < 20) { toast.error("Please provide at least 20 characters."); return; }
    setSending(true);
    try {
      await submitAppeal(message.trim());
      toast.success("Appeal submitted successfully.");
      navigate("/account", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit appeal.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (existingAppeal) {
    const step = STEPS[existingAppeal.appealStatus] || STEPS.pending;
    const StepIcon = step.icon;
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-2xl px-4 py-10">
          <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg}`}>
                <StepIcon className={`h-7 w-7 ${step.color}`} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Appeal {step.label}</h1>
                <p className="text-sm text-gray-500">Your appeal is currently being processed.</p>
              </div>
            </div>

            {/* Timeline tracker */}
            <div className="mt-8">
              <div className="relative flex items-center justify-between">
                {["pending", "under_review", "approved"].map((s, i) => {
                  const st = STEPS[s];
                  const Icon = st.icon;
                  const isActive = ["pending", "under_review", "waiting_customer", "escalated"].includes(existingAppeal.appealStatus)
                    ? ["pending", "under_review"].includes(s)
                    : s === "approved" || s === "pending"
                      ? existingAppeal.appealStatus === "approved" ? s !== "under_review" : s === "pending"
                      : s === "pending";
                  const isRejection = existingAppeal.appealStatus === "rejected" && s === "approved";
                  return (
                    <div key={s} className="flex flex-col items-center relative z-10">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                        isActive || (existingAppeal.appealStatus === "approved" && s === "approved")
                          ? "border-green-500 bg-green-50"
                          : isRejection
                            ? "border-red-500 bg-red-50"
                            : existingAppeal.appealStatus === "rejected" && s === "pending"
                              ? "border-red-500 bg-red-50"
                              : "border-gray-200 bg-gray-50"
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          isActive || (existingAppeal.appealStatus === "approved" && s === "approved")
                            ? "text-green-600"
                            : isRejection || existingAppeal.appealStatus === "rejected"
                              ? "text-red-500"
                              : "text-gray-400"
                        }`} />
                      </div>
                      <p className={`mt-2 text-xs font-semibold ${
                        isActive || (existingAppeal.appealStatus === "approved" && s === "approved")
                          ? "text-green-700"
                          : isRejection
                            ? "text-red-600"
                            : "text-gray-400"
                      }`}>{st.label}</p>
                    </div>
                  );
                })}
                {/* Connector line */}
                <div className="absolute top-5 left-[12%] right-[12%] h-0.5 bg-gray-200 -z-0" />
                <div className={`absolute top-5 left-[12%] h-0.5 bg-green-500 -z-0 transition-all duration-500 ${
                  existingAppeal.appealStatus === "approved" ? "right-[12%]" :
                  existingAppeal.appealStatus === "rejected" ? "w-[30%]" :
                  "w-[45%]"
                }`} />
              </div>

              <p className="mt-6 text-center text-sm text-gray-500">
                {existingAppeal.appealStatus === "approved" ? "Your appeal has been approved and your account has been restored." :
                 existingAppeal.appealStatus === "rejected" ? "Your appeal was reviewed but has been rejected." :
                 "We will review your appeal and get back to you."}
              </p>
            </div>

            {/* Appeal details */}
            <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Your Appeal Message</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{existingAppeal.appealMessage}</p>
              {existingAppeal.appealReviewNotes && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Admin Response</h3>
                  <p className="text-sm text-gray-700">{existingAppeal.appealReviewNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100">
              <Shield className="h-7 w-7 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Submit an Appeal</h1>
              <p className="text-sm text-gray-500">
                Explain why you believe this decision should be reconsidered. Our team will review your case.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700">Your Appeal</label>
              <p className="text-xs text-gray-400 mt-1 mb-2">Be detailed and respectful. {message.length}/500</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                rows={6}
                className="input mt-1 text-sm w-full resize-y min-h-[140px]"
                placeholder="Describe your situation in detail. What happened? Why do you believe the action should be reconsidered?..."
                required
              />
              <div className="mt-1 flex justify-between items-center">
                <p className="text-[10px] text-gray-400">Minimum 20 characters</p>
                <p className={`text-xs font-medium ${
                  message.length >= 500 ? "text-red-500" : message.length >= 400 ? "text-yellow-600" : "text-gray-400"
                }`}>{message.length}/500</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-semibold text-xs uppercase tracking-wide">Tips for a strong appeal:</p>
              <ul className="mt-2 space-y-1 text-xs text-amber-700 list-disc list-inside">
                <li>Explain the situation clearly and honestly</li>
                <li>Acknowledge what happened and what you've learned</li>
                <li>Mention any steps you've taken to resolve the issue</li>
                <li>Be respectful — aggressive language may hurt your case</li>
              </ul>
            </div>

            <button type="submit" disabled={sending || message.trim().length < 20}
              className="btn-primary inline-flex w-full items-center justify-center gap-2 py-3 rounded-xl">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? "Submitting..." : "Submit Appeal"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppealPage;