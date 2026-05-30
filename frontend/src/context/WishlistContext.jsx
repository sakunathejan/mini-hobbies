import { useCallback, createContext, useContext, useMemo, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getWishlist, toggleWishlistApi } from "../services/customerWishlistService.js";

const WishlistContext = createContext(null);

const LOCAL_KEY = "mini_hobbies_wishlist";

const loadLocalWishlist = () => {
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveLocalWishlist = (items) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch {}
};

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const isLoggedIn = () => !!localStorage.getItem("mini_hobbies_customer_token");

  useEffect(() => {
    if (isLoggedIn()) {
      getWishlist()
        .then((data) => {
          setItems(data.products || []);
          saveLocalWishlist([]);
        })
        .catch(() => {
          setItems(loadLocalWishlist());
        })
        .finally(() => setInitialized(true));
    } else {
      setItems(loadLocalWishlist());
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    const handleWishlistRefresh = () => {
      if (isLoggedIn()) {
        getWishlist().then((data) => setItems(data.products || [])).catch(() => {});
      }
    };

    const handleWishlistLogout = () => {
      setItems([]);
      saveLocalWishlist([]);
    };

    window.addEventListener("wishlist:refresh", handleWishlistRefresh);
    window.addEventListener("wishlist:logout", handleWishlistLogout);
    return () => {
      window.removeEventListener("wishlist:refresh", handleWishlistRefresh);
      window.removeEventListener("wishlist:logout", handleWishlistLogout);
    };
  }, []);

  const toggle = useCallback((product) => {
    if (isLoggedIn()) {
      toggleWishlistApi(product._id)
        .then((data) => {
          setItems(data.products || []);
          const exists = (data.products || []).some((p) => (p._id || p) === product._id);
          toast.success(exists ? "Saved to wishlist." : "Removed from wishlist.");
        })
        .catch(() => toast.error("Failed to update wishlist."));
    } else {
      setItems((current) => {
        const exists = current.some((item) => item._id === product._id);
        const nextItems = exists
          ? current.filter((item) => item._id !== product._id)
          : [...current, product];
        saveLocalWishlist(nextItems);
        toast.success(exists ? "Removed from wishlist." : "Saved to wishlist.");
        return nextItems;
      });
    }
  }, []);

  const value = useMemo(() => ({ items, toggle, initialized }), [items, toggle, initialized]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => useContext(WishlistContext);
