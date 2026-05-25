import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

const image = (query) => ({
  url: `https://images.unsplash.com/photo-1594787318286-3d835c1d207f?auto=format&fit=crop&w=900&q=80&${query}`,
  alt: "Mini Hobbies collectible model"
});

const categories = [
  { name: "Die Cast Cars", featured: true, description: "Premium diecast collectibles for display and play." },
  { name: "Hot Wheels", featured: true, description: "Hot Wheels Sri Lanka picks, treasure hunts, and carded models." },
  { name: "Scale Models", featured: true, description: "Detailed model kits and display-ready scale builds." },
  { name: "Anime Figures", description: "Figures and character collectibles for shelf displays." },
  { name: "RC Toys", description: "Remote control toys and hobby vehicles." },
  { name: "Collectibles", description: "Limited edition toys, gifts, and collector pieces." }
];

const makeProducts = (categoryMap) => [
  {
    name: "Hot Wheels Premium Nissan Skyline GT-R",
    description: "A collector-friendly JDM diecast car with detailed card art and display-ready finish.",
    brand: "Hot Wheels",
    category: categoryMap["Hot Wheels"],
    price: 4200,
    discountPrice: 3800,
    stock: 12,
    images: [image("skyline")],
    tags: ["Hot Wheels Sri Lanka", "JDM", "1:64"],
    scale: "1:64",
    material: "Die-cast metal",
    featured: true,
    condition: "New"
  },
  {
    name: "Maisto Lamborghini Aventador Roadster",
    description: "A sharp supercar model with realistic proportions, bright paint, and collector shelf appeal.",
    brand: "Maisto",
    category: categoryMap["Die Cast Cars"],
    price: 6800,
    stock: 7,
    images: [image("lamborghini")],
    tags: ["Die cast cars", "Supercar", "Display"],
    scale: "1:24",
    material: "Die-cast metal",
    featured: true,
    condition: "New"
  },
  {
    name: "Tamiya Toyota Supra Scale Model Kit",
    description: "Beginner-friendly scale model kit for builders who enjoy clean lines and classic tuner cars.",
    brand: "Tamiya",
    category: categoryMap["Scale Models"],
    price: 14500,
    stock: 5,
    images: [image("supra")],
    tags: ["Scale models", "Model kit", "Toyota"],
    scale: "1:24",
    material: "Plastic",
    featured: false,
    condition: "New"
  },
  {
    name: "Anime Hero Display Figure",
    description: "A compact figure with a stable base, clean paint details, and strong desk-display presence.",
    brand: "Bandai",
    category: categoryMap["Anime Figures"],
    price: 8900,
    stock: 9,
    images: [image("figure")],
    tags: ["Anime Figures", "Collectible toys", "Display"],
    scale: "Non-scale",
    material: "PVC",
    featured: true,
    condition: "New"
  }
];

const seed = async () => {
  await connectDB();
  await Promise.all([Product.deleteMany(), Category.deleteMany(), User.deleteMany()]);

  const createdCategories = await Promise.all(categories.map((category) => Category.create(category)));
  const categoryMap = createdCategories.reduce((map, category) => {
    map[category.name] = category._id;
    return map;
  }, {});

  await Promise.all(makeProducts(categoryMap).map((product) => Product.create(product)));
  await User.create({
    name: process.env.ADMIN_NAME || "Mini Hobbies Admin",
    email: process.env.ADMIN_EMAIL || "admin@minihobbies.lk",
    password: process.env.ADMIN_PASSWORD || "ChangeMe123!",
    role: "admin"
  });

  console.log("Seed data created.");
  process.exit(0);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
