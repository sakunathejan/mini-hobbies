import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import app from "./app.js";
import connectDB from "./config/db.js";
import { startExpiryProcessor } from "./moderation-system/events/expiryProcessor.js";
// KOOMBIYO DISABLED — SDK not yet built/deployed. Re-enable when ready.
// import { initKoombiyo } from "./Integrations/koombiyo-sdk-wrapper/koombiyoClient.js";
// import { syncAllActiveDeliveries } from "./Integrations/koombiyo-sdk-wrapper/koombiyoTrackingService.js";
import { seedDefaultPaymentMethods } from "./controllers/paymentMethodController.js";
import { preloadLogo } from "./services/emailService.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  startExpiryProcessor(2000);
  // KOOMBIYO DISABLED — re-enable when SDK is ready:
  // initKoombiyo(process.env.KOOMBIYO_API_KEY);
  // syncAllActiveDeliveries();
  seedDefaultPaymentMethods();
  preloadLogo();

  const server = app.listen(PORT, () => {
    console.log(`Mini Hobbies API running on port ${PORT}`);
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("");  console.log("\x1b[33m%s\x1b[0m", "----------------------------------------");
      console.log("\x1b[33m%s\x1b[0m", "  SMTP not configured — emails will not be sent.");
      console.log("\x1b[33m%s\x1b[0m", "  Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env");
      console.log("\x1b[33m%s\x1b[0m", "----------------------------------------");
    }
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
    setTimeout(() => { console.log("Forced shutdown."); process.exit(1); }, 10000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

startServer();
