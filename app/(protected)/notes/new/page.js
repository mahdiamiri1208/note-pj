"use client";

import { useState, useEffect } from "react";
import styles from "./AddNote.module.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "@/context/ThemeContext";

export default function NewNote() {
  const { theme } = useTheme(); // light | dark

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedColor, setSelectedColor] = useState("");
  const [colors, setColors] = useState([]);
  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch رنگ‌ها و تگ‌ها از API
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [colorRes, tagRes] = await Promise.all([
          fetch("/api/colors"),
          fetch("/api/tags"),
        ]);

        const colorData = await colorRes.json();
        const tagData = await tagRes.json();

        setColors(colorData);
        setTags(tagData.map((t) => t.name));

        // انتخاب پیش‌فرض اولین رنگ
        setSelectedColor(colorData[0]?.id || "");
      } catch (err) {
        console.error(err);
        toast.error("Failed to load color or tag options", { theme });
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [theme]);

  // ولیدیشن ساده: حداقل 3 کاراکتر
  const validate = () => {
    const newErrors = {};
    if (!title.trim() || title.trim().length < 3)
      newErrors.title = "Title must be at least 3 characters";
    if (!content.trim() || content.trim().length < 3)
      newErrors.content = "Content must be at least 3 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error("Please fix errors before submitting", { theme });
      return;
    }

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

      if (!res.ok) throw new Error();

      toast.success("Note saved successfully!", { theme });

      // Reset form
      setTitle("");
      setContent("");
      setSelectedTags([]);
      setSelectedColor(colors[0]?.id || "");
      setErrors({});
    } catch {
      toast.error("Failed to save note.", { theme });
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
    colors.find((c) => c.id === selectedColor) || { bg: "#fff", title: "#000", border: "#ccc" };

  if (loadingOptions) return <p>Loading options...</p>;

  return (
    <div className={styles.wrapper}>
      {/* فرم */}
      <div className={styles.form}>
        <h4 className={styles.heading}>Create New Note</h4>

        <label className={styles.label}>
          Title
          <input
            className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
            placeholder="Enter note title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          {errors.title && <span className={styles.error}>{errors.title}</span>}
        </label>

        <label className={styles.label}>
          Content
          <textarea
            className={`${styles.textarea} ${errors.content ? styles.inputError : ""}`}
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          {errors.content && <span className={styles.error}>{errors.content}</span>}
        </label>

        <div className={styles.label}>
          Tags
          <div className={styles.tags}>
            {tags.map((tag) => (
              <span
                key={tag}
                className={`${styles.tag} ${selectedTags.includes(tag) ? styles.tagActive : ""}`}
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
            {colors.map((c) => (
              <span
                key={c.id}
                className={`${styles.colorSwatch} ${selectedColor === c.id ? styles.colorActive : ""}`}
                style={{ backgroundColor: c.title }}
                onClick={() => setSelectedColor(c.id)}
              />
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleSubmit} disabled={isSubmitting}>
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
          <div className={styles.previewTitle} style={{ color: activeColor.title }}>
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
