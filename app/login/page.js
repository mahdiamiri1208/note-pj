"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./login.module.css";
import SocialLogin from "./components/auth/SocialLogin";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const OTP_TTL = Number(process.env.NEXT_PUBLIC_OTP_TTL_SECONDS || 300);

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");

  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);

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

  /* ---------------- Send OTP ---------------- */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill email and password");
      return;
    }

    if (!recaptchaReady) {
      setError("reCAPTCHA not ready");
      return;
    }

    setLoading(true);

    try {
      const token = await getRecaptchaToken();
      if (!token) throw new Error("reCAPTCHA failed");

      setRecaptchaToken(token);

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recaptchaToken: token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send OTP");
      } else {
        setStep(2);
        setTimeLeft(OTP_TTL);
        setCanResend(false);
      }
    } catch (err) {
      console.error(err);
      setError("reCAPTCHA or server error");
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
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!data.ok) {
        setError(data.message || "Wrong OTP");
      } else {
        window.location.href = "/protected";
      }
    } catch {
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
        setError(data.message || "Failed to resend OTP");
      } else {
        setTimeLeft(OTP_TTL);
        setCanResend(false);
      }
    } catch {
      setError("reCAPTCHA or server error");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Login to your account</p>

        {step === 1 && (
          <form className={styles.form} onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className={styles.primaryBtn} disabled={loading}>
              {loading ? "Processing..." : "Login"}
            </button>

            {error && <p className={styles.error}>{error}</p>}
          </form>
        )}

        {step === 2 && (
          <form className={styles.form} onSubmit={handleVerifyOtp}>
            <input
              type="text"
              placeholder="6-digit code"
              className={styles.input}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
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
