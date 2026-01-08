"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MainContent from "../components/layout/MainContent";
import styles from "./layout.module.css";

// اگر toast داری استفاده کن، اگر نه می‌تونی حذفش کنی
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ProtectedLayout({ children }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const warnedRef = useRef(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!session?.expiresAt) return;

    const checkExpiration = () => {
      const now = Date.now();
      const timeLeft = session.expiresAt - now;

      // هشدار ۳۰ ثانیه قبل از اکسپایر (فقط یک بار)
      if (timeLeft <= 30_000 && timeLeft > 0 && !warnedRef.current) {
        warnedRef.current = true;
        toast.warning("Session is about to expire", {
          position: "top-right",
          autoClose: 5000,
        });
      }

      // اکسپایر شد → خروج + ریدایرکت
      if (timeLeft <= 0) {
        clearInterval(intervalRef.current);

        signOut({
          redirect: true,
          callbackUrl: `/login?expired=1&returnTo=${encodeURIComponent(
            pathname || "/"
          )}`,
        });
      }
    };

    // اولین اجرا
    checkExpiration();

    // هر ۱ ثانیه چک شود
    intervalRef.current = setInterval(checkExpiration, 1000);

    return () => clearInterval(intervalRef.current);
  }, [session, pathname]);

  // هنگام لود شدن سشن
  if (status === "loading") {
    return (
      <>
        <ToastContainer />
        <div style={{ padding: 24 }}>Checking session...</div>
      </>
    );
  }

  return (
    <>
      <ToastContainer />

      <div className={styles.main}>
        <div className={styles.appWrapper}>
          <Sidebar />
          <div className={styles.contentArea}>
            <Header />
            <MainContent>{children}</MainContent>
          </div>
        </div>
      </div>
    </>
  );
}
