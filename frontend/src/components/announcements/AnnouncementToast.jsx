import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../../services/api.js";

const PRIORITY_STYLES = {
  urgent: "bg-red-600 text-white",
  high: "bg-orange-600 text-white",
  normal: "bg-blue-600 text-white",
  low: "bg-gray-700 text-white"
};

const AnnouncementToast = ({ announcement, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!announcement) return null;

  const handleDismiss = () => {
    setVisible(false);
    api.post(`/announcements/${announcement._id}/dismiss`).catch(() => {});
    setTimeout(onClose, 300);
  };

  const handleClick = () => {
    api.post(`/announcements/${announcement._id}/click`).catch(() => {});
  };

  const handleCtaClick = () => {
    handleClick();
    setVisible(false);
    onClose();
  };

  const style = PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.normal;

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <div className={`rounded-xl p-4 shadow-2xl ${style}`}>
        <button onClick={handleDismiss} className="absolute right-3 top-3 rounded p-0.5 hover:bg-white/20 transition">
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          {announcement.image && (
            <img src={announcement.image} alt="" className="h-14 w-20 rounded-lg object-cover shrink-0" loading="lazy" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{announcement.title}</p>
            <p className="mt-0.5 text-xs opacity-90 line-clamp-2">{announcement.content.replace(/<[^>]*>/g, "")}</p>
              {announcement.ctaText && announcement.ctaUrl && (
              <a
                href={announcement.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCtaClick}
                className="mt-2 inline-block text-xs font-semibold underline underline-offset-2"
              >
                {announcement.ctaText}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementToast;
