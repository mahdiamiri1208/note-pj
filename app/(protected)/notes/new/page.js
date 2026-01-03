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
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
  const newErrors = {};

  if (!title.trim()) {
    newErrors.title = "Title is required";
  } else if (title.length < 3) {
    newErrors.title = "Title must be at least 3 characters";
  }

  if (!content.trim()) {
    newErrors.content = "Content is required";
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};


const handleSubmit = async () => {
  if (!validate()) return;

  setIsSubmitting(true);

  try {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        tags: selectedTags,
        color: selectedColor,
      }),
    });

    if (!res.ok) throw new Error("Failed to save note");

    // ریست فرم
    setTitle("");
    setContent("");
    setSelectedTags([]);
    setSelectedColor("yellow");
    setErrors({});
  } catch (err) {
    alert("Error saving note");
  } finally {
    setIsSubmitting(false);
  }
};


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
            className={`${styles.input} ${
              errors.title ? styles.inputError : ""
            }`}
            placeholder="Enter note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && <span className={styles.error}>{errors.title}</span>}
        </label>

        <label className={styles.label}>
          Content
          <textarea
            className={`${styles.textarea} ${
              errors.content ? styles.inputError : ""
            }`}
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {errors.content && (
            <span className={styles.error}>{errors.content}</span>
          )}
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

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Note"}
          </button>
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
