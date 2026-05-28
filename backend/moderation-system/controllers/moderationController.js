import asyncHandler from "../../utils/asyncHandler.js";
import {
  issueWarning,
  applySuspension,
  applyBan,
  liftModeration,
  getModerationHistory,
  listCases,
  reviewAppeal,
  deleteAppeal,
  deleteModerationCase,
  updateAppealStatus,
  addAppealNote,
  getAppealAnalytics,
} from "../services/moderationService.js";

export const warnUser = asyncHandler(async (req, res) => {
  const result = await issueWarning(req.params.id, req.body, req.user);
  res.json({ message: "Warning issued", case: result });
});

export const suspendUser = asyncHandler(async (req, res) => {
  const result = await applySuspension(req.params.id, req.body, req.user);
  res.json({ message: "User suspended", case: result });
});

export const banUser = asyncHandler(async (req, res) => {
  const result = await applyBan(req.params.id, req.body, req.user);
  res.json({ message: "User banned", case: result });
});

export const liftUserModeration = asyncHandler(async (req, res) => {
  const result = await liftModeration(req.params.id, req.user);
  res.json({ message: "Moderation lifted", ...result });
});

export const getUserModerationHistory = asyncHandler(async (req, res) => {
  const result = await getModerationHistory(req.params.id);
  res.json(result);
});

export const getAllCases = asyncHandler(async (req, res) => {
  const { page, limit, type, status, appealStatus, search, startDate, endDate } = req.query;
  const result = await listCases({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    type, status, appealStatus, search, startDate, endDate,
  });
  res.json(result);
});

export const approveAppeal = asyncHandler(async (req, res) => {
  const result = await reviewAppeal(req.params.caseId, "approve", req.user, req.body.notes);
  res.json({ message: "Appeal approved", case: result });
});

export const rejectAppeal = asyncHandler(async (req, res) => {
  const result = await reviewAppeal(req.params.caseId, "reject", req.user, req.body.notes);
  res.json({ message: "Appeal rejected", case: result });
});

export const deleteAppealCase = asyncHandler(async (req, res) => {
  const result = await deleteAppeal(req.params.caseId);
  res.json({ message: "Appeal deleted", case: result });
});

export const removeCase = asyncHandler(async (req, res) => {
  const result = await deleteModerationCase(req.params.id);
  res.json({ message: "Moderation case deleted", ...result });
});

export const setAppealStatus = asyncHandler(async (req, res) => {
  const result = await updateAppealStatus(req.params.caseId, req.body.status, req.user);
  res.json({ message: `Appeal status set to ${req.body.status}`, case: result });
});

export const createAppealNote = asyncHandler(async (req, res) => {
  const result = await addAppealNote(req.params.caseId, req.body.text, req.user);
  res.json({ message: "Note added", case: result });
});

export const appealStats = asyncHandler(async (req, res) => {
  const result = await getAppealAnalytics();
  res.json(result);
});