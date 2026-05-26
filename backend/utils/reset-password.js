import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const reset = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.argv[2] || "admin@minihobbies.lk";
  const password = process.argv[3] || "ChangeMe123!";

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    console.log(`User ${email} not found.`);
    process.exit(1);
  }

  user.password = password;
  user.loginAttempts = 0;
  user.lockUntil = null;
  user.refreshToken = null;
  await user.save();

  console.log(`Password reset for ${email}`);
  mongoose.disconnect();
};

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
