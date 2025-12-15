// components/layout/Sidebar.jsx
"use client";

import Link from "next/link";
import styles from "./Sidebar.module.css";
import ThemeToggle from "../ui/ThemeToggle";
import useAuth from "../../auth/useAuth"; // نمونه: بعدا به auth واقعی وصل کن

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
            <Link href="/notes" className={styles.link}>
              🗒️ All Notes
            </Link>
          </li>
          <li>
            <Link href="/notes?filter=favorites" className={styles.link}>
              ⭐ Favorites
            </Link>
          </li>
          <li>
            <Link href="/notes?filter=recent" className={styles.link}>
              🕘 Recent Notes
            </Link>
          </li>
          <li>
            <Link href="/tags" className={styles.link}>
              🏷️ Tags
            </Link>
          </li>
        </ul>
      </nav>

      {/* بخش اضافی */}
      <div className={styles.extra}>
        <Link href="/notes/new" className={styles.cta}>
          + Create Note
        </Link>

        <Link href="/settings" className={styles.link}>
          ⚙️ Settings
        </Link>
      </div>
    </aside>
  );
}
