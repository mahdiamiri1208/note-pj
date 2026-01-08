// app/api/auth/register/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const { RECAPTCHA_SECRET } = process.env;

async function verifyRecaptcha(token) {
  if (!RECAPTCHA_SECRET) {
    console.log('reCAPTCHA skipped in development');
    return { success: true, score: 0.9 };
  }

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

export async function POST(req) {
  console.log('📨 Register API called');
  
  try {
    const body = await req.json();
    console.log('📝 Request body:', body);
    
    const { firstName, lastName, username, email, password, recaptchaToken } = body;

    // 1. Check required fields
    if (!firstName || !lastName || !username || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // 2. Check reCAPTCHA (only in production)
    if (process.env.NODE_ENV === 'production') {
      if (!recaptchaToken) {
        return NextResponse.json(
          { message: "Security verification required" },
          { status: 400 }
        );
      }

      const recaptchaResult = await verifyRecaptcha(recaptchaToken);
      
      if (!recaptchaResult.success) {
        return NextResponse.json(
          { message: "Security verification failed" },
          { status: 400 }
        );
      }

      // Check minimum score 0.4
      const score = recaptchaResult.score || 0;
      if (score < 0.4) {
        return NextResponse.json(
          { message: "Security check failed. Please try again." },
          { status: 400 }
        );
      }
    }

    // 3. Validate first and last name
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    
    if (trimmedFirstName.length < 2) {
      return NextResponse.json(
        { message: "First name must be at least 2 characters" },
        { status: 400 }
      );
    }
    
    if (trimmedLastName.length < 2) {
      return NextResponse.json(
        { message: "Last name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // 4. Validate username
    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername.length < 3) {
      return NextResponse.json(
        { message: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }

    // 5. Validate email
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // 6. Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check password strength
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasLowercase || !hasUppercase || !hasNumber || !hasSpecial) {
      return NextResponse.json(
        { message: "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character" },
        { status: 400 }
      );
    }

    console.log('🔄 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected');

    // 7. Check for duplicate user
    console.log('🔎 Checking for existing user...');
    
    const existingUser = await User.findOne({
      $or: [
        { username: trimmedUsername },
        { email: trimmedEmail }
      ]
    });

    if (existingUser) {
      console.log('❌ User already exists');
      const field = existingUser.username === trimmedUsername ? 'username' : 'email';
      return NextResponse.json(
        { message: `User already exists with this ${field}` },
        { status: 400 }
      );
    }

    // 8. Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // 9. Create new user
    console.log('👤 Creating new user...');
    
    const userData = {
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      username: trimmedUsername,
      email: trimmedEmail,
      password: hashedPassword
    };

    console.log('📋 User data to save:', userData);
    
    const newUser = await User.create(userData);
    console.log('🎉 User created successfully. ID:', newUser._id);

    // 10. Remove password field from response
    const userResponse = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      username: newUser.username,
      email: newUser.email,
      createdAt: newUser.createdAt
    };

    return NextResponse.json(
      { 
        success: true,
        message: "User registered successfully", 
        user: userResponse 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('💥 Registration error:', error);
    console.error('💥 Error name:', error.name);
    console.error('💥 Error message:', error.message);
    
    // MongoDB errors (like duplicate key)
    if (error.code === 11000) {
      console.error('🔑 Duplicate key error:', error.keyValue);
      const field = Object.keys(error.keyValue)[0];
      return NextResponse.json(
        { message: `User already exists with this ${field}` },
        { status: 400 }
      );
    }

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      console.error('📝 Validation errors:', error.errors);
      const messages = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Server error, please try again later" },
      { status: 500 }
    );
  }
}