import ReviewReply from "../models/ReviewReply.js";
import Review from "../models/Review.js";
import Customer from "../../models/Customer.js";
import { sendMail } from "../../services/emailService.js";
import { newReplyNotificationTemplate } from "../emails/reviewTemplates.js";

export async function createReply(reviewId, userId, message, parentReplyId) {
  const review = await Review.findOne({ _id: reviewId, deletedAt: null });
  if (!review) {
    throw Object.assign(new Error("Review not found."), { statusCode: 404 });
  }

  if (parentReplyId) {
    const parent = await ReviewReply.findOne({ _id: parentReplyId, reviewId, deletedAt: null });
    if (!parent) {
      throw Object.assign(new Error("Parent reply not found."), { statusCode: 404 });
    }
    if (parent.parentReplyId) {
      throw Object.assign(new Error("Maximum reply depth reached (2 levels)."), { statusCode: 400 });
    }
  }

  const reply = await ReviewReply.create({
    reviewId,
    parentReplyId: parentReplyId || null,
    userId,
    message: message.trim().slice(0, 2000),
  });

  const populated = await ReviewReply.findById(reply._id)
    .populate("userId", "name")
    .lean();

  try {
    const reviewAuthor = await Customer.findById(review.userId).select("name email");
    const replier = await Customer.findById(userId).select("name");
    if (reviewAuthor && reviewAuthor._id.toString() !== userId.toString()) {
      const { subject, html } = newReplyNotificationTemplate({
        customerName: reviewAuthor.name || "Valued Customer",
        replierName: replier?.name || "Someone",
        replyMessage: message.trim().slice(0, 200),
      });
      sendMail(reviewAuthor.email, subject, html).catch(() => {});
    }
  } catch {}

  return populated;
}

export async function editReply(replyId, userId, message) {
  const reply = await ReviewReply.findOne({ _id: replyId, userId, deletedAt: null });
  if (!reply) {
    throw Object.assign(new Error("Reply not found."), { statusCode: 404 });
  }

  reply.message = message.trim().slice(0, 2000);
  reply.edited = true;
  await reply.save();

  return ReviewReply.findById(reply._id).populate("userId", "name").lean();
}

export async function deleteReply(replyId, userId) {
  const reply = await ReviewReply.findOne({ _id: replyId, userId, deletedAt: null });
  if (!reply) {
    throw Object.assign(new Error("Reply not found."), { statusCode: 404 });
  }

  reply.deletedAt = new Date();
  await reply.save();

  await ReviewReply.updateMany(
    { parentReplyId: replyId, deletedAt: null },
    { deletedAt: new Date() }
  );

  return reply;
}

export async function getReplies(reviewId) {
  const replies = await ReviewReply.find({ reviewId, deletedAt: null })
    .populate("userId", "name")
    .sort({ createdAt: 1 })
    .lean();

  const top = replies.filter((r) => !r.parentReplyId);
  const children = replies.filter((r) => r.parentReplyId);

  const grouped = top.map((t) => ({
    ...t,
    replies: children.filter((c) => c.parentReplyId?.toString() === t._id.toString()),
  }));

  return grouped;
}

export async function deleteReplyAdmin(replyId) {
  const reply = await ReviewReply.findOne({ _id: replyId, deletedAt: null });
  if (!reply) {
    throw Object.assign(new Error("Reply not found."), { statusCode: 404 });
  }

  reply.deletedAt = new Date();
  await reply.save();

  await ReviewReply.updateMany(
    { parentReplyId: replyId, deletedAt: null },
    { deletedAt: new Date() }
  );

  return reply;
}
