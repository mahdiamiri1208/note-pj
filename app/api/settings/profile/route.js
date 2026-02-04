// app/api/settings/profile/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const userId = token.sub || token.id || token?.user?.id;
    if (!userId) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    await connectDB();
    const user = await User.findById(userId).select("firstName lastName username email");
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    console.error("profile GET error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const userId = token.sub || token.id || token?.user?.id;
    if (!userId) return NextResponse.json({ message: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const username = (body.username || "").trim().toLowerCase();
    const email = (body.email || "").trim().toLowerCase();

    // basic validation
    if (!firstName) return NextResponse.json({ message: "First name is required" }, { status: 400 });
    if (!username) return NextResponse.json({ message: "Username is required" }, { status: 400 });
    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ message: "Invalid email" }, { status: 400 });

    await connectDB();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // check username uniqueness (excluding current user)
    if (username !== user.username) {
      const existingU = await User.findOne({ username });
      if (existingU) return NextResponse.json({ message: "Username already taken" }, { status: 400 });
    }

    // check email uniqueness (excluding current user)
    if (email !== user.email) {
      const existingE = await User.findOne({ email });
      if (existingE) return NextResponse.json({ message: "Email already in use" }, { status: 400 });
    }

    // apply updates to matching schema fields
    user.firstName = firstName;
    user.lastName = lastName;
    user.username = username;
    user.email = email;

    await user.save();

    const safeUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      email: user.email,
    };

    return NextResponse.json({ ok: true, user: safeUser }, { status: 200 });
  } catch (err) {
    console.error("profile PUT error:", err);
    // duplicate key possible fallback
    if (err?.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return NextResponse.json({ message: `${field} already exists` }, { status: 400 });
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
