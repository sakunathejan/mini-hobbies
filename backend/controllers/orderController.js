import Coupon from "../models/Coupon.js";
import DeliveryZone from "../models/DeliveryZone.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateOrderNumber } from "../utils/orderNumber.js";
import { normalizeOrder, toTitleStatus } from "../utils/normalizeOrder.js";
import { normalizePhone, notifyAdminWhatsApp } from "../utils/whatsapp.js";
import { uploadPaymentSlip } from "../services/supabaseStorageService.js";
import { retryCustomerWhatsApp, buildCustomerWhatsAppUrl } from "../services/whatsappService.js";
import { sendOrderStatusEmail } from "../services/emailService.js";

const pushStatusHistory = (order, status, note = "") => {
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({ status, note, updatedAt: new Date() });
};

export const createOrder = asyncHandler(async (req, res) => {
  // Parse JSON-stringified fields from FormData (multipart)
  let customer = typeof req.body.customer === "string" ? JSON.parse(req.body.customer) : req.body.customer;
  let items = typeof req.body.items === "string" ? JSON.parse(req.body.items) : req.body.items;
  const { notes, paymentMethod, couponCode } = req.body;

  if (!items?.length) {
    res.status(400);
    throw new Error("Order must include at least one item.");
  }

  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });

  const orderItems = items.map((item) => {
    const product = products.find((p) => p._id.toString() === item.product);
    if (!product) {
      res.status(400);
      throw new Error("One or more products were not found.");
    }
    let price = product.discountPrice || product.price;
    let variantName = "";
    if (item.variantId && product.hasVariants) {
      const variant = product.variants.id(item.variantId);
      if (variant) {
        price = variant.price || price;
        variantName = variant.name || "";
      }
    }
    return {
      product: product._id,
      name: product.name,
      image: product.images[0]?.url || "",
      price,
      quantity: Number(item.quantity),
      variantId: item.variantId || "",
      variantName
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let deliveryFee = 650;
  let district = customer.district || "";
  if (district) {
    const zone = await DeliveryZone.findOne({ district: { $regex: new RegExp(`^${district}$`, "i") }, isActive: true });
    if (zone) deliveryFee = zone.fee;
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

  const advanceAmount = paymentMethod === "advance" ? Math.round(total * 0.5) : 0;
  const remainingBalance = advanceAmount > 0 ? total - advanceAmount : 0;

  if (paymentMethod === "cod") {
    initialStatus = "Awaiting Final Payment";
    initialNote = "Order placed with Cash on Delivery";
  } else if (paymentMethod === "bank_transfer") {
    initialStatus = "Pending Payment Verification";
    initialNote = "Order placed, awaiting payment verification";
  }

  const orderData = {
    orderNumber,
    customer: { ...customer, phone: customer.phone.trim(), district },
    items: orderItems,
    subtotal,
    deliveryFee,
    discount,
    total,
    advanceAmount,
    remainingBalance,
    paymentMethod: paymentMethod || "bank_transfer",
    coupon: couponData,
    notes: notes || "",
    status: initialStatus,
    statusHistory: [{ status: initialStatus, note: initialNote, updatedAt: new Date() }]
  };

  const order = await Order.create(orderData);

  if (paymentMethod === "cod") {
    const payment = await Payment.create({
      order: order._id,
      method: "cod",
      status: "verified"
    });
    order.payment = payment._id;
    await order.save();
  }

  // For advance with payment slip uploaded at checkout
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

  const normalized = normalizeOrder(order);

  let whatsappUrl = "";
  let adminNotified = false;
  try {
    const wa = await notifyAdminWhatsApp(normalized);
    whatsappUrl = wa.whatsappUrl;
    adminNotified = wa.adminNotified;
  } catch (_) {}

  res.status(201).json({ ...normalized, whatsappUrl, adminNotified });
});

export const getOrders = asyncHandler(async (_req, res) => {
  const orders = await Order.find().sort("-createdAt").populate("payment").lean();
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
    await sendOrderStatusEmail(order, note || `Status updated to ${newStatus}`);
    emailSent = true;
  } catch (err) {
    if (err.message === "EMAIL_NOT_CONFIGURED") {
      emailError = "Email not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env to enable automatic email notifications.";
    } else {
      emailError = err.message;
    }
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

export const deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }
  res.json({ message: "Order deleted successfully." });
});
