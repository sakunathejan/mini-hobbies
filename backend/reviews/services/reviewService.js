import Review from "../models/Review.js";
import ReviewReaction from "../models/ReviewReaction.js";
import ReviewReply from "../models/ReviewReply.js";
import Product from "../../models/Product.js";
import Order from "../../models/Order.js";
import Customer from "../../models/Customer.js";
import AuditLog from "../../models/AuditLog.js";
import { sendMail } from "../../services/emailService.js";
import {
  reviewApprovedTemplate,
  reviewRejectedTemplate,
  adminResponseTemplate,
  newReviewNotificationTemplate,
} from "../emails/reviewTemplates.js";

async function recalcProductRating(productId) {
  const result = await Review.aggregate([
    { $match: { productId: productId, status: "approved", deletedAt: null } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const stats = result[0] || { avg: 0, count: 0 };
  await Product.findByIdAndUpdate(productId, {
    averageRating: Math.round(stats.avg * 10) / 10,
    totalReviews: stats.count,
  });
}

async function sendAdminNotification(review) {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  if (!adminEmails) return;
  const customer = await Customer.findById(review.userId).select("name email");
  const product = await Product.findById(review.productId).select("name");
  const { subject, html } = newReviewNotificationTemplate({
    customerName: customer?.name || "A customer",
    productName: product?.name || "a product",
    rating: review.rating,
    comment: review.comment,
  });
  for (const email of adminEmails.split(",").map((s) => s.trim())) {
    sendMail(email, subject, html).catch(() => {});
  }
}

export async function createReview(customerId, data) {
  const existing = await Review.findOne({
    userId: customerId,
    productId: data.productId,
    deletedAt: null,
  });
  if (existing) {
    throw Object.assign(new Error("You have already reviewed this product."), { statusCode: 409 });
  }

  const hasOrdered = await Order.exists({
    "customer.email": (await Customer.findById(customerId).select("email"))?.email,
    "items.product": data.productId,
    status: "Delivered",
  });
  const isVerifiedPurchase = !!hasOrdered;

  const review = await Review.create({
    userId: customerId,
    productId: data.productId,
    orderId: data.orderId || undefined,
    rating: data.rating,
    title: (data.title || "").trim().slice(0, 200),
    comment: (data.comment || "").trim().slice(0, 5000),
    images: data.images || [],
    isVerifiedPurchase,
  });

  sendAdminNotification(review).catch(() => {});

  return review;
}

export async function editReview(reviewId, customerId, data) {
  const review = await Review.findOne({ _id: reviewId, userId: customerId, deletedAt: null });
  if (!review) {
    throw Object.assign(new Error("Review not found."), { statusCode: 404 });
  }
  if (review.status === "approved") {
    throw Object.assign(new Error("Cannot edit an approved review."), { statusCode: 403 });
  }

  if (data.rating !== undefined) review.rating = data.rating;
  if (data.title !== undefined) review.title = (data.title || "").trim().slice(0, 200);
  if (data.comment !== undefined) review.comment = (data.comment || "").trim().slice(0, 5000);
  if (data.images !== undefined) review.images = data.images;
  review.status = "pending";

  await review.save();
  return review;
}

export async function deleteReview(reviewId, customerId) {
  const review = await Review.findOne({ _id: reviewId, userId: customerId, deletedAt: null });
  if (!review) {
    throw Object.assign(new Error("Review not found."), { statusCode: 404 });
  }
  review.deletedAt = new Date();
  await review.save();

  if (review.status === "approved") {
    await recalcProductRating(review.productId);
  }

  return review;
}

async function enrichReviews(reviews, userId) {
  if (!reviews.length) return reviews;

  const reviewIds = reviews.map((r) => r._id);

  const [reactionAgg, replyCounts] = await Promise.all([
    ReviewReaction.aggregate([
      { $match: { reviewId: { $in: reviewIds } } },
      { $group: { _id: { reviewId: "$reviewId", reactionType: "$reactionType" }, count: { $sum: 1 } } },
    ]),
    ReviewReply.aggregate([
      { $match: { reviewId: { $in: reviewIds }, deletedAt: null } },
      { $group: { _id: "$reviewId", count: { $sum: 1 } } },
    ]),
  ]);

  const reactionMap = {};
  for (const r of reactionAgg) {
    const rid = r._id.reviewId.toString();
    if (!reactionMap[rid]) reactionMap[rid] = {};
    reactionMap[rid][r._id.reactionType] = r.count;
  }

  const replyCountMap = {};
  for (const r of replyCounts) {
    replyCountMap[r._id.toString()] = r.count;
  }

  let userReactionMap = {};
  if (userId) {
    const userReactions = await ReviewReaction.find({
      reviewId: { $in: reviewIds },
      userId,
    }).lean();
    for (const ur of userReactions) {
      userReactionMap[ur.reviewId.toString()] = ur.reactionType;
    }
  }

  return reviews.map((r) => {
    const rid = r._id.toString();
    return {
      ...r,
      reactionCounts: reactionMap[rid] || {},
      replyCount: replyCountMap[rid] || 0,
      userReactions: userReactionMap[rid] || null,
    };
  });
}

export async function getProductReviews(productId, { page = 1, limit = 10, sort = "-createdAt" } = {}) {
  const query = { productId, status: "approved", deletedAt: null };
  const total = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .populate("userId", "name")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const enriched = await enrichReviews(reviews);

  return {
    reviews: enriched,
    total,
    page,
    pages: Math.ceil(total / limit),
    averageRating: 0,
    totalReviews: total,
  };
}

export async function getCustomerReviews(customerId, { page = 1, limit = 20 } = {}) {
  const query = { userId: customerId, deletedAt: null };
  const total = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .populate("productId", "name slug images")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const enriched = await enrichReviews(reviews, customerId);

  return { reviews: enriched, total, page, pages: Math.ceil(total / limit) };
}

export async function getAdminReviews({ status, page = 1, limit = 20, sort = "-createdAt" } = {}) {
  const query = { deletedAt: null };
  if (status && status !== "all") query.status = status;

  const total = await Review.countDocuments(query);
  const reviews = await Review.find(query)
    .populate("userId", "name email")
    .populate("productId", "name slug images price")
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const enriched = await enrichReviews(reviews);

  return { reviews: enriched, total, page, pages: Math.ceil(total / limit) };
}

export async function approveReview(reviewId, adminId) {
  const review = await Review.findOne({ _id: reviewId, deletedAt: null });
  if (!review) {
    throw Object.assign(new Error("Review not found."), { statusCode: 404 });
  }
  if (review.status === "approved") return review;

  review.status = "approved";
  await review.save();
  await recalcProductRating(review.productId);

  const product = await Product.findById(review.productId).select("name");
  const customer = await Customer.findById(review.userId).select("name email");
  if (customer?.email) {
    const { subject, html } = reviewApprovedTemplate({
      customerName: customer.name || "Valued Customer",
      productName: product?.name || "a product",
      reviewTitle: review.title,
    });
    sendMail(customer.email, subject, html).catch(() => {});
  }

  AuditLog.create({
    admin: adminId,
    action: "approve_review",
    resource: "Review",
    resourceId: reviewId,
    details: { rating: review.rating },
  }).catch(() => {});

  return review;
}

export async function rejectReview(reviewId, adminId, reason) {
  const review = await Review.findOne({ _id: reviewId, deletedAt: null });
  if (!review) {
    throw Object.assign(new Error("Review not found."), { statusCode: 404 });
  }
  if (review.status === "rejected") return review;

  review.status = "rejected";
  review.adminResponse = reason || "";
  await review.save();

  const product = await Product.findById(review.productId).select("name");
  const customer = await Customer.findById(review.userId).select("name email");
  if (customer?.email) {
    const { subject, html } = reviewRejectedTemplate({
      customerName: customer.name || "Valued Customer",
      productName: product?.name || "a product",
      reviewTitle: review.title,
      reason,
    });
    sendMail(customer.email, subject, html).catch(() => {});
  }

  AuditLog.create({
    admin: adminId,
    action: "reject_review",
    resource: "Review",
    resourceId: reviewId,
    details: { reason },
  }).catch(() => {});

  return review;
}

export async function featureReview(reviewId, adminId) {
  const review = await Review.findOne({ _id: reviewId, deletedAt: null });
  if (!review) {
    throw Object.assign(new Error("Review not found."), { statusCode: 404 });
  }

  review.isFeatured = !review.isFeatured;
  await review.save();

  AuditLog.create({
    admin: adminId,
    action: review.isFeatured ? "feature_review" : "unfeature_review",
    resource: "Review",
    resourceId: reviewId,
  }).catch(() => {});

  return review;
}

export async function respondToReview(reviewId, adminId, response) {
  const review = await Review.findOne({ _id: reviewId, deletedAt: null });
  if (!review) {
    throw Object.assign(new Error("Review not found."), { statusCode: 404 });
  }

  review.adminResponse = (response || "").trim().slice(0, 2000);
  await review.save();

  const admin = await AuditLog.findById(adminId) || { name: "Admin" };
  const product = await Product.findById(review.productId).select("name");
  const customer = await Customer.findById(review.userId).select("name email");
  if (customer?.email) {
    const { subject, html } = adminResponseTemplate({
      customerName: customer.name || "Valued Customer",
      productName: product?.name || "a product",
      adminName: admin.name || "Admin",
      response: review.adminResponse,
    });
    sendMail(customer.email, subject, html).catch(() => {});
  }

  AuditLog.create({
    admin: adminId,
    action: "respond_review",
    resource: "Review",
    resourceId: reviewId,
  }).catch(() => {});

  return review;
}

export async function deleteReviewAdmin(reviewId, adminId) {
  const review = await Review.findOne({ _id: reviewId, deletedAt: null });
  if (!review) {
    throw Object.assign(new Error("Review not found."), { statusCode: 404 });
  }

  const wasApproved = review.status === "approved";
  const productId = review.productId;

  review.deletedAt = new Date();
  review.status = "rejected";
  await review.save();

  if (wasApproved) {
    await recalcProductRating(productId);
  }

  AuditLog.create({
    admin: adminId,
    action: "delete_review",
    resource: "Review",
    resourceId: reviewId,
    details: { rating: review.rating },
  }).catch(() => {});

  return review;
}
