import { MessageCircle } from "lucide-react";
import { Link, useLocation, Navigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import OrderStatusBadge from "../components/orders/OrderStatusBadge.jsx";
import { formatCurrency } from "../utils/formatters.js";

const PAYMENT_LABELS = {
  bank_transfer: "Bank Transfer",
  cod: "Cash on Delivery",
  advance: "50% Advance"
};

const OrderSuccessPage = () => {
  const { state } = useLocation();

  if (!state?.orderNumber) {
    return <Navigate to="/cart" replace />;
  }

  const { orderNumber, phone, total, advanceAmount, remainingBalance, paymentMethod, status, whatsappUrl } = state;
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
    "Track: " + window.location.origin + "/track-order?order=" + orderNumber + "&phone=" + encodeURIComponent(customerPhone)
  ].join("\n");
  const digits = customerPhone.replace(/\D/g, "");
  const whatsappCustomerUrl = digits ? "https://wa.me/" + (digits.startsWith("94") ? digits : "94" + digits.replace(/^0/, "")) + "?text=" + encodeURIComponent(msg) : "";

  return (
    <>
      <Seo title="Order Placed" description="Your Mini Hobbies order was received." canonical="/order-success" />
      <section className="container-page py-10">
        <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-bold uppercase tracking-wide text-ember">Order received</p>
          <h1 className="mt-2 text-3xl font-black">Thank you for your order</h1>
          <p className="mt-3 text-gray-600">
            Your order has been saved. Use the order number below to track delivery status anytime.
          </p>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-600">Order number</p>
            <p className="text-2xl font-black tracking-wide">{orderNumber}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <OrderStatusBadge status={status || "Pending Advance Payment"} />
              <span className="text-sm font-semibold text-gray-700">Total: {formatCurrency(total)}</span>
              <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                {PAYMENT_LABELS[paymentMethod] || paymentMethod}
              </span>
            </div>
          </div>

          {paymentMethod === "bank_transfer" && (
            <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
              <p className="font-semibold">Payment Verification</p>
              <p className="mt-1">
                Your payment slip has been submitted. The admin will verify your payment and update the order status. You will be able to track progress below.
              </p>
            </div>
          )}

          {isAdvance && (
            <div className="mt-5 rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900">
              <p className="font-semibold">Advance Payment Slip Submitted</p>
              <p className="mt-1">
                Your 50% advance payment slip has been uploaded and the order is now awaiting admin verification.
                You will be notified once the payment is verified. After verification, you will need to pay the remaining <strong>{formatCurrency(remainingBalance || 0)}</strong> before shipping.
              </p>
            </div>
          )}

          {whatsappCustomerUrl && (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <p className="font-semibold">Save your receipt on WhatsApp</p>
              <p className="mt-1">
                Send yourself a copy of the receipt so you can reference it later.
              </p>
              <a href={whatsappCustomerUrl} target="_blank" rel="noreferrer" className="btn-primary mt-3 inline-flex">
                <MessageCircle className="h-4 w-4" /> Send receipt to WhatsApp
              </a>
            </div>
          )}

          {whatsappUrl && (
            <div className="mt-3">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn-secondary inline-flex text-sm">
                <MessageCircle className="h-4 w-4" /> Contact shop on WhatsApp
              </a>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/track-order?order=${orderNumber}&phone=${encodeURIComponent(phone)}`} className="btn-primary">
              Track this order
            </Link>
            <Link to="/products" className="btn-secondary">
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default OrderSuccessPage;
