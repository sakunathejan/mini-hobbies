import { PackageSearch, RefreshCw, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import OrderStatusBadge from "../components/orders/OrderStatusBadge.jsx";
import OrderTimeline from "../components/orders/OrderTimeline.jsx";
import Seo from "../components/Seo.jsx";
import { trackOrder } from "../services/orderService.js";
import { submitBalancePayment } from "../services/paymentService.js";
import { formatCurrency } from "../utils/formatters.js";
import { getTrackedOrders } from "../utils/orderStorage.js";

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
  const savedOrders = getTrackedOrders();

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

  return (
    <>
      <Seo
        title="Track Order"
        description="Track your Mini Hobbies order status with your order number and phone."
        canonical="/track-order"
      />
      <section className="container-page py-10">
        <h1 className="section-title">Track your order</h1>
        <p className="mt-2 max-w-2xl text-gray-600">
          Enter the order number from checkout and the phone number you used. Status updates whenever the shop
          changes your order.
        </p>

        <form onSubmit={lookup} className="mt-8 max-w-xl rounded-lg border border-gray-200 bg-white p-5">
          <div className="grid gap-3">
            <input
              required
              className="input"
              placeholder="Order number (e.g. MH202605240001)"
              value={form.orderNumber}
              onChange={(event) => setForm({ ...form, orderNumber: event.target.value })}
            />
            <input
              required
              className="input"
              placeholder="Phone number used at checkout"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <button className="btn-primary mt-4 w-full sm:w-auto" disabled={loading}>
            {loading ? "Looking up..." : "Track order"}
          </button>
        </form>

        {savedOrders.length > 0 && !order && (
          <div className="mt-6 max-w-xl rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="font-black">Your recent orders</h2>
            <div className="mt-3 grid gap-2">
              {savedOrders.map((saved) => (
                <button
                  key={saved.orderNumber}
                  type="button"
                  onClick={() => setForm({ orderNumber: saved.orderNumber, phone: saved.phone })}
                  className="rounded-md border border-gray-200 px-4 py-3 text-left text-sm hover:border-ember"
                >
                  <span className="font-bold">{saved.orderNumber}</span>
                  <span className="mt-1 block text-gray-600">{saved.phone}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <PackageSearch className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {order && (
          <div className="mt-8 grid gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-5">
              <div>
                <p className="text-sm text-gray-600">Order number</p>
                <p className="text-2xl font-black">{order.orderNumber}</p>
                <p className="mt-1 text-sm text-gray-600">
                  Placed {new Date(order.createdAt).toLocaleString("en-LK")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.status} />
                <button type="button" onClick={refreshStatus} className="btn-secondary" disabled={loading}>
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="font-black">Delivery progress</h2>
              <div className="mt-4">
                <OrderTimeline order={order} />
              </div>
            </div>

            {order.paymentMethod === "advance" && (
              <div className="rounded-lg border border-purple-200 bg-white p-5">
                <h2 className="font-black">Payment Progress</h2>
                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span>Advance Paid: {formatCurrency(order.advanceAmount || 0)}</span>
                    <span>Total: {formatCurrency(order.total)}</span>
                  </div>
                  <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${order.remainingBalance > 0 ? 50 : 100}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="font-semibold text-emerald-600">{order.remainingBalance > 0 ? "50% Paid" : "100% Paid"}</span>
                    <span className="text-gray-600">
                      {order.remainingBalance > 0
                        ? `Remaining: ${formatCurrency(order.remainingBalance)}`
                        : "Fully Paid"}
                    </span>
                  </div>
                </div>

                {order.remainingBalance > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <p className="mb-2 text-sm font-semibold text-purple-800">Pay Remaining Balance</p>
                    <div className="flex items-center gap-3">
                      <label className="btn-secondary cursor-pointer text-sm">
                        <Upload className="h-4 w-4" />
                        {balanceSlip ? "Change slip" : "Upload slip"}
                        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setBalanceSlip(e.target.files[0] || null)} />
                      </label>
                      {balanceSlip && <span className="text-xs text-gray-600">{balanceSlip.name}</span>}
                      <button className="btn-primary text-sm" disabled={payingBalance || !balanceSlip} onClick={handlePayBalance}>
                        {payingBalance ? "Submitting..." : "Pay Now"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="font-black">Items</h2>
                <ul className="mt-4 divide-y">
                  {order.items.map((item) => (
                    <li key={`${item.product}-${item.name}`} className="flex justify-between gap-4 py-3 text-sm">
                      <span>
                        {item.name} <span className="text-gray-500">x{item.quantity}</span>
                      </span>
                      <strong>{formatCurrency(item.price * item.quantity)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <strong>{formatCurrency(order.subtotal)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery</span>
                    <strong>{formatCurrency(order.deliveryFee)}</strong>
                  </div>
                  <div className="flex justify-between text-base">
                    <span>Total</span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <h2 className="font-black">Status history</h2>
                <ul className="mt-4 space-y-3">
                  {(order.statusHistory || []).slice().reverse().map((entry, index) => (
                    <li key={`${entry.status}-${index}`} className="rounded-md bg-gray-50 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <OrderStatusBadge status={entry.status} />
                        <span className="text-gray-500">{new Date(entry.updatedAt).toLocaleString("en-LK")}</span>
                      </div>
                      {entry.note && <p className="mt-2 text-gray-600">{entry.note}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Link to="/products" className="btn-secondary inline-flex w-fit">
              Continue shopping
            </Link>
          </div>
        )}
      </section>
    </>
  );
};

export default OrderTrackPage;
