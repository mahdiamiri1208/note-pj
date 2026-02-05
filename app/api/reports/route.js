// app/api/reports/overview/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Note from "@/models/Note";
import User from "@/models/User";
import mongoose from "mongoose";

function formatDateYYYYMMDD(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function GET() {
  try {
    await connectDB();

    // total counts
    const [totalNotes, totalUsers] = await Promise.all([
      Note.countDocuments(),
      User.countDocuments(),
    ]);

    // notes per day - last 7 days (including today)
    const days = 7;
    const start = new Date();
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0, 0, 0, 0);

    const notesPerDayAgg = await Note.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // normalize to continuous last-7-days array
    const notesPerDayMap = new Map(notesPerDayAgg.map((r) => [r._id, r.count]));
    const notesPerDay = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - (days - 1 - i));
      d.setUTCHours(0, 0, 0, 0);
      const key = formatDateYYYYMMDD(d);
      notesPerDay.push({ date: key, count: notesPerDayMap.get(key) || 0 });
    }

    // notes by category: we'll use color field (you can change to tags if preferred)
    const notesByCategoryAgg = await Note.aggregate([
      {
        $group: {
          _id: "$color",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const notesByCategory = notesByCategoryAgg.map((r) => ({
      category: r._id || "unknown",
      count: r.count,
    }));

    // activeToday = distinct users who created notes today
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const activeTodayAgg = await Note.aggregate([
      { $match: { createdAt: { $gte: todayStart } } },
      { $group: { _id: "$userId" } },
      { $count: "distinctUsers" },
    ]);
    const activeToday = (activeTodayAgg[0] && activeTodayAgg[0].distinctUsers) || 0;

    // recent notes (latest 10) with user name
    const recentNotesAgg = await Note.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          title: 1,
          createdAt: 1,
          userName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$user.firstName", ""] },
                  " ",
                  { $ifNull: ["$user.lastName", ""] },
                ],
              },
            },
          },
        },
      },
    ]);

    const recentNotes = recentNotesAgg.map((r) => ({
      title: r.title,
      user: r.userName || "Unknown",
      date: formatDateYYYYMMDD(new Date(r.createdAt)),
    }));

    return NextResponse.json({
      totalNotes,
      totalUsers,
      notesPerDay,
      notesByCategory,
      activeToday,
      recentNotes,
    });
  } catch (err) {
    console.error("reports overview error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
