import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  label: { type: String, default: "Home" },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  phone: { type: String, default: "", trim: true },
  avatar: { type: String, default: "" },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  emailVerifiedAt: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  refreshToken: { type: String, default: null },
  refreshTokenHistory: [{ token: String, createdAt: Date }],
  addresses: [addressSchema],
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
  },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date, default: null },
  lastLoginIp: { type: String },
  lastLoginAt: { type: Date },
  lastLoginDevice: { type: String },
  deletedAt: { type: Date, default: null },
  status: { type: String, enum: ["active", "suspended", "banned"], default: "active" },
  statusChangedAt: { type: Date, default: null },
  statusChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  adminNotes: [{
    text: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    adminName: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

customerSchema.index({ email: 1 });
customerSchema.index({ refreshToken: 1 });
customerSchema.index({ emailVerificationToken: 1 });
customerSchema.index({ passwordResetToken: 1 });
customerSchema.index({ deletedAt: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ name: 1 });
customerSchema.index({ createdAt: -1 });
customerSchema.index({ lastLoginAt: -1 });

customerSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

customerSchema.methods.matchPassword = function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

customerSchema.methods.isLocked = function isLocked() {
  return this.lockUntil && this.lockUntil > Date.now();
};

customerSchema.methods.incrementLoginAttempts = async function incrementLoginAttempts() {
  this.loginAttempts = (this.loginAttempts || 0) + 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 15 * 60 * 1000;
    this.loginAttempts = 0;
  }
  await this.save();
};

customerSchema.methods.resetLoginAttempts = function resetLoginAttempts() {
  this.loginAttempts = 0;
  this.lockUntil = null;
};

customerSchema.methods.toPublicProfile = function toPublicProfile() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    emailVerified: this.emailVerified,
    addresses: this.addresses,
    preferences: this.preferences,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export default mongoose.model("Customer", customerSchema);
