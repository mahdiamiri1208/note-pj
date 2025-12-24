"use client";

import React, { useState } from "react";
import styles from "./forgotPassword.module.css";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1=email | 2=code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submitEmail = () => {
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);

    // 🔐 بعداً: ارسال ایمیل به سرور
    setTimeout(() => {
      setLoading(false);
      setStep(2);
    }, 1200);
  };

  const submitCode = () => {
    if (code.length !== 6) {
      setError("Verification code must be 6 digits");
      return;
    }

    setError("");
    setLoading(true);

    // 🔐 بعداً: اعتبارسنجی کد
    setTimeout(() => {
      setLoading(false);
      alert("Code verified ✅ (next: reset password)");
    }, 1200);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {step === 1 && (
          <>
            <h1 className={styles.title}>Forgot Password</h1>
            <p className={styles.subtitle}>
              Enter your email and we’ll send you a verification code
            </p>

            <input
              className={styles.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {error && <span className={styles.error}>{error}</span>}

            <button
              className={styles.btn}
              onClick={submitEmail}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Code"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className={styles.title}>Verify Code</h1>
            <p className={styles.subtitle}>
              We sent a 6-digit code to <b>{email}</b>
            </p>

            <input
              className={styles.input}
              type="text"
              placeholder="Enter verification code"
              value={code}
              maxLength={6}
              onChange={(e) => setCode(e.target.value)}
            />

            {error && <span className={styles.error}>{error}</span>}

            <button
              className={styles.btn}
              onClick={submitCode}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              className={styles.linkBtn}
              onClick={() => setStep(1)}
            >
              Change email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
