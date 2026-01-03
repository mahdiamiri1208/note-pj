// app/notes/page.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./notes.module.css";

import WindowIcon from "@mui/icons-material/Window";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import AddIcon from "@mui/icons-material/Add";
import NoteCard from "../../components/notes/NoteCard";

const TAGS = ["Work", "Personal", "Important", "Office", "Home"];
const COLORS = ["yellow", "green", "blue", "red", "gray"];

export default function NotesPage() {
  const [layout, setLayout] = useState("grid");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const filterRef = useRef(null);

  const q = searchParams.get("q") || "";
  const colors = searchParams.get("colors")?.split(",") || [];
  const tags = searchParams.get("tags")?.split(",") || [];

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (colors.length) params.append("colors", colors.join(","));
      if (tags.length) params.append("tags", tags.join(","));

      try {
        const res = await fetch(`/api/notes?${params.toString()}`);
        const data = await res.json();
        setNotes(data);
      } catch {
        setError("Failed to fetch notes");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [q, colors.join(","), tags.join(",")]);

  // ✅ حذف نوت از state
  const handleDeleteFromList = (id) => {
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  return (
    <div className={styles.notesPage}>
      <div className={styles.toolbar}>
        <Link href="/notes/new" className={styles.cta}>
          <AddIcon sx={{ fontSize: 18 }} /> Add Note
        </Link>
      </div>

      {loading && <p>Loading...</p>}
      {!loading && !notes.length && <p>No notes found</p>}

      <div className={layout === "grid" ? styles.notesGrid : styles.notesList}>
        {notes.map((note) => (
          <NoteCard
            key={note._id}
            {...note}
            layout={layout}
            onDelete={handleDeleteFromList} // ✅ مهم
          />
        ))}
      </div>
    </div>
  );
}
