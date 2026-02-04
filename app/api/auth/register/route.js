// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

const { RECAPTCHA_SECRET } = process.env;

async function verifyRecaptcha(token) {
  if (!RECAPTCHA_SECRET) {
    console.log("reCAPTCHA skipped in development");
    return { success: true, score: 0.9 };
  }

  try {
    const res = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        body: `secret=${encodeURIComponent(
          RECAPTCHA_SECRET
        )}&response=${encodeURIComponent(token)}`,
      }
    );

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("recaptcha verify error:", err);
    return { success: false };
  }
}

export async function POST(req) {
  console.log("📨 Register API called");

  try {
    const body = await req.json();
    console.log("📝 Request body:", body);

    const { firstName, lastName, username, email, password, recaptchaToken } =
      body;

    // 1. Required
    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    // 2. reCAPTCHA (only in production)
    if (process.env.NODE_ENV === "production") {
      if (!recaptchaToken) {
        return NextResponse.json({ message: "Security verification required" }, { status: 400 });
      }

      const recaptchaResult = await verifyRecaptcha(recaptchaToken);
      if (!recaptchaResult.success || (recaptchaResult.score ?? 0) < 0.4) {
        return NextResponse.json({ message: "Security check failed. Please try again." }, { status: 400 });
      }
    }

    // 3. Trim & basic validation
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedFirstName.length < 2) {
      return NextResponse.json({ message: "First name must be at least 2 characters" }, { status: 400 });
    }
    if (trimmedLastName.length < 2) {
      return NextResponse.json({ message: "Last name must be at least 2 characters" }, { status: 400 });
    }
    if (trimmedUsername.length < 3) {
      return NextResponse.json({ message: "Username must be at least 3 characters" }, { status: 400 });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ message: "Please enter a valid email address" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters" }, { status: 400 });
    }

    // optional strength check (keep or remove)
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
      return NextResponse.json(
        { message: "Password must contain lowercase, uppercase, number, and special char" },
        { status: 400 }
      );
    }

    console.log("🔄 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected");

    console.log("🔎 Checking for existing user...");
    const existingUser = await User.findOne({
      $or: [{ username: trimmedUsername }, { email: trimmedEmail }],
    });

    if (existingUser) {
      console.log("❌ User already exists");
      const field = existingUser.username === trimmedUsername ? "username" : "email";
      return NextResponse.json({ message: `User already exists with this ${field}` }, { status: 400 });
    }

    // IMPORTANT: store plain password here — model will hash it in pre('save')
    console.log("👤 Creating new user...");
    const newUser = await User.create({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      username: trimmedUsername,
      email: trimmedEmail,
      password: password, // plain — hashed by model
    });

    console.log("🎉 User created successfully. ID:", newUser._id);

    const userResponse = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json({ success: true, message: "User registered successfully", user: userResponse }, { status: 201 });
  } catch (error) {
    console.error("💥 Registration error:", error);
    console.error("💥 Error name:", error.name);
    console.error("💥 Error message:", error.message);

    // Duplicate key
    if (error.code === 11000 && error.keyValue) {
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json({ message: `User already exists with this ${field}` }, { status: 400 });
    }

    // Mongoose validation
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json({ message: messages.join(", ") }, { status: 400 });
    }

    return NextResponse.json({ message: "Server error, please try again later" }, { status: 500 });
  }
}
