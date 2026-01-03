import { connectDB } from "@/lib/mongodb";
import Color from "@/models/Color";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();
  const colors = await Color.find({});
  return NextResponse.json(colors);
}
