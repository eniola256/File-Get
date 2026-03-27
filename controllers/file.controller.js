import File from "../models/File.js";

function getCloudinaryUrl(uploadedFile) {
  return (
    uploadedFile?.path ||
    uploadedFile?.secure_url ||
    uploadedFile?.url ||
    uploadedFile?.location
  );
}

export async function uploadTextbook(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Missing file (field name: file)" });
    }

    const { title, price } = req.body || {};
    if (!title || price === undefined) {
      return res.status(400).json({ message: "Title and price are required" });
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: "Invalid price" });
    }

    const fileUrl = getCloudinaryUrl(req.file);
    if (!fileUrl) {
      return res
        .status(500)
        .json({ message: "Upload failed: missing Cloudinary URL" });
    }

    const fileHash = req.file?.etag || req.file?.filename;
    if (!fileHash) {
      return res
        .status(500)
        .json({ message: "Upload failed: missing file hash" });
    }

    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const doc = await File.create({
      title: String(title).trim(),
      originalName: req.file.originalname,
      price: parsedPrice,
      fileUrl,
      fileHash,
      owner: ownerId,
    });

    return res.status(201).json({ file: doc });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ message: "Duplicate file" });
    }
    return next(err);
  }
}

export async function listFiles(req, res, next) {
  try {
    const files = await File.find()
      .select("title originalName price owner createdAt updatedAt")
      .sort({ createdAt: -1 });
    return res.json({ files });
  } catch (err) {
    return next(err);
  }
}

export async function getFileById(req, res, next) {
  try {
    const file = await File.findById(req.params.id).select(
      "title originalName price fileUrl fileHash owner createdAt updatedAt",
    );
    if (!file) return res.status(404).json({ message: "Not found" });
    return res.json({ file });
  } catch (err) {
    return next(err);
  }
}

