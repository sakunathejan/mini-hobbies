import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Customer from "../models/Customer.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "..", ".env") });

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const orders = await Order.find({
    $or: [{ customerId: { $exists: false } }, { customerId: null }]
  }).lean();

  console.log(`Found ${orders.length} orders without customerId`);

  let matched = 0;
  let skipped = 0;

  for (const order of orders) {
    const email = order.customer?.email;
    if (!email) { skipped++; continue; }

    const customer = await Customer.findOne({
      email: email.toLowerCase().trim(),
      deletedAt: null
    }).lean();

    if (customer) {
      await Order.updateOne(
        { _id: order._id },
        { $set: { customerId: customer._id } }
      );
      matched++;
      if (matched <= 5) {
        console.log(`  Linked order ${order.orderNumber} → customer ${customer.email} (${customer._id})`);
      }
    } else {
      skipped++;
    }
  }

  console.log(`Migration complete: ${matched} linked, ${skipped} skipped (no matching account)`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
