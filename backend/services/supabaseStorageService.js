import path from "path";
import { randomUUID } from "crypto";
import { getSupabaseClient } from "../config/supabase.js";

const ensureBucket = async (supabase, bucket) => {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.find((b) => b.name === bucket)) {
    const { error } = await supabase.storage.createBucket(bucket, { public: true });
    if (error && !error.message?.includes("already exists")) throw error;
  }
};

export const uploadPaymentSlip = async (file) => {
  const supabase = getSupabaseClient();
  const bucket = process.env.SUPABASE_PAYMENT_BUCKET || "payment-slips";
  await ensureBucket(supabase, bucket);
  const ext = path.extname(file.originalname) || ".jpg";
  const fileName = `slips/${Date.now()}-${randomUUID()}${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "31536000",
      upsert: false
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return { url: data.publicUrl, path: fileName };
};

export const uploadAnnouncementImage = async (file) => {
  const supabase = getSupabaseClient();
  const bucket = process.env.SUPABASE_BUCKET || "product-images";
  await ensureBucket(supabase, bucket);
  const ext = path.extname(file.originalname) || ".jpg";
  const fileName = `announcements/${Date.now()}-${randomUUID()}${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      cacheControl: "31536000",
      upsert: false
    });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

  return { url: data.publicUrl, path: fileName };
};

export const uploadImagesToSupabase = async (files = []) => {
  const supabase = getSupabaseClient();
  const bucket = process.env.SUPABASE_BUCKET || "product-images";

  const uploads = await Promise.all(
    files.map(async (file) => {
      const ext = path.extname(file.originalname) || ".jpg";
      const fileName = `products/${Date.now()}-${randomUUID()}${ext}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: "31536000",
          upsert: false
        });

      if (error) throw error;

      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

      return {
        url: data.publicUrl,
        path: fileName,
        alt: file.originalname.replace(ext, "")
      };
    })
  );

  return uploads;
};
