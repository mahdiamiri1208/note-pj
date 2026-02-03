// app/api/auth/verify-otp/route.js

import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400 }
      );
    }

    const record = await Otp.findOne({ email });

    if (!record) {
      return new Response(
        JSON.stringify({ error: "OTP not found" }),
        { status: 404 }
      );
    }

    if (record.expiresAt < new Date()) {
      await Otp.deleteOne({ email });
      return new Response(
        JSON.stringify({ error: "OTP expired" }),
        { status: 410 }
      );
    }

    const isValid = await bcrypt.compare(otp, record.code);

    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid OTP" }),
        { status: 401 }
      );
    }

    return new Response(
      JSON.stringify({
        resetToken: otp
      }),
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
