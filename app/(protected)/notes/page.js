"use client";

import React, { useState } from "react";
import styles from "./notes.module.css";
import WindowIcon from "@mui/icons-material/Window";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import AddIcon from "@mui/icons-material/Add";
import NoteCard from "../../components/notes/NoteCard";

export default function NotesPage() {
  const [layout, setLayout] = useState("grid"); // "grid" یا "list"

  // نمونه نوت‌ها
const notes = [
  {
    title: "Shopping",
    content:
      "Buy milk, eggs, bread, and also check if there are any discounts on fruits. Maybe grab some bananas, apples, and oranges. Don't forget to compare the price of different coffee brands. Also pick up dish soap and maybe some snacks for later tonight.",
    tags: ["Home", "Urgent"],
    color: "yellow",
  },
  {
    title: "Work",
    content:
      "Finish the project report by Thursday. Include the updated charts from the analytics team, and revise the introduction section. Make sure to double-check the budget calculations. Also prepare a short summary for the meeting next week and send a draft to Sarah for review.",
    tags: ["Office"],
    color: "green",
  },
  {
    title: "Personal",
    content:
      "Read a book tonight — maybe continue 'Atomic Habits'. Try to finish at least one full chapter. Also think about organizing your bookshelf this weekend. It’s getting messy and a lot of the books are not in order anymore.",
    tags: ["Leisure"],
    color: "red",
  },
  {
    title: "Study Plan",
    content:
      "Review JavaScript closures, promises, async/await, and event loop. Then practice React hooks—especially useCallback and useMemo. After that, watch the TypeScript tutorial and take notes. Don’t forget to solve at least two coding problems on LeetCode before sleep.",
    tags: ["Programming", "Learning","Programming", "Learning"],
    color: "gray",
  },
  {
    title: "Ideas",
    content:
      "Write down ideas for the new app concept: a minimal note-taking tool with fast tagging, color categories, offline sync, and AI summarization Consider also adding voice input, custom themes, and maybe a compact widget for the home screen.",
    tags: ["Brainstorm"],
    color: "blue",
  },
];


  return (
    <div className={styles.notesPage}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        {/* سمت چپ: Add Note */}
        <div className={styles.leftActions}>
          <button className={styles.cta}>
            <AddIcon sx={{ fontSize: "18px" }} /> Add Note
          </button>
        </div>

        {/* سمت راست: Layout + Filter */}
        <div className={styles.rightActions}>
          {/* Layout toggle */}
          <div className={styles.layoutToggle}>
            <WindowIcon
              className={layout === "grid" ? styles.activeIcon : styles.icon}
              onClick={() => setLayout("grid")}
            />
            <FormatListBulletedIcon
              className={layout === "list" ? styles.activeIcon : styles.icon}
              onClick={() => setLayout("list")}
            />
          </div>

          {/* Filter */}
          <button className={styles.filterBtn}>
            <FilterAltIcon /> Filter
          </button>
        </div>
      </div>

      {/* Notes container */}
      <div className={layout === "grid" ? styles.notesGrid : styles.notesList}>
        {notes.map((note, index) => (
          <NoteCard
            key={index}
            title={note.title}
            content={note.content}
            tags={note.tags}
            color={note.color}
            layout={layout}
          />
        ))}
      </div>
    </div>
  );
}
