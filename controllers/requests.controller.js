import mongoose from "mongoose";

import cloudinary, { streamToCloudinary } from "../config/cloudinary.js";
import File from "../models/File.js";
import Request from "../models/Request.js";
import {
  duplicateReceiptRepEmail,
  newRequestRepEmail,
  requestReceivedEmail,
} from "../utils/emailTemplates.js";
import sendEmail from "../utils/mailer.js";
import { generateImageHash, runReceiptChecks } from "../utils/receiptChecks.js";

export const submitRequest = async (req, res, next) => {
  let uploadResult;

  try {
    const { fileId, payerName, relationship } = req.body || {};

    if (!fileId || !payerName || !relationship) {
      return res.status(400).json({
        success: false,
        message: "fileId, payerName, and relationship are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return res.status(400).json({ success: false, message: "Invalid fileId" });
    }

    const validRelationships = ["self", "parent", "guardian"];
    if (!validRelationships.includes(relationship)) {
      return res.status(400).json({
        success: false,
        message: "Relationship must be one of: self, parent, guardian",
      });
    }

    if (!req.file?.buffer) {
      return res
        .status(400)
        .json({ success: false, message: "Payment proof image is required" });
    }

    const file = await File.findById(fileId).populate("owner", "name email");
    if (!file) {
      return res.status(404).json({ success: false, message: "Textbook not found" });
    }

    const existingRequest = await Request.findOne({
      user: req.user._id,
      file: fileId,
    }).select("status");

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted a request for this textbook",
        status: existingRequest.status,
      });
    }

    const receiptHash = generateImageHash(req.file.buffer);
    const duplicateReceipt = await Request.findOne({ receiptHash }).populate(
      "user",
      "name email",
    );

    if (duplicateReceipt) {
      try {
        const { subject, html } = duplicateReceiptRepEmail(
          file.owner?.name,
          req.user.name,
          file.title,
        );
        await sendEmail({ to: file.owner?.email, subject, html });
      } catch {
        // email failures must not break requests
      }

      return res.status(409).json({
        success: false,
        message: "This receipt has already been submitted. Your attempt has been flagged.",
      });
    }

    const { exifSuspicious, visuallySuspicious, flagDetails } = await runReceiptChecks(
      req.file.buffer,
      req.file.mimetype,
    );

    uploadResult = await streamToCloudinary(req.file.buffer, {
      folder: "receipts",
      resource_type: "image",
    });

    const request = await Request.create({
      user: req.user._id,
      file: fileId,
      paymentProofUrl: uploadResult.secure_url,
      receiptPublicId: uploadResult.public_id,
      receiptHash,
      payerName: String(payerName).trim(),
      relationship,
      flags: {
        duplicateImage: false,
        exifSuspicious,
        visuallySuspicious,
        flagDetails,
      },
    });

    try {
      const studentEmail = requestReceivedEmail(req.user.name, file.title);
      await sendEmail({
        to: req.user.email,
        subject: studentEmail.subject,
        html: studentEmail.html,
      });
    } catch {
      // email failures must not break requests
    }

    try {
      const repEmail = newRequestRepEmail(file.owner?.name, req.user.name, file.title);
      await sendEmail({
        to: file.owner?.email,
        subject: repEmail.subject,
        html: repEmail.html,
      });
    } catch {
      // email failures must not break requests
    }

    const responsePayload = {
      success: true,
      message: "Request submitted successfully",
      request: {
        id: request._id,
        status: request.status,
        file: { id: file._id, title: file.title },
        submittedAt: request.createdAt,
      },
    };

    if (exifSuspicious || visuallySuspicious) {
      responsePayload.warning =
        "Your receipt was flagged for review. Your request is still pending but will be reviewed carefully.";
    }

    return res.status(201).json(responsePayload);
  } catch (err) {
    if (uploadResult?.public_id) {
      try {
        await cloudinary.uploader.destroy(uploadResult.public_id, {
          resource_type: "image",
        });
      } catch {
        // ignore cleanup errors
      }
    }

    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate request detected",
      });
    }

    return next(err);
  }
};

export const getMyRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ user: req.user._id })
      .populate("file", "title price")
      .select("-receiptHash -receiptPublicId -flags")
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    return next(err);
  }
};

