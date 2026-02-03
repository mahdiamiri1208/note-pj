// app/api/notes/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import User from "@/models/User";
import mongoose from "mongoose";

function escapeRegExp(string = "") {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveUserIdFromSession(session) {
  if (!session) return null;
  if (session.user?.id) return session.user.id;
  if (session.user?.email) {
    await connectDB();
    const u = await User.findOne({ email: session.user.email }).select("_id").lean();
    return u?._id?.toString() || null;
  }
  return null;
}

/* POST - create note (authenticated) */
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();

    const userId = await resolveUserIdFromSession(session);
    if (!userId) return NextResponse.json({ message: "User not found" }, { status: 401 });

    const body = await req.json();

    if (!body.title || !body.content) {
      return NextResponse.json({ message: "Title and content are required" }, { status: 400 });
    }

    // normalize tags
    let tags = [];
    if (Array.isArray(body.tags)) {
      tags = body.tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof body.tags === "string" && body.tags.trim()) {
      tags = body.tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    const noteData = {
      // use string id directly; Mongoose will cast it
      userId: userId,
      title: String(body.title).trim(),
      content: String(body.content),
      tags,
      color: body.color && ["yellow","green","blue","red","gray"].includes(body.color) ? body.color : undefined
    };

    const note = await Note.create(noteData);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ message: "Error creating note", error: String(error) }, { status: 500 });
  }
}

/* GET - list notes with search/filters/pagination (only user's notes) */
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const userId = await resolveUserIdFromSession(session);
    if (!userId) return NextResponse.json({ message: "User not found" }, { status: 401 });

    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limitRaw = Number(searchParams.get("limit") || 20);
    const limit = Math.min(Math.max(isNaN(limitRaw) ? 20 : limitRaw, 1), 100);

    const q = (searchParams.get("q") || "").trim();
    const colors = searchParams.get("colors")?.split(",").map(s => s.trim()).filter(Boolean) || [];
    const tags = searchParams.get("tags")?.split(",").map(s => s.trim()).filter(Boolean) || [];

    const filter = { userId: userId }; // keep as string; Mongoose will handle casting

    if (q) {
      const regex = new RegExp(escapeRegExp(q), "i");
      filter.$or = [
        { title: regex },
        { content: regex },
        { tags: { $elemMatch: { $regex: regex } } }
      ];
    }

    if (colors.length) {
      filter.color = { $in: colors };
    }

    if (tags.length) {
      filter.tags = { $in: tags };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Note.find(filter).sort({ updatedAt: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Note.countDocuments(filter)
    ]);

    return NextResponse.json({ data, page, limit, total }, { status: 200 });
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ message: "Failed to fetch notes", error: String(error) }, { status: 500 });
  }
}
