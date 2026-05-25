import { Outlet } from "react-router-dom";
import Footer from "../components/layout/Footer.jsx";
import Navbar from "../components/layout/Navbar.jsx";

const StoreLayout = () => (
  <div className="min-h-screen bg-[#f7f7f4] dark:bg-graphite">
    <Navbar />
    <main>
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default StoreLayout;
