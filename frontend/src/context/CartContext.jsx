import { useCallback, createContext, useContext, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { getProductById } from "../services/productService.js";

const CartContext = createContext(null);

const getItemId = (product, variantId) => variantId ? `${product._id}_${variantId}` : product._id;

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem("mini_hobbies_cart");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const persist = useCallback((nextItems) => {
    setItems(nextItems);
    try { localStorage.setItem("mini_hobbies_cart", JSON.stringify(nextItems)); } catch {}
  }, []);

  const addItem = useCallback((product, quantity = 1, variantId = null) => {
    const currentItems = itemsRef.current;
    const id = getItemId(product, variantId);
    const variant = variantId ? product.variants?.find((v) => v._id === variantId) : null;
    const existingItem = currentItems.find((item) => item._cartId === id);

    const currentQty = existingItem ? existingItem.quantity : 0;
    const maxStock = variant ? variant.stock : (product.stock || 0);
    const newQty = currentQty + quantity;

    if (newQty > maxStock) {
      toast.error(`Only ${maxStock} available.`);
      return;
    }

    const cartItem = {
      ...product,
      _cartId: id,
      variantId: variantId || "",
      variantName: variant?.name || "",
      quantity: newQty
    };

    const nextItems = existingItem
      ? currentItems.map((item) => (item._cartId === id ? cartItem : item))
      : [...currentItems, cartItem];

    persist(nextItems);
    toast.success("Added to cart.");
  }, [persist]);

  const updateQuantity = useCallback(async (cartId, newQuantity) => {
    const currentItems = itemsRef.current;
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

    persist(currentItems.map((i) => (i._cartId === cartId ? { ...i, quantity: Math.max(1, newQuantity) } : i)));
  }, [persist]);

  const removeItem = useCallback((cartId) => {
    persist(itemsRef.current.filter((item) => item._cartId !== cartId));
    toast.success("Removed from cart.");
  }, [persist]);

  const clearCart = useCallback(() => persist([]), [persist]);

  const subtotal = useMemo(() =>
    items.reduce((sum, item) => {
      let price = item.discountPrice || item.price;
      if (item.variantId && item.variants) {
        const variant = item.variants.find((v) => v._id === item.variantId);
        if (variant?.price) price = variant.price;
      }
      return sum + price * item.quantity;
    }, 0),
  [items]);

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clearCart, subtotal }),
    [items, addItem, updateQuantity, removeItem, clearCart, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);