import mongoose from "mongoose";

const bankDetailSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true },
    accountName: { type: String, required: true },
    accountNumber: { type: String, required: true },
    branch: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("BankDetail", bankDetailSchema);