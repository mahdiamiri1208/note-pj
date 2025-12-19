// components/layout/Sidebar.jsx
"use client";

import Link from "next/link";
import styles from "./Sidebar.module.css";
import useAuth from "../../auth/useAuth"; // نمونه: بعدا به auth واقعی وصل کن
import NotesIcon from "@mui/icons-material/Notes";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ScheduleIcon from "@mui/icons-material/Schedule";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import TopicIcon from "@mui/icons-material/Topic";
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';

export default function Sidebar() {
  const { user, isAuthenticated } = useAuth();

  return (
    <aside
      className={`${styles.sidebar} ${!isAuthenticated ? styles.disabled : ""}`}
      aria-label="Main sidebar"
    >
      {/* بالای سایدبار: عکس و نام و ایمیل */}
      <div className={styles.userBox}>
        <img
          src={user?.avatar || "/avatar.png"}
          alt={user?.name || "Guest avatar"}
          className={styles.avatar}
        />
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.name || "مهمان"}</div>
        </div>
      </div>

      {/* منوی اصلی */}
      <nav className={styles.nav}>
        <ul>
          <li>
            <Link href="/notes" className={`${styles.link} ${styles.btnStyle507}`}>
              <NotesIcon className={styles.iconNotes} /> All Notes
            </Link>
          </li>
          <li>
            <Link href="/topic" className={`${styles.link} ${styles.btnStyle507}`}>
              <TopicIcon className={styles.iconTopic} /> Topics
            </Link>
          </li>
          <li>
            <Link href="/notes?filter=favorites" className={`${styles.link} ${styles.btnStyle507}`}>
              <FavoriteIcon className={styles.iconFavorite} /> Favorites
            </Link>
          </li>

          <li>
            <Link href="/notes?filter=recent" className={`${styles.link} ${styles.btnStyle507}`}>
              <ScheduleIcon className={styles.iconRecent} /> Recent Notes
            </Link>
          </li>

          <li>
            <Link href="/tags" className={`${styles.link} ${styles.btnStyle507}`}>
              <LocalOfferIcon className={styles.iconTags} /> Tags
            </Link>
          </li>
        </ul>
      </nav>

      {/* بخش اضافی */}
      <div className={styles.extra}>
        <Link href="/notes/new" className={styles.cta}>
          <AddIcon /> Create Note
        </Link>

        <Link href="/settings" className={`${styles.link} ${styles.btnStyle507}`}>
          <SettingsIcon className={styles.iconSettings}/> Settings
        </Link>
      </div>
    </aside>
  );
}
