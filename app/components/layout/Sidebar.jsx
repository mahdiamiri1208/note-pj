"use client";

import Link from "next/link";
import styles from "./Sidebar.module.css";
import useAuth from "../../auth/useAuth";
import NotesIcon from "@mui/icons-material/Notes";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ScheduleIcon from "@mui/icons-material/Schedule";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import TopicIcon from "@mui/icons-material/Topic";
import AddIcon from "@mui/icons-material/Add";
import SettingsIcon from "@mui/icons-material/Settings";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const { user, isAuthenticated } = useAuth();

  const { theme } = useTheme();

  const isDark = theme === "dark";  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;


  return (
    <aside
      className={`${styles.sidebar} ${!isAuthenticated ? styles.disabled : ""}`}
      aria-label="Main sidebar"
    >
      {/* بالای سایدبار: عکس و نام و ایمیل */}
      <div className={styles.userBox}>
        <Image
          src={
            user?.avatar
              ? user.avatar
              : isDark
              ? "/dark-logo.png"
              : "/light-logo.png"
          }
          alt={user?.name || "logo"}
          width={95}
          height={70}
          priority
        />
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.name || "مهمان"}</div>
        </div>
      </div>

      {/* تیتر اصلی */}

      {/* منوی اصلی */}
      <nav className={styles.nav}>
        <div
          className="px-4 mb-1 text-sm"
          style={{ color: "#878787", fontSize: "14px" }}
        >
          Main
        </div>
        <ul>
          {/* ✅ All Notes فعال */}
          <li>
            <Link
              href="/notes"
              className={`${styles.link} ${styles.btnStyle507}`}
            >
              <NotesIcon className={styles.iconNotes} /> All Notes
            </Link>
          </li>

          {/* بخش در دست ساخت - کاملاً غیرفعال */}
          <div
            className="px-1 mb-1 text-sm"
            style={{ color: "#878787", fontSize: "14px" }}
          >
            Under development (soon)
          </div>

          <li>
            <span
              className={`${styles.link} ${styles.btnStyle507} ${styles.fullyDisabled}`}
              aria-disabled="true"
              role="button"
              tabIndex={-1}
            >
              <TopicIcon className={styles.iconTopic} /> Topics
            </span>
          </li>
          <li>
            <span
              className={`${styles.link} ${styles.btnStyle507} ${styles.fullyDisabled}`}
              aria-disabled="true"
              role="button"
              tabIndex={-1}
            >
              <FavoriteIcon className={styles.iconFavorite} /> Favorites
            </span>
          </li>
          <li>
            <span
              className={`${styles.link} ${styles.btnStyle507} ${styles.fullyDisabled}`}
              aria-disabled="true"
              role="button"
              tabIndex={-1}
            >
              <ScheduleIcon className={styles.iconRecent} /> Recent Notes
            </span>
          </li>
          <li>
            <span
              className={`${styles.link} ${styles.btnStyle507} ${styles.fullyDisabled}`}
              aria-disabled="true"
              role="button"
              tabIndex={-1}
            >
              <LocalOfferIcon className={styles.iconTags} /> Tags
            </span>
          </li>
        </ul>
      </nav>

      {/* بخش اضافی */}
      <div className={styles.extra}>
        <Link href="/notes/new" className={styles.cta}>
          <AddIcon /> Create Note
        </Link>

        <Link
          href="/setting"
          className={`${styles.link} ${styles.btnStyle507}`}
        >
          <SettingsIcon className={styles.iconSettings} /> Settings
        </Link>
      </div>
    </aside>
  );
}
