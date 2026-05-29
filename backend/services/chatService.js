import Product from "../models/Product.js";
import DeliveryZone from "../models/DeliveryZone.js";
import * as cache from "../utils/cache.js";
import { findAnswer } from "./chat/chatKnowledgeService.js";

const MODE_KEYWORDS = {
  car: ["car", "cars", "hot wheels", "diecast", "model car", "automotive", "vehicle", "ferrari", "porsche", "lamborghini", "toyota", "nissan", "bmw", "mercedes", "supra", "gtr", "mustang"],
  anime: ["anime", "naruto", "dragon ball", "one piece", "demon slayer", "figurine", "manga", "collectible figure", "anime figure", "action figure", "goku", "luffy", "naruto", "tanjiro"]
};

const INTENTS = {
  greeting: { keywords: ["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "sup", "howdy"], weight: 1 },
  product_search: { keywords: ["looking for", "do you have", "i want", "find", "search", "available", "show me", "got any", "have any", "looking to buy", "interested in"], weight: 2 },
  product_direct: { keywords: ["hot wheels", "diecast", "model car", "miniature", "figurine", "action figure", "collectible", "rc car", "model kit"], weight: 1 },
  budget: { keywords: ["under", "budget", "afford", "spend", "price range", "max", "cheap", "inexpensive", "pocket friendly", "value for money"], weight: 2 },
  recommend: { keywords: ["recommend", "suggest", "best", "popular", "top", "trending", "favorite", "must have", "worth buying", "good"], weight: 2 },
  order_track: { keywords: ["track", "order status", "where is my", "my order", "order update", "shipping status", "delivery status", "package"], weight: 3 },
  delivery: { keywords: ["delivery", "shipping", "ship", "deliver", "koombiyo", "shipping cost", "delivery fee", "shipping charge", "courier"], weight: 2 },
  payment: { keywords: ["pay", "payment", "bank transfer", "cod", "cash on delivery", "advance", "slip", "bank deposit", "how to pay"], weight: 2 },
  help: { keywords: ["help", "what can you do", "capabilities", "how to", "guide", "tutorial", "support", "assist", "information"], weight: 1 },
  new_arrivals: { keywords: ["new arrival", "new product", "just arrived", "latest", "new in", "recently added", "what's new"], weight: 2 },
  deals: { keywords: ["deal", "discount", "sale", "offer", "promotion", "cheap", "clearance", "bargain", "special"], weight: 2 }
};

const FAQ_INTENT_KEYWORDS = [
  "how to order", "how do i order", "place an order", "how to buy", "how do i buy",
  "how to pay", "how do i pay", "payment method", "how shipping works", "how does shipping work",
  "delivery time", "delivery takes", "how long", "shipping to", "do you deliver",
  "account", "register", "sign up", "create account", "forgot password", "reset password",
  "refund", "return", "cancel order", "exchange",
  "what is", "what are", "how does", "how do", "tell me about"
];

const PRODUCT_INTENT_KEYWORDS = [
  "do you have", "looking for", "i want", "show me", "got any", "have any",
  "interested in", "buy", "looking to buy",
  "hot wheels", "diecast", "model", "figurine", "action figure", "collectible",
  "naruto", "goku", "dragon ball", "anime", "ferrari", "porsche", "supra",
  "rc car", "toyota"
];

const SUPPORT_INTENT_KEYWORDS = [
  "order issue", "problem with", "not working", "broken", "damaged", "wrong item",
  "missing item", "didn't receive", "not delivered", "complaint", "refund",
  "return", "exchange", "cancel", "defective", "quality issue"
];

const AMOUNT_PATTERN = /(\d[\d,]*)\s*(lkr|rs|rupees?|\.)?\s*/i;

const GREETING_RESPONSES = [
  "Hey there! 👋 Welcome to Mini Hobbies. Looking for something specific — diecast cars, anime figures, or maybe just browsing?",
  "Hi! 🚗🎌 I'm MiniBot, your personal collector assistant. What are you hunting for today?",
  "Hello collector! 👋 Tell me what you're into — I can help find products, track orders, or just chat about collectibles!"
];

const HELP_RESPONSE = {
  text: "Here's what I can help you with:\n\n🔍 **Find Products** — Just tell me what you're looking for!\n💰 **Budget Search** — \"I have 5000\" or \"under 3000\"\n📦 **Track Orders** — \"Track my order\"\n🚚 **Delivery Info** — Ask about shipping\n💳 **Payment Help** — Payment methods explained\n🏆 **Recommendations** — \"Best Hot Wheels?\"",
  suggestions: ["Show me Hot Wheels", "Best under 2000", "Naruto figures", "New arrivals"]
};

const CLARIFICATION_RESPONSE = {
  type: "text",
  text: "I'm not sure what you're looking for. Are you trying to:\n\n🔍 **Find a product** — Tell me what you want (e.g. \"Hot Wheels Ferrari\" or \"Naruto figure\")\n❓ **Get help** — Ask about ordering, shipping, or payments\n📦 **Track an order** — Say \"Track my order\"\n\nHow can I help you?",
  suggestions: ["Find products", "How to order", "Track my order", "Delivery info"]
};

const extractAmount = (text) => {
  const match = text.match(AMOUNT_PATTERN);
  if (match) return parseInt(match[1].replace(/,/g, ""), 10);
  return null;
};

const detectCollectorMode = (text) => {
  const lower = text.toLowerCase();
  for (const [mode, keywords] of Object.entries(MODE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return mode;
  }
  return null;
};

const detectIntent = (text) => {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [intent, config] of Object.entries(INTENTS)) {
    let score = 0;
    for (const kw of config.keywords) {
      if (lower.includes(kw)) score += config.weight;
    }
    if (score > 0) scores[intent] = score;
  }
  return scores;
};

const hasFAQIntent = (text) => {
  const lower = text.toLowerCase();
  return FAQ_INTENT_KEYWORDS.some((kw) => lower.includes(kw));
};

const hasProductIntent = (text) => {
  const lower = text.toLowerCase();
  return PRODUCT_INTENT_KEYWORDS.some((kw) => lower.includes(kw));
};

const hasSupportIntent = (text) => {
  const lower = text.toLowerCase();
  return SUPPORT_INTENT_KEYWORDS.some((kw) => lower.includes(kw));
};

const searchProducts = async (query, options = {}) => {
  const { limit = 5, maxPrice, minPrice, category, sort = "-createdAt" } = options;
  const filter = {};
  if (query) filter.$text = { $search: query };
  if (maxPrice) filter.price = { ...filter.price, $lte: maxPrice };
  if (minPrice) filter.price = { ...filter.price, $gte: minPrice };
  if (category) filter.category = category;
  const cacheKey = `chat:search:${JSON.stringify({ query, ...options })}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const products = await Product.find(filter)
    .select("name slug price discountPrice images stock stockStatus category")
    .populate("category", "name")
    .sort(sort)
    .limit(limit)
    .lean();
  cache.set(cacheKey, products, 30 * 1000);
  return products;
};

const getNewArrivals = async (limit = 5) => {
  return searchProducts("", { limit, sort: "-createdAt" });
};

const getDeals = async (limit = 5) => {
  const cacheKey = "chat:deals";
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const products = await Product.find({ discountPrice: { $gt: 0 } })
    .select("name slug price discountPrice images stock stockStatus category")
    .populate("category", "name")
    .sort("-createdAt")
    .limit(limit)
    .lean();
  cache.set(cacheKey, products, 60 * 1000);
  return products;
};

const getRecommendations = async (mode = null, limit = 5) => {
  const filter = {};
  if (mode === "anime") {
    filter.$or = [
      { category: { $in: [] } },
      { tags: { $in: ["anime", "naruto", "figure", "dragon ball", "one piece", "demon slayer", "manga", "action figure"] } },
      { name: { $regex: /anime|naruto|figure|goku|action/i } }
    ];
  }
  const cacheKey = `chat:recommend:${mode || "all"}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const products = await Product.find(filter)
    .select("name slug price discountPrice images stock stockStatus category")
    .populate("category", "name")
    .sort("-averageRating -createdAt")
    .limit(limit)
    .lean();
  cache.set(cacheKey, products, 60 * 1000);
  return products;
};

const buildProductResponse = (products, context = "") => {
  if (!products || products.length === 0) return null;
  return {
    type: "products",
    text: context || "Here's what I found:",
    products: products.map((p) => ({
      _id: p._id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      discountPrice: p.discountPrice,
      image: p.images?.[0]?.url || "",
      inStock: p.stock > 0 && p.stockStatus !== "out_of_stock",
      category: p.category?.name || ""
    })),
    suggestions: products.slice(0, 3).map((p) => `Tell me more about ${p.name}`)
  };
};

export const processMessage = async (text, context = {}) => {
  const lower = text.toLowerCase().trim();
  if (!lower) {
    return { type: "text", text: "Say something! I'm here to help you find collectibles. 😊", suggestions: ["Show products", "Hot Wheels", "Help"] };
  }

  const mode = context.collectorMode || detectCollectorMode(text);
  const amount = extractAmount(text);
  const intents = detectIntent(text);
  const topIntent = Object.entries(intents).sort((a, b) => b[1] - a[1])[0]?.[0];
  const faqIntent = hasFAQIntent(text);
  const productIntent = hasProductIntent(text);
  const supportIntent = hasSupportIntent(text);

  // PRIORITY 1: Knowledge base match (cached, <100ms)
  // Catches FAQ, policy, shipping, payment, product info from admin-managed KB
  const knowledgeMatch = await findAnswer(text);
  if (knowledgeMatch) {
    const categoryIcon = {
      faq: "❓",
      policy: "📋",
      shipping: "🚚",
      product: "🛍️",
      brand: "🏷️",
      payment: "💳",
      custom: "💬"
    }[knowledgeMatch.category] || "💬";

    return {
      type: "text",
      text: `${categoryIcon} **${knowledgeMatch.question}**\n\n${knowledgeMatch.answer}`,
      suggestions: ["How to order", "Delivery info", "Payment methods", "Find products"]
    };
  }

  // PRIORITY 2: Greeting
  if (topIntent === "greeting") {
    return { type: "text", text: GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)], suggestions: ["Hot Wheels under 3000", "Naruto figures", "Track my order", "New arrivals"] };
  }

  // PRIORITY 3: Help
  if (topIntent === "help") {
    return HELP_RESPONSE;
  }

  // PRIORITY 4: Order tracking
  if (topIntent === "order_track") {
    return { type: "text", text: "I'd be happy to track your order! 🔍 Please provide your **order number** so I can look it up.\n\n*You can also visit the order tracking page directly.*", suggestions: ["Track using order number"], action: { type: "navigate", href: "/track-order", label: "Go to Order Tracking" } };
  }

  // PRIORITY 5: Support issues
  if (supportIntent) {
    return {
      type: "text",
      text: "I'm sorry you're having trouble! 😔 For issues with orders, payments, or products, please **contact our support team** directly and they'll help you right away.\n\nYou can also check your order status using the tracking page.",
      suggestions: ["Track my order", "Contact support", "How to order"],
      action: { type: "navigate", href: "/track-order", label: "Track Order" }
    };
  }

  // PRIORITY 6: FAQ-type intent (no KB match) → give general answer + clarify
  if (faqIntent) {
    return {
      type: "text",
      text: "I'd be happy to help with that! Here's what I can tell you:\n\n📦 **Orders** — Place orders through our website. Add items to cart and checkout.\n🚚 **Delivery** — We deliver across Sri Lanka via Koombiyo. Free shipping over LKR 25,000.\n💳 **Payment** — We accept bank transfer, 50% advance payment, and cash on delivery.\n\nFor more specific info, check our FAQ or let me know exactly what you need!",
      suggestions: ["How to place an order", "Delivery time", "Payment methods", "Find products"]
    };
  }

  // PRIORITY 7: Delivery information
  if (topIntent === "delivery") {
    const zones = await DeliveryZone.find({ isActive: true }).distinct("normalizedTo").lean();
    const cities = (Array.isArray(zones) ? zones : []).sort().slice(0, 20);
    return {
      type: "text",
      text: "🚚 **Delivery Information**\n\nWe partner with **Koombiyo** for reliable delivery across Sri Lanka.\n\n• Delivery fee is calculated based on **weight & distance**\n• Most locations are covered\n• Free shipping on orders over **LKR 25,000**\n\nHere are some available delivery cities:",
      suggestions: ["Calculate delivery cost", "How long does delivery take?", "Check if you deliver to my city"],
      cities: cities.length > 0 ? cities : undefined
    };
  }

  // PRIORITY 8: Payment information
  if (topIntent === "payment") {
    return {
      type: "text",
      text: "💳 **Payment Options**\n\nWe offer several payment methods:\n\n🏦 **Bank Transfer** — Full payment via bank transfer (upload your slip)\n💰 **50% Advance Payment** — Pay half now, half before shipping\n📬 **Cash on Delivery** — Pay when you receive\n\nAll payments are verified by our team before processing.",
      suggestions: ["How does advance payment work?", "Bank transfer details", "Do you have cash on delivery?"]
    };
  }

  // PRIORITY 9: New arrivals (only if explicit)
  if (topIntent === "new_arrivals") {
    const products = await getNewArrivals(5);
    return buildProductResponse(products, "🌟 **New Arrivals!**\n\nCheck out our latest collectibles:") || { type: "text", text: "No new arrivals at the moment. Check back soon! 😊", suggestions: ["Show best sellers", "Hot Wheels"] };
  }

  // PRIORITY 10: Deals (only if explicit)
  if (topIntent === "deals") {
    const products = await getDeals(5);
    return buildProductResponse(products, "🔥 **Hot Deals & Discounts!**\n\nGrab these while they last:") || { type: "text", text: "No active deals right now. Check back later!", suggestions: ["New arrivals", "Best sellers"] };
  }

  // PRIORITY 11: Product search (only if buying intent is detected)
  if (productIntent || topIntent === "product_search" || topIntent === "product_direct") {
    const searchQuery = lower.replace(/(looking for|do you have|i want|find|search|show me|got any|have any|available|interested in|buy|get)\s*/gi, "").trim();
    const products = await searchProducts(searchQuery || lower, { limit: 5 });
    if (products.length > 0) {
      return buildProductResponse(products, `🔍 **Search Results for "${searchQuery || text}"**`);
    }
    return {
      type: "text",
      text: `I couldn't find "${text}". 😅 Try different keywords or check our full catalog.`,
      suggestions: ["Hot Wheels", "Naruto figures", "Show me products", "Budget under 3000"]
    };
  }

  // PRIORITY 12: Budget search (only if amount detected + budget intent)
  if (amount && (topIntent === "budget" || topIntent === "product_search" || topIntent === "recommend" || text.match(/\d+/))) {
    const searchQuery = text.replace(AMOUNT_PATTERN, "").trim().replace(/(under|budget|max|around|about|spend|have|only)\s*/gi, "").trim();
    const products = await searchProducts(searchQuery || "", { maxPrice: amount, limit: 5 });
    if (products.length > 0) {
      const modePrefix = mode === "anime" ? "🎌 " : mode === "car" ? "🚗 " : "";
      return buildProductResponse(products, `${modePrefix}**Products under LKR ${amount.toLocaleString("en-LK")}**\n\nHere's what fits your budget:`);
    }
    return { type: "text", text: `I couldn't find products under LKR ${amount.toLocaleString("en-LK")}. Try a different budget or browse our catalog. 😊`, suggestions: ["Show all products", "What do you have under 2000?"] };
  }

  // PRIORITY 13: Recommendations (only if explicit intent or collector mode)
  if (topIntent === "recommend" || (mode && (topIntent === "product_search" || !topIntent))) {
    const products = await getRecommendations(mode, 5);
    const modeLabel = mode === "anime" ? "🎌 Anime Collectibles" : mode === "car" ? "🚗 Diecast Cars & Models" : "Our Top Picks";
    return buildProductResponse(products, `🏆 **${modeLabel}**\n\nBased on your interest, check these out:`) || {
      type: "text",
      text: "Let me know what you're looking for and I'll find the best matches!",
      suggestions: ["Hot Wheels", "Naruto figures", "Best sellers"]
    };
  }

  // PRIORITY 14: Clarification — NEVER show random products or fallback
  if (lower.length > 3) {
    return CLARIFICATION_RESPONSE;
  }

  return CLARIFICATION_RESPONSE;
};
