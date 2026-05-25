import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

const ConfirmDialog = ({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, destructive }) => {
  const dialogRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) {
      confirmRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative w-full max-w-md animate-bounce-in rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${destructive ? "bg-red-100" : "bg-gray-100"}`}>
            <AlertTriangle className={`h-7 w-7 ${destructive ? "text-red-600" : "text-gray-600"}`} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{message}</p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary w-full sm:w-auto">
            {cancelLabel || "Cancel"}
          </button>
          <button
            type="button"
            ref={confirmRef}
            onClick={onConfirm}
            className={`w-full sm:w-auto ${destructive ? "btn-danger" : "btn-primary"}`}
          >
            {confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
