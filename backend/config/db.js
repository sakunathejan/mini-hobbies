import mongoose from "mongoose";
import User from "../models/User.js";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from environment variables.");
  }

  mongoose.set("strictQuery", true);
  const connection = await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);

  const adminEmail = process.env.ADMIN_EMAIL || "admin@minihobbies.lk";
  const existing = await User.findOne({ email: adminEmail });
  const adminData = {
    name: process.env.ADMIN_NAME || "Mini Hobbies Admin",
    email: adminEmail,
    role: "admin"
  };

  if (existing) {
    existing.name = adminData.name;
    if (process.env.ADMIN_PASSWORD) {
      existing.password = process.env.ADMIN_PASSWORD;
    }
    await existing.save();
    console.log(`Admin synced: ${adminEmail}`);
  } else {
    adminData.password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
    await User.create(adminData);
    console.log(`Admin created: ${adminEmail}`);
  }
};

export default connectDB;
