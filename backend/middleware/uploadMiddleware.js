import multer from "multer";
import { detectMagicBytes } from "../utils/sanitize.js";

const storage = multer.memoryStorage();

const validateFile = (file, allowedMimes) => {
  if (!file) return "No file provided.";
  if (!allowedMimes.includes(file.mimetype)) return "Invalid file type.";
  const detected = detectMagicBytes(file.buffer);
  if (!detected || !allowedMimes.includes(detected)) return "File content does not match expected type.";
  return null;
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const error = validateFile(file, ["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    if (error) return cb(new Error(error));
    cb(null, true);
  }
});

export const uploadProductImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    const error = validateFile(file, ["image/jpeg", "image/png", "image/webp"]);
    if (error) return cb(new Error(error));
    cb(null, true);
  }
});
