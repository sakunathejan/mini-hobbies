import { useCallback, createContext, useContext, useMemo, useState } from "react";
import toast from "react-hot-toast";

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem("mini_hobbies_wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const toggle = useCallback((product) => {
    setItems((current) => {
      const exists = current.some((item) => item._id === product._id);
      const nextItems = exists ? current.filter((item) => item._id !== product._id) : [...current, product];
      try { localStorage.setItem("mini_hobbies_wishlist", JSON.stringify(nextItems)); } catch {}
      toast.success(exists ? "Removed from wishlist." : "Saved to wishlist.");
      return nextItems;
    });
  }, []);

  const value = useMemo(() => ({ items, toggle }), [items, toggle]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => useContext(WishlistContext);
