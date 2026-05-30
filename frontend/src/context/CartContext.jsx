import { useCallback, createContext, useContext, useMemo, useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getProductById } from "../services/productService.js";
import { getCart, addToCartApi, updateCartItemApi, removeCartItemApi } from "../services/customerCartService.js";

const CartContext = createContext(null);

const LOCAL_KEY = "mini_hobbies_cart";

const getItemId = (productId, variantId) => variantId ? `${productId}_${variantId}` : productId;

const loadLocalCart = () => {
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
};

const saveLocalCart = (items) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch {}
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const hasMerged = useRef(false);

  const isLoggedIn = () => !!localStorage.getItem("mini_hobbies_customer_token");

  const mapApiItems = (dataItems) => {
    const raw = (dataItems || []).map((item) => ({
      ...item.product,
      _cartItemId: item._id,
      _cartId: getItemId(item.product._id, item.variantId || ""),
      quantity: item.quantity,
      variantId: item.variantId || "",
      variantName: item.variantName || "",
    }));
    const hasVariantId = new Set();
    raw.forEach((i) => { if (i.variantId) hasVariantId.add(i._id); });
    return raw.filter((i) => !(!i.variantId && hasVariantId.has(i._id)));
  };

  useEffect(() => {
    if (isLoggedIn()) {
      getCart()
        .then((data) => {
          setItems(mapApiItems(data.items));
          saveLocalCart([]);
        })
        .catch(() => {
          setItems(loadLocalCart());
        })
        .finally(() => setInitialized(true));
    } else {
      setItems(loadLocalCart());
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    const handleCartRefresh = () => {
      if (isLoggedIn()) {
        getCart().then((data) => setItems(mapApiItems(data.items))).catch(() => {});
      }
    };

    const handleCartLogout = () => {
      setItems([]);
      saveLocalCart([]);
      hasMerged.current = false;
    };

    window.addEventListener("cart:refresh", handleCartRefresh);
    window.addEventListener("cart:logout", handleCartLogout);
    return () => {
      window.removeEventListener("cart:refresh", handleCartRefresh);
      window.removeEventListener("cart:logout", handleCartLogout);
    };
  }, []);

  const syncToLocal = useCallback((nextItems) => {
    setItems(nextItems);
    if (!isLoggedIn()) saveLocalCart(nextItems);
  }, []);

  const addItem = useCallback(async (product, quantity = 1, variantId = null) => {
    const currentItems = items;
    const id = getItemId(product._id, variantId);
    const variant = variantId ? product.variants?.find((v) => v._id === variantId) : null;
    const existingItem = currentItems.find((item) => item._cartId === id);

    const currentQty = existingItem ? existingItem.quantity : 0;
    const maxStock = variant ? variant.stock : (product.stock || 0);
    const newQty = currentQty + quantity;

    if (newQty > maxStock) {
      toast.error(`Only ${maxStock} available.`);
      return;
    }

    if (isLoggedIn()) {
      try {
        await addToCartApi(product._id, quantity, variantId || "");
        const data = await getCart();
        setItems(mapApiItems(data.items));
        toast.success("Added to cart.");
      } catch {
        toast.error("Failed to add to cart.");
      }
    } else {
      const cartItem = {
        ...product,
        _cartId: id,
        variantId: variantId || "",
        variantName: variant?.name || "",
        quantity: newQty,
      };

      const nextItems = existingItem
        ? currentItems.map((item) => (item._cartId === id ? cartItem : item))
        : [...currentItems, cartItem];

      syncToLocal(nextItems);
      toast.success("Added to cart.");
    }
  }, [items, syncToLocal]);

  const updateQuantity = useCallback(async (cartId, newQuantity) => {
    const currentItems = items;
    const item = currentItems.find((i) => i._cartId === cartId);
    if (!item) return;

    let maxStock = 0;
    if (item.variantId && item.variants) {
      const variant = item.variants.find((v) => v._id === item.variantId);
      maxStock = variant?.stock ?? 0;
    } else {
      try {
        const fresh = await getProductById(item._id);
        maxStock = fresh.stock || 0;
      } catch {
        maxStock = item.stock || 0;
      }
    }

    if (newQuantity > maxStock) {
      toast.error(`Only ${maxStock} available.`);
      return;
    }

    if (isLoggedIn()) {
      try {
        await updateCartItemApi(item._id, newQuantity, item.variantId);
        const data = await getCart();
        setItems(mapApiItems(data.items));
      } catch {
        toast.error("Failed to update cart.");
      }
    } else {
      syncToLocal(currentItems.map((i) =>
        i._cartId === cartId ? { ...i, quantity: Math.max(1, newQuantity) } : i
      ));
    }
  }, [items, syncToLocal]);

  const removeItem = useCallback(async (cartId) => {
    const currentItems = items;
    const item = currentItems.find((i) => i._cartId === cartId);
    if (!item) return;

    if (isLoggedIn()) {
      try {
        await removeCartItemApi(item._id, item.variantId);
        const data = await getCart();
        setItems(mapApiItems(data.items));
        toast.success("Removed from cart.");
      } catch {
        toast.error("Failed to remove item.");
      }
    } else {
      syncToLocal(currentItems.filter((i) => i._cartId !== cartId));
      toast.success("Removed from cart.");
    }
  }, [items, syncToLocal]);

  const clearCart = useCallback(() => {
    setItems([]);
    saveLocalCart([]);
  }, []);

  const subtotal = useMemo(() =>
    items.reduce((sum, item) => {
      let price = item.discountPrice || item.price;
      if (item.variantId && item.variants) {
        const variant = item.variants.find((v) => v._id === item.variantId);
        if (variant?.price) price = variant.price;
      }
      return sum + (Number(price) || 0) * item.quantity;
    }, 0),
  [items]);

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clearCart, subtotal, initialized }),
    [items, addItem, updateQuantity, removeItem, clearCart, subtotal, initialized]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
