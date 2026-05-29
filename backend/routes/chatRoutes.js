import express from "express";
import rateLimit from "express-rate-limit";
import { handleMessage, trackOrderByNumber, getSuggestions } from "../controllers/chatController.js";

const router = express.Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many messages. Slow down, collector! 😅" }
});

router.post("/message", chatLimiter, handleMessage);
router.post("/track-order", chatLimiter, trackOrderByNumber);
router.get("/suggestions", getSuggestions);

export default router;
