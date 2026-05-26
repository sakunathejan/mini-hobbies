import { Heart, Menu, Moon, ShoppingBag, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";

const links = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/track-order", label: "Track order" },
  { to: "/admin", label: "Admin" }
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const { items } = useCart();
  const { items: wishlist } = useWishlist();

  useEffect(() => {
    if (open) {
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
  }, [open]);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-graphite/90">
        <nav className="container-page flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-graphite text-xs font-black text-white dark:bg-white dark:text-graphite sm:h-10 sm:w-10 sm:text-sm">
              MH
            </span>
            <span className="text-base font-black tracking-normal text-gray-950 dark:text-white sm:text-lg">Mini Hobbies</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-semibold ${isActive ? "text-ember" : "text-gray-600 dark:text-gray-300"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button aria-label="Toggle theme" onClick={toggleDark} className="rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              {dark ? <Sun className="h-5 w-5 text-white" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link aria-label="Wishlist" to="/wishlist" className="relative rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Heart className="h-5 w-5 dark:text-white" />
              {wishlist.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-ember px-1.5 text-xs text-white">{wishlist.length}</span>}
            </Link>
            <Link aria-label="Cart" to="/cart" className="relative rounded-md p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <ShoppingBag className="h-5 w-5 dark:text-white" />
              {items.length > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-ember px-1.5 text-xs text-white">{items.length}</span>}
            </Link>
            <button aria-label="Open menu" onClick={() => setOpen(true)} className="touch-manipulation rounded-md p-2 md:hidden">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl md:hidden animate-slide-in">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <span className="text-sm font-black">Menu</span>
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="touch-manipulation rounded-md p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  onClick={() => setOpen(false)}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center rounded-md px-4 py-3 min-h-[48px] text-sm font-semibold transition ${isActive ? "bg-ember/10 text-ember" : "text-gray-700 hover:bg-gray-100"}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
