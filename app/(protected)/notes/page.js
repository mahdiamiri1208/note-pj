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

/* موقت – بعدا از دیتابیس میاد */
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

  /* 🔍 سرچ */
  const q = searchParams.get("q") || "";

  /* 🎨 فیلتر چندانتخابی */
  const colors = searchParams.get("colors")?.split(",") || [];
  const tags = searchParams.get("tags")?.split(",") || [];

  /* بستن منو با کلیک بیرون */
  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* fetch notes */
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

  /* 🧠 toggle فیلتر چندانتخابی */
  const toggleFilter = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get(key)?.split(",").filter(Boolean) || [];

    let next;
    if (current.includes(value)) {
      next = current.filter((v) => v !== value);
    } else {
      next = [...current, value];
    }

    if (next.length) params.set(key, next.join(","));
    else params.delete(key);

    router.push(`/notes?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q); // سرچ حفظ شود
    router.push(`/notes?${params.toString()}`);
  };

  return (
    <div className={styles.notesPage}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.leftActions}>
          <Link href="/notes/new" className={styles.cta}>
            <AddIcon sx={{ fontSize: 18 }} /> Add Note
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

          {/* Filter dropdown */}
          {/* Filter dropdown */}
          <div className={styles.filterWrapper} ref={filterRef}>
            <button
              className={styles.filterBtn}
              onClick={() => setFilterOpen((p) => !p)}
            >
              <FilterAltIcon /> Filter
            </button>

            {filterOpen && (
              <div className={styles.filterDropdown}>
                {/* Colors */}
                <div className={styles.dropdownSection}>
                  <span className={styles.dropdownTitle}>Colors</span>
                  <div className={styles.optionsRow}>
                    {COLORS.map((c) => (
                      <label key={c} className={styles.optionItem}>
                        <input
                          type="checkbox"
                          checked={colors.includes(c)}
                          onChange={() => toggleFilter("colors", c)}
                        />
                        <span className={styles.colorDot} data-color={c} />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className={styles.dropdownSection}>
                  <span className={styles.dropdownTitle}>Tags</span>
                  <div className={styles.optionsRow}>
                    {TAGS.map((t) => (
                      <label key={t} className={styles.optionItem}>
                        <input
                          type="checkbox"
                          checked={tags.includes(t)}
                          onChange={() => toggleFilter("tags", t)}
                        />
                        {t}
                      </label>
                    ))}
                  </div>
                </div>

                <button className={styles.clearBtn} onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* State */}
      {loading && <p className={styles.info}>Loading notes...</p>}
      {error && <p className={styles.error}>{error}</p>}
      {!loading && !notes.length && (
        <div className={styles.info}>
          <p>No notes found</p>
        </div>
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
