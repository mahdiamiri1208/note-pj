import mongoose from "mongoose";

const ColorSchema = new mongoose.Schema({
  id: { type: String, required: true },
  bg: String,
  title: String,
  border: String,
});

export default mongoose.models.Color || mongoose.model("Color", ColorSchema);
