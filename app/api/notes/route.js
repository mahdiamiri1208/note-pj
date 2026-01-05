import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import { NextResponse } from "next/server";

function escapeRegExp(string = "") {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

/* GET NOTES (with search, filters, pagination) */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    // Pagination params
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limitRaw = Number(searchParams.get("limit") || 20);
    const limit = Math.min(Math.max(isNaN(limitRaw) ? 20 : limitRaw, 1), 100);

    const q = searchParams.get("q") || "";
    const colors = searchParams.get("colors")?.split(",").filter(Boolean) || [];
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

    const filter = {};

    if (q) {
      const regex = new RegExp(q, "i");

      filter.$or = [
        { title: regex },
        { content: regex },
        { tags: { $elemMatch: { $regex: regex } } },
      ];
    }

    if (colors.length) {
      filter.color = { $in: colors };
    }

    if (tags.length) {
      filter.tags = { $in: tags };
    }

    const skip = (page - 1) * limit;

    // parallelize queries: get data and total count
    const [data, total] = await Promise.all([
      Note.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Note.countDocuments(filter),
    ]);

    return NextResponse.json({ data, page, limit, total }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}
