import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";

export const getDashboardStats = async () => {
  const [products, categories, orders, revenue] = await Promise.all([
    Product.countDocuments(),
    Category.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }])
  ]);

  return {
    products,
    categories,
    orders,
    revenue: revenue[0]?.total || 0
  };
};
