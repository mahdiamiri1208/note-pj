"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import styles from "../forgotPassword.module.css";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { ThemeToggleButton } from "../../components/theme-toggle-button";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useTheme } from "@/context/ThemeContext";

export default function ResetPasswordPage() {
  const search = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const email = search.get("email") || "";
  const resetToken = search.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email || !resetToken) {
      toast.error("Invalid or expired password reset link.");
      router.replace("/forgot-password");
    }
  }, [email, resetToken, router]);

  const submit = async () => {
    if (!password || !confirmPassword) {
      toast.error("Please enter and confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          newPassword: password,
          resetToken,
        }),
      });

      const text = await res.text(); // ⬅️ مهم

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("NON-JSON RESPONSE:", text);
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to reset password.",
        );
      }

      toast.success(
        "Your password has been reset successfully. You can now log in.",
      );
      router.push("/login");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.texts}>
            <h1 className={styles.title}>Reset Password</h1>
            <p className={styles.subtitle}>
              Create a new password for <b>{email}</b>
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

        {/* New password */}
        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            className={`${styles.input} ${styles.passwordInput}`}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </button>
        </div>

        {/* Confirm password */}
        <div className={styles.passwordWrapper}>
          <input
            type={showPassword ? "text" : "password"}
            className={`${styles.input} ${styles.passwordInput}`}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button className={styles.btn} onClick={submit} disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </div>
  );
}
