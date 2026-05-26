import { Outlet } from "react-router-dom";
import { AnnouncementProvider } from "../context/AnnouncementContext.jsx";
import AnnouncementManager from "../components/announcements/AnnouncementManager.jsx";
import Footer from "../components/layout/Footer.jsx";
import Navbar from "../components/layout/Navbar.jsx";

const StoreLayout = () => (
  <AnnouncementProvider>
    <div className="min-h-screen bg-[#f7f7f4] dark:bg-graphite">
      <Navbar />
      <AnnouncementManager />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  </AnnouncementProvider>
);

export default StoreLayout;
