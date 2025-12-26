// models/Otp.js
import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true },
    code: { type: String, required: true }, // هش‌شده
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
