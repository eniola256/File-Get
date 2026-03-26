import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import express from "express";
import multer from "multer";

const router = express.Router();

function resolveBaseUrl(req) {
  if (process.env.BASE_URL && process.env.BASE_URL.trim() !== "") {
    return process.env.BASE_URL.replace(/\/+$/, "");
  }

  const host = req.get("host");
  const protocol = req.protocol;
  return `${protocol}://${host}`;
}

function isSafeFileId(value) {
  if (typeof value !== "string") return false;
  if (value.length < 1 || value.length > 200) return false;
  if (value.includes("..")) return false;
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) return false;
  return true;
}

const uploadDir = process.env.UPLOAD_DIR || "uploads";
const absoluteUploadDir = path.resolve(process.cwd(), uploadDir);
fs.mkdirSync(absoluteUploadDir, { recursive: true });

const maxFileSizeMb = Number.parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10);
const maxFileSizeBytes = Number.isFinite(maxFileSizeMb)
  ? Math.max(1, maxFileSizeMb) * 1024 * 1024
  : 25 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, absoluteUploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || "").slice(0, 16);
    cb(null, `${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSizeBytes },
});

router.get("/", async (req, res, next) => {
  try {
    const entries = await fs.promises.readdir(absoluteUploadDir, {
      withFileTypes: true,
    });

    const ids = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort();

    res.json({ ids });
  } catch (err) {
    next(err);
  }
});

router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing file (field name: file)" });
  }

  const baseUrl = resolveBaseUrl(req);
  const id = req.file.filename;
  const url = `${baseUrl}/api/files/${encodeURIComponent(id)}`;

  res.status(201).json({
    id,
    url,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
  });
});

router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isSafeFileId(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const filePath = path.join(absoluteUploadDir, id);
    const exists = fs.existsSync(filePath);
    if (!exists) {
      return res.status(404).json({ error: "Not found" });
    }

    res.download(filePath, (err) => {
      if (err) next(err);
    });
  } catch (err) {
    next(err);
  }
});

export default router;
