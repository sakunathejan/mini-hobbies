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
import couponRoutes from "./routes/couponRoutes.js";
import deliveryZoneRoutes from "./routes/deliveryZoneRoutes.js";
import bankDetailRoutes from "./routes/bankDetailRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://hkaosngsasoezxsgrour.supabase.co", "https://images.unsplash.com"],
      connectSrc: ["'self'", "https://hkaosngsasoezxsgrour.supabase.co", "https://mini-hobbies.onrender.com"],
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
const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Mini Hobbies API" });
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth", publicLimiter, authRoutes);
app.use("/api/products", publicLimiter, productRoutes);
app.use("/api/categories", publicLimiter, categoryRoutes);
app.use("/api/orders", orderLimiter, orderRoutes);
app.use("/api/cart", publicLimiter, cartRoutes);
app.use("/api/wishlist", publicLimiter, wishlistRoutes);
app.use("/api/uploads", adminLimiter, uploadRoutes);
app.use("/api/payments", publicLimiter, paymentRoutes);
app.use("/api/coupons", publicLimiter, couponRoutes);
app.use("/api/delivery-zones", publicLimiter, deliveryZoneRoutes);
app.use("/api/bank-details", publicLimiter, bankDetailRoutes);
app.use("/api/settings", publicLimiter, settingRoutes);
app.use("/api/announcements", publicLimiter, announcementRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
