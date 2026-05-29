import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ["admin", "customer"], default: "customer" },
    refreshToken: { type: String, default: null },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    lastLoginIp: { type: String },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.index({ refreshToken: 1 });
userSchema.index({ role: 1 });
userSchema.index({ passwordResetToken: 1, passwordResetExpires: 1 });
userSchema.index({ emailVerificationToken: 1 });

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isLocked = function isLocked() {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = async function incrementLoginAttempts() {
  this.loginAttempts = (this.loginAttempts || 0) + 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 15 * 60 * 1000;
    this.loginAttempts = 0;
  }
  await this.save();
};

userSchema.methods.resetLoginAttempts = function resetLoginAttempts() {
  this.loginAttempts = 0;
  this.lockUntil = null;
};

export default mongoose.model("User", userSchema);
