import mongoose from "mongoose";
import Order from "../models/Order.js";

const PREPAID_METHODS = ["online_payment", "bank_transfer", "card", "advance"];
const PAID_STATUS = "paid";
const COD_METHOD = "cod";

async function migrateCodAmount() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGODB_URI environment variable is required");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  }

  const totalOrders = await Order.countDocuments({});
  console.log(`Total orders in database: ${totalOrders}`);

  const cursor = Order.find({}).cursor();
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for await (const order of cursor) {
    processed++;
    const pm = (order.paymentMethod || "").toLowerCase();
    const ps = (order.paymentStatus || "").toLowerCase();
    const items = order.items || [];
    const productValue = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    const deliveryCharge = order.deliveryFee || 0;
    const totalAmount = Math.round((parseFloat(productValue || 0) + parseFloat(deliveryCharge || 0)) * 100) / 100;

    let expectedCodAmount;

    if (ps === PAID_STATUS || (PREPAID_METHODS.includes(pm))) {
      expectedCodAmount = 0;
    } else if (pm === COD_METHOD) {
      expectedCodAmount = totalAmount;
    } else {
      expectedCodAmount = 0;
    }

    const currentCodAmount = order.codAmount ?? 0;

    if (currentCodAmount !== expectedCodAmount) {
      try {
        await Order.findByIdAndUpdate(order._id, {
          $set: {
            codAmount: expectedCodAmount,
            codTotal: expectedCodAmount
          }
        });
        updated++;
        console.log(`  [${processed}/${totalOrders}] Order ${order.orderNumber}: codAmount ${currentCodAmount} → ${expectedCodAmount} (paymentMethod=${pm}, paymentStatus=${ps})`);
      } catch (err) {
        errors++;
        console.error(`  [${processed}/${totalOrders}] FAILED Order ${order.orderNumber}: ${err.message}`);
      }
    } else {
      skipped++;
    }

    if (processed % 100 === 0) {
      console.log(`Progress: ${processed}/${totalOrders} (${updated} updated, ${skipped} skipped, ${errors} errors)`);
    }
  }

  console.log("\n=== Migration Complete ===");
  console.log(`Total processed: ${processed}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already correct): ${skipped}`);
  console.log(`Errors: ${errors}`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");

  if (errors > 0) {
    process.exit(1);
  }
}

migrateCodAmount().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
