import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },
    paymentProofUrl: {
      type: String,
      required: true,
    },
    payerName: {
      type: String,
      required: true,
    },
    relationship: {
      type: String,
      enum: ["self", "parent", "guardian"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionNote: { type: String },
    attempts: {
      type: Number,
      default: 0,
    },
    flags: {
      duplicateImage: { type: Boolean, default: false },
      exifSuspicious: { type: Boolean, default: false },
      visuallySuspicious: { type: Boolean, default: false },
      flagDetails: [{ type: String }],
    },
  },
  { timestamps: true },
);

requestSchema.index({ user: 1, file: 1 }, { unique: true });

const Request = mongoose.models.Request || mongoose.model("Request", requestSchema);

export default Request;
