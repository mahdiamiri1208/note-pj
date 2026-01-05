"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import styles from "./NoteCard.module.css";
import { generateNoteColors } from "../../utils/color";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@/context/ThemeContext";

// Dynamic import to avoid MUI + App Router SSR bug
const SpeedDial = dynamic(() => import("@mui/material/SpeedDial"), { ssr: false });
const SpeedDialAction = dynamic(() => import("@mui/material/SpeedDialAction"), { ssr: false });

export default function NoteCard({
  _id,
  title,
  content,
  tags = [],
  color,
  layout,
  onDelete, // <-- callback از والد برای حذف فوری در UI
}) {
  const colors = generateNoteColors(color);
  const router = useRouter();
  const minHeight = layout === "list" ? "160px" : "240px";
  const [open, setOpen] = useState(false);
  const { theme } = useTheme(); // light | dark

  const handleDelete = async () => {
    setOpen(false);

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This note will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      background: theme === "dark" ? "#1f2937" : "#fff",
      color: theme === "dark" ? "#fff" : "#000",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/notes/${_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      // سعی کنیم پیام خطا/موفقیت برگشتی را دقیق نشان دهیم
      let data = null;
      try { data = await res.json(); } catch (e) { /* ignore */ }

      if (res.ok) {
        toast.success(data?.message || "Note deleted");
        // مهم: callback والد را فراخوانی کن تا خودش state را آپدیت کند
        if (typeof onDelete === "function") {
          onDelete(_id);
        }
      } else {
        const msg = data?.message || `Delete failed (${res.status})`;
        toast.error(msg);
        console.error("Delete failed:", res.status, data);
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete note");
    }
  };

  const actions = [
    { icon: <EditIcon sx={{ color: "#2979ff" }} />, name: "Edit", onClick: () => router.push(`/notes/edit/${_id}`) },
    { icon: <DeleteIcon sx={{ color: "#d32f2f" }} />, name: "Delete", onClick: handleDelete },
  ];

  return (
    <div
      className={styles.card}
      style={{
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        minHeight,
        position: "relative",
      }}
    >
      <div className={styles.title} style={{ color: colors.title }}>
        {/* titleText: تا 2 خط می‌پیچد و در انتها ... می‌گذارد */}
        <span className={styles.titleText} title={title}>
          {title}
        </span>

        <SpeedDial
          ariaLabel="note-actions"
          icon={<MoreHorizIcon sx={{ color: colors.title }} />}
          direction="left"
          open={open}
          onClick={() => setOpen((s) => !s)}
          FabProps={{
            "aria-label": "note-actions",
            sx: { background: "transparent !important", boxShadow: "none", width: 32, height: 32 },
          }}
          sx={{ position: "absolute", top: -5, right: 2, "& .MuiSpeedDial-actions": { gap: "2px" } }}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={action.onClick}
              sx={{
                background: "transparent !important",
                boxShadow: "none",
                width: 28,
                height: 28,
                minHeight: 28,
                margin: "0px",
                transform: "translateX(20px)",
                "&:hover": { background: "rgba(0,0,0,0.05)" },
                "& .MuiSpeedDialAction-fab": {
                  width: 28,
                  height: 28,
                  minHeight: 28,
                  background: "transparent !important",
                  boxShadow: "none",
                },
                "& .MuiSpeedDialAction-fab svg": { fontSize: 18 },
                "& .MuiSpeedDialAction-staticTooltipLabel": { fontSize: 10 },
              }}
            />
          ))}
        </SpeedDial>
      </div>

      <div className={styles.noteContent}>
        <div className={styles.tags}>
          {tags?.map((tag, i) => (
            <span key={i} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
        <div className={`${styles.content} ${styles.contentText}`}>{content}</div>
      </div>
    </div>
  );
}
