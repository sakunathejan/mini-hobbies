import Payment from "../models/Payment.js";
import Order from "../models/Order.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as cache from "../utils/cache.js";
import { enqueue } from "../utils/jobQueue.js";
import { uploadPaymentSlip } from "../services/supabaseStorageService.js";
import { sendPaymentVerificationEmail } from "../services/emailService.js";
import { normalizeOrder } from "../utils/normalizeOrder.js";

export const submitBankTransferPayment = asyncHandler(async (req, res) => {
  const { orderId, bankName, accountName, accountNumber, branch } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  let slipUrl = "";
  let slipPath = "";
  if (req.file) {
    const upload = await uploadPaymentSlip(req.file);
    slipUrl = upload.url;
    slipPath = upload.path;
  }

  const paymentType = order.paymentType || (order.paymentMethod === "advance" ? "advance_50" : "full_payment");
  const isAdvance = paymentType === "advance_50";

  const payment = await Payment.create({
    order: order._id,
    method: isAdvance ? "advance" : "bank_transfer",
    status: "awaiting_verification",
    advance: isAdvance ? { percentage: 50, amount: order.advanceAmount, remainingAmount: order.remainingBalance } : undefined,
    bankTransfer: { bankName, accountName, accountNumber, branch, slipUrl, slipPath }
  });

  order.payment = payment._id;
  const payStatus = isAdvance ? "Advance Payment Submitted" : "Fully Paid Pending Verification";
  order.status = payStatus;
  order.statusHistory.push({ status: payStatus, note: "Payment slip submitted, awaiting verification", updatedAt: new Date() });
  await order.save();

  res.status(201).json({ payment, order });
});

export const submitBalancePayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  if (order.remainingBalance <= 0) {
    res.status(400);
    throw new Error("This order has no remaining balance.");
  }

  let slipUrl = "";
  let slipPath = "";
  if (req.file) {
    const upload = await uploadPaymentSlip(req.file);
    slipUrl = upload.url;
    slipPath = upload.path;
  }

  order.partialPayments.push({
    amount: order.remainingBalance,
    method: "bank_transfer",
    slipUrl,
    slipPath,
    type: "balance"
  });

  order.status = "Advance Payment Submitted";
  order.statusHistory.push({ status: "Advance Payment Submitted", note: "Balance payment slip submitted, awaiting verification", updatedAt: new Date() });
  await order.save();

  res.json({ order });
});

export const getPayments = asyncHandler(async (_req, res) => {
  const payments = await Payment.find()
    .populate("order")
    .sort("-createdAt");
  res.json(payments);
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate("order");
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found.");
  }
  res.json(payment);
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found.");
  }

  payment.status = "verified";
  payment.verifiedBy = req.user._id;
  payment.verifiedAt = new Date();
  await payment.save();

  const order = await Order.findById(payment.order);
  if (!order) {
    res.json({ payment, order: null });
    return;
  }

  const paymentType = order.paymentType || (order.paymentMethod === "advance" ? "advance_50" : order.paymentMethod === "cod" ? "cod" : "full_payment");

  if (paymentType === "advance_50") {
    const hasUnverifiedBalance = order.partialPayments.some(
      (pp) => pp.type === "balance" && !pp.verifiedBy
    );

    if (hasUnverifiedBalance) {
      const balancePayment = order.partialPayments.find(
        (pp) => pp.type === "balance" && !pp.verifiedBy
      );
      balancePayment.verifiedBy = req.user._id;
      balancePayment.verifiedAt = new Date();
      order.remainingBalance = 0;
      order.fullyPaidAt = new Date();
      order.status = "Fully Paid";
      order.statusHistory.push({ status: "Fully Paid", note: "Balance payment verified. Order fully paid.", updatedAt: new Date() });
    } else {
      order.partialPayments.push({
        amount: order.advanceAmount,
        method: "bank_transfer",
        type: "advance",
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      });
      order.status = "Awaiting Final Payment";
      order.statusHistory.push({ status: "Awaiting Final Payment", note: "Advance payment verified. Awaiting final payment.", updatedAt: new Date() });
    }
  } else if (paymentType === "cod") {
    order.status = "Fully Paid";
    order.statusHistory.push({ status: "Fully Paid", note: "Payment verified by admin", updatedAt: new Date() });
  } else {
    order.remainingBalance = 0;
    order.fullyPaidAt = new Date();
    order.status = "Fully Paid";
    order.statusHistory.push({ status: "Fully Paid", note: "Full payment verified by admin", updatedAt: new Date() });
  }

  await order.save();
  cache.clear("dashboard:");

  const populatedPayment = await Payment.findById(payment._id).populate("order");
  const normalizedOrder = order.toObject ? normalizeOrder(order) : order;

  enqueue("payment-verification-email", () => sendPaymentVerificationEmail(order, "verified", "Payment verified successfully."));

  res.json({ payment: populatedPayment, order: normalizedOrder });
});

export const rejectPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found.");
  }

  payment.status = "rejected";
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    const paymentType = order.paymentType || (order.paymentMethod === "advance" ? "advance_50" : "full_payment");
    const rejectStatus = paymentType === "advance_50" ? "Pending Advance Payment" : "Pending Payment Verification";
    order.status = rejectStatus;
    order.statusHistory.push({ status: rejectStatus, note: req.body.reason || "Payment rejected, please resubmit", updatedAt: new Date() });
    await order.save();
  }

  let populatedPayment = payment;
  if (order) {
    cache.clear("dashboard:");
    enqueue("payment-verification-email", () => sendPaymentVerificationEmail(order, "rejected", req.body.reason || "Payment rejected"));
    populatedPayment = await Payment.findById(payment._id).populate("order");
  }

  const normalizedOrder = order && order.toObject ? normalizeOrder(order) : order;
  res.json({ payment: populatedPayment, order: normalizedOrder });
});

export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error("Payment not found.");
  }

  const order = await Order.findById(payment.order);
  if (order) {
    order.payment = undefined;
    const paymentType = order.paymentType || (order.paymentMethod === "advance" ? "advance_50" : "full_payment");
    if (order.status === "Advance Payment Submitted" || order.status === "Fully Paid Pending Verification") {
      const revertStatus = paymentType === "advance_50" ? "Pending Advance Payment" : "Pending Payment Verification";
      order.status = revertStatus;
      order.statusHistory.push({ status: revertStatus, note: "Payment record deleted by admin", updatedAt: new Date() });
    }
    await order.save();
  }

  res.json({ message: "Payment deleted." });
});

export const bulkDeletePayments = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error("No payment IDs provided.");
  }

  const payments = await Payment.find({ _id: { $in: ids } });

  for (const payment of payments) {
    const order = await Order.findById(payment.order);
    if (order) {
      order.payment = undefined;
      if (order.status === "Advance Payment Submitted") {
        const revertStatus = order.paymentMethod === "advance" ? "Pending Advance Payment" : "Pending Payment Verification";
        order.status = revertStatus;
        order.statusHistory.push({ status: revertStatus, note: "Payment record deleted by admin", updatedAt: new Date() });
      }
      await order.save();
    }
  }

  await Payment.deleteMany({ _id: { $in: ids } });

  res.json({ message: `${ids.length} payment(s) deleted.` });
});
