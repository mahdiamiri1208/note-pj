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
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

/* fallback (در صورتی که API مشکل داشت) */
const FALLBACK_TAGS = [
  "Work",
  "Personal",
  "Important",
  "Office",
  "Home",
  "Health",
];
const FALLBACK_COLORS = ["yellow", "green", "blue", "red", "gray"];

export default function NotesPage() {
  const [layout, setLayout] = useState("grid");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);

  const [availableTags, setAvailableTags] = useState([]); // array of strings (names)
  const [availableColors, setAvailableColors] = useState([]); // array of color objects {id, bg, title, border}
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const filterRef = useRef(null);
  const abortRef = useRef();

  /* 🔍 params */
  const q = searchParams.get("q") || "";
  const colors = searchParams.get("colors")?.split(",").filter(Boolean) || [];
  const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const page = Math.max(Number(searchParams.get("page") || 1), 1);
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

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

  /* fetch notes (with AbortController + pagination) */
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchNotes = async () => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (colors.length) params.append("colors", colors.join(","));
      if (tags.length) params.append("tags", tags.join(","));
      params.set("page", String(page));
      params.set("limit", String(limit));

      try {
        const res = await fetch(`/api/notes?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch notes");
        const data = await res.json();
        setNotes(Array.isArray(data.data) ? data.data : data); // back-compat if needed
        // If API returns meta, we may want to use it (total) — keep it in state below if needed
        setTotal(data.total ?? (Array.isArray(data) ? data.length : 0));
      } catch (e) {
        if (e.name === "AbortError") return;
        console.error(e);
        setError("Failed to fetch notes");
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, colors.join(","), tags.join(","), page, limit]);

  /* fetch available colors & tags from API once */
  useEffect(() => {
    let mounted = true;
    const fetchOptions = async () => {
      setOptionsLoading(true);
      setOptionsError("");
      try {
        const [cRes, tRes] = await Promise.all([
          fetch("/api/colors"),
          fetch("/api/tags"),
        ]);
        if (!cRes.ok || !tRes.ok) throw new Error("Failed to load options");

        const cData = await cRes.json();
        const tData = await tRes.json();

        if (!mounted) return;
        // colors: expect array of { id, bg, title, border }
        setAvailableColors(
          Array.isArray(cData) && cData.length
            ? cData
            : FALLBACK_COLORS.map((id) => ({ id }))
        );
        // tags: accept array of objects {name} or array of strings
        const parsedTags = Array.isArray(tData)
          ? tData
              .map((t) => (typeof t === "string" ? t : t?.name))
              .filter(Boolean)
          : [];
        setAvailableTags(parsedTags.length ? parsedTags : FALLBACK_TAGS);
      } catch (err) {
        console.error("Failed to load filter options:", err);
        if (!mounted) return;
        setOptionsError("Failed to load filter options");
        setAvailableColors(FALLBACK_COLORS.map((id) => ({ id })));
        setAvailableTags(FALLBACK_TAGS);
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    };

    fetchOptions();
    return () => {
      mounted = false;
    };
  }, []);

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

    // reset to page 1 when filters change
    params.set("page", "1");

    router.push(`/notes?${params.toString()}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q); // سرچ حفظ شود
    router.push(`/notes?${params.toString()}`);
  };

  // حذف از state وقتی NoteCard حذف موفق را اعلام می‌کند (بدون رفرش)
  const handleDeleteFromList = (id) => {
    setNotes((prev) => prev.filter((n) => n._id !== id));
  };

  // pagination: read total from last fetch — keep in state
  const [total, setTotal] = useState(0);
  const pageCount = Math.max(1, Math.ceil(total / limit));

  const handlePageChange = (event, value) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(value));
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
          <div className={styles.filterWrapper} ref={filterRef}>
            <button
              className={styles.filterBtn}
              onClick={() => setFilterOpen((p) => !p)}
            >
              <FilterAltIcon /> Filter
            </button>

            {filterOpen && (
              <div className={styles.filterDropdown}>
                {optionsLoading ? (
                  <div className={styles.dropdownSection}>
                    <div>Loading options...</div>
                  </div>
                ) : optionsError ? (
                  <div className={styles.dropdownSection}>
                    <div className={styles.error}>{optionsError}</div>
                  </div>
                ) : (
                  <>
                    {/* Colors */}
                    <div className={styles.dropdownSection}>
                      <span className={styles.dropdownTitle}>Colors</span>
                      <div className={styles.optionsRow}>
                        {availableColors.map((c) => {
                          const id = c.id || c._id || c.name;
                          return (
                            <label key={id} className={styles.optionItem}>
                              <input
                                type="checkbox"
                                checked={colors.includes(id)}
                                onChange={() => toggleFilter("colors", id)}
                              />
                              <span
                                className={styles.colorDot}
                                data-color={id}
                                title={id}
                                style={{
                                  backgroundColor: c.title || undefined,
                                }}
                              />
                              {id}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tags */}
                    <div className={styles.dropdownSection}>
                      <span className={styles.dropdownTitle}>Tags</span>
                      <div className={styles.optionsRow}>
                        {availableTags.map((t) => (
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
                  </>
                )}
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
            _id={note._id}
            title={note.title}
            content={note.content}
            tags={note.tags}
            color={note.color}
            layout={layout}
            onDelete={handleDeleteFromList}
          />
        ))}
      </div>

      {/* Pagination footer */}
      <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
        
        <Stack spacing={2}>
          <Pagination
            count={pageCount}
            page={page}
            color="primary"
            onChange={handlePageChange}
            showFirstButton
            showLastButton
          />
        </Stack>
      </div>
    </div>
  );
}
