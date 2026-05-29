import { CheckCircle, Clock, Copy, ExternalLink, MessageCircle, Package, PackageSearch, Phone, RefreshCw, Truck, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import KoombiyoDeliveryPanel from "../components/orders/KoombiyoDeliveryPanel.jsx";
import OrderStatusBadge from "../components/orders/OrderStatusBadge.jsx";
import OrderTimeline from "../components/orders/OrderTimeline.jsx";
import Seo from "../components/Seo.jsx";
import { trackOrder } from "../services/orderService.js";
import { submitBalancePayment } from "../services/paymentService.js";
import { formatCurrency } from "../utils/formatters.js";
import { getTrackedOrders } from "../utils/orderStorage.js";
import { placeholderImage } from "../utils/constants.js";

const STORE_PHONE = import.meta.env.VITE_WHATSAPP_STORE_PHONE || "+94703500434";

const statusProgress = {
  "Pending Advance Payment": 5,
  "Pending Payment Verification": 5,
  "Advance Payment Submitted": 10,
  "Fully Paid Pending Verification": 10,
  "Payment Confirmed": 15,
  "Advance Payment Confirmed": 20,
  "Awaiting Final Payment": 25,
  "Fully Paid": 40,
  "Preparing Order": 55,
  Shipped: 75,
  Delivered: 100,
  Cancelled: 100
};

const estimateLabel = {
  "Pending Advance Payment": "Awaiting initial payment",
  "Pending Payment Verification": "Awaiting payment verification",
  "Advance Payment Submitted": "Verifying your advance payment",
  "Fully Paid Pending Verification": "Verifying your full payment",
  "Payment Confirmed": "Payment confirmed",
  "Advance Payment Confirmed": "Advance confirmed",
  "Awaiting Final Payment": "Awaiting final payment",
  "Fully Paid": "Payment complete — preparing soon",
  "Preparing Order": "Being prepared — estimated 1–3 business days",
  Shipped: "In transit — estimated 2–5 business days",
  Delivered: "Delivered successfully",
  Cancelled: "Order cancelled"
};

const OrderTrackPage = () => {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    orderNumber: searchParams.get("order") || "",
    phone: searchParams.get("phone") || ""
  });
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [balanceSlip, setBalanceSlip] = useState(null);
  const [payingBalance, setPayingBalance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [liveRefresh, setLiveRefresh] = useState(false);
  const savedOrders = getTrackedOrders();
  const orderRef = useRef(order);
  const formRef = useRef(form);

  useEffect(() => { orderRef.current = order; }, [order]);
  useEffect(() => { formRef.current = form; }, [form]);

  useEffect(() => {
    if (!order || order.status === "Delivered" || order.status === "Cancelled") {
      setLiveRefresh(false);
      return;
    }
    setLiveRefresh(true);
    const interval = setInterval(async () => {
      try {
        const result = await trackOrder(orderRef.current.orderNumber, formRef.current.phone.trim());
        if (result.updatedAt !== orderRef.current?.updatedAt) {
          setOrder(result);
        }
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [order?.status, order?.updatedAt]);

  const lookup = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const result = await trackOrder(form.orderNumber.trim().toUpperCase(), form.phone.trim());
      setOrder(result);
    } catch (err) {
      setError(err.response?.data?.message || "Could not find that order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const orderNumber = searchParams.get("order");
    const phone = searchParams.get("phone");
    if (!orderNumber || !phone) return;
    const loadOrder = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await trackOrder(orderNumber.trim().toUpperCase(), phone.trim());
        setOrder(result);
      } catch (err) {
        setError(err.response?.data?.message || "Could not find that order.");
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [searchParams]);

  const handlePayBalance = async () => {
    if (!balanceSlip) {
      toast.error("Please upload the payment slip for the remaining balance.");
      return;
    }
    setPayingBalance(true);
    try {
      const fd = new FormData();
      fd.append("orderId", order._id);
      fd.append("slip", balanceSlip);
      await submitBalancePayment(fd);
      toast.success("Balance payment slip submitted. Awaiting verification.");
      setBalanceSlip(null);
      const result = await trackOrder(order.orderNumber, form.phone.trim());
      setOrder(result);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit balance payment.");
    } finally {
      setPayingBalance(false);
    }
  };

  const refreshStatus = async () => {
    if (!order) return;
    setLoading(true);
    try {
      const result = await trackOrder(order.orderNumber, form.phone.trim());
      setOrder(result);
      toast.success("Order status refreshed.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not refresh order.");
    } finally {
      setLoading(false);
    }
  };

  const copyOrderNumber = useCallback(() => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber).then(() => {
      setCopied(true);
      toast.success("Order number copied.");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => toast.error("Could not copy."));
  }, [order]);

  const contactSupport = () => {
    if (!order) return;
    const msg = `Hi Mini Hobbies! I have a question about my order *${order.orderNumber}*.`;
    const digits = STORE_PHONE.replace(/\D/g, "");
    const intl = digits.startsWith("94") ? digits : "94" + digits.replace(/^0/, "");
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const fullProgress = order ? (statusProgress[order.status] || 0) : 0;

  return (
    <>
      <Seo
        title="Track Order"
        description="Track your Mini Hobbies order status with your order number and phone."
        canonical="/track-order"
      />
      <section className="container-page py-10">
        <div className="mx-auto max-w-3xl">
          <h1 className="section-title">Track your order</h1>
          <p className="mt-2 text-gray-600">
            Enter the order number from checkout and the phone number you used.
          </p>

          <form onSubmit={lookup} className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                required
                className="input text-base"
                placeholder="Order number (e.g. MH202605240001)"
                value={form.orderNumber}
                onChange={(event) => setForm({ ...form, orderNumber: event.target.value })}
              />
              <input
                required
                className="input text-base"
                placeholder="Phone number used at checkout"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </div>
            <button className="btn-primary mt-4 w-full sm:w-auto min-h-[48px]" disabled={loading}>
              {loading ? "Looking up..." : "Track order"}
            </button>
          </form>

          {savedOrders.length > 0 && !order && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-sm font-black text-gray-700">
                <Clock className="h-4 w-4" /> Recent orders
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {savedOrders.map((saved) => (
                  <button
                    key={saved.orderNumber}
                    type="button"
                    onClick={() => setForm({ orderNumber: saved.orderNumber, phone: saved.phone })}
                    className="rounded-lg border border-gray-200 px-4 py-3 text-left text-sm transition hover:border-ember hover:shadow-sm"
                  >
                    <span className="font-bold">{saved.orderNumber}</span>
                    <span className="mt-0.5 block text-gray-500">{saved.phone}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <PackageSearch className="mt-0.5 h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {order && (
            <div className="mt-8 animate-fade-in space-y-6">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order number</p>
                      {liveRefresh && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-2xl font-black tracking-tight">{order.orderNumber}</p>
                      <button
                        type="button"
                        onClick={copyOrderNumber}
                        className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        title="Copy order number"
                      >
                        {copied ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Placed {new Date(order.createdAt).toLocaleString("en-LK", { dateStyle: "long", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <button
                      type="button"
                      onClick={refreshStatus}
                      disabled={loading}
                      className="btn-secondary min-h-[44px]"
                      title="Refresh status"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                    <span>Progress</span>
                    <span>{fullProgress}%</span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-ember to-emerald-500 transition-all duration-700 ease-out"
                      style={{ width: `${fullProgress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{estimateLabel[order.status] || "Processing"}</p>
                </div>

                {order.trackingNumber && (
                  <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm">
                    <span className="font-semibold text-blue-700">Tracking number:</span>{" "}
                    <span className="text-blue-800">{order.trackingNumber}</span>
                  </div>
                )}

                {order.delivery?.shipmentCreated && (
                  <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-700">Koombiyo waybill:</span>{" "}
                      <span className="text-blue-800">{order.delivery.waybillId || "—"}</span>
                    </div>
                    {order.delivery.trackingUrl && (
                      <a href={order.delivery.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-ember hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" /> Track on Koombiyo
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button type="button" onClick={contactSupport} className="btn-secondary text-sm min-h-[44px]">
                    <MessageCircle className="h-4 w-4" /> Contact support
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-black text-gray-700">
                  <Truck className="h-4 w-4" /> Delivery progress
                </h2>
                <div className="mt-5">
                  <OrderTimeline order={order} />
                </div>
              </div>

              {(order.paymentType === "advance_50" || order.paymentMethod === "advance") && (
                <div className="rounded-xl border border-purple-100 bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-sm font-black text-purple-800">
                    <Package className="h-4 w-4" /> Payment progress
                  </h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-purple-50 p-4">
                      <p className="text-xs text-purple-600">Advance paid</p>
                      <p className="mt-1 text-xl font-black text-purple-900">{formatCurrency(order.advanceAmount || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="mt-1 text-xl font-black">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{order.remainingBalance > 0 ? "50% Paid" : "100% Paid"}</span>
                      <span>
                        {order.remainingBalance > 0 ? `Remaining: ${formatCurrency(order.remainingBalance)}` : "Fully paid"}
                      </span>
                    </div>
                    <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-700"
                        style={{ width: `${order.remainingBalance > 0 ? 50 : 100}%` }}
                      />
                    </div>
                  </div>
                  {order.remainingBalance > 0 && (
                    <div className="mt-5 rounded-lg border border-purple-200 bg-purple-50 p-4">
                      <p className="text-sm font-semibold text-purple-800">Pay remaining balance</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <label className="btn-secondary cursor-pointer text-sm min-h-[44px]">
                          <Upload className="h-4 w-4" />
                          {balanceSlip ? "Change slip" : "Upload slip"}
                          <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setBalanceSlip(e.target.files[0] || null)} />
                        </label>
                        {balanceSlip && <span className="max-w-[160px] truncate text-xs text-gray-600">{balanceSlip.name}</span>}
                        <button className="btn-primary text-sm min-h-[44px]" disabled={payingBalance || !balanceSlip} onClick={handlePayBalance}>
                          {payingBalance ? "Submitting..." : "Pay Now"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-sm font-black text-gray-700">
                    <Package className="h-4 w-4" /> Items
                  </h2>
                  <ul className="mt-4 divide-y divide-gray-100">
                    {order.items.map((item) => (
                      <li key={`${item.product}-${item.name}`} className="flex items-center gap-3 py-3">
                        <img
                          src={item.image || placeholderImage}
                          alt={item.name}
                          className="h-12 w-12 shrink-0 rounded-lg border object-cover sm:h-14 sm:w-14"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-snug">{item.name}</p>
                          {item.variantName && (
                            <p className="text-xs text-gray-500">{item.variantName}</p>
                          )}
                          <p className="mt-0.5 text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="shrink-0 text-sm font-bold">{formatCurrency(item.price * item.quantity)}</p>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span>{formatCurrency(order.deliveryFee)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount</span>
                        <span>-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-black">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-sm font-black text-gray-700">
                    <Clock className="h-4 w-4" /> Status history
                  </h2>
                  <ul className="mt-4 space-y-3">
                    {(order.statusHistory || []).slice().reverse().map((entry, index) => (
                      <li key={`${entry.status}-${index}`} className="rounded-lg bg-gray-50 p-3 text-sm transition hover:bg-gray-100">
                        <div className="flex items-center justify-between gap-2">
                          <OrderStatusBadge status={entry.status} />
                          <span className="shrink-0 text-xs text-gray-500">
                            {new Date(entry.updatedAt).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </div>
                        {entry.note && <p className="mt-1.5 text-gray-600">{entry.note}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Need help with your order?</p>
                    <p className="text-sm text-gray-500">Contact us on WhatsApp for quick support.</p>
                  </div>
                </div>
                <button type="button" onClick={contactSupport} className="btn-primary min-h-[44px]">
                  <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
                </button>
              </div>

              <Link to="/products" className="btn-secondary inline-flex w-full sm:w-auto min-h-[44px]">
                <Package className="h-4 w-4" /> Continue shopping
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default OrderTrackPage;
