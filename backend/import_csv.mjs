import mongoose from "mongoose";
import { config } from "dotenv";
import { parseCSVBuffer } from "./services/csvParserService.js";
import fs from "fs";
config();

const csvPath = "C:/Users/sakut/Downloads/Koombiyo Delivery Delivery Rates.csv";
const result = parseCSVBuffer(fs.readFileSync(csvPath));
console.log("Valid rows:", result.rows.length);

await mongoose.connect(process.env.MONGO_URI);
const col = mongoose.connection.db.collection("deliveryzones");
await col.deleteMany({});

const BATCH_SIZE = 500;
for (let i = 0; i < result.rows.length; i += BATCH_SIZE) {
  const batch = result.rows.slice(i, i + BATCH_SIZE);
  const ops = batch.map(row => ({
    updateOne: {
      filter: { normalizedFrom: row.normalizedFrom, normalizedTo: row.normalizedTo },
      update: {
        $set: {
          from: row.from, to: row.to,
          firstKgCharge: row.firstKgCharge, additionalKgCharge: row.additionalKgCharge,
          courierProvider: "koombiyo",
          normalizedFrom: row.normalizedFrom, normalizedTo: row.normalizedTo,
          importedAt: new Date(), isActive: true
        },
        $setOnInsert: { createdAt: new Date() }
      },
      upsert: true
    }
  }));
  await col.bulkWrite(ops, { ordered: false });
}

const c = await col.countDocuments();
console.log("Imported:", c);
await mongoose.disconnect();
