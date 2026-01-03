import { connectDB } from "@/lib/mongodb";
import Tag from "@/models/Tag";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();
  const tags = await Tag.find({});
  return NextResponse.json(tags);
}
