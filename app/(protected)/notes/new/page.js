"use client";

import { useState } from "react";
import styles from "./AddNote.module.css";

const COLOR_OPTIONS = [
  {
    id: "yellow",
    bg: "#fff9e6",
    title: "#f8d302",
    border: "#fff2b3",
  },
  {
    id: "green",
    bg: "#e6f7e6",
    title: "#03c103",
    border: "#b3e6b3",
  },
  {
    id: "blue",
    bg: "#e6f0ff",
    title: "#1a8bfc",
    border: "#b3d1ff",
  },
  {
    id: "red",
    bg: "#ffe6e6",
    title: "#ff3a3a",
    border: "#ffb3b3",
  },
  {
    id: "gray",
    bg: "#f0f0f0",
    title: "#8a8a8a",
    border: "#d9d9d9",
  },
];

const DEFAULT_TAGS = ["Work", "Personal", "Important"];

export default function NewNote() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedColor, setSelectedColor] = useState("yellow");

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const activeColor =
    COLOR_OPTIONS.find((c) => c.id === selectedColor) || COLOR_OPTIONS[0];

  return (
    <div className={styles.wrapper}>
      {/* فرم */}
      <div className={styles.form}>
        <h4 className={styles.heading}>Create New Note</h4>

        <label className={styles.label}>
          Title
          <input
            className={styles.input}
            placeholder="Enter note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <label className={styles.label}>
          Content
          <textarea
            className={styles.textarea}
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>

        <div className={styles.label}>
          Tags
          <div className={styles.tags}>
            {DEFAULT_TAGS.map((tag) => (
              <span
                key={tag}
                className={`${styles.tag} ${
                  selectedTags.includes(tag) ? styles.tagActive : ""
                }`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.label}>
          Color
          <div className={styles.colors}>
            {COLOR_OPTIONS.map((c) => (
              <span
                key={c.id}
                className={`${styles.colorSwatch} ${
                  selectedColor === c.id ? styles.colorActive : ""
                }`}
                style={{ backgroundColor: c.bg }}
                onClick={() => setSelectedColor(c.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* پیش‌نمایش */}
      <aside className={styles.preview}>
        <div
          className={styles.previewCard}
          style={{
            backgroundColor: activeColor.bg,
            borderColor: activeColor.border,
          }}
        >
          <div
            className={styles.previewTitle}
            style={{ color: activeColor.title }}
          >
            {title || "Note title..."}
          </div>

          <div className={styles.previewTags}>
            {selectedTags.length ? (
              selectedTags.map((tag) => (
                <span key={tag} className={styles.previewTag}>
                  {tag}
                </span>
              ))
            ) : (
              <span className={styles.noTags}>No tags</span>
            )}
          </div>

          <div className={styles.previewContent}>
            {content || "Note content preview..."}
          </div>
        </div>
      </aside>
    </div>
  );
}
