import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const PromptDialog = ({ open, title, message, placeholder, confirmLabel, cancelLabel, onConfirm, onCancel }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 100);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(inputRef.current?.value || "");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-md animate-bounce-in rounded-2xl bg-white p-6 shadow-2xl">
        <button onClick={onCancel} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
        <form onSubmit={handleSubmit} className="mt-4">
          <textarea
            ref={inputRef}
            className="input min-h-[100px] resize-y"
            placeholder={placeholder || "Enter reason..."}
            autoFocus
          />
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} className="btn-secondary w-full sm:w-auto">
              {cancelLabel || "Cancel"}
            </button>
            <button type="submit" className="btn-danger w-full sm:w-auto">
              {confirmLabel || "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptDialog;