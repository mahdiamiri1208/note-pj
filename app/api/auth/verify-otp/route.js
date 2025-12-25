import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Otp from "@/models/Otp";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ message: "Missing params" }, { status: 400 });
    }

    await connectDB();

    const record = await Otp.findOne({ email }).sort({ createdAt: -1 });

    if (!record) {
      return NextResponse.json({ message: "OTP not found" }, { status: 404 });
    }

    if (Date.now() > record.expiresAt.getTime()) {
      await Otp.deleteMany({ email });
      return NextResponse.json({ message: "OTP expired" }, { status: 400 });
    }

    if (record.code !== otp) {
      return NextResponse.json({ message: "Wrong OTP" }, { status: 400 });
    }

    // مصرف شد → حذف
    await Otp.deleteMany({ email });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
