const colorMap = {
  yellow: { bg: "#fff9e6", title: "#f8d302ff", border: "#fff2b373" },
  green:  { bg: "#e6f7e6", title: "#03c103ff", border: "#b3e6b373" },
  blue:   { bg: "#e6f0ff", title: "#1a8bfcff", border: "#b3d1ff72" },
  red:    { bg: "#ffe6e6", title: "#ff3a3aff", border: "#ffb3b36b" },
  gray:   { bg: "#f0f0f0", title: "#8a8a8aff", border: "#d9d9d960" },
};

export function generateNoteColors(colorName) {
  return colorMap[colorName] || colorMap.gray;
}