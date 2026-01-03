"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./EditNote.module.css"; // همان CSS AddNote
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "@/context/ThemeContext";

const COLOR_OPTIONS = [
  { id: "yellow", bg: "#fff9e6", title: "#f8d302", border: "#fff2b3" },
  { id: "green", bg: "#e6f7e6", title: "#03c103", border: "#b3e6b3" },
  { id: "blue", bg: "#e6f0ff", title: "#1a8bfc", border: "#b3d1ff" },
  { id: "red", bg: "#ffe6e6", title: "#ff3a3a", border: "#ffb3b3" },
  { id: "gray", bg: "#f0f0f0", title: "#8a8a8a", border: "#d9d9d9" },
];

const DEFAULT_TAGS = ["Work", "Personal", "Important"];

export default function EditNote() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useParams(); // نوت ID از URL

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedColor, setSelectedColor] = useState("yellow");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // بارگذاری داده نوت
  useEffect(() => {
    fetch(`/api/notes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title || "");
        setContent(data.content || "");
        setSelectedTags(data.tags || []);
        setSelectedColor(data.color || "yellow");
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load note", { theme });
        setLoading(false);
      });
  }, [id, theme]);

  const validate = () => {
    const newErrors = {};

    if (!title.trim()) newErrors.title = "Title is required";
    else if (title.trim().length < 3)
      newErrors.title = "Title must be at least 3 characters";
    else if (title.trim().length > 100)
      newErrors.title = "Title cannot exceed 100 characters";

    if (!content.trim()) newErrors.content = "Content is required";
    else if (content.trim().length < 3)
      newErrors.content = "Content must be at least 3 characters";
    else if (content.trim().length > 1000)
      newErrors.content = "Content cannot exceed 1000 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleUpdate = async () => {
    if (!validate()) {
      toast.error("Please fix validation errors.", { theme });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          tags: selectedTags,
          color: selectedColor,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Note updated successfully!", { theme });
      router.push("/notes");
    } catch {
      toast.error("Failed to update note.", { theme });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeColor =
    COLOR_OPTIONS.find((c) => c.id === selectedColor) || COLOR_OPTIONS[0];

  if (loading) return <p>Loading...</p>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.form}>
        <h4 className={styles.heading}>Edit Note</h4>

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
                style={{ backgroundColor: c.title }}
                onClick={() => setSelectedColor(c.id)}
              />
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={handleUpdate}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Note"}
          </button>
        </div>
      </div>

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
