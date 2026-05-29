import mongoose from "mongoose";

const chatConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    description: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const DEFAULT_CONFIG = {
  behavior: {
    tone: "casual",
    responseLength: "detailed",
    useEmoji: true
  },
  features: {
    productSuggestions: true,
    orderTracking: true,
    budgetMode: true,
    collectorMode: true,
    recommendations: true,
    newArrivals: true,
    deals: true
  },
  sales: {
    featuredProductIds: [],
    boostBestSellers: true,
    boostDiscountedItems: true,
    maxProductSuggestions: 5
  },
  appearance: {
    widgetTitle: "MiniBot",
    widgetColor: "#92400e",
    showBranding: true,
    greetingMessage: "Hey there! 👋 I'm MiniBot, your personal collector assistant."
  }
};

export const getDefaultConfig = () => JSON.parse(JSON.stringify(DEFAULT_CONFIG));

export const getConfigValue = async (key) => {
  const doc = await mongoose.model("ChatConfig").findOne({ key }).lean();
  return doc ? doc.value : DEFAULT_CONFIG[key];
};

export const getAllConfig = async () => {
  const docs = await mongoose.model("ChatConfig").find({}).lean();
  const config = getDefaultConfig();
  for (const doc of docs) {
    if (config[doc.key] !== undefined) config[doc.key] = doc.value;
  }
  return config;
};

export default mongoose.model("ChatConfig", chatConfigSchema);
