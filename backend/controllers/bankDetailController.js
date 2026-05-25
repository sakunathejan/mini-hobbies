import BankDetail from "../models/BankDetail.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getBankDetails = asyncHandler(async (req, res) => {
  const details = await BankDetail.findOne().sort({ createdAt: -1 });
  res.json(details || { bankName: "", accountName: "", accountNumber: "", branch: "" });
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

  res.json(details);
});