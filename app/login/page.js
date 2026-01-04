"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./login.module.css";
import SocialLogin from "./components/auth/SocialLogin";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ThemeToggleButton } from "../components/theme-toggle-button";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "@/context/ThemeContext";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const OTP_TTL = Number(process.env.NEXT_PUBLIC_OTP_TTL_SECONDS || 300);

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const { theme, toggleTheme } = useTheme();
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------- Load reCAPTCHA ---------------- */
  useEffect(() => {
    if (!SITE_KEY) {
      console.error("❌ NEXT_PUBLIC_RECAPTCHA_SITE_KEY is missing");
      return;
    }

    if (window.grecaptcha) {
      setRecaptchaReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "recaptcha-script";
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => setRecaptchaReady(true);
    document.body.appendChild(script);
  }, []);

  /* ---------------- Get reCAPTCHA Token ---------------- */
  const getRecaptchaToken = useCallback(async () => {
    if (!window.grecaptcha || !SITE_KEY) return null;

    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(SITE_KEY, { action: "login" })
          .then(resolve)
          .catch(reject);
      });
    });
  }, []);

  /* ---------------- OTP Timer ---------------- */
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const validateLoginForm = (email, password) => {
    if (!email.trim()) {
      toast.error("Email is required");
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!password.trim()) {
      toast.error("Password is required");
      return false;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }

    if (!EMAIL_REGEX.test(email)) {
      toast.error("Email must be a valid Latin email address");
      return false;
    }

    return true;
  };

  /* ---------------- Send OTP ---------------- */
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateLoginForm(email, password)) return;

    if (!recaptchaReady) {
      toast.error("Security check not ready. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const token = await getRecaptchaToken();
      if (!token) throw new Error();

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recaptchaToken: token }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to send verification code");
      } else {
        toast.success("Verification code sent successfully");
        setStep(2);
        setTimeLeft(OTP_TTL);
        setCanResend(false);
      }
    } catch {
      toast.error("Server or reCAPTCHA error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Verify OTP ---------------- */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        otp,
      });

      if (res?.error) {
        toast.error(res.error || "Wrong OTP");
        setError(res.error || "Wrong OTP");
      } else {
        toast.success("Login successful");
        router.push("/notes");
      }
    } catch (err) {
      console.error("signIn error:", err);
      toast.error("Server error");
      setError("Server error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Resend OTP ---------------- */
  const handleResendOtp = async () => {
    if (!canResend || !recaptchaReady) return;

    setLoading(true);
    setError("");

    try {
      const token = await getRecaptchaToken();
      if (!token) throw new Error("reCAPTCHA failed");

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recaptchaToken: token }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to resend OTP");
        setError(data.message || "Failed to resend OTP");
      } else {
        toast.success("New verification code sent");
        setTimeLeft(OTP_TTL);
        setCanResend(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("reCAPTCHA or server error");
      setError("reCAPTCHA or server error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.texts}>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Login to your account</p>
          </div>

          <ThemeToggleButton
            start="top-right"
            onClick={toggleTheme}
            className={styles.iconDarkMode}
          >
            {theme === "light" ? <DarkModeIcon /> : <LightModeIcon />}
          </ThemeToggleButton>
        </div>

        {step === 1 && (
          <form noValidate className={styles.form} onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className={styles.primaryBtn} disabled={loading}>
              {loading ? "Processing..." : "Login"}
            </button>

            {/* optional inline error (kept for accessibility) */}
            {error && <p className={styles.error}>{error}</p>}
          </form>
        )}

        {step === 2 && (
          <form noValidate className={styles.form} onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="6-digit code"
              className={styles.input}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <p className={styles.timer}>
              {timeLeft > 0
                ? `Expires in ${Math.floor(timeLeft / 60)}:${String(
                    timeLeft % 60
                  ).padStart(2, "0")}`
                : "Code expired"}
            </p>

            <button className={styles.primaryBtn} disabled={loading}>
              Verify OTP
            </button>

            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResendOtp}
              disabled={!canResend || loading}
            >
              Resend code
            </button>

            {error && <p className={styles.error}>{error}</p>}
          </form>
        )}

        {/* ---------------- SocialLogin ---------------- */}
        {step === 1 && (
          <>
            <Link href="/forgot-password" className={styles.forgot}>
              Forgot password?
            </Link>
            <div className={styles.divider}>
              <span>OR</span>
            </div>

            <SocialLogin />
          </>
        )}
      </div>
    </div>
  );
}
