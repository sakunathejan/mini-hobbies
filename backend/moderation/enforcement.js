import { getAccountStatus } from "./moderationService.js";

export async function requireActiveAccount(req, res, next) {
  try {
    const customerId = req.customer?._id || req.user?._id;
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const { status } = await getAccountStatus(customerId);

    if (status === "banned") {
      return res.status(403).json({ message: "Your account has been permanently banned.", moderationStatus: "banned" });
    }

    if (status === "suspended") {
      return res.status(403).json({ message: "Your account is currently suspended.", moderationStatus: "suspended" });
    }

    next();
  } catch (err) {
    console.error("[MODERATION] requireActiveAccount error:", err.message);
    next();
  }
}
