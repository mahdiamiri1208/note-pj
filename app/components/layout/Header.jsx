"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.css";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import SearchIcon from "@mui/icons-material/Search";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import PersonIcon from "@mui/icons-material/Person";
import { signOut } from "next-auth/react";
import { ThemeToggleButton } from "../theme-toggle-button";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const { theme, toggleTheme } = useTheme();

  const segments = (pathname || "/").split("/").filter(Boolean);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.replace("/");
  };

  return (
    <header className={styles.header}>
      <div className={styles.breadcrumb}>
        <button onClick={() => router.back()} className={styles.back}>
          <ArrowBackIosIcon sx={{ fontSize: 18 }} />
        </button>

        <span className={styles.path}>
          Home
          {segments.map((seg, i) => (
            <span key={i}> / {seg}</span>
          ))}
        </span>
      </div>

      <div className={styles.bottom}>
        <div className={styles.searchWrapper}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="text"
            className={styles.search}
            placeholder="Search your notes..."
          />
        </div>

        <div className={styles.actions} ref={profileRef}>
          <ThemeToggleButton
            start="top-right"
            onClick={toggleTheme}
            className={styles.iconDarkMode}
          >
            {theme === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </ThemeToggleButton>
          <button
            className={styles.iconPerson}
            onClick={() => setProfileOpen((p) => !p)}
          >
            <PersonIcon />
          </button>

          {profileOpen && (
            <div className={styles.profileMenu}>
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
