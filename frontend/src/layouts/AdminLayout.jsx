import { BarChart3, Building2, CreditCard, ExternalLink, LogOut, MapPin, Megaphone, Menu, MessageSquare, Package, Percent, PlusCircle, Settings, Shield, ShoppingBag, Tags, TrendingUp, User, X } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import PageTransition from "../components/transitions/PageTransition.jsx";

const AdminLayout = () => {
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    } else {
      const top = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      if (top) {
        window.scrollTo(0, parseInt(top) * -1);
      }
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const links = [
    { to: "/admin", end: true, icon: BarChart3, label: "Dashboard" },
    { to: "/admin/products", icon: Package, label: "Products" },
    { to: "/admin/products/new", icon: PlusCircle, label: "Add Product" },
    { to: "/admin/categories", icon: Tags, label: "Categories" },
    { to: "/admin/orders", icon: ShoppingBag, label: "Orders" },
    { to: "/admin/payments", icon: CreditCard, label: "Payments" },
    { to: "/admin/payment-methods", icon: Settings, label: "Payment Methods" },
    { to: "/admin/coupons", icon: Percent, label: "Coupons" },
    { to: "/admin/delivery-zones", icon: MapPin, label: "Delivery Zones" },
    { to: "/admin/bank-details", icon: Building2, label: "Bank Details" },
    { to: "/admin/announcements", icon: Megaphone, label: "Announcements" },
    { to: "/admin/users", icon: User, label: "Users" },
    { to: "/admin/reviews", icon: MessageSquare, label: "Reviews" },
    { to: "/admin/moderation", icon: Shield, label: "Moderation" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <>
    <div className="min-h-screen bg-gray-100">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-200 bg-white md:flex md:flex-col">
        <div className="shrink-0 px-5 pt-5 pb-3">
          <h1 className="text-xl font-black">Mini Hobbies Admin</h1>
          <Link to="/" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-ember transition-colors">
            <ExternalLink className="h-3 w-3" /> Visit Store
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-5 grid gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100 ${isActive ? "bg-ember/10 text-ember" : ""}`}>
                <Icon className="h-4 w-4" /> {link.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-gray-200 px-5 py-4">
          <button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <p className="text-sm font-black">Mini Hobbies Admin</p>
        <button aria-label="Open menu" onClick={() => setMobileOpen(true)} className="touch-manipulation rounded-md p-2 hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <main className="md:pl-64">
        <div className="container-page py-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>
    </div>

    {mobileOpen && (
      <>
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
        <div className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl md:hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <span className="text-sm font-black">Menu</span>
            <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="touch-manipulation rounded-md p-2 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <Link to="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-gray-400 hover:bg-gray-100 min-h-[44px]">
              <ExternalLink className="h-4 w-4" /> Visit Store
            </Link>
            <hr className="my-2 border-gray-100" />
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `flex items-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition min-h-[44px] ${isActive ? "bg-ember/10 text-ember" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <Icon className="h-4 w-4" /> {link.label}
                </NavLink>
              );
            })}
            <button onClick={() => { logout(); setMobileOpen(false); }} className="mt-4 flex w-full items-center gap-2 rounded-md px-4 py-3 text-sm font-semibold text-red-600 min-h-[44px]">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </nav>
        </div>
      </>
    )}
    </>
  );
};

export default AdminLayout;
