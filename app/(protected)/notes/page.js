"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./notes.module.css";
import WindowIcon from "@mui/icons-material/Window";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import AddIcon from "@mui/icons-material/Add";
import NoteCard from "../../components/notes/NoteCard";

export default function NotesPage() {
  const [layout, setLayout] = useState("grid");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch("/api/notes");
        if (!res.ok) throw new Error("Failed to load notes");

        const data = await res.json();
        setNotes(data);
      } catch (err) {
        setError("Could not fetch notes");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return (
    <div className={styles.notesPage}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.leftActions}>
          <Link href="/notes/new" className={styles.cta}>
            <AddIcon sx={{ fontSize: "18px" }} /> Add Note
          </Link>
        </div>

        <div className={styles.rightActions}>
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

          <button className={styles.filterBtn}>
            <FilterAltIcon /> Filter
          </button>
        </div>
      </div>

      {/* State handling */}
      {loading && <p className={styles.info}>Loading notes...</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !notes.length && (
        <p className={styles.info}>No notes found</p>
      )}

      {/* Notes */}
      <div className={layout === "grid" ? styles.notesGrid : styles.notesList}>
        {notes.map((note) => (
          <NoteCard
            key={note._id}
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
