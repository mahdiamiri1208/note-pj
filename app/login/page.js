"use client";

import Link from "next/link";
import styles from "./login.module.css";
import SocialLogin from "./components/auth/SocialLogin";
import CaptchaBox from "./components/auth/CaptchaBox";

export default function LoginPage() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Login to your account</p>

        {/* فرم ورود */}
        <form className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            className={styles.input}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className={styles.input}
            required
          />

          {/* Captcha */}
          <CaptchaBox />

          <button type="submit" className={styles.primaryBtn}>
            Login
          </button>
        </form>

        {/* Forget password */}
        <Link href="/forgot-password" className={styles.forgot}>
          Forgot password?
        </Link>

        {/* Divider */}
        <div className={styles.divider}>
          <span>OR</span>
        </div>

        {/* Social Login */}
        <SocialLogin />

        {/* 🔹 Sign up link */}
        <div className={styles.signupBox}>
          <span>Don’t have an account?</span>
          <Link href="/register" className={styles.signupLink}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
