import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { getToken } from "next-auth/jwt";

// helper: check valid Mongo ObjectId
function isObjectId(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    let user = null;
    const tokenId = token.id || token.sub;

    // 1) Try find by ObjectId (local/credentials)
    if (isObjectId(tokenId)) {
      user = await User.findById(tokenId).select("firstName lastName username email image provider password");
    }

    // 2) If not found, try provider lookup (oauth)
    if (!user && token.provider && token.sub) {
      user = await User.findOne({ provider: token.provider, providerId: token.sub })
        .select("firstName lastName username email image provider password");
    }

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Decide hasPassword based on actual stored password hash
    const hasPassword = Boolean(user.password && String(user.password).length > 0);
    const provider = user.provider || "credentials";

    const safeUser = {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      username: user.username || "",
      email: user.email || "",
      image: user.image || null,
      provider,
      hasPassword,
    };

    return NextResponse.json({ user: safeUser }, { status: 200 });
  } catch (err) {
    console.error("profile GET error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const username = (body.username || "").trim().toLowerCase();
    const email = (body.email || "").trim().toLowerCase();
    const newPassword = body.password; // optional, only for local users

    if (!firstName || !lastName) {
      return NextResponse.json({ message: "First name and last name are required" }, { status: 400 });
    }

    await connectDB();

    let user = null;
    const tokenId = token.id || token.sub;

    if (isObjectId(tokenId)) {
      user = await User.findById(tokenId);
    }
    if (!user && token.provider && token.sub) {
      user = await User.findOne({ provider: token.provider, providerId: token.sub });
    }

    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Determine local vs oauth by presence of password hash
    const isLocal = Boolean(user.password && String(user.password).length > 0);

    if (!isLocal) {
      // OAuth user: only allow firstName/lastName changes
      user.firstName = firstName;
      user.lastName = lastName;
      await user.save();

      return NextResponse.json({
        ok: true,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
          provider: user.provider || "oauth",
          hasPassword: false,
        },
      }, { status: 200 });
    }

    // Local user: allow username, email and password update (with uniqueness checks)

    // username required for local update
    if (!username) return NextResponse.json({ message: "Username is required" }, { status: 400 });

    if (username !== user.username) {
      const exists = await User.findOne({ username, _id: { $ne: user._id } });
      if (exists) return NextResponse.json({ message: "Username already taken" }, { status: 400 });
      user.username = username;
    }

    if (!email) return NextResponse.json({ message: "Email is required" }, { status: 400 });

    if (email !== user.email) {
      const existsE = await User.findOne({ email, _id: { $ne: user._id } });
      if (existsE) return NextResponse.json({ message: "Email already in use" }, { status: 400 });
      user.email = email;
    }

    user.firstName = firstName;
    user.lastName = lastName;

    if (newPassword) {
      if (typeof newPassword !== "string" || newPassword.length < 8) {
        return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
      }
      user.password = newPassword; // hashing is handled by UserSchema.pre('save')
    }

    await user.save();

    return NextResponse.json({
      ok: true,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        provider: user.provider || "credentials",
        hasPassword: Boolean(user.password && String(user.password).length > 0),
      },
    }, { status: 200 });
  } catch (err) {
    console.error("profile PUT error:", err);
    if (err?.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return NextResponse.json({ message: `${field} already exists` }, { status: 400 });
    }
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
