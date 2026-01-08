// app/register/page.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./register.module.css";
import SocialLogin from "../login/components/auth/SocialLogin";
import { useRouter } from "next/navigation";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { ThemeToggleButton } from "../components/theme-toggle-button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTheme } from "@/context/ThemeContext";
import Recaptcha from "../components/recaptcha/Recaptcha";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,}$/;

export default function RegisterPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaScore, setRecaptchaScore] = useState(0);
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "At least 8 characters",
    color: "#dc2626",
  });

  const handleRecaptchaVerify = (token, score) => {
    setRecaptchaToken(token);
    setRecaptchaScore(score);
    setIsRecaptchaVerified(!!token && score >= 0.4);

    if (score > 0) {
      const scorePercent = (score * 100).toFixed(1);
      let message = `Security score: ${scorePercent}% - `;

      if (score >= 0.8) message += "Excellent";
      else if (score >= 0.6) message += "Good";
      else if (score >= 0.4) message += "Fair";
      else message += "Poor";

      toast.info(message, {
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = useCallback((password) => {
    if (!password) {
      return { score: 0, message: "At least 8 characters", color: "#dc2626" };
    }

    let score = 0;
    const messages = [];

    if (password.length >= 8) score += 1;
    else messages.push("At least 8 characters");

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
    else messages.push("Lowercase & uppercase letters");

    if (/\d/.test(password)) score += 1;
    else messages.push("Include numbers");

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else messages.push("Special characters");

    const strengthConfig = [
      { score: 0, message: messages[0] || "Very weak", color: "#dc2626" },
      { score: 1, message: "Weak", color: "#ea580c" },
      { score: 2, message: "Medium", color: "#f59e0b" },
      { score: 3, message: "Strong", color: "#10b981" },
      { score: 4, message: "Very strong", color: "#059669" },
    ];

    return (
      strengthConfig.find((config) => score <= config.score) ||
      strengthConfig[4]
    );
  }, []);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(form.password));
  }, [form.password, calculatePasswordStrength]);

  // Fix scrolling issue
  useEffect(() => {
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "auto";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        if (session?.user) {
          toast.info("You're already logged in! Redirecting to dashboard...");
          setTimeout(() => router.push("/notes"), 1500);
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    };
    checkAuth();
  }, [router]);

  function onChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function validate() {
    const errors = [];

    // First name validation
    if (!form.firstName.trim()) {
      errors.push("First name is required");
    } else if (form.firstName.trim().length < 2) {
      errors.push("First name must be at least 2 characters");
    }

    // Last name validation
    if (!form.lastName.trim()) {
      errors.push("Last name is required");
    } else if (form.lastName.trim().length < 2) {
      errors.push("Last name must be at least 2 characters");
    }

    // Username validation
    if (!form.username.trim()) {
      errors.push("Username is required");
    } else if (!USERNAME_REGEX.test(form.username.trim())) {
      errors.push("Username must be at least 3 characters and can only contain letters, numbers, dots, hyphens, and underscores");
    }

    // Email validation
    if (!form.email.trim()) {
      errors.push("Email is required");
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      errors.push("Please enter a valid email address");
    }

    // Password validation
    if (!form.password) {
      errors.push("Password is required");
    } else if (form.password.length < 8) {
      errors.push("Password must be at least 8 characters");
    } else if (passwordStrength.score < 2) {
      errors.push("Password is too weak");
    }

    // Confirm password validation
    if (form.password !== form.confirmPassword) {
      errors.push("Passwords do not match");
    }

    // Show all errors
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return false;
    }

    // reCAPTCHA validation (skip in development)
    if (process.env.NODE_ENV !== "development" && !isRecaptchaVerified) {
      toast.error("Please complete the security verification");
      return false;
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          username: form.username.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          recaptchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || `Registration failed (${res.status})`);
        setLoading(false);
        return;
      }

      toast.success("Account created successfully — Please sign in");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      console.error("Register error:", err);
      toast.error("Server error, please try again later");
    } finally {
      setLoading(false);
    }
  }

  const PasswordRequirements = () => (
    <div className={styles.passwordRequirements}>
      <p className={styles.requirementsTitle}>Password requirements:</p>
      <ul className={styles.requirementsList}>
        <li
          className={form.password.length >= 8 ? styles.valid : styles.invalid}
        >
          {form.password.length >= 8 ? (
            <CheckCircleOutlineIcon fontSize="small" />
          ) : (
            <ErrorOutlineIcon fontSize="small" />
          )}
          At least 8 characters
        </li>
        <li
          className={
            /[a-z]/.test(form.password) && /[A-Z]/.test(form.password)
              ? styles.valid
              : styles.invalid
          }
        >
          {/[a-z]/.test(form.password) && /[A-Z]/.test(form.password) ? (
            <CheckCircleOutlineIcon fontSize="small" />
          ) : (
            <ErrorOutlineIcon fontSize="small" />
          )}
          Lowercase & uppercase letters
        </li>
        <li
          className={/\d/.test(form.password) ? styles.valid : styles.invalid}
        >
          {/\d/.test(form.password) ? (
            <CheckCircleOutlineIcon fontSize="small" />
          ) : (
            <ErrorOutlineIcon fontSize="small" />
          )}
          Include numbers
        </li>
        <li
          className={
            /[!@#$%^&*(),.?":{}|<>]/.test(form.password)
              ? styles.valid
              : styles.invalid
          }
        >
          {/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? (
            <CheckCircleOutlineIcon fontSize="small" />
          ) : (
            <ErrorOutlineIcon fontSize="small" />
          )}
          Special characters
        </li>
      </ul>
    </div>
  );

  return (
    <div className={styles.wrapper}>
      <ToastContainer position="top-right" />
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.texts}>
            <h1 className={styles.title}>Create Account</h1>
            <p className={styles.subtitle}>
              Register a new account to save your notes
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

        <div className={styles.sectionTitle}>
          <h2 className={styles.sectionTitleText}>Personal Information</h2>
        </div>

        <form noValidate className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.nameRow}>
            <div className={styles.inputGroup}>
              <input
                name="firstName"
                placeholder="First name"
                className={styles.input}
                value={form.firstName}
                onChange={onChange}
                autoComplete="given-name"
                aria-label="First name"
              />
            </div>
            <div className={styles.inputGroup}>
              <input
                name="lastName"
                placeholder="Last name"
                className={styles.input}
                value={form.lastName}
                onChange={onChange}
                autoComplete="family-name"
                aria-label="Last name"
              />
            </div>
          </div>

          <div className={styles.sectionTitle}>
            <h2 className={styles.sectionTitleText}>Account Credentials</h2>
          </div>

          <div className={styles.inputGroup}>
            <input
              name="username"
              placeholder="Username"
              className={styles.input}
              value={form.username}
              onChange={onChange}
              autoComplete="username"
              aria-label="Username"
            />
          </div>

          <div className={styles.inputGroup}>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              className={styles.input}
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              aria-label="Email address"
            />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className={styles.input}
                value={form.password}
                onChange={onChange}
                autoComplete="new-password"
                aria-label="Password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
              </button>
            </div>

            {form.password && (
              <div className={styles.strengthMeter}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${(passwordStrength.score / 4) * 100}%`,
                      backgroundColor: passwordStrength.color,
                    }}
                  />
                </div>
                <span
                  className={styles.strengthText}
                  style={{ color: passwordStrength.color }}
                >
                  Password strength: {passwordStrength.message}
                </span>
              </div>
            )}

            <PasswordRequirements />
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm password"
                className={styles.input}
                value={form.confirmPassword}
                onChange={onChange}
                autoComplete="new-password"
                aria-label="Confirm password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <VisibilityOffIcon />
                ) : (
                  <VisibilityIcon />
                )}
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className={styles.inputError}>
                <ErrorOutlineIcon fontSize="small" />
                Passwords do not match
              </p>
            )}
          </div>

          <Recaptcha onVerify={handleRecaptchaVerify} action="register" />

          <button
            className={`${styles.primaryBtn} ${loading ? styles.loading : ""}`}
            disabled={
              loading || passwordStrength.score < 2 || !isRecaptchaVerified
            }
            type="submit"
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>OR</span>
        </div>

        <SocialLogin />

        <p className={styles.loginBox}>
          Already have an account?{" "}
          <Link href="/login" className={styles.loginLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}