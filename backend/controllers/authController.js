import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import User from "../models/User.js";

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase?.() });

  if (!user || user.role !== "admin" || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid admin credentials.");
  }

  res.json({
    token: generateToken(user._id),
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

export const updateAdminProfile = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.user._id);
  if (!admin) {
    res.status(404);
    throw new Error("Admin not found.");
  }

  const { name, email, currentPassword, newPassword } = req.body;

  if (name) admin.name = name;

  if (email && email.toLowerCase() !== admin.email) {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(400);
      throw new Error("Email already in use.");
    }
    admin.email = email;
  }

  if (currentPassword && newPassword) {
    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error("Current password is incorrect.");
    }
    admin.password = newPassword;
  }

  await admin.save();

  res.json({
    token: generateToken(admin._id),
    user: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  });
});
