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
import { useEffect, useRef, useState } from "react";

export default function Sidebar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("Guest");

  // refs برای نگهداری مقادیر بین رندرها
  const lastNameRef = useRef(null);
  const bcRef = useRef(null);
  const abortRef = useRef(null);
  const pollTimerRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    let mountedLocal = true;

    // helper: fetch profile from API
    const fetchProfile = async () => {
      try {
        // abort قبلی
        if (abortRef.current) {
          try { abortRef.current.abort(); } catch {}
        }
        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch("/api/settings/profile", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          // console.warn("sidebar: profile fetch not ok", res.status);
          return;
        }

        const data = await res.json();
        const name = data?.user?.firstName
          ? `${data.user.firstName} ${data.user.lastName || ""}`.trim()
          : data?.user?.name || "Guest";

        // update only on real change
        if (mountedLocal && name !== lastNameRef.current) {
          lastNameRef.current = name;
          setUserName(name || "Guest");
        }
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    };

    fetchProfile();

    try {
      const bc = new BroadcastChannel("profile-updates");
      bcRef.current = bc;
      bc.onmessage = (ev) => {
        try {
          const payload = ev?.data;
          if (!payload) return;
          const name = payload.name || payload.fullName || payload.displayName;
          if (name && name !== lastNameRef.current) {
            lastNameRef.current = name;
            setUserName(name);
          } else if (payload.refresh) {
            // اگر پیام refresh خواست، دوباره fetch کن
            fetchProfile();
          }
        } catch (e) {
          // ignore
        }
      };
    } catch (e) {
      // BroadcastChannel ممکنه در بعضی محیط‌ها در دسترس نباشه — نادیده بگیر
    }

    // 3) storage event listener (localStorage) — cross-tab
    const onStorage = (e) => {
      try {
        if (e.key === "profile-updated") {
          const val = e.newValue;
          if (!val) return;
          const obj = JSON.parse(val);
          const name = obj?.name || obj?.fullName;
          if (name && name !== lastNameRef.current) {
            lastNameRef.current = name;
            setUserName(name);
          } else if (obj?.refresh) {
            fetchProfile();
          }
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener("storage", onStorage);

    const startPolling = () => {
      pollTimerRef.current = setInterval(() => {
        fetchProfile();
      }, 2000);
    };
    startPolling();

    return () => {
      mountedLocal = false;
      // cleanup
      if (bcRef.current) {
        try { bcRef.current.close(); } catch {}
      }
      window.removeEventListener("storage", onStorage);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (abortRef.current) {
        try { abortRef.current.abort(); } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <aside className={`${styles.sidebar}`} aria-label="Main sidebar">
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

        <Link href="/setting" className={`${styles.link} ${styles.btnStyle507}`}>
          <SettingsIcon className={styles.iconSettings} /> Settings
        </Link>
      </div>
    </aside>
  );
}
