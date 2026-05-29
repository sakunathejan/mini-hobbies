import { X } from "lucide-react";
import { useEffect } from "react";

const PRIORITY_COLORS = {
  low: "bg-gray-100 text-gray-700", normal: "bg-blue-50 text-blue-700",
  high: "bg-orange-50 text-orange-700", urgent: "bg-red-50 text-red-700"
};

const AnnouncementPreview = ({ announcement, onClose }) => {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!announcement) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Preview</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>

        {/* Banner preview */}
        <div className={`rounded-lg border p-4 ${announcement.priority === "urgent" ? "bg-red-50 border-red-200" : announcement.priority === "high" ? "bg-orange-50 border-orange-200" : announcement.priority === "normal" ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-center gap-3">
            {announcement.image && <img src={announcement.image} alt="" className="h-12 w-20 rounded object-cover shrink-0" loading="lazy" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{announcement.title}</span>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${PRIORITY_COLORS[announcement.priority] || ""}`}>{announcement.priority}</span>
              </div>
              <div className="mt-1 text-sm [&_*]:break-words [&_*]:overflow-hidden" style={{ overflowWrap: "break-word", wordBreak: "break-word" }} dangerouslySetInnerHTML={{ __html: announcement.content }} />
              {announcement.ctaText && announcement.ctaUrl && (
                <a href={announcement.ctaUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex rounded-md bg-gray-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 transition">
                  {announcement.ctaText}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Type badges */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
          <span className="rounded bg-gray-100 px-2 py-0.5">{announcement.type}</span>
          <span className="rounded bg-gray-100 px-2 py-0.5">{announcement.audience}</span>
          <span className="rounded bg-gray-100 px-2 py-0.5">{announcement.category}</span>
          <span className={`rounded px-2 py-0.5 font-medium ${
            announcement.status === "published" ? "bg-emerald-50 text-emerald-700" :
            announcement.status === "scheduled" ? "bg-blue-50 text-blue-700" :
            "bg-gray-100 text-gray-600"
          }`}>{announcement.status}</span>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPreview;
