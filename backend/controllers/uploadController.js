import asyncHandler from "../utils/asyncHandler.js";
import { uploadImagesToSupabase } from "../services/supabaseStorageService.js";

export const uploadProductImages = asyncHandler(async (req, res) => {
  const images = await uploadImagesToSupabase(req.files);
  res.status(201).json({ images });
});
