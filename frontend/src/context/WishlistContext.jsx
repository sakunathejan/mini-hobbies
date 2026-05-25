import { createContext, useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem("mini_hobbies_wishlist");
    return stored ? JSON.parse(stored) : [];
  });

  const toggle = (product) => {
    const exists = items.some((item) => item._id === product._id);
    const nextItems = exists ? items.filter((item) => item._id !== product._id) : [...items, product];
    setItems(nextItems);
    localStorage.setItem("mini_hobbies_wishlist", JSON.stringify(nextItems));
    toast.success(exists ? "Removed from wishlist." : "Saved to wishlist.");
  };

  const value = useMemo(() => ({ items, toggle }), [items]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => useContext(WishlistContext);
