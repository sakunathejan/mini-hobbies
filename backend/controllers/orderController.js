import Coupon from "../models/Coupon.js";
import Customer from "../models/Customer.js";
import DeliveryZone from "../models/DeliveryZone.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import PaymentMethod from "../models/PaymentMethod.js";
import Product from "../models/Product.js";
import Setting from "../models/Setting.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as cache from "../utils/cache.js";
import { enqueue } from "../utils/jobQueue.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { normalizeOrder, toTitleStatus } from "../utils/normalizeOrder.js";
import { normalizePhone, notifyAdminWhatsApp } from "../utils/whatsapp.js";
import { uploadPaymentSlip } from "../services/supabaseStorageService.js";
import { retryCustomerWhatsApp, buildCustomerWhatsAppUrl } from "../services/whatsappService.js";
import { sendOrderStatusEmail, sendOrderConfirmationEmail } from "../services/emailService.js";
import { normalizeTo } from "../utils/normalizeAddress.js";

const calcShipping = (totalWeightKg, zone) => {
  if (!zone) return null;
  if (totalWeightKg <= 1) return zone.firstKgCharge;
  return zone.firstKgCharge + Math.ceil((totalWeightKg - 1)) * zone.additionalKgCharge;
};

const getDefaultOrigin = async () => {
  try {
    const zones = await DeliveryZone.distinct("from", { isActive: true });
    if (zones.length === 1) return zones[0];
    const setting = await Setting.findOne({ key: "defaultShippingOrigin" }).lean();
    return setting?.value || "Colombo";
  } catch {
    return "Colombo";
  }
};

const pushStatusHistory = (order, status, note = "") => {
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({ status, note, updatedAt: new Date() });
};

export const createOrder = asyncHandler(async (req, res) => {
  let customer = typeof req.body.customer === "string" ? JSON.parse(req.body.customer) : req.body.customer;
  let items = typeof req.body.items === "string" ? JSON.parse(req.body.items) : req.body.items;
  const { notes, paymentMethod, couponCode } = req.body;

  if (!items?.length) {
    res.status(400);
    throw new Error("Order must include at least one item.");
  }

  const productIds = items.map((item) => item.product);

  const [{ products }, pm] = await Promise.all([
    Product.find({ _id: { $in: productIds } }).lean().then((products) => ({ products })),
    paymentMethod ? PaymentMethod.findOne({ code: paymentMethod.toLowerCase(), enabled: true }).lean() : Promise.resolve(null)
  ]);

  if (paymentMethod && !pm) {
    res.status(400);
    throw new Error("Selected payment method is currently unavailable.");
  }

  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.product);
    if (!product) {
      res.status(400);
      throw new Error("One or more products were not found.");
    }
    let price = product.discountPrice || product.price;
    let variantName = "";
    let variantImage = "";
    if (item.variantId && product.hasVariants) {
      const variant = product.variants.find((v) => v._id.toString() === item.variantId);
      if (variant) {
        price = variant.price || price;
        variantName = variant.name || "";
        variantImage = variant.image?.url || "";
      }
    }
    return {
      product: product._id,
      name: product.name,
      image: variantImage || product.images[0]?.url || "",
      price,
      quantity: Number(item.quantity),
      variantId: item.variantId || "",
      variantName,
      variantImage
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let deliveryFee = 650;
  let district = customer.district || "";
  const destinationTo = normalizeTo(district);

  if (destinationTo && orderItems.length > 0) {
    const origin = await getDefaultOrigin();
    const zone = await DeliveryZone.findOne({
      normalizedFrom: normalizeTo(origin),
      normalizedTo: destinationTo,
      isActive: true
    }).lean();

    if (zone) {
      const totalWeight = orderItems.reduce((sum, item) => {
        const product = products.find((p) => p._id.toString() === item.product);
        return sum + (product?.weightKg || 0.5) * item.quantity;
      }, 0);
      const calculated = calcShipping(totalWeight, zone);
      if (calculated !== null) deliveryFee = calculated;
    }
  }
  if (subtotal > 25000) deliveryFee = 0;

  let discount = 0;
  let couponData = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon) {
      if (coupon.expiresAt && new Date() > coupon.expiresAt) {
        res.status(400);
        throw new Error("Coupon has expired.");
      }
      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        res.status(400);
        throw new Error("Coupon usage limit reached.");
      }
      if (subtotal < coupon.minOrder) {
        res.status(400);
        throw new Error(`Minimum order LKR ${coupon.minOrder.toLocaleString("en-LK")} required.`);
      }
      if (coupon.type === "percentage") {
        discount = Math.round((subtotal * coupon.value) / 100);
        if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
      } else {
        discount = coupon.value;
      }
      coupon.usedCount += 1;
      await coupon.save();
      couponData = { code: coupon.code, discount };
    }
  }

  const total = subtotal + deliveryFee - discount;
  const orderNumber = await generateOrderNumber();

  let initialStatus = "Pending Advance Payment";
  let initialNote = "Order placed";

  const paymentType = paymentMethod === "advance" ? "advance_50" : paymentMethod === "bank_transfer" ? "full_payment" : "cod";
  const advanceAmount = paymentMethod === "advance" ? Math.round(total * 0.5) : 0;
  const remainingBalance = advanceAmount > 0 ? total - advanceAmount : 0;

  if (paymentMethod === "cod") {
    initialStatus = "Awaiting Final Payment";
    initialNote = "Order placed with Cash on Delivery";
  } else if (paymentMethod === "bank_transfer") {
    initialStatus = "Pending Payment Verification";
    initialNote = "Order placed, awaiting payment verification";
  }

  console.log(`[ORDER] createOrder: customer authenticated=${!!req.customer}, customerId=${req.customer?._id || "null"}, paymentMethod=${paymentMethod}`);

  const orderData = {
    orderNumber,
    customerId: req.customer?._id || null,
    customer: { ...customer, phone: customer.phone.trim(), district },
    items: orderItems,
    subtotal,
    deliveryFee,
    discount,
    total,
    advanceAmount,
    remainingBalance,
    paymentMethod: paymentMethod || "bank_transfer",
    paymentType,
    coupon: couponData,
    notes: notes || "",
    status: initialStatus,
    statusHistory: [{ status: initialStatus, note: initialNote, updatedAt: new Date() }]
  };

  const order = await Order.create(orderData);

  if (!order.customerId && customer.email) {
    try {
      const matched = await Customer.findOne({ email: customer.email.toLowerCase().trim() });
      if (matched) {
        order.customerId = matched._id;
        await order.save();
        console.log(`[ORDER] Linked order ${order.orderNumber} to customer ${matched._id} by email fallback`);
      }
    } catch (linkErr) {
      console.error(`[ORDER] Email fallback failed for ${order.orderNumber}:`, linkErr.message);
    }
  }

  if (paymentMethod === "cod") {
    const payment = await Payment.create({
      order: order._id,
      method: "cod",
      status: "verified"
    });
    order.payment = payment._id;
    await order.save();
  }

  if (paymentMethod === "advance" && req.file) {
    const upload = await uploadPaymentSlip(req.file);
    const slipUrl = upload.url;
    const slipPath = upload.path;

    const payment = await Payment.create({
      order: order._id,
      method: "advance",
      status: "awaiting_verification",
      advance: { percentage: 50, amount: advanceAmount, remainingAmount: remainingBalance },
      bankTransfer: {
        slipUrl,
        slipPath,
        bankName: req.body.bankName || "",
        accountName: req.body.accountName || "",
        accountNumber: req.body.accountNumber || "",
        branch: req.body.branch || ""
      }
    });

    order.payment = payment._id;
    order.status = "Advance Payment Submitted";
    order.statusHistory.push({ status: "Advance Payment Submitted", note: "Advance payment slip uploaded at checkout, awaiting verification", updatedAt: new Date() });
    await order.save();
  }

  for (const item of orderItems) {
    const variantId = item.variantId || null;
    if (variantId) {
      const product = await Product.findById(item.product);
      if (product && product.hasVariants) {
        const variant = product.variants.id(variantId);
        if (variant) {
          variant.stock = Math.max(0, variant.stock - item.quantity);
          await product.save();
        }
      }
    } else {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }
  }

  cache.clear("dashboard:");
  const normalized = normalizeOrder(order);

  let whatsappUrl = "";
  let adminNotified = false;
  try {
    const wa = await notifyAdminWhatsApp(normalized);
    whatsappUrl = wa.whatsappUrl;
    adminNotified = wa.adminNotified;
  } catch (_) {}

  enqueue("order-confirmation-email", () => sendOrderConfirmationEmail(order));

  res.status(201).json({ ...normalized, whatsappUrl, adminNotified });
});

export const getOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().sort("-createdAt").populate("payment", "status method").lean();
  res.json(orders.map(normalizeOrder));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("payment").lean();
  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }
  res.json(normalizeOrder(order));
});

export const trackOrder = asyncHandler(async (req, res) => {
  const phone = normalizePhone(req.query.phone || "");
  if (!phone) {
    res.status(400);
    throw new Error("Phone number is required to track your order.");
  }
  const order = await Order.findOne({ orderNumber: req.params.orderNumber.toUpperCase() }).populate("payment").lean();
  const normalized = order ? normalizeOrder(order) : null;
  if (!normalized || normalizePhone(normalized.customer.phone) !== phone) {
    res.status(404);
    throw new Error("Order not found. Check your order number and phone.");
  }
  res.json(normalized);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  const { status, note, trackingNumber } = req.body;
  const newStatus = toTitleStatus(status);

  if ((newStatus === "Preparing Order" || newStatus === "Shipped" || newStatus === "Delivered") && order.remainingBalance > 0) {
    res.status(400);
    throw new Error("Cannot prepare, ship, or deliver this order until the remaining balance is fully paid.");
  }

  order.status = newStatus;
  pushStatusHistory(order, newStatus, note || `Status updated to ${newStatus}`);

  if (trackingNumber !== undefined) {
    order.trackingNumber = trackingNumber;
  }

  if (newStatus === "Delivered" && order.remainingBalance > 0) {
    order.remainingBalance = 0;
    order.fullyPaidAt = new Date();
  }

  order.markModified("statusHistory");
  await order.save({ validateBeforeSave: false });

  let emailSent = false;
  let emailError = "";
  try {
    enqueue("order-status-email", () => sendOrderStatusEmail(order, note || `Status updated to ${newStatus}`));
    emailSent = true;
  } catch (err) {
    emailError = err.message;
  }

  const customerWhatsappUrl = buildCustomerWhatsAppUrl(normalizeOrder(order), note || `Status updated to ${newStatus}`);

  const normalized = normalizeOrder(order);

  res.json({ ...normalized, emailSent, emailError, customerWhatsappUrl });
});

export const retryWhatsApp = asyncHandler(async (req, res) => {
  try {
    const result = await retryCustomerWhatsApp(req.params.id);
    res.json({ success: true, whatsappUrl: result.whatsappUrl, message: "WhatsApp link generated. Click to send manually." });
  } catch (err) {
    res.status(500);
    throw new Error(err.message);
  }
});

export const getMyOrders = asyncHandler(async (req, res) => {
  if (!req.customer) {
    res.status(401);
    throw new Error("Authentication required.");
  }

  const { page = 1, limit = 10, status } = req.query;
  const filter = { customerId: req.customer._id };
  if (status && status !== "All") filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort("-createdAt")
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate("payment", "status method")
      .lean(),
    Order.countDocuments(filter)
  ]);

  res.json({
    orders: orders.map(normalizeOrder),
    pagination: {
      page: parseInt(page),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }
  res.json({ message: "Order deleted successfully." });
});

export const deleteOrders = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error("No order IDs provided.");
  }
  const result = await Order.deleteMany({ _id: { $in: ids } });
  res.json({ message: `${result.deletedCount} order(s) deleted.`, deletedCount: result.deletedCount });
});
