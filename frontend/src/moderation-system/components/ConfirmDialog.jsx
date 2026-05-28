import { AlertTriangle, X } from "lucide-react";

const ConfirmDialog = ({ open, title, message, confirmLabel = "Delete", cancelLabel = "Cancel", variant = "danger", loading, onConfirm, onCancel }) => {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm animate-bounce-in rounded-2xl bg-white p-6 shadow-2xl">
        <button onClick={onCancel} className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isDanger ? "bg-red-100" : "bg-gray-100"}`}>
            <AlertTriangle className={`h-6 w-6 ${isDanger ? "text-red-600" : "text-gray-600"}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900">{title || "Confirm"}</h3>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary text-sm px-4 py-2 rounded-lg">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`text-sm px-4 py-2 rounded-lg font-semibold text-white transition inline-flex items-center gap-1.5 ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 disabled:opacity-50"
                : "bg-gray-900 hover:bg-gray-800 disabled:opacity-50"
            }`}>
            {loading && (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;