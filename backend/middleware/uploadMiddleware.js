import multer from "multer";
import { detectMagicBytes } from "../utils/sanitize.js";

const storage = multer.memoryStorage();

const validateMime = (file, allowedMimes) => {
  if (!file) return "No file provided.";
  if (!allowedMimes.includes(file.mimetype)) return "Invalid file type.";
  return null;
};

export const validateFileContent = (allowedMimes) => {
  return (req, _res, next) => {
    const files = req.file ? [req.file] : (req.files || []);
    for (const f of files) {
      if (!f.buffer || f.buffer.length === 0) {
        return next(Object.assign(new Error("Empty file."), { status: 400 }));
      }
      const detected = detectMagicBytes(f.buffer);
      if (!detected || !allowedMimes.includes(detected)) {
        return next(Object.assign(new Error("File content does not match expected type."), { status: 400 }));
      }
    }
    next();
  };
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const error = validateMime(file, ["image/jpeg", "image/png", "image/webp", "application/pdf"]);
    if (error) return cb(new Error(error));
    cb(null, true);
  }
});

export const uploadProductImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    const error = validateMime(file, ["image/jpeg", "image/png", "image/webp"]);
    if (error) return cb(new Error(error));
    cb(null, true);
  }
});
