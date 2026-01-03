import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const note = await Note.create(body);

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error creating note" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const notes = await Note.find().sort({ createdAt: -1 });

    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
