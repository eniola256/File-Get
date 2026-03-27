import crypto from "node:crypto";

import cloudinary from "../config/cloudinary.js";
import File from "../models/File.js";

function generateHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function streamToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });

    stream.end(buffer);
  });
}

// POST /api/files
// Rep uploads a textbook — hashes it, checks for duplicates, then uploads to Cloudinary
export const uploadTextbook = async (req, res, next) => {
  let uploadResult;
  let fileHash;

  try {
    const { title, price } = req.body || {};

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    if (!title || !price) {
      return res
        .status(400)
        .json({ success: false, message: "Title and price are required" });
    }

    if (Number.isNaN(Number(price)) || Number(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number",
      });
    }

    // Step 1 — hash the buffer before touching Cloudinary
    fileHash = generateHash(req.file.buffer);

    // Step 2 — check for duplicate, reject before any upload happens
    const duplicate = await File.findOne({ fileHash }).populate(
      "owner",
      "name email",
    );

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This file has already been uploaded",
        uploadedBy: {
          name: duplicate.owner?.name,
          email: duplicate.owner?.email,
        },
        existingFile: {
          id: duplicate._id,
          title: duplicate.title,
        },
      });
    }

    // Step 3 — no duplicate, manually stream buffer to Cloudinary
    uploadResult = await streamToCloudinary(req.file.buffer, {
      folder: "textbooks",
      resource_type: "raw",
    });

    // Step 4 — save record to DB
    const file = await File.create({
      title: String(title).trim(),
      price: Number(price),
      fileUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      originalName: req.file.originalname,
      fileHash,
      owner: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Textbook uploaded successfully",
      file: {
        id: file._id,
        title: file.title,
        price: file.price,
        originalName: file.originalName,
        uploadedAt: file.createdAt,
      },
    });
  } catch (err) {
    // Prevent orphaned Cloudinary files if DB save fails (e.g. unique hash race)
    if (uploadResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadResult.public_id, {
          resource_type: "raw",
        });
      } catch {
        // ignore cleanup errors
      }
    }

    if (err?.code === 11000 && fileHash) {
      try {
        const existing = await File.findOne({ fileHash }).populate(
          "owner",
          "name email",
        );
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "This file has already been uploaded",
            uploadedBy: {
              name: existing.owner?.name,
              email: existing.owner?.email,
            },
            existingFile: {
              id: existing._id,
              title: existing.title,
            },
          });
        }
      } catch {
        // fall through to error handler
      }
    }

    return next(err);
  }
};

// GET /api/files
// All authenticated users — browse every available textbook
export const getAllFiles = async (req, res, next) => {
  try {
    const files = await File.find()
      .populate("owner", "name")
      .select("-fileUrl -fileHash -publicId")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: files.length, files });
  } catch (err) {
    return next(err);
  }
};

// GET /api/files/my
// Rep only — files they personally uploaded
export const getMyFiles = async (req, res, next) => {
  try {
    const files = await File.find({ owner: req.user._id })
      .select("-fileHash")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: files.length, files });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/files/:id
// Rep deletes their own file — admin can delete any file
export const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ success: false, message: "File not found" });
    }

    const isOwner = file.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this file",
      });
    }

    await cloudinary.uploader.destroy(file.publicId, { resource_type: "raw" });
    await file.deleteOne();

    return res.json({ success: true, message: "File deleted successfully" });
  } catch (err) {
    return next(err);
  }
};
