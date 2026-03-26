import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["student", "pending", "rep", "admin"],
      default: "student",
    },
    suspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: { type: Date },
    suspendedReason: { type: String },
    suspendedBy: { type: String, enum: ["system", "admin"] },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
