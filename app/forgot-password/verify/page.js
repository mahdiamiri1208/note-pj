"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import styles from "../forgotPassword.module.css";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { ThemeToggleButton } from "../../components/theme-toggle-button";
import { useTheme } from "@/context/ThemeContext";

/* ---------- Utils ---------- */
const maskEmail = (email) => {
  if (!email || !email.includes("@")) return email;

  const [name, domain] = email.split("@");

  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }

  return `${name.slice(0, 2)}***@${domain}`;
};

export default function VerifyOtpPage() {
  const search = useSearchParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const email = search.get("email") || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error(
        "Email is missing. Please restart the password recovery process.",
      );
      router.replace("/forgot-password");
    }
  }, [email, router]);

  const verify = async () => {
    if (code.length !== 6) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: code,
        }),
      });

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.error("NON-JSON RESPONSE:", text);
        throw new Error("Invalid server response");
      }

      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Invalid or expired verification code.",
        );
      }

      toast.success("Code verified successfully.");

      router.push(
        `/forgot-password/reset?email=${encodeURIComponent(
          email,
        )}&token=${encodeURIComponent(data.resetToken)}`,
      );
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to verify the code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.texts}>
            <h1 className={styles.title}>Verify Code</h1>
            <p className={styles.subtitle}>
              A 6-digit verification code has been sent to{" "}
              <b>{maskEmail(email)}</b>
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verify();
          }}
        >
          <input
            className={styles.input}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />

          <button
            type="submit"
            className={`${styles.primaryBtn} ${loading ? styles.loading : ""}`}
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Verifying...
              </>
            ) : (
              "Verify Code"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
