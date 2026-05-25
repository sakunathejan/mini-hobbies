import { Heart, Menu, Moon, ShoppingBag, Sun, X } from "lucide-react";
import { useState } from "react";
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

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-graphite/90">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-graphite text-sm font-black text-white dark:bg-white dark:text-graphite">
            MH
          </span>
          <span className="text-lg font-black tracking-normal text-gray-950 dark:text-white">Mini Hobbies</span>
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

        <div className="flex items-center gap-2">
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
          <button aria-label="Open menu" onClick={() => setOpen(!open)} className="rounded-md p-2 md:hidden">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="container-page pb-4 md:hidden">
          <div className="grid gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-soft">
            {links.map((link) => (
              <NavLink key={link.to} onClick={() => setOpen(false)} to={link.to} className="rounded-md px-3 py-2 text-sm font-semibold hover:bg-gray-100">
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
