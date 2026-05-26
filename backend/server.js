import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Mini Hobbies API running on port ${PORT}`);
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("");  console.log("\x1b[33m%s\x1b[0m", "----------------------------------------");
      console.log("\x1b[33m%s\x1b[0m", " Email auto-notify NOT configured.");
      console.log("\x1b[33m%s\x1b[0m", " To enable, set SMTP_HOST, SMTP_USER, and SMTP_PASS in .env");
      console.log("\x1b[33m%s\x1b[0m", " Gmail example: smtp.gmail.com, port 587, your email, app password");
      console.log("\x1b[33m%s\x1b[0m", "----------------------------------------");
    }
  });

  server.on("error", (err) => {
    console.error(`Server failed to start on port ${PORT}:`, err.message);
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
