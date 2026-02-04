"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MainContent from "../components/layout/MainContent";
import styles from "./layout.module.css";

import { toast } from "react-toastify";

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

      if (timeLeft <= 30_000 && timeLeft > 0 && !warnedRef.current) {
        warnedRef.current = true;
        toast.warning("Session is about to expire", {
          position: "top-right",
          autoClose: 15000,
        });
      }

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

    checkExpiration();
    intervalRef.current = setInterval(checkExpiration, 1000);

    return () => clearInterval(intervalRef.current);
  }, [session, pathname]);

  if (status === "loading") {
    return <div style={{ padding: 24 }}>Checking session...</div>;
  }

  return (
    <div className={styles.main}>
      <div className={styles.appWrapper}>
        <Sidebar />
        <div className={styles.contentArea}>
          <Header />
          <MainContent>{children}</MainContent>
        </div>
      </div>
    </div>
  );
}
