import mongoose from "mongoose";

const accessSchema = new mongoose.Schema(
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
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
    },
  },
  { timestamps: true },
);

accessSchema.index({ user: 1, file: 1 }, { unique: true });

const Access = mongoose.models.Access || mongoose.model("Access", accessSchema);

export default Access;
