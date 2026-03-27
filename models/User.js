import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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

userSchema.pre("save", async function preSave(next) {
  try {
    if (!this.isModified("password")) return next();

    const saltRounds = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
    const rounds = Number.isFinite(saltRounds) ? saltRounds : 10;

    this.password = await bcrypt.hash(String(this.password), rounds);
    return next();
  } catch (err) {
    return next(err);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(String(candidatePassword), this.password);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
