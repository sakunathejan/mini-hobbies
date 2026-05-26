import BankDetail from "../models/BankDetail.js";
import asyncHandler from "../utils/asyncHandler.js";
import * as cache from "../utils/cache.js";

export const getBankDetails = asyncHandler(async (req, res) => {
  const cached = cache.get("bank-details");
  if (cached) return res.json(cached);
  const details = await BankDetail.findOne().sort({ createdAt: -1 }).lean();
  const result = details || { bankName: "", accountName: "", accountNumber: "", branch: "" };
  cache.set("bank-details", result, 5 * 60 * 1000);
  res.json(result);
});

export const upsertBankDetails = asyncHandler(async (req, res) => {
  const { bankName, accountName, accountNumber, branch } = req.body;

  let details = await BankDetail.findOne().sort({ createdAt: -1 });
  if (details) {
    details.bankName = bankName;
    details.accountName = accountName;
    details.accountNumber = accountNumber;
    details.branch = branch || "";
    await details.save();
  } else {
    details = await BankDetail.create({ bankName, accountName, accountNumber, branch });
  }
  cache.clear("bank-details");
  res.json(details);
});