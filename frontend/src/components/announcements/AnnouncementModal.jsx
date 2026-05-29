import { useEffect, useState } from "react";
import { X } from "lucide-react";
import api from "../../services/api.js";

const PRIORITY_STYLES = {
  urgent: "bg-red-50 border-red-200 text-red-800",
  high: "bg-orange-50 border-orange-200 text-orange-800",
  normal: "bg-blue-50 border-blue-200 text-blue-800",
  low: "bg-gray-50 border-gray-200 text-gray-600"
};

const AnnouncementModal = ({ announcement, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!announcement) return null;

  const handleClose = () => {
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
    <>
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />
      <div
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${visible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
      >
        <div className={`overflow-hidden rounded-xl border-2 p-6 shadow-2xl ${style}`}>
          <button onClick={handleClose} className="absolute right-4 top-4 rounded p-1 hover:bg-black/5 transition">
            <X className="h-5 w-5" />
          </button>

          {announcement.image && (
            <img src={announcement.image} alt="" className="mb-4 w-full h-48 rounded-lg object-cover" loading="lazy" />
          )}

          <h3 className="text-xl font-bold break-words">{announcement.title}</h3>
          <div className="mt-2 text-sm leading-relaxed [&_*]:break-words [&_*]:overflow-hidden" style={{ overflowWrap: "break-word", wordBreak: "break-word" }} dangerouslySetInnerHTML={{ __html: announcement.content }} />

          {announcement.ctaText && announcement.ctaUrl && (
            <a
              href={announcement.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleCtaClick}
              className="mt-4 inline-flex rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800 transition"
            >
              {announcement.ctaText}
            </a>
          )}

          <button onClick={handleClose} className="mt-4 ml-3 text-sm text-gray-500 hover:text-gray-700 transition">
            Dismiss
          </button>
        </div>
      </div>
    </>
  );
};

export default AnnouncementModal;
