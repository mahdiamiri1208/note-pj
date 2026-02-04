"use client";

import Link from "next/link";
import styles from "./Sidebar.module.css";
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
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("Guest");

  useEffect(() => {
    setMounted(true);

    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.name) {
          setUserName(data.user.name);
        }
      })
      .catch(() => {});
  }, []);

  if (!mounted) return null;

  return (
    <aside
      className={`${styles.sidebar}`}
      aria-label="Main sidebar"
    >
      {/* بالای سایدبار */}
      <div className={styles.userBox}>
        <Image
          src={isDark ? "/dark-logo.png" : "/light-logo.png"}
          alt="logo"
          width={95}
          height={70}
          priority
        />
        <div className={styles.userInfo}>
          <div className={styles.userName}>{userName}</div>
        </div>
      </div>

      {/* منوی اصلی */}
      <nav className={styles.nav}>
        <div
          className="px-4 mb-1 text-sm"
          style={{ color: "#878787", fontSize: "14px" }}
        >
          Main
        </div>

        <ul>
          <li>
            <Link
              href="/notes"
              className={`${styles.link} ${styles.btnStyle507}`}
            >
              <NotesIcon className={styles.iconNotes} /> All Notes
            </Link>
          </li>

          <div
            className="px-1 mb-1 text-sm"
            style={{ color: "#878787", fontSize: "14px" }}
          >
            Under development (soon)
          </div>

          <li>
            <span
              className={`${styles.link} ${styles.btnStyle507} ${styles.fullyDisabled}`}
            >
              <TopicIcon className={styles.iconTopic} /> Topics
            </span>
          </li>

          <li>
            <span
              className={`${styles.link} ${styles.btnStyle507} ${styles.fullyDisabled}`}
            >
              <FavoriteIcon className={styles.iconFavorite} /> Favorites
            </span>
          </li>

          <li>
            <span
              className={`${styles.link} ${styles.btnStyle507} ${styles.fullyDisabled}`}
            >
              <ScheduleIcon className={styles.iconRecent} /> Recent Notes
            </span>
          </li>

          <li>
            <span
              className={`${styles.link} ${styles.btnStyle507} ${styles.fullyDisabled}`}
            >
              <LocalOfferIcon className={styles.iconTags} /> Tags
            </span>
          </li>
        </ul>
      </nav>

      {/* بخش پایینی */}
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