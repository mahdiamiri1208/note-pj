"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./settings.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditIcon from "@mui/icons-material/Edit";

/* --- Validation helpers --- */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

function validateFirstName(v) {
  const t = (v || "").trim();
  if (!t) return { ok: false, msg: "First name is required" };
  if (t.length < 2)
    return { ok: false, msg: "First name must be at least 2 characters" };
  if (t.length > 50)
    return { ok: false, msg: "First name cannot exceed 50 characters" };
  return { ok: true };
}

function validateLastName(v) {
  const t = (v || "").trim();
  if (!t) return { ok: false, msg: "Last name is required" };
  if (t.length < 2)
    return { ok: false, msg: "Last name must be at least 2 characters" };
  if (t.length > 50)
    return { ok: false, msg: "Last name cannot exceed 50 characters" };
  return { ok: true };
}

function validateUsernameField(v) {
  const t = (v || "").trim();
  if (!t) return { ok: false, msg: "Username is required" };
  if (t.length < 3)
    return { ok: false, msg: "Username must be at least 3 characters" };
  if (t.length > 30)
    return { ok: false, msg: "Username cannot exceed 30 characters" };
  if (!USERNAME_REGEX.test(t))
    return {
      ok: false,
      msg: "Username can contain letters, numbers, dots, hyphens and underscores",
    };
  if (/[\u0600-\u06FF]/.test(t))
    return { ok: false, msg: "Username cannot contain Persian characters" };
  if (!/[a-zA-Z]/.test(t))
    return { ok: false, msg: "Username must contain at least one letter" };
  return { ok: true };
}

function validateEmailField(v) {
  const t = (v || "").trim();
  if (!t) return { ok: false, msg: "Email is required" };
  if (!EMAIL_REGEX.test(t))
    return { ok: false, msg: "Please enter a valid email address" };
  return { ok: true };
}

/* --- Component --- */
export default function SettingsPage() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
  });
  const [originalForm, setOriginalForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
  });
  const [editable, setEditable] = useState({
    firstName: false,
    lastName: false,
    username: false,
    email: false,
  });
  const [errors, setErrors] = useState({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [saving, setSaving] = useState(false);
  const usernameCheckAbortRef = useRef();

  /* --- Load profile --- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/settings/profile");
        const contentType = res.headers.get("content-type") || "";
        let data;
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || "Failed to load profile");
        }

        if (!res.ok) throw new Error(data?.message || "Failed to load profile");
        if (!mounted) return;

        const u = data.user || {};
        const shaped = {
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          username: u.username || "",
          email: u.email || "",
        };
        setForm(shaped);
        setOriginalForm(shaped);
        toast.success("Profile loaded successfully");
      } catch (err) {
        console.error("load profile error:", err);
        toast.error(err.message || "Failed to load profile");
      }
    })();

    return () => {
      mounted = false;
      if (usernameCheckAbortRef.current) usernameCheckAbortRef.current.abort();
    };
  }, []);

  /* --- Username availability check --- */
  useEffect(() => {
    if (!form.username || form.username === originalForm.username) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }
    const v = validateUsernameField(form.username);
    if (!v.ok) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    setUsernameAvailable(null);

    const t = setTimeout(async () => {
      try {
        if (usernameCheckAbortRef.current) {
          try {
            usernameCheckAbortRef.current.abort();
          } catch {}
        }
        const controller = new AbortController();
        usernameCheckAbortRef.current = controller;

        const res = await fetch(
          `/api/users/check-username?username=${encodeURIComponent(form.username)}`,
          { signal: controller.signal },
        );
        const contentType = res.headers.get("content-type") || "";
        let data;
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          const text = await res.text();
          console.error("username check response not JSON:", text);
          data = { available: null };
        }

        const isAvailable = Boolean(data.available);
        setUsernameAvailable(isAvailable);

        if (isAvailable) {
          toast.success("Username is available");
        } else {
          toast.error("Username is already taken");
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("username check error:", err);
        setUsernameAvailable(null);
        toast.error("Failed to check username availability");
      } finally {
        setCheckingUsername(false);
      }
    }, 500);

    return () => {
      clearTimeout(t);
      if (usernameCheckAbortRef.current) {
        try {
          usernameCheckAbortRef.current.abort();
        } catch {}
      }
    };
  }, [form.username]);

  /* --- Field validation --- */
  const validateFieldOnBlur = (key) => {
    let v;
    if (key === "firstName") v = validateFirstName(form.firstName);
    else if (key === "lastName") v = validateLastName(form.lastName);
    else if (key === "username") v = validateUsernameField(form.username);
    else if (key === "email") v = validateEmailField(form.email);
    else v = { ok: true };

    setErrors((prev) => ({ ...prev, [key]: v.ok ? "" : v.msg }));

    if (!v.ok) {
      toast.error(v.msg);
    }

    return v.ok;
  };

  const validateAll = () => {
    const e = {};
    const errorMessages = [];

    const v1 = validateFirstName(form.firstName);
    if (!v1.ok) {
      e.firstName = v1.msg;
      errorMessages.push(v1.msg);
    }

    const v2 = validateLastName(form.lastName);
    if (!v2.ok) {
      e.lastName = v2.msg;
      errorMessages.push(v2.msg);
    }

    const v3 = validateUsernameField(form.username);
    if (!v3.ok) {
      e.username = v3.msg;
      errorMessages.push(v3.msg);
    }

    const v4 = validateEmailField(form.email);
    if (!v4.ok) {
      e.email = v4.msg;
      errorMessages.push(v4.msg);
    }

    if (
      form.username !== originalForm.username &&
      usernameAvailable === false
    ) {
      e.username = "Username already exists";
      errorMessages.push("Username already exists");
    }

    setErrors(e);

    if (errorMessages.length > 0) {
      if (errorMessages.length === 1) {
        toast.error(errorMessages[0]);
      } else {
        toast.error(`Please fix ${errorMessages.length} validation errors`);
      }
    }

    return Object.keys(e).length === 0;
  };

  /* --- Save profile --- */
  const handleSave = async () => {
    if (!hasChanges) {
      toast.info("No changes to save");
      return;
    }

    if (!validateAll()) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          username: form.username.trim().toLowerCase(),
          email: form.email.trim().toLowerCase(),
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || "Server returned invalid response");
      }

      if (!res.ok) throw new Error(data?.message || "Failed to update profile");

      toast.success("Profile updated successfully");
      const returned = data.user || {};
      const shaped = {
        firstName: returned.firstName || "",
        lastName: returned.lastName || "",
        username: returned.username || "",
        email: returned.email || "",
      };
      setForm(shaped);
      setOriginalForm(shaped);
      setEditable({
        firstName: false,
        lastName: false,
        username: false,
        email: false,
      });
      setErrors({});
      setUsernameAvailable(null);
    } catch (err) {
      console.error("save profile error:", err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  /* --- Input handlers --- */
  const handleInputChange = (key, value) => {
    const val = key === "username" ? value.toLowerCase() : value;
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    if (key === "username") setUsernameAvailable(null);
  };

  const toggleEditable = (key) => {
    setEditable((p) => ({ ...p, [key]: !p[key] }));
    if (!editable[key]) {
      toast.info(`Now editing ${key.replace(/([A-Z])/g, " $1").toLowerCase()}`);
    }
  };

  const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm);
  const hasErrors = Object.values(errors).some((v) => v && v.length > 0);
  const canSave =
    hasChanges && !saving && !hasErrors && usernameAvailable !== false;

  /* --- Render --- */
  return (
    <div className={styles.wrapper}>
      <div className={styles.form}>
        <h4 className={styles.heading}>Account Settings</h4>

        {/* First Name */}
        <label className={styles.label}>
          First Name
          <div className={styles.inputWrapper}>
            <input
              className={`${styles.input} ${errors.firstName ? styles.inputError : ""}`}
              value={form.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              onBlur={() => validateFieldOnBlur("firstName")}
              placeholder="Enter your first name"
              readOnly={!editable.firstName}
            />
            <EditIcon
              className={styles.editIcon}
              onClick={() => toggleEditable("firstName")}
            />
          </div>
          {errors.firstName && (
            <span className={styles.error}>{errors.firstName}</span>
          )}
        </label>

        {/* Last Name */}
        <label className={styles.label}>
          Last Name
          <div className={styles.inputWrapper}>
            <input
              className={`${styles.input} ${errors.lastName ? styles.inputError : ""}`}
              value={form.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              onBlur={() => validateFieldOnBlur("lastName")}
              placeholder="Enter your last name"
              readOnly={!editable.lastName}
            />
            <EditIcon
              className={styles.editIcon}
              onClick={() => toggleEditable("lastName")}
            />
          </div>
          {errors.lastName && (
            <span className={styles.error}>{errors.lastName}</span>
          )}
        </label>

        {/* Username */}
        <label className={styles.label}>
          Username
          <div className={styles.inputWrapper}>
            <input
              className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
              value={form.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              onBlur={() => validateFieldOnBlur("username")}
              placeholder="Choose a username"
              readOnly={!editable.username}
            />
            <EditIcon
              className={styles.editIcon}
              onClick={() => toggleEditable("username")}
            />
          </div>
          {checkingUsername && (
            <span className={styles.info}>Checking availability...</span>
          )}
          {usernameAvailable === true && (
            <span className={styles.success}>Username is available</span>
          )}
          {usernameAvailable === false && (
            <span className={styles.error}>Username is already taken</span>
          )}
          {errors.username && (
            <span className={styles.error}>{errors.username}</span>
          )}
        </label>

        {/* Email */}
        <label className={styles.label}>
          Email
          <div className={styles.inputWrapper}>
            <input
              className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
              type="email"
              value={form.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              onBlur={() => validateFieldOnBlur("email")}
              placeholder="Enter your email"
              readOnly={!editable.email}
            />
            <EditIcon
              className={styles.editIcon}
              onClick={() => toggleEditable("email")}
            />
          </div>
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </label>

        <div className={styles.actions}>
          <button
            className={styles.btnPrimary}
            onClick={handleSave}
            disabled={!canSave}
            type="button"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {/* Security */}
      <aside className={styles.sideCard}>
        <h4 className={styles.sideTitle}>Security</h4>
        <p className={styles.sideText}>You can reset your password anytime.</p>
        <Link href="/forgot-password" className={styles.resetBtn}>
          Reset password
        </Link>
      </aside>
    </div>
  );
}
