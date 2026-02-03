// app/api/auth/reset-password/route.js

import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();

    const { email, newPassword, resetToken } = await req.json();

    if (!email || !newPassword || !resetToken) {
      return new Response(
        JSON.stringify({
          error: "Email, new password and reset token are required",
        }),
        { status: 400 }
      );
    }

    const record = await Otp.findOne({ email });

    if (!record) {
      return new Response(
        JSON.stringify({ error: "Reset token not found" }),
        { status: 404 }
      );
    }

    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return new Response(
        JSON.stringify({ error: "Token expired" }),
        { status: 410 }
      );
    }

    const isValid = await bcrypt.compare(resetToken, record.code);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword }
    );

    await Otp.deleteOne({ email });

    return new Response(
      JSON.stringify({ message: "Password reset successfully" }),
      { status: 200 }
    );

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500 }
    );
  }
}
