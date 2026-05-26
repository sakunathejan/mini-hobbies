import { useState } from "react";
import AnnouncementBanner from "./AnnouncementBanner.jsx";
import AnnouncementModal from "./AnnouncementModal.jsx";
import AnnouncementToast from "./AnnouncementToast.jsx";
import { useAnnouncements } from "../../context/AnnouncementContext.jsx";

const AnnouncementManager = () => {
  const { announcements } = useAnnouncements();
  const [dismissedPopups, setDismissedPopups] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("dismissed_popups") || "[]"); }
    catch { return []; }
  });
  const [dismissedToasts, setDismissedToasts] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("dismissed_toasts") || "[]"); }
    catch { return []; }
  });

  const banner = announcements.find((a) => a.type === "banner");
  const popup = announcements.find((a) => a.type === "popup" && !dismissedPopups.includes(a._id));
  const toast = announcements.find((a) => a.type === "toast" && !dismissedToasts.includes(a._id));

  const dismissPopup = (id) => {
    const next = [...dismissedPopups, id];
    setDismissedPopups(next);
    sessionStorage.setItem("dismissed_popups", JSON.stringify(next));
  };

  const dismissToast = (id) => {
    const next = [...dismissedToasts, id];
    setDismissedToasts(next);
    sessionStorage.setItem("dismissed_toasts", JSON.stringify(next));
  };

  return (
    <>
      {banner && <AnnouncementBanner announcement={banner} />}
      {popup && <AnnouncementModal announcement={popup} onClose={() => dismissPopup(popup._id)} />}
      {toast && <AnnouncementToast announcement={toast} onClose={() => dismissToast(toast._id)} />}
    </>
  );
};

export default AnnouncementManager;
