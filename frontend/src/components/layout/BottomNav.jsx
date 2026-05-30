import { Heart, Home, Package, ShoppingBag, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { useCustomerAuth } from "../../context/CustomerAuthContext.jsx";

const tabs = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/cart", icon: ShoppingBag, label: "Cart", countKey: "cart" },
  { to: "/wishlist", icon: Heart, label: "Wishlist", countKey: "wishlist" },
  { to: "/account", icon: User, label: "Account", authKey: true },
];

const BottomNav = () => {
  const { items } = useCart();
  const { items: wishlist } = useWishlist();
  const { customer } = useCustomerAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-lg md:hidden safe-bottom">
      <ul className="flex items-center justify-around py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = tab.countKey === "cart" ? items.length : tab.countKey === "wishlist" ? wishlist.length : 0;
          const to = tab.authKey && !customer ? "/login" : tab.to;
          return (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-0.5 py-1 min-h-[48px] justify-center rounded-md text-[10px] font-semibold transition-colors ${
                    isActive ? "text-ember" : "text-gray-500"
                  }`
                }
              >
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {count > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-ember px-1 text-[9px] font-bold text-white leading-none">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default BottomNav;
