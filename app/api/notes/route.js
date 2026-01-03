import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import { NextResponse } from "next/server";

/* CREATE NOTE */
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.title || !body.content) {
      return NextResponse.json(
        { message: "Title and content are required" },
        { status: 400 }
      );
    }

    const note = await Note.create(body);

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error creating note" },
      { status: 500 }
    );
  }
}

/* GET NOTES (with search & filters) */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q");
    const colors = searchParams.get("colors")?.split(",");
    const tags = searchParams.get("tags")?.split(",");

    const filter = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
      ];
    }

    if (colors?.length) {
      filter.color = { $in: colors };
    }

    if (tags?.length) {
      filter.tags = { $in: tags };
    }

    const notes = await Note.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
