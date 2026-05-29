import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import paymentMethodRoutes from "./routes/paymentMethodRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import deliveryZoneRoutes from "./routes/deliveryZoneRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import bankDetailRoutes from "./routes/bankDetailRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import customerAuthRoutes from "./routes/customerAuthRoutes.js";
import unifiedAuthRoutes from "./routes/unifiedAuthRoutes.js";
import adminUserRoutes from "./routes/adminUserRoutes.js";
import moderationRoutes from "./moderation-system/routes/moderationRoutes.js";
import customerModerationRoutes from "./moderation-system/routes/customerRoutes.js";
// KOOMBIYO DISABLED — SDK not yet built. Re-enable when ready:
// import koombiyoRoutes from "./Integrations/koombiyo-sdk-wrapper/koombiyoRoutes.js";
import reviewRoutes from "./reviews/routes/reviewRoutes.js";
import reviewReactionRoutes from "./reviews/routes/reviewReactionRoutes.js";
import reviewReplyRoutes from "./reviews/routes/reviewReplyRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import adminChatRoutes from "./routes/adminChatRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const app = express();

app.set("trust proxy", 1);

app.use(compression({ filter: (req, res) => {
  if (req.headers["x-no-compression"]) return false;
  return compression.filter(req, res);
}, level: 6 }));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://hkaosngsasoezxsgrour.supabase.co", "https://images.unsplash.com", "https://lh3.googleusercontent.com"],
      connectSrc: ["'self'", "https://hkaosngsasoezxsgrour.supabase.co", "https://mini-hobbies.onrender.com", "https://accounts.google.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-session-id", "x-csrf-token"]
}));

app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { message: "Too many login attempts. Try again later." } });
const customerAuthLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { message: "Too many attempts. Try again later." } });
const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Mini Hobbies API" });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth", publicLimiter, authRoutes);
app.use("/api/customers/auth/login", customerAuthLimiter);
app.use("/api/customers/auth/register", customerAuthLimiter);
app.use("/api/customers/auth/google", customerAuthLimiter);
app.use("/api/customers", publicLimiter, customerAuthRoutes);
app.use("/api/products", publicLimiter, productRoutes);
app.use("/api/categories", publicLimiter, categoryRoutes);
app.use("/api/orders", orderLimiter, orderRoutes);
app.use("/api/cart", publicLimiter, cartRoutes);
app.use("/api/wishlist", publicLimiter, wishlistRoutes);
app.use("/api/uploads", adminLimiter, uploadRoutes);
app.use("/api/payments", publicLimiter, paymentRoutes);
app.use("/api/payment-methods", publicLimiter, paymentMethodRoutes);
app.use("/api/coupons", publicLimiter, couponRoutes);
app.use("/api/delivery-zones", publicLimiter, deliveryZoneRoutes);
app.use("/api/delivery", publicLimiter, deliveryRoutes);
app.use("/api/bank-details", publicLimiter, bankDetailRoutes);
app.use("/api/settings", publicLimiter, settingRoutes);
app.use("/api/announcements", publicLimiter, announcementRoutes);
app.use("/api/unified/auth/login", authLimiter);
app.use("/api/unified", publicLimiter, unifiedAuthRoutes);
app.use("/api/admin/users", adminLimiter, adminUserRoutes);
app.use("/api/admin/moderation", adminLimiter, moderationRoutes);
app.use("/api/customers/moderation", publicLimiter, customerModerationRoutes);

// KOOMBIYO DISABLED — re-enable when SDK is ready:
// app.use("/api/integrations/koombiyo", adminLimiter, koombiyoRoutes);

app.use("/api/reviews", reviewRoutes);
app.use("/api/reviews/reactions", reviewReactionRoutes);
app.use("/api/reviews/replies", reviewReplyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin/chat", adminChatRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
