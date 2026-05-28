import asyncHandler from "../../utils/asyncHandler.js";
import * as replyService from "../services/reviewReplyService.js";
import { validateReplyInput, sanitizeReplyMessage } from "../validators/reviewReplyValidator.js";

export const createReply = asyncHandler(async (req, res) => {
  const errors = validateReplyInput(req.body);
  if (errors.length > 0) {
    res.status(400).json({ message: errors.join(" ") });
    return;
  }

  const message = sanitizeReplyMessage(req.body.message);
  const reply = await replyService.createReply(
    req.body.reviewId,
    req.customer._id,
    message,
    req.body.parentReplyId || null
  );
  res.status(201).json({ message: "Reply added.", reply });
});

export const editReply = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ message: "Message is required." });
    return;
  }

  const sanitized = sanitizeReplyMessage(message);
  const reply = await replyService.editReply(req.params.id, req.customer._id, sanitized);
  res.json({ message: "Reply updated.", reply });
});

export const deleteReply = asyncHandler(async (req, res) => {
  await replyService.deleteReply(req.params.id, req.customer._id);
  res.json({ message: "Reply deleted." });
});

export const getReplies = asyncHandler(async (req, res) => {
  const replies = await replyService.getReplies(req.params.reviewId);
  res.json({ replies });
});

export const deleteReplyAdmin = asyncHandler(async (req, res) => {
  await replyService.deleteReplyAdmin(req.params.id);
  res.json({ message: "Reply deleted by admin." });
});
