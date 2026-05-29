import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";
import { processMessage } from "../services/chatService.js";
import { normalizeOrder } from "../utils/normalizeOrder.js";
import { normalizePhone } from "../utils/whatsapp.js";
import { trackMessage } from "../services/chat/chatTrackingService.js";

export const handleMessage = asyncHandler(async (req, res) => {
  const { message, context } = req.body;
  const sessionId = req.headers["x-session-id"] || `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400);
    throw new Error("Message is required.");
  }

  if (message.length > 500) {
    res.status(400);
    throw new Error("Message too long (max 500 characters).");
  }

  const safeMessage = message.trim().slice(0, 500);
  const startTime = Date.now();
  const response = await processMessage(safeMessage, context || {});
  const responseTimeMs = Date.now() - startTime;

  trackMessage({
    sessionId,
    customerId: req.user?._id,
    role: "user",
    text: safeMessage,
    intent: response.type === "products" ? "product_search" : response.type === "text" ? "general" : "unknown",
    responseTimeMs
  });

  trackMessage({
    sessionId,
    role: "bot",
    text: response.text || "",
    intent: response.type || "text",
    products: response.products || response.fallbackProducts || undefined,
    responseTimeMs
  });

  res.json(response);
});

export const trackOrderByNumber = asyncHandler(async (req, res) => {
  const { orderNumber, phone } = req.body;

  if (!orderNumber || !phone) {
    res.status(400);
    throw new Error("Order number and phone are required.");
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    res.status(400);
    throw new Error("Valid phone number is required.");
  }

  const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() }).populate("payment", "status method").lean();
  if (!order) {
    return res.json({ found: false, text: "I couldn't find an order with that number. Please check and try again. 🔍" });
  }

  const orderPhone = normalizePhone(order.customer?.phone || "");
  if (orderPhone !== normalizedPhone) {
    return res.json({ found: false, text: "Order number and phone don't match. Please verify your details. 🔍" });
  }

  const normalized = normalizeOrder(order);
  res.json({
    found: true,
    text: `📦 **Order #${normalized.orderNumber}**\n\n**Status:** ${normalized.status}\n**Payment:** ${normalized.paymentMethod}\n**Total:** LKR ${Number(normalized.total).toLocaleString("en-LK")}\n**Placed:** ${new Date(normalized.createdAt).toLocaleDateString("en-LK")}\n\n${normalized.remainingBalance > 0 ? `*Remaining balance: LKR ${normalized.remainingBalance.toLocaleString("en-LK")}*` : ""}`,
    order: {
      orderNumber: normalized.orderNumber,
      status: normalized.status,
      total: normalized.total,
      paymentMethod: normalized.paymentMethod
    },
    suggestions: ["Track another order", "Payment help", "Talk to support"]
  });
});

export const getSuggestions = asyncHandler(async (_req, res) => {
  res.json({
    suggestions: [
      { label: "🔍 Search Products", message: "Show me products" },
      { label: "🔥 Best Deals", message: "Best deals" },
      { label: "🆕 New Arrivals", message: "New arrivals" },
      { label: "📦 Track Order", message: "Track my order" },
      { label: "💰 Budget Picks", message: "What can I get for 3000?" },
      { label: "🏆 Best Sellers", message: "What's popular?" }
    ]
  });
});
