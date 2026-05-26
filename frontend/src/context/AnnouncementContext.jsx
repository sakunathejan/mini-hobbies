import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getActiveAnnouncements } from "../services/announcementService.js";

const AnnouncementContext = createContext(null);

export const AnnouncementProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(localStorage.getItem("dismissed_announcements") || "[]"); }
    catch { return []; }
  });

  const refresh = useCallback(() => {
    getActiveAnnouncements()
      .then((data) => setAnnouncements(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => { refresh(); const iv = setInterval(refresh, 60000); return () => clearInterval(iv); }, [refresh]);

  const dismiss = useCallback((id) => {
    const next = dismissed.includes(id) ? dismissed : [...dismissed, id];
    setDismissed(next);
    localStorage.setItem("dismissed_announcements", JSON.stringify(next));
  }, [dismissed]);

  const visible = announcements.filter((a) => !dismissed.includes(a._id));

  return (
    <AnnouncementContext.Provider value={{ announcements: visible, all: announcements, refresh, dismiss }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncements = () => {
  const ctx = useContext(AnnouncementContext);
  if (!ctx) throw new Error("useAnnouncements must be used within AnnouncementProvider");
  return ctx;
};
