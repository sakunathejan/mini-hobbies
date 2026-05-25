import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Seo from "../components/Seo.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { useCart } from "../context/CartContext.jsx";
import { getSetting } from "../services/settingService.js";
import { formatCurrency } from "../utils/formatters.js";
import { placeholderImage } from "../utils/constants.js";

const CartLineItem = ({ item, onUpdateQuantity, onRemove }) => {
  let unitPrice = item.discountPrice || item.price;
  if (item.variantId && item.variants) {
    const v = item.variants.find((v) => v._id === item.variantId);
    if (v?.price) unitPrice = v.price;
  }
  const lineTotal = unitPrice * item.quantity;

  return (
    <div className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-4">
      <img
        src={item.images?.[0]?.url || placeholderImage}
        alt={item.name}
        className="h-14 w-14 shrink-0 rounded-md object-cover sm:h-16 sm:w-16"
      />
      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-2 text-sm font-bold leading-snug text-gray-950 sm:text-base">{item.name}</h2>
        {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
        <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
          {formatCurrency(unitPrice)} each · <span className="font-semibold text-gray-800">{formatCurrency(lineTotal)}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="inline-flex h-8 items-center rounded-md border border-gray-200 text-sm">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onUpdateQuantity(item._cartId, Math.max(1, item.quantity - 1))}
            className="px-2 py-1 hover:bg-gray-50"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[1.75rem] text-center text-xs font-bold">{item.quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onUpdateQuantity(item._cartId, item.quantity + 1)}
            className="px-2 py-1 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Remove item"
          onClick={() => onRemove(item._cartId)}
          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const [freeShipping, setFreeShipping] = useState(false);

  useEffect(() => {
    getSetting("freeShipping").then((s) => setFreeShipping(s.value)).catch(() => {});
  }, []);

  return (
    <>
      <Seo title="Cart" description="Review your Mini Hobbies cart and checkout request." canonical="/cart" />
      <section className="container-page py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="section-title">Cart</h1>
            {items.length > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
            )}
          </div>
        </div>

        {!items.length ? (
          <EmptyState title="Your cart is empty" message="Add die cast cars, figures, scale models, or toys from the catalog." />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-black uppercase tracking-wide text-gray-700">Your items</h2>
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-semibold text-gray-500 hover:text-red-600"
                >
                  Clear cart
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((item) => (
                  <CartLineItem
                    key={item._cartId}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
              <div className="flex justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                <span className="text-gray-600">Items subtotal</span>
                <strong>{formatCurrency(subtotal)}</strong>
              </div>
            </div>

            <div className="lg:sticky lg:top-24">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="font-black">Order Summary</h2>
                <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="text-gray-400">{freeShipping ? "Free" : "Calculated at checkout"}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-black">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                <Link to="/checkout" className="btn-primary mt-4 w-full py-2.5 text-sm">
                  <ShoppingBag className="h-4 w-4" /> Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default CartPage;
