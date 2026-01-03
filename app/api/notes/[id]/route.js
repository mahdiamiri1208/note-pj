// app/api/notes/[id]/route.js
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

async function resolveId(req, context) {
  // امن‌سازی access به params که ممکنه Promise باشد
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

/* ---------------- GET ---------------- */
export async function GET(req, context) {
  try {
    const id = await resolveId(req, context);

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid or missing id" }, { status: 400 });
    }

    await connectDB();

    const note = await Note.findById(id);
    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
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
    const id = await resolveId(req, context);

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid or missing id" }, { status: 400 });
    }

    const body = await req.json();

    // در صورت نیاز می‌توانید اینجا ولیدیشن بیشتری اضافه کنید
    // for example: if (!body.title) return NextResponse.json({ message: "Title required" }, { status: 400 });

    await connectDB();

    const updated = await Note.findByIdAndUpdate(id, body, { new: true });
    if (!updated) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("PUT /api/notes/[id] error:", err);
    return NextResponse.json({ message: "Failed to update note", error: String(err) }, { status: 500 });
  }
}

/* ---------------- DELETE ---------------- */
export async function DELETE(req, context) {
  try {
    const id = await resolveId(req, context);

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid or missing id" }, { status: 400 });
    }

    await connectDB();

    const deleted = await Note.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Note deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/notes/[id] error:", err);
    return NextResponse.json({ message: "Failed to delete note", error: String(err) }, { status: 500 });
  }
}
