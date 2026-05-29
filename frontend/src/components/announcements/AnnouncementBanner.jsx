import { AlertTriangle, Info, Megaphone, X } from "lucide-react";
import { useAnnouncements } from "../../context/AnnouncementContext.jsx";

const PRIORITY_STYLES = {
  urgent: { bg: "bg-red-50 border-red-200 text-red-800", icon: AlertTriangle },
  high: { bg: "bg-orange-50 border-orange-200 text-orange-800", icon: AlertTriangle },
  normal: { bg: "bg-blue-50 border-blue-200 text-blue-800", icon: Megaphone },
  low: { bg: "bg-gray-50 border-gray-200 text-gray-600", icon: Info }
};

const AnnouncementBanner = ({ announcement: propAnnouncement }) => {
  const { announcements: contextAnnouncements, dismiss } = useAnnouncements();
  const announcement = propAnnouncement || contextAnnouncements.find((a) => a.type === "banner");

  if (!announcement) return null;

  const style = PRIORITY_STYLES[announcement.priority] || PRIORITY_STYLES.normal;
  const Icon = style.icon;

  return (
    <div className={`border-b ${style.bg} transition-all duration-300`}>
      <div className="container-page flex items-center gap-3 px-4 py-3">
        <Icon className="h-5 w-5 shrink-0" />
        {announcement.image && (
          <img src={announcement.image} alt="" className="h-10 w-16 shrink-0 rounded object-cover" loading="lazy" />
        )}
        <div className="min-w-0 flex-1 text-sm break-words">
          <span className="font-bold">{announcement.title}</span>
          {announcement.content && (
            <span className="ml-1">{announcement.content.replace(/<[^>]*>/g, "")}</span>
          )}
        </div>
        {announcement.ctaText && announcement.ctaUrl && (
          <a
            href={announcement.ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => dismiss(announcement._id)}
            className="shrink-0 rounded-md bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 transition"
          >
            {announcement.ctaText}
          </a>
        )}
        <button
          onClick={() => dismiss(announcement._id)}
          className="shrink-0 rounded p-1 opacity-60 hover:opacity-100 transition"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
