// components/Header/Header.jsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import styles from "./Header.module.css";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import SearchIcon from "@mui/icons-material/Search";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import PersonIcon from "@mui/icons-material/Person";
import { signOut } from "next-auth/react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

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
    try {
      // عدم redirect خودکار توسط next-auth تا بتوانیم router.replace کنیم
      await signOut({ redirect: false });
      // پاک‌سازی local/session storage در کلاینت (اختیاری)
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      router.replace("/");
    } catch (err) {
      console.error("Logout error:", err);
      router.replace("/");
    }
  };

  return (
    <header className={styles.header}>
      <div>
        <div className={styles.breadcrumb}>
          <button
            onClick={() => router.back()}
            className={styles.back}
            title="Go back"
          >
            <ArrowBackIosIcon sx={{ fontSize: 18 }} />
          </button>

          <span className={styles.path}>
            Home
            {segments.map((seg, i) => (
              <span key={i}> / {seg}</span>
            ))}
          </span>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <input
            type="text"
            className={styles.search}
            placeholder="Search your notes..."
          />
        </div>

        <div className={styles.actions} ref={profileRef}>
          <button className={styles.iconDarkMode} title="Toggle theme">
            <DarkModeIcon />
          </button>

          <button
            className={styles.iconPerson}
            title="Profile"
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
