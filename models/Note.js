// models/Note.js
import mongoose from "mongoose";

const NoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [255, "Title cannot exceed 255 characters"]
    },
    content: {
      type: String,
      required: [true, "Content is required"]
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    color: {
      type: String,
      enum: ["yellow", "green", "blue", "red", "gray"],
      default: "yellow"
    }
  },
  { timestamps: true }
);

const Note = mongoose.models.Note || mongoose.model("Note", NoteSchema);
export default Note;
