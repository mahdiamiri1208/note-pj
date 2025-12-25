import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";

const {
  RECAPTCHA_SECRET,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  OTP_TTL_SECONDS = "300",
} = process.env;

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function verifyRecaptcha(token) {
  const res = await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`,
    { method: "POST" }
  );
  return res.json();
}

async function sendEmail(to, code) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
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
      <h2>Notebook App</h2>
      <p>Your OTP code:</p>
      <h1>${code}</h1>
      <p>Expires in 5 minutes</p>
    `,
  });
}

export async function POST(req) {
  try {
    const { email, recaptchaToken } = await req.json();
    if (!email || !recaptchaToken) {
      return NextResponse.json({ message: "Missing params" }, { status: 400 });
    }

    // verify recaptcha
    const rec = await verifyRecaptcha(recaptchaToken);
    if (!rec.success || rec.score < 0.4) {
      return NextResponse.json({ message: "reCAPTCHA failed" }, { status: 403 });
    }

    await connectDB();

    const code = genOtp();
    const expiresAt = new Date(Date.now() + Number(OTP_TTL_SECONDS) * 1000);

    // ⬅️ ذخیره واقعی در MongoDB
    await Otp.create({ email, code, expiresAt });

    await sendEmail(email, code);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
