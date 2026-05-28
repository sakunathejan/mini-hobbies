import { getCustomerModerationStatus } from "../services/moderationService.js";

export const requireActiveAccount = async (req, res, next) => {
  try {
    if (!req.customer) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const { status } = await getCustomerModerationStatus(req.customer._id);

    if (status === "banned") {
      res.status(403).json({ message: "Your account has been permanently banned" });
      return;
    }
    if (status === "suspended") {
      res.status(403).json({ message: "Your account is temporarily suspended" });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};
