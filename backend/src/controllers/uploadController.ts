import path from "node:path";
import multer from "multer";
import { nanoid } from "nanoid";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const allowed = new Set(["image/png", "image/jpeg", "application/pdf", "text/plain"]);

export const upload = multer({
  storage: multer.diskStorage({
    destination: env.UPLOAD_DIR,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${nanoid(8)}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, allowed.has(file.mimetype))
});

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  res.status(201).json({
    file: {
      name: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    }
  });
});
