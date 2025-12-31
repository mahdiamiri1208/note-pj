"use client";

import { useCallback } from "react";

export function ThemeToggleButton({
  start = "top-right",
  onClick,
  children,
  className = "",
}) {
  const handleClick = useCallback(() => {
    const styleId = `theme-transition-${Date.now()}`;
    const style = document.createElement("style");

    const cx =
      start === "center" ? "50" : start.includes("left") ? "0" : "100";
    const cy =
      start === "center" ? "50" : start.includes("top") ? "0" : "100";

    style.textContent = `
      @supports (view-transition-name: root) {
        ::view-transition-old(root) {
          animation: none;
        }
        ::view-transition-new(root) {
          animation: circle-blur-expand 0.5s ease-out;
        }
        @keyframes circle-blur-expand {
          from {
            clip-path: circle(0% at ${cx}% ${cy}%);
            filter: blur(6px);
          }
          to {
            clip-path: circle(150% at ${cx}% ${cy}%);
            filter: blur(0);
          }
        }
      }
    `;

    document.head.appendChild(style);

    setTimeout(() => style.remove(), 700);

    onClick?.();
  }, [onClick, start]);

  return (
    <button
      onClick={handleClick}
      className={className}
      aria-label="Toggle theme"
    >
      {children}
    </button>
  );
}
