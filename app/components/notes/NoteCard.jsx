import React, { useState } from "react";
import styles from "./NoteCard.module.css";
import { generateNoteColors } from "../../utils/color";

import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function NoteCard({ title, content, tags, color, layout }) {
  const colors = generateNoteColors(color);

  const minHeight = layout === "list" ? "160px" : "240px";

  const [open, setOpen] = useState(false);

  const actions = [
    { icon: <EditIcon sx={{ color: "#2979ff" }} />, name: "Edit" },
    { icon: <DeleteIcon sx={{ color: "#d32f2f" }} />, name: "Delete" },
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
      {/* Title + 3-dot */}
      <div className={styles.title} style={{ color: colors.title }}>
        <span>{title}</span>

        <SpeedDial
          ariaLabel="note-actions"
          icon={<MoreHorizIcon sx={{ color: colors.title }} />}
          direction="left"
          open={open}
          onClick={() => setOpen(!open)}
          FabProps={{
            sx: {
              background: "transparent !important",
              boxShadow: "none",
              width: 32,
              height: 32,
              minHeight: 32,
              "&:hover": { background: "transparent" }, // هاور حذف شد
            },
          }}
          sx={{
            position: "absolute",
            top: 7,
            right: 7,
            "& .MuiSpeedDial-fab": {
              boxShadow: "none",
            },
            "& .MuiSpeedDial-actions": {
              gap: "2px", // فاصله بین اکشن‌ها
            },
          }}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
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
                "& .MuiSpeedDialAction-fab svg": {
                  fontSize: 18,
                },
                "& .MuiSpeedDialAction-staticTooltipLabel": {
                  fontSize: 10,
                },
              }}
            />
          ))}
        </SpeedDial>
      </div>

      {/* Body */}
      <div className={styles.noteContent}>
        <div className={styles.tags}>
          {tags?.map((tag, i) => (
            <span key={i} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        <div className={styles.content}>{content}</div>
      </div>
    </div>
  );
}
