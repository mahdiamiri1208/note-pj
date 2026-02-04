import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { message: "username is required" },
      { status: 400 }
    );
  }

  await connectDB();

  const user = await User.findOne({ username }).select("_id");

  return NextResponse.json({
    available: !user,
  });
}
