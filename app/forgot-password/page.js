// app/forgot-password/page.js
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { ThemeToggleButton } from "../components/theme-toggle-button";
import styles from "./forgotPassword.module.css";
import { useTheme } from "@/context/ThemeContext";


export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const sendOtp = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp-forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      // 🔥 business errors
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("No account found with this email");
          return;
        }

        toast.error(data?.message || "Failed to send OTP");
        return;
      }

      toast.success("OTP sent to your email");
      router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error(err);
      toast.error("Network or server error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.texts}>
            <h1 className={styles.title}>Forgot Password</h1>
            <p className={styles.subtitle}>
              Enter your email and we'll send a verification code
            </p>
          </div>
          <ThemeToggleButton
            start="top-right"
            onClick={toggleTheme}
            className={styles.iconDarkMode}
          >
            {theme === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </ThemeToggleButton>
        </div>

        <input
          className={styles.input}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button className={styles.btn} onClick={sendOtp} disabled={loading}>
          {loading ? "Sending..." : "Send Code"}
        </button>
      </div>
    </div>
  );
}
