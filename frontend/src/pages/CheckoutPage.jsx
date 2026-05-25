import { ChevronDown, ChevronUp, Minus, Plus, ShoppingBag, Trash2, Upload, Package } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import { useCart } from "../context/CartContext.jsx";
import { validateCoupon } from "../services/couponService.js";
import { getBankDetails } from "../services/bankDetailService.js";
import { getDeliveryZones } from "../services/deliveryZoneService.js";
import { createOrder } from "../services/orderService.js";
import { getSetting } from "../services/settingService.js";
import { formatCurrency } from "../utils/formatters.js";

const SRI_LANKA_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo", "Galle",
  "Gampaha", "Hambantota", "Jaffna", "Kalutara", "Kandy", "Kegalle",
  "Kilinochchi", "Kurunegala", "Mannar", "Matale", "Matara", "Moneragala",
  "Mullaitivu", "Nuwara Eliya", "Polonnaruwa", "Puttalam", "Ratnapura",
  "Trincomalee", "Vavuniya"
];

const CheckoutPage = () => {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showSummaryMobile, setShowSummaryMobile] = useState(false);
  const [zones, setZones] = useState([]);
  const [freeShipping, setFreeShipping] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", district: "", address: "", notes: "" });
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [bankDetails, setBankDetails] = useState({ bankName: "Bank of Ceylon", accountName: "Mini Hobbies", accountNumber: "1234567890", branch: "Colombo Main" });

  useEffect(() => {
    getDeliveryZones().then(setZones).catch(() => {});
    getBankDetails().then((d) => {
      if (d.bankName) setBankDetails(d);
    }).catch(() => {});
    getSetting("freeShipping").then((s) => setFreeShipping(s.value)).catch(() => {});
  }, []);

  const zoneFee = useMemo(() => {
    if (!form.district) return 0;
    const zone = zones.find((z) => z.district.toLowerCase() === form.district.toLowerCase());
    return zone ? zone.fee : 0;
  }, [form.district, zones]);

  const deliveryFee = freeShipping ? 0 : zoneFee;
  const total = subtotal + deliveryFee - couponDiscount;

  const validate = useCallback(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    else if (!/^(?:\+94|0)?[0-9]{9,10}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Invalid Sri Lankan phone number";
    if (!form.address.trim()) e.address = "Address is required";
    if (items.length === 0) e.items = "Cart is empty";
    if (paymentMethod === "advance" && !slipFile) e.slip = "Please upload the advance payment slip";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, items, paymentMethod, slipFile]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const result = await validateCoupon(couponCode, subtotal);
      setAppliedCoupon(result.coupon);
      setCouponDiscount(result.discount);
      toast.success(`Coupon applied! You saved ${formatCurrency(result.discount)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid coupon");
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    if (paymentMethod === "bank_transfer" && !slipFile) {
      toast.error("Please upload the payment slip screenshot.");
      return;
    }

    setSubmitting(true);
    try {
      const customerPayload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        district: form.district
      };

      const itemsPayload = items.map((item) => ({ product: item._id, quantity: item.quantity, variantId: item.variantId || "" }));

      if (paymentMethod === "advance" && slipFile) {
        const fd = new FormData();
        fd.append("customer", JSON.stringify(customerPayload));
        fd.append("items", JSON.stringify(itemsPayload));
        fd.append("notes", form.notes);
        fd.append("paymentMethod", "advance");
        fd.append("couponCode", appliedCoupon ? appliedCoupon.code : "");
        fd.append("paymentSlip", slipFile);
        fd.append("bankName", bankDetails.bankName);
        fd.append("accountName", bankDetails.accountName);
        fd.append("accountNumber", bankDetails.accountNumber);
        fd.append("branch", bankDetails.branch);

        const order = await createOrder(fd);
        clearCart();
        navigate("/order-success", {
          state: {
            orderNumber: order.orderNumber,
            phone: form.phone,
            total: order.total,
            advanceAmount: order.advanceAmount,
            remainingBalance: order.remainingBalance,
            paymentMethod,
            status: order.status,
            whatsappUrl: order.whatsappUrl
          }
        });
      } else {
        const payload = {
          customer: customerPayload,
          items: itemsPayload,
          notes: form.notes,
          paymentMethod,
          couponCode: appliedCoupon ? appliedCoupon.code : ""
        };

        const order = await createOrder(payload);

        if (paymentMethod === "bank_transfer" && slipFile) {
          const fd = new FormData();
          fd.append("orderId", order._id);
          fd.append("slip", slipFile);
          fd.append("bankName", bankDetails.bankName);
          fd.append("accountName", bankDetails.accountName);
          fd.append("accountNumber", bankDetails.accountNumber);
          fd.append("branch", bankDetails.branch);

          const api = (await import("../services/api.js")).default;
          await api.post("/payments/bank-transfer", fd, {
            headers: { "Content-Type": "multipart/form-data" }
          });
        }

        clearCart();
        navigate("/order-success", {
          state: {
            orderNumber: order.orderNumber,
            phone: form.phone,
            total: order.total,
            advanceAmount: order.advanceAmount,
            remainingBalance: order.remainingBalance,
            paymentMethod,
            status: order.status,
            whatsappUrl: order.whatsappUrl
          }
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-gray-600">Add some products before checking out.</p>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <Seo title="Checkout" />
      <h1 className="text-3xl font-black">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-lg border bg-white p-4 sm:p-6">
            <h2 className="text-lg font-bold">Contact Information</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium">Full Name</label>
                <input className={`input mt-1 text-base ${errors.name ? "border-red-400" : ""}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium">Email</label>
                <input className={`input mt-1 text-base ${errors.email ? "border-red-400" : ""}`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium">Phone</label>
                <input className={`input mt-1 text-base ${errors.phone ? "border-red-400" : ""}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="077 123 4567" />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium">District</label>
                <select className="input mt-1 text-base" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}>
                  <option value="">Select district</option>
                  {SRI_LANKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Delivery Address</label>
                <textarea className={`input mt-1 text-base ${errors.address ? "border-red-400" : ""}`} rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, city, postal code" />
                {errors.address && <p className="mt-1 text-xs text-red-600">{errors.address}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Order Notes (optional)</label>
                <textarea className="input mt-1 text-base" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Special instructions for delivery..." />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-4 sm:p-6">
            <h2 className="text-lg font-bold">Payment Method</h2>
            <div className="mt-4 grid gap-3">
              {[
                { method: "bank_transfer", label: "Bank Transfer", desc: "Pay via bank transfer and upload your payment slip" },
                { method: "cod", label: "Cash on Delivery", desc: "Pay when you receive your order" },
                { method: "advance", label: "50% Advance Payment", desc: "Pay 50% now and the remaining 50% before shipping" },
              ].map(({ method, label, desc }) => (
                <label key={method} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${paymentMethod === method ? "border-ember bg-ember/5" : "hover:border-gray-400"}`}>
                  <input type="radio" name="payment" className="accent-ember mt-0.5 shrink-0" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                  <div className="min-w-0">
                    <p className="font-semibold">{label}</p>
                    <p className="text-sm text-gray-600">{desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {paymentMethod === "bank_transfer" && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-semibold text-emerald-800">Bank Details for Transfer</p>
                <div className="mt-2 space-y-1 text-sm text-emerald-700">
                  <p>Bank: {bankDetails.bankName}</p>
                  <p>Account Name: {bankDetails.accountName}</p>
                  <p>Account Number: {bankDetails.accountNumber}</p>
                  <p>Branch: {bankDetails.branch}</p>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">Upload Payment Slip</label>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <label className="btn-secondary cursor-pointer min-h-[44px]">
                      <Upload className="h-4 w-4" />
                      {slipFile ? "Change file" : "Choose file"}
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setSlipFile(e.target.files[0] || null)} />
                    </label>
                    {slipFile && <span className="max-w-[200px] truncate text-sm text-gray-600">{slipFile.name}</span>}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "advance" && (
              <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-4">
                <p className="text-sm text-purple-700">
                  A 50% advance of <strong>{formatCurrency(Math.round(total * 0.5))}</strong> is required to place this order.
                  The remaining <strong>{formatCurrency(Math.round(total * 0.5))}</strong> will be due before shipping.
                  Once the admin verifies your advance payment, the order will be reserved for you.
                </p>
                <div className="mt-4">
                  <label className="text-sm font-medium">Upload Advance Payment Slip <span className="text-red-500">*</span></label>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <label className={`btn-secondary cursor-pointer min-h-[44px] ${errors.slip ? "border-red-400" : ""}`}>
                      <Upload className="h-4 w-4" />
                      {slipFile ? "Change file" : "Choose file"}
                      <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setSlipFile(e.target.files[0] || null)} />
                    </label>
                    {slipFile && <span className="max-w-[200px] truncate text-sm text-gray-600">{slipFile.name}</span>}
                  </div>
                  {errors.slip && <p className="mt-1 text-xs text-red-600">{errors.slip}</p>}
                </div>
              </div>
            )}

            <button
              className="btn-primary mt-4 w-full min-h-[48px] lg:hidden"
              disabled={submitting}
              onClick={() => { setShowSummaryMobile(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              Review Order - {formatCurrency(total)}
            </button>
          </div>
        </div>

        <div className={`lg:col-span-2 space-y-6 ${showSummaryMobile ? "fixed inset-0 z-50 overflow-y-auto bg-white p-4 lg:static lg:z-auto lg:overflow-visible lg:bg-transparent lg:p-0" : "hidden lg:block"}`}>
          {showSummaryMobile && (
            <button onClick={() => setShowSummaryMobile(false)} className="mb-4 flex items-center gap-1 text-sm font-semibold text-gray-600 lg:hidden">
              <ChevronDown className="h-4 w-4 rotate-90" /> Back to form
            </button>
          )}

          <div className="rounded-lg border bg-white p-4 sm:p-6">
            <h2 className="text-lg font-bold">
              Order Summary
              {showSummaryMobile && (
                <button onClick={() => setShowSummaryMobile(false)} className="float-right text-sm font-normal text-gray-500">Close</button>
              )}
            </h2>
            <div className="mt-4 divide-y">
              {items.map((item) => (
                <div key={item._id} className="flex items-center gap-3 py-3">
                  <img src={item.images?.[0]?.url || item.image || ""} alt={item.name} className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-16 sm:w-16" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(item.discountPrice || item.price)} each</p>
                    <div className="mt-1 flex items-center gap-2">
                      <button className="rounded border p-0.5 hover:bg-gray-100 min-h-[28px] min-w-[28px]" onClick={() => { if (item.quantity > 1) updateQuantity(item._id, item.quantity - 1); }}>
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                      <button className="rounded border p-0.5 hover:bg-gray-100 min-h-[28px] min-w-[28px]" onClick={() => updateQuantity(item._id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </button>
                      <button className="ml-auto text-red-500 hover:text-red-700" onClick={() => removeItem(item._id)}>
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold shrink-0">{formatCurrency((item.discountPrice || item.price) * item.quantity)}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center gap-2">
                <input className="input flex-1 text-base" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" />
                <button className="btn-secondary text-sm min-h-[44px]" disabled={couponLoading || !couponCode.trim()} onClick={handleApplyCoupon}>
                  {couponLoading ? "..." : "Apply"}
                </button>
              </div>
              {appliedCoupon && (
                <p className="mt-1 text-sm text-emerald-600">Coupon applied: -{formatCurrency(couponDiscount)}</p>
              )}
            </div>

            <div className="mt-4 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{freeShipping ? <span className="text-emerald-600">Free</span> : formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              className="btn-primary mt-6 w-full min-h-[48px]"
              disabled={submitting}
              onClick={handlePlaceOrder}
            >
              {submitting ? "Placing order..." : `Place Order - ${formatCurrency(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
