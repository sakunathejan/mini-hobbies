import { getCustomerModerationStatus } from "../../moderation-system/services/moderationService.js";

const recentSubmissions = new Map();

export async function checkSpamAndAbuse(req, res, next) {
  try {
    const customerId = String(req.customer._id);
    const productId = req.body.productId;

    if (!productId) {
      res.status(400).json({ message: "Product ID is required." });
      return;
    }

    const now = Date.now();
    const lastSubmission = recentSubmissions.get(customerId);
    if (lastSubmission && now - lastSubmission < 30000) {
      res.status(429).json({ message: "Please wait before submitting another review." });
      return;
    }
    recentSubmissions.set(customerId, now);
    setTimeout(() => recentSubmissions.delete(customerId), 30000);
  } catch {
    next();
  }
  next();
}

export async function requireActiveCustomer(req, res, next) {
  try {
    if (!req.customer) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    const { status } = await getCustomerModerationStatus(req.customer._id);

    if (status === "banned") {
      res.status(403).json({ message: "Your account has been permanently banned." });
      return;
    }
    if (status === "suspended") {
      res.status(403).json({ message: "Your account is temporarily suspended." });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
