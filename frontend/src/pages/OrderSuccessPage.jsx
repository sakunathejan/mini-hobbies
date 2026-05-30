import { useMemo } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Package, ArrowRight, Truck } from "lucide-react";
import { Link, useLocation, Navigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import OrderStatusBadge from "../components/orders/OrderStatusBadge.jsx";
import OrderCelebration from "../components/orders/OrderCelebration.jsx";
import { formatCurrency } from "../utils/formatters.js";

const PAYMENT_LABELS = {
  bank_transfer: "Bank Transfer",
  cod: "Cash on Delivery",
  advance: "50% Advance",
};

const INFO_COLORS = {
  bank_transfer: { border: "border-orange-200/60", bg: "bg-orange-50/80", text: "text-orange-900" },
  advance: { border: "border-purple-200/60", bg: "bg-purple-50/80", text: "text-purple-900" },
  whatsapp: { border: "border-emerald-200/60", bg: "bg-emerald-50/80", text: "text-emerald-900" },
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" } },
});

const OrderSuccessPage = () => {
  const { state } = useLocation();

  if (!state?.orderNumber) {
    return <Navigate to="/cart" replace />;
  }

  const { orderNumber, phone, total, advanceAmount, remainingBalance, paymentMethod, status, whatsappUrl, items } = state;
  const isAdvance = paymentMethod === "advance";

  const customerPhone = phone || "";
  const msg = [
    "*RECEIPT - Mini Hobbies*",
    "------------------------",
    "ID: " + orderNumber,
    "Status: " + (status || "Pending Advance Payment"),
    "Payment: " + (PAYMENT_LABELS[paymentMethod] || paymentMethod || "N/A"),
    "------------------------",
    "*Total: LKR " + (total || 0).toLocaleString("en-LK") + "*",
    "------------------------",
    "Track: " + window.location.origin + "/track-order?order=" + orderNumber + "&phone=" + encodeURIComponent(customerPhone),
  ].join("\n");
  const digits = customerPhone.replace(/\D/g, "");
  const whatsappCustomerUrl = digits
    ? "https://wa.me/" + (digits.startsWith("94") ? digits : "94" + digits.replace(/^0/, "")) + "?text=" + encodeURIComponent(msg)
    : "";

  const infoKey = paymentMethod === "bank_transfer" ? "bank_transfer" : isAdvance ? "advance" : null;
  const infoStyle = infoKey ? INFO_COLORS[infoKey] : null;

  const displayItems = useMemo(
    () => (Array.isArray(items) ? items.slice(0, 6) : []),
    [items]
  );

  return (
    <>
      <Seo title="Order Placed" description="Your Mini Hobbies order was received." canonical="/order-success" />
      <OrderCelebration customerName={state.customerName || ""} items={items || []} total={total} />

      {/* Background gradient glow */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-ember/5 blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-mint/5 blur-3xl" />
      </div>

      <section className="container-page py-8 sm:py-12">
        <motion.div
          className="mx-auto max-w-2xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Premium glassmorphism card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white/90 p-5 shadow-soft backdrop-blur-xl sm:p-8">
            {/* Gradient border accent */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-ember via-amber-400 to-mint" />

            {/* Header */}
            <motion.div {...fadeUp(0.1)}>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-ember">
                Order received
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                Thank you for your order
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">
                Your order is safe with us. Use the order number below to track its journey anytime.
              </p>
            </motion.div>

            {/* Order number badge */}
            <motion.div
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-graphite px-4 py-3 sm:mt-6"
              {...fadeUp(0.2)}
            >
              <Package className="h-4 w-4 text-white/60" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/50">
                  Order number
                </p>
                <p className="text-lg font-black tracking-wide text-white sm:text-xl">
                  {orderNumber}
                </p>
              </div>
            </motion.div>

            {/* Status / total row */}
            <motion.div
              className="mt-4 flex flex-wrap items-center gap-3"
              {...fadeUp(0.3)}
            >
              <OrderStatusBadge status={status || "Pending Advance Payment"} />
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {PAYMENT_LABELS[paymentMethod] || paymentMethod}
              </span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(total)}
              </span>
            </motion.div>

            {/* Ordered items gallery */}
            {displayItems.length > 0 && (
              <motion.div className="mt-6" {...fadeUp(0.35)}>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                  Items ordered
                </p>
                <div className="flex flex-wrap gap-2">
                  {displayItems.map((item, i) => (
                    <motion.div
                      key={item.product || i}
                      className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white p-2 shadow-sm transition-shadow hover:shadow-md"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { delay: 0.4 + i * 0.08, duration: 0.35 },
                      }}
                    >
                      {(item.variantImage || item.image) && (
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg sm:h-20 sm:w-20">
                          <img
                            src={item.variantImage || item.image}
                            alt={item.name}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 text-[10px] font-bold text-white">
                            x{item.quantity}
                          </span>
                        </div>
                      )}
                      <p className="mt-1.5 max-w-[72px] truncate text-center text-[10px] font-semibold text-gray-700 sm:max-w-[88px]">
                        {item.name}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Payment-specific info panels */}
            {paymentMethod === "bank_transfer" && (
              <motion.div
                className={`mt-6 rounded-xl border ${infoStyle?.border} ${infoStyle?.bg} p-4 text-sm ${infoStyle?.text}`}
                {...fadeUp(0.5)}
              >
                <p className="font-semibold">Payment Verification</p>
                <p className="mt-1">
                  Your payment slip has been submitted. The admin will verify your payment and update the order status. You will be able to track progress below.
                </p>
              </motion.div>
            )}

            {isAdvance && (
              <motion.div
                className={`mt-6 rounded-xl border ${infoStyle?.border} ${infoStyle?.bg} p-4 text-sm ${infoStyle?.text}`}
                {...fadeUp(0.5)}
              >
                <p className="font-semibold">Advance Payment Slip Submitted</p>
                <p className="mt-1">
                  Your 50% advance payment slip has been uploaded and the order is now awaiting admin verification.
                  You will be notified once the payment is verified. After verification, you will need to pay the remaining{" "}
                  <strong>{formatCurrency(remainingBalance || 0)}</strong> before shipping.
                </p>
              </motion.div>
            )}

            {/* WhatsApp receipt */}
            {whatsappCustomerUrl && (
              <motion.div
                className={`mt-5 rounded-xl border ${INFO_COLORS.whatsapp.border} ${INFO_COLORS.whatsapp.bg} p-4 text-sm ${INFO_COLORS.whatsapp.text}`}
                {...fadeUp(0.55)}
              >
                <p className="font-semibold">Save your receipt on WhatsApp</p>
                <p className="mt-1">
                  Send yourself a copy of the receipt so you can reference it later.
                </p>
                <a
                  href={whatsappCustomerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
                >
                  <MessageCircle className="h-4 w-4" /> Send receipt to WhatsApp
                </a>
              </motion.div>
            )}

            {/* Contact shop */}
            {whatsappUrl && (
              <motion.div className="mt-3" {...fadeUp(0.6)}>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 underline-offset-2 hover:text-gray-900 hover:underline"
                >
                  <MessageCircle className="h-4 w-4" /> Contact shop on WhatsApp
                </a>
              </motion.div>
            )}

            {/* CTA actions */}
            <motion.div
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              {...fadeUp(0.65)}
            >
              <Link
                to={`/track-order?order=${orderNumber}&phone=${encodeURIComponent(phone)}`}
                className="group relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl bg-graphite px-6 py-3.5 text-sm font-bold text-white transition active:scale-[0.97]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/10 to-transparent transition duration-300 group-hover:translate-x-0" />
                <Truck className="relative h-4 w-4" />
                <span className="relative">Track this order</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                to="/products"
                className="group relative inline-flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-900 transition hover:border-ember hover:text-ember active:scale-[0.97]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-ember/5 to-transparent transition duration-300 group-hover:translate-x-0" />
                <span className="relative">Continue shopping</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Footer note */}
            <motion.p
              className="mt-6 text-center text-xs text-gray-400"
              {...fadeUp(0.7)}
            >
              A confirmation email has been sent to your inbox.
            </motion.p>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default OrderSuccessPage;
