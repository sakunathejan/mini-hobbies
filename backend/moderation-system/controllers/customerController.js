import asyncHandler from "../../utils/asyncHandler.js";
import { getCustomerModerationStatus, getModerationHistory, submitAppeal } from "../services/moderationService.js";

export const getMyStatus = asyncHandler(async (req, res) => {
  const status = await getCustomerModerationStatus(req.customer._id);
  res.json(status);
});

export const getMyHistory = asyncHandler(async (req, res) => {
  const history = await getModerationHistory(req.customer._id);
  res.json(history);
});

export const submitMyAppeal = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ message: "Appeal message is required" });
    return;
  }
  const result = await submitAppeal(req.customer._id, message.trim());
  res.json({ message: "Appeal submitted", case: result });
});
