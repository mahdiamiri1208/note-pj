// app/api/notes/[id]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import User from "@/models/User";
import mongoose from "mongoose";

async function resolveId(req, context) {
  let params = context?.params;
  if (params && typeof params.then === "function") {
    params = await params;
  }
  const idFromParams = params?.id;
  const idFromUrl =
    !idFromParams && req?.url
      ? new URL(req.url).pathname.split("/").filter(Boolean).pop()
      : undefined;

  return idFromParams || idFromUrl;
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

/* ---------------- GET ---------------- */
export async function GET(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = await resolveId(req, context);
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid or missing id" }, { status: 400 });
    }

    await connectDB();
    const userId = await resolveUserIdFromSession(session);
    if (!userId) return NextResponse.json({ message: "User not found" }, { status: 401 });

    const note = await Note.findById(id).lean();
    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    if (note.userId?.toString() !== userId.toString()) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(note, { status: 200 });
  } catch (err) {
    console.error("GET /api/notes/[id] error:", err);
    return NextResponse.json({ message: "Failed to fetch note", error: String(err) }, { status: 500 });
  }
}

/* ---------------- PUT ---------------- */
export async function PUT(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = await resolveId(req, context);
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid or missing id" }, { status: 400 });
    }

    await connectDB();
    const userId = await resolveUserIdFromSession(session);
    if (!userId) return NextResponse.json({ message: "User not found" }, { status: 401 });

    const existing = await Note.findById(id);
    if (!existing) return NextResponse.json({ message: "Note not found" }, { status: 404 });
    if (existing.userId?.toString() !== userId.toString()) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    if (body.title && String(body.title).trim() === "") {
      return NextResponse.json({ message: "Title cannot be empty" }, { status: 400 });
    }

    let tags;
    if (Array.isArray(body.tags)) {
      tags = body.tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof body.tags === "string") {
      tags = body.tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    const updateData = {};
    if (body.title !== undefined) updateData.title = String(body.title).trim();
    if (body.content !== undefined) updateData.content = body.content;
    if (tags !== undefined) updateData.tags = tags;
    if (body.color !== undefined && ["yellow","green","blue","red","gray"].includes(body.color)) updateData.color = body.color;

    const updated = await Note.findByIdAndUpdate(id, updateData, { new: true }).lean();
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("PUT /api/notes/[id] error:", err);
    return NextResponse.json({ message: "Failed to update note", error: String(err) }, { status: 500 });
  }
}

/* ---------------- DELETE ---------------- */
export async function DELETE(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const id = await resolveId(req, context);
    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid or missing id" }, { status: 400 });
    }

    await connectDB();
    const userId = await resolveUserIdFromSession(session);
    if (!userId) return NextResponse.json({ message: "User not found" }, { status: 401 });

    const existing = await Note.findById(id);
    if (!existing) return NextResponse.json({ message: "Note not found" }, { status: 404 });
    if (existing.userId?.toString() !== userId.toString()) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await Note.findByIdAndDelete(id);
    return NextResponse.json({ message: "Note deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/notes/[id] error:", err);
    return NextResponse.json({ message: "Failed to delete note", error: String(err) }, { status: 500 });
  }
}
