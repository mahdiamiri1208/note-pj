// app/api/auth/send-otp/route.js
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";

const {
  RECAPTCHA_SECRET,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  NEXT_PUBLIC_OTP_TTL_SECONDS = "300",
} = process.env;

const OTP_TTL = Number(NEXT_PUBLIC_OTP_TTL_SECONDS || "300");

// ساده‌ترین rate limiter در حافظه (برای production از Redis استفاده کن)
const rateMap = global.__otpRateMap || new Map();
global.__otpRateMap = rateMap;

// helper: تولید کد 6 رقمی
function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function verifyRecaptcha(token) {
  if (!RECAPTCHA_SECRET) return { success: true, score: 1 }; // dev fallback (نهایی: قرار نده)
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: `secret=${encodeURIComponent(RECAPTCHA_SECRET)}&response=${encodeURIComponent(token)}`,
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("recaptcha verify error:", err);
    return { success: false };
  }
}

async function sendEmail(to, code) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: false,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject: "Your verification code",
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.4">
        <h3>Notebook App — Verification Code</h3>
        <p>Your OTP code is:</p>
        <h2 style="letter-spacing: 4px">${code}</h2>
        <p>It expires in ${Math.floor(OTP_TTL / 60)} minutes.</p>
      </div>
    `,
  });
}

export async function POST(req) {
  try {
    const { email, recaptchaToken } = await req.json();
    if (!email || !recaptchaToken) {
      return NextResponse.json({ message: "Missing params" }, { status: 400 });
    }

    // Rate limit ساده: حداکثر 5 ارسال در 24 ساعت و حداقل 60s بین ارسال‌ها
    const now = Date.now();
    const bucket = rateMap.get(email) || { lastSent: 0, count24h: 0, firstTs: now };
    // reset 24h window
    if (now - bucket.firstTs > 24 * 60 * 60 * 1000) {
      bucket.firstTs = now;
      bucket.count24h = 0;
    }

    if (now - bucket.lastSent < 60 * 1000) {
      return NextResponse.json({ message: "Too many requests. Wait a bit." }, { status: 429 });
    }
    if (bucket.count24h >= 5) {
      return NextResponse.json({ message: "Exceeded daily limit for OTP sends." }, { status: 429 });
    }

    // verify reCAPTCHA
    const rec = await verifyRecaptcha(recaptchaToken);
    if (!rec.success || (typeof rec.score === "number" && rec.score < 0.4)) {
      return NextResponse.json({ message: "reCAPTCHA failed" }, { status: 403 });
    }

    // تولید و هش کردن OTP
    const codePlain = genOtp();
    const hashed = await bcrypt.hash(codePlain, 10);
    const expiresAt = new Date(Date.now() + OTP_TTL * 1000);

    await connectDB();

    // حذف رکوردهای خیلی قدیمی (فضاپروری) یا نگه داشتن فقط آخرین
    await Otp.deleteMany({ email, expiresAt: { $lt: new Date() } });

    // ذخیره‌ی هش شده
    await Otp.create({ email, code: hashed, expiresAt });

    // ارسال ایمیل (کد متن‌خام به ایمیل می‌رود)
    await sendEmail(email, codePlain);

    // update rate map
    bucket.lastSent = now;
    bucket.count24h = (bucket.count24h || 0) + 1;
    rateMap.set(email, bucket);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-otp error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
