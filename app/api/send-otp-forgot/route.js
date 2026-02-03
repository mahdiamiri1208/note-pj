// app/api/auth/send-otp-forgot/route.js

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  NEXT_PUBLIC_OTP_TTL_FORGET_SECONDS = "300",
} = process.env;

const OTP_TTL = Number(NEXT_PUBLIC_OTP_TTL_FORGET_SECONDS|| "300");

// rate limit ساده (در حافظه)
const rateMap = global.__forgotOtpRate || new Map();
global.__forgotOtpRate = rateMap;

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(to, code) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: "Reset password code",
    html: `
      <div style="font-family: Arial">
        <h3>Password Reset</h3>
        <p>Your verification code:</p>
        <h2 style="letter-spacing:4px">${code}</h2>
        <p>Expires in ${Math.floor(OTP_TTL / 60)} minutes.</p>
      </div>
    `,
  });
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ تفاوت اصلی: باید کاربر وجود داشته باشد
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // rate limit: حداقل 60 ثانیه
    const now = Date.now();
    const bucket = rateMap.get(email) || { last: 0 };

    if (now - bucket.last < 60 * 1000) {
      return NextResponse.json(
        { message: "Please wait before requesting again" },
        { status: 429 }
      );
    }

    // تولید OTP
    const codePlain = genOtp();
    const hashed = await bcrypt.hash(codePlain, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL * 1000);

    // پاکسازی قبلی
    await Otp.deleteMany({ email, expiresAt: { $lt: new Date() } });

    await Otp.findOneAndUpdate(
      { email },
      { code: hashed, expiresAt },
      { upsert: true, new: true }
    );

    await sendEmail(email, codePlain);

    bucket.last = now;
    rateMap.set(email, bucket);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("forgot otp error:", err);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
