// app/page.jsx
"use client";

import React from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function LandingPage() {
  return (
    <div className={styles.landingWrapper}>
      {/* پس‌زمینه‌ی بلور شده از طریق ::before */}
      <div className={styles.glassCard}>
        <h1 className={styles.title}>Welcome to Notebook App</h1>
        <p className={styles.subtitle}>Keep your notes organized and accessible</p>

        <div className={styles.actions}>
          <Link href="/login" className={styles.btn}>
            Login
          </Link>

          <Link href="/register" className={styles.btnOutline}>
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
