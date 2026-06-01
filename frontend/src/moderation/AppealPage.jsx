import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Shield, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Seo from "../components/Seo.jsx";
import { getMyAppealableCases, submitAppeal } from "../moderation/moderationService.js";

const AppealPage = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyAppealableCases()
      .then((result) => {
        setCases(result.cases);
        if (result.cases.length > 0) {
          setSelectedCaseId(result.cases[0]._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCaseId) { toast.error("Select a case to appeal."); return; }
    if (!message.trim()) { toast.error("Please describe why you are appealing."); return; }

    setSubmitting(true);
    try {
      const result = await submitAppeal(selectedCaseId, message.trim());
      toast.success(result.message);
      navigate("/account/moderation", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit appeal.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <>
        <Seo title="Appeal" description="Submit an appeal." />
        <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="rounded-2xl border border-gray-200/60 bg-white p-8 shadow-soft">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Shield className="h-8 w-8 text-gray-400" />
              </div>
              <h1 className="mt-4 text-xl font-black text-gray-900">No Appealable Cases</h1>
              <p className="mt-2 text-sm text-gray-600">You don't have any active moderation cases that can be appealed.</p>
              <button type="button" onClick={() => navigate(-1)} className="mt-6 btn-secondary text-sm">Go Back</button>
            </div>
          </div>
        </section>
      </>
    );
  }

  const selectedCase = cases.find((c) => c._id === selectedCaseId);

  return (
    <>
      <Seo title="Submit Appeal" description="Appeal a moderation decision." />
      <section className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-12">
        <div className="w-full max-w-lg">
          <button type="button" onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-soft sm:p-8">
            <h1 className="text-2xl font-black text-gray-900">Submit an Appeal</h1>
            <p className="mt-1 text-sm text-gray-600">Explain why you believe the moderation decision should be reconsidered.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {cases.length > 1 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Select Case</label>
                  <select value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)} className="input w-full text-sm">
                    {cases.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.type === "suspension" ? "Suspension" : "Ban"} — {new Date(c.createdAt).toLocaleDateString("en-LK")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedCase && (
                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                  <p className="text-xs font-semibold text-gray-500 capitalize">{selectedCase.type} — REASON</p>
                  <p className="mt-1 text-gray-700">{selectedCase.reason}</p>
                  {selectedCase.duration && (
                    <p className="mt-1 text-xs text-gray-500">Duration: {selectedCase.duration} hours</p>
                  )}
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Your Appeal</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="input w-full text-sm" placeholder="Explain why you believe this decision should be reconsidered..." required />
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full text-sm">
                {submitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin inline" /> : <Send className="mr-1.5 h-4 w-4 inline" />}
                {submitting ? "Submitting..." : "Submit Appeal"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default AppealPage;
