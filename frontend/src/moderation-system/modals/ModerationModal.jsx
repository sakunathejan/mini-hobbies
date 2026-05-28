import { useEffect, useState } from "react";
import { AlertTriangle, Ban, Clock, CalendarClock } from "lucide-react";

const DURATION_OPTIONS = [
  { label: "6 hours", hours: 6 },
  { label: "12 hours", hours: 12 },
  { label: "24 hours", hours: 24 },
  { label: "3 days", hours: 72 },
  { label: "7 days", hours: 168 },
  { label: "14 days", hours: 336 },
  { label: "30 days", hours: 720 },
  { label: "Custom", hours: null },
];

const SEVERITY_OPTIONS = ["low", "medium", "high", "critical"];

function toLocalDatetimeString(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const ModerationModal = ({ open, type, customer, onClose, onConfirm }) => {
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [duration, setDuration] = useState(24);
  const [selectedPreset, setSelectedPreset] = useState(24);
  const [customEndAt, setCustomEndAt] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setReason("");
    setMessage("");
    setSeverity("medium");
    setDuration(24);
    setSelectedPreset(24);
    const future = new Date(Date.now() + 3600000);
    setCustomEndAt(toLocalDatetimeString(future));
    setError("");
  }, [open, type]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { setError("Reason is required."); return; }
    setSending(true);
    try {
      const payload = { reason: reason.trim(), message: message.trim(), severity };
      if (type === "suspend") {
        if (selectedPreset === null) {
          payload.endAt = new Date(customEndAt).toISOString();
        } else {
          payload.durationHours = duration;
        }
      }
      await onConfirm(payload);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Action failed.");
    } finally {
      setSending(false);
    }
  };

  const handleDurationSelect = (h) => {
    setSelectedPreset(h);
    if (h !== null) { setDuration(h); }
  };

  const TITLES = { warn: "Issue Warning", suspend: "Suspend Account", ban: "Ban Account" };
  const ICONS = { warn: AlertTriangle, suspend: Clock, ban: Ban };
  const COLORS = { warn: "amber", suspend: "orange", ban: "red" };
  const Icon = ICONS[type] || AlertTriangle;
  const color = COLORS[type] || "gray";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-bounce-in rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-${color}-100`}>
            <Icon className={`h-5 w-5 text-${color}-600`} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{TITLES[type] || "Moderation"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700">Customer</label>
            <p className="mt-1 text-sm text-gray-900">{customer?.name || "Unknown"} ({customer?._id || customer?.id || ""})</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Reason *</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="input mt-1 text-sm" placeholder="Why is this action being taken?" required />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Additional message (optional)</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} className="input mt-1 text-sm" placeholder="Visible to the customer" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700">Severity</label>
            <div className="mt-1 flex gap-1.5">
              {SEVERITY_OPTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setSeverity(s)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${severity === s
                    ? s === "critical" ? "bg-red-600 text-white" : s === "high" ? "bg-orange-500 text-white" : s === "medium" ? "bg-amber-500 text-white" : "bg-yellow-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {type === "suspend" && (
            <div>
              <label className="text-xs font-semibold text-gray-700">Duration</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {DURATION_OPTIONS.map((opt) => (
                  <button key={opt.label} type="button" onClick={() => handleDurationSelect(opt.hours)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${selectedPreset === opt.hours ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {selectedPreset === null && (
                <div className="mt-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">End date & time</label>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-gray-400" />
                    <input type="datetime-local" value={customEndAt} onChange={(e) => setCustomEndAt(e.target.value)} className="input text-sm flex-1" />
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={sending} className={`btn-${color} text-sm`}>
              {sending ? "Processing..." : TITLES[type] || "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModerationModal;
