import asyncHandler from "../utils/asyncHandler.js";
import generateToken from "../utils/generateToken.js";
import User from "../models/User.js";

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

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
