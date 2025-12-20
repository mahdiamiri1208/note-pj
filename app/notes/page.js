"use client";

import React, { useState } from "react";
import styles from "./notes.module.css";
import WindowIcon from "@mui/icons-material/Window";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import AddIcon from "@mui/icons-material/Add";

export default function NotesPage() {
  const [layout, setLayout] = useState("grid"); // "grid" یا "list"

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
        <div className={styles.noteCard}>Note 1</div>  
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 2</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
        <div className={styles.noteCard}>Note 3</div>
      </div>
    </div>
  );
}
