import asyncHandler from "../../utils/asyncHandler.js";
import * as reviewService from "../services/reviewService.js";
import { validateReviewInput, sanitizeComment } from "../validators/reviewValidator.js";

export const createReview = asyncHandler(async (req, res) => {
  const errors = validateReviewInput(req.body);
  if (errors.length > 0) {
    res.status(400).json({ message: errors.join(" ") });
    return;
  }

  req.body.comment = sanitizeComment(req.body.comment);
  req.body.title = sanitizeComment(req.body.title);

  const review = await reviewService.createReview(req.customer._id, req.body);
  res.status(201).json({ message: "Review submitted for moderation.", review });
});

export const editReview = asyncHandler(async (req, res) => {
  const errors = validateReviewInput(req.body);
  if (errors.length > 0) {
    res.status(400).json({ message: errors.join(" ") });
    return;
  }

  req.body.comment = sanitizeComment(req.body.comment);
  req.body.title = sanitizeComment(req.body.title);

  const review = await reviewService.editReview(req.params.id, req.customer._id, req.body);
  res.json({ message: "Review updated and resubmitted for moderation.", review });
});

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id, req.customer._id);
  res.json({ message: "Review deleted." });
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const { page, limit, sort } = req.query;
  const result = await reviewService.getProductReviews(req.params.productId, { page, limit, sort });
  res.json(result);
});

export const getCustomerReviews = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await reviewService.getCustomerReviews(req.customer._id, { page, limit });
  res.json(result);
});

export const getAdminReviews = asyncHandler(async (req, res) => {
  const { status, page, limit, sort } = req.query;
  const result = await reviewService.getAdminReviews({ status, page, limit, sort });
  res.json(result);
});

export const approveReview = asyncHandler(async (req, res) => {
  const review = await reviewService.approveReview(req.params.id, req.user._id);
  res.json({ message: "Review approved.", review });
});

export const rejectReview = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const review = await reviewService.rejectReview(req.params.id, req.user._id, reason);
  res.json({ message: "Review rejected.", review });
});

export const featureReview = asyncHandler(async (req, res) => {
  const review = await reviewService.featureReview(req.params.id, req.user._id);
  res.json({ message: review.isFeatured ? "Review featured." : "Review unfeatured.", review });
});

export const respondToReview = asyncHandler(async (req, res) => {
  const { response } = req.body;
  if (!response || !response.trim()) {
    res.status(400).json({ message: "Response text is required." });
    return;
  }
  const review = await reviewService.respondToReview(req.params.id, req.user._id, response);
  res.json({ message: "Response added to review.", review });
});

export const deleteReviewAdmin = asyncHandler(async (req, res) => {
  await reviewService.deleteReviewAdmin(req.params.id, req.user._id);
  res.json({ message: "Review deleted." });
});
