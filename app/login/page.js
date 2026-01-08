// app/login/page.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./login.module.css";
import SocialLogin from "./components/auth/SocialLogin";
import { useRouter } from "next/navigation";
import { signIn, useSession, signOut } from "next-auth/react";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { ThemeToggleButton } from "../components/theme-toggle-button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "@/context/ThemeContext";

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const OTP_TTL = Number(process.env.NEXT_PUBLIC_OTP_TTL_SECONDS || 300);

function maskEmail(email = "") {
  if (!email.includes("@")) return email;
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const n = name.length;
  const maskedName =
    n <= 2
      ? name[0] + "*"
      : name[0] + "*".repeat(Math.max(1, n - 2)) + name.slice(-1);
  const [dom, tld] = domain.split(".");
  const maskedDom = dom
    ? dom[0] + "*" + (dom.length > 1 ? dom.slice(-1) : "")
    : domain;
  return `${maskedName}@${maskedDom}.${tld ?? ""}`;
}

function isEmail(input) {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return EMAIL_REGEX.test(input.trim());
}

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [mode, setMode] = useState("password"); // فقط دو حالت: "password" یا "otp"
  const [step, setStep] = useState(1); // 1 = وارد کردن شناسه، 2 = وارد کردن کد
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // بررسی session و هدایت اگر لاگین باشد
  useEffect(() => {
    if (status === "authenticated") {
      console.log("User is already logged in, redirecting to /notes");
      router.push("/notes");
    } else if (status === "unauthenticated") {
      setIsCheckingSession(false);
    }
  }, [status, router]);

  useEffect(() => {
    if (!SITE_KEY || status === "authenticated") {
      setRecaptchaReady(true);
      return;
    }

    if (window.grecaptcha) {
      setRecaptchaReady(true);
      return;
    }

    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    s.defer = true;
    s.onload = () => setRecaptchaReady(true);
    document.body.appendChild(s);

    return () => {
      if (document.body.contains(s)) {
        document.body.removeChild(s);
      }
    };
  }, [status]);

  const getRecaptchaToken = useCallback(async () => {
    if (!window.grecaptcha || !SITE_KEY || status === "authenticated")
      return null;
    return new Promise((resolve, reject) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(SITE_KEY, { action: "login" })
          .then(resolve)
          .catch(reject);
      });
    });
  }, [status]);

  // تایمر OTP
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0 || status === "authenticated") return;
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
  }, [step, timeLeft, status]);

  // نمایش توست
  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const showInfoToast = (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  // بررسی اعتبارسنجی فرم
  const validateForm = () => {
    if (status === "authenticated") return false;

    const trimmedIdentifier = identifier.trim();

    if (!trimmedIdentifier) {
      return false;
    }

    if (step === 1) {
      if (mode === "password") {
        return !!password && password.length >= 1;
      } else if (mode === "otp") {
        return isEmail(trimmedIdentifier);
      }
    } else if (step === 2) {
      return isEmail(trimmedIdentifier) && otp.length === 6;
    }

    return false;
  };

  const isButtonDisabled = () => {
    if (status === "authenticated") return true;
    if (loading) return true;
    if (isCheckingSession) return true;
    return !validateForm();
  };

  // ارسال OTP
  const sendOtp = async (emailToSend) => {
    if (status === "authenticated") {
      router.push("/notes");
      return false;
    }

    if (!recaptchaReady) {
      showErrorToast("Security system not ready. Please try again.");
      return false;
    }

    setLoading(true);
    try {
      const token = await getRecaptchaToken();
      if (!token) {
        showErrorToast("Security verification failed. Please try again.");
        return false;
      }

      showInfoToast("Sending verification code...");

      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToSend,
          recaptchaToken: token,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showErrorToast(data.message || "Failed to send verification code");
        return false;
      }

      showSuccessToast(`Verification code sent to ${maskEmail(emailToSend)}`);
      setStep(2);
      setTimeLeft(OTP_TTL);
      setCanResend(false);
      return true;
    } catch (err) {
      console.error("Error sending OTP:", err);
      showErrorToast("Server error. Please try again later.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ورود با رمز عبور
  const handlePasswordLogin = async (e) => {
    e.preventDefault();

    if (status === "authenticated") {
      router.push("/notes");
      return;
    }

    const id = identifier.trim();
    if (!id) {
      showErrorToast("Please enter username or email");
      return;
    }

    if (!password) {
      showErrorToast("Please enter password");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("password", {
        redirect: false,
        identifier: id,
        password: password,
      });

      if (result?.error) {
        showErrorToast("Invalid username/email or password");

        // اگر ایمیل بود، پیشنهاد OTP بده
        if (isEmail(id)) {
          showInfoToast("You can also try logging in with a verification code");
        }
      } else if (result?.ok) {
        showSuccessToast("Login successful! Redirecting...");
        setTimeout(() => {
          router.push("/notes");
        }, 1500);
      } else {
        showErrorToast("Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      showErrorToast("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // ورود با OTP
  const handleOtpLogin = async (e) => {
    e.preventDefault();

    if (status === "authenticated") {
      router.push("/notes");
      return;
    }

    const email = identifier.trim();
    if (!email || !isEmail(email)) {
      showErrorToast("Please enter a valid email address");
      return;
    }

    if (step === 1) {
      // مرحله اول: ارسال OTP
      await sendOtp(email);
    } else {
      // مرحله دوم: تأیید OTP
      if (!otp.trim()) {
        showErrorToast("Please enter verification code");
        return;
      }

      if (otp.length !== 6) {
        showErrorToast("Please enter a valid 6-digit code");
        return;
      }

      setLoading(true);

      try {
        const result = await signIn("otp", {
          redirect: false,
          email: email,
          otp: otp.trim(),
        });

        if (result?.error) {
          showErrorToast("Invalid or expired verification code");
        } else if (result?.ok) {
          showSuccessToast("Verification successful! Redirecting...");
          setTimeout(() => {
            router.push("/notes");
          }, 1500);
        } else {
          showErrorToast("Verification failed. Please try again.");
        }
      } catch (err) {
        console.error("OTP verification error:", err);
        showErrorToast("Server error. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
  };

  // ارسال مجدد OTP
  const handleResend = async () => {
    if (status === "authenticated") {
      router.push("/notes");
      return;
    }

    if (!canResend) {
      showInfoToast("Please wait before resending");
      return;
    }

    const email = identifier.trim();
    if (!email) return;

    await sendOtp(email);
  };

  // تغییر حالت
  const handleModeChange = (newMode) => {
    if (status === "authenticated") {
      router.push("/notes");
      return;
    }

    setMode(newMode);
    setStep(1);
    setOtp("");
    setTimeLeft(0);
    setCanResend(false);
  };

  // برگشت به مرحله اول
  const handleBack = () => {
    if (status === "authenticated") {
      router.push("/notes");
      return;
    }

    setStep(1);
    setOtp("");
    setTimeLeft(0);
    setCanResend(false);
  };

  // نمایش ایمیل ماسک شده
  const maskedEmail = maskEmail(identifier);

  // تعیین متن دکمه
  const getButtonText = () => {
    if (status === "authenticated") {
      return "Already logged in";
    }

    if (loading) {
      if (step === 2) {
        return "Verifying...";
      }
      return "Processing...";
    }

    if (step === 1) {
      if (mode === "otp") {
        return "Send verification code";
      }
      return "Login";
    } else {
      return "Verify and login";
    }
  };

  // اگر در حال بررسی session هستیم
  if (status === "loading" || isCheckingSession) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>Checking session...</h1>
          </div>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // اگر کاربر لاگین است
  if (status === "authenticated") {
    return (
      <div className={styles.wrapper}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={theme}
          style={{ marginTop: "60px" }}
        />

        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.texts}>
              <h1 className={styles.title}>Already Logged In</h1>
              <p className={styles.subtitle}>
                You are already logged in to your account
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

          <div className={styles.alreadyLoggedIn}>
            <p>You are already logged in. Redirecting to your notes...</p>
            <button
              className={styles.logoutBtn}
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Logout
            </button>
            <button
              className={styles.notesBtn}
              onClick={() => router.push("/notes")}
            >
              Go to Notes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
        style={{ marginTop: "60px" }}
      />

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

        {step === 1 ? (
          <form
            noValidate
            className={styles.form}
            onSubmit={
              mode === "password" ? handlePasswordLogin : handleOtpLogin
            }
          >
            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Username or email"
                className={styles.input}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                aria-label="Username or email"
                disabled={loading || isCheckingSession}
              />
            </div>

            {/* نمایش گزینه‌ها فقط برای ایمیل */}
            {isEmail(identifier) && (
              <div className={styles.modeSelector}>
                <div className={styles.radioGroup}>
                  <label
                    className={`${styles.radioLabel} ${
                      mode === "password" ? styles.radioLabelActive : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="loginMode"
                      checked={mode === "password"}
                      onChange={() => handleModeChange("password")}
                      className={styles.radioInput}
                      disabled={loading || isCheckingSession}
                    />
                    <span className={styles.radioText}>
                      Login with password
                    </span>
                  </label>

                  <label
                    className={`${styles.radioLabel} ${
                      mode === "otp" ? styles.radioLabelActive : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="loginMode"
                      checked={mode === "otp"}
                      onChange={() => handleModeChange("otp")}
                      className={styles.radioInput}
                      disabled={loading || isCheckingSession}
                    />
                    <span className={styles.radioText}>
                      Login with verification code
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* نمایش رمز عبور فقط در حالت password */}
            {mode === "password" && (
              <div className={styles.inputGroup}>
                <input
                  type="password"
                  placeholder="Password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-label="Password"
                  disabled={loading || isCheckingSession}
                />
              </div>
            )}

            <button
              type="submit"
              className={`${styles.primaryBtn} ${
                loading ? styles.loading : ""
              }`}
              disabled={isButtonDisabled()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  {getButtonText()}
                </>
              ) : (
                getButtonText()
              )}
            </button>
          </form>
        ) : (
          <form noValidate className={styles.form} onSubmit={handleOtpLogin}>
            <div className={styles.otpHeader}>
              <p className={styles.otpMessage}>
                Verification code sent to <strong>{maskedEmail}</strong>
              </p>
              <button
                type="button"
                onClick={handleBack}
                className={styles.changeEmailBtn}
                disabled={loading || isCheckingSession}
              >
                Change email
              </button>
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="6-digit code"
                className={styles.input}
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 6) setOtp(value);
                }}
                aria-label="Verification code"
                maxLength={6}
                dir="ltr"
                disabled={loading || isCheckingSession}
              />
            </div>

            <div className={styles.timerContainer}>
              {timeLeft > 0 ? (
                <p className={styles.timer}>
                  <span className={styles.timerIcon}>⏳</span>
                  Code valid for {Math.floor(timeLeft / 60)}:
                  {String(timeLeft % 60).padStart(2, "0")}
                </p>
              ) : (
                <p className={styles.timerExpired}>
                  <span className={styles.expiredIcon}>⌛</span>
                  Code expired
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`${styles.primaryBtn} ${
                loading ? styles.loading : ""
              }`}
              disabled={isButtonDisabled()}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  {getButtonText()}
                </>
              ) : (
                getButtonText()
              )}
            </button>

            <button
              type="button"
              className={styles.resendBtn}
              onClick={handleResend}
              disabled={!canResend || loading || isCheckingSession}
            >
              {canResend ? "Resend code" : "Wait to resend"}
            </button>
          </form>
        )}

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

        <p className={styles.registerBox}>
          Don't have an account?{" "}
          <Link href="/register" className={styles.registerLink}>
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}