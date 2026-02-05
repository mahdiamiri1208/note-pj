"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./settings.module.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditIcon from "@mui/icons-material/Edit";

/* validation */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

function validateFirstName(v) { const t=(v||"").trim(); if(!t) return {ok:false,msg:"First name is required"}; if(t.length<2) return {ok:false,msg:"First name must be at least 2 characters"}; if(t.length>50) return {ok:false,msg:"First name cannot exceed 50 characters"}; return {ok:true}; }
function validateLastName(v) { const t=(v||"").trim(); if(!t) return {ok:false,msg:"Last name is required"}; if(t.length<2) return {ok:false,msg:"Last name must be at least 2 characters"}; if(t.length>50) return {ok:false,msg:"Last name cannot exceed 50 characters"}; return {ok:true}; }
function validateUsernameField(v) {
  const t=(v||"").trim();
  if(!t) return {ok:false,msg:"Username is required"};
  if(t.length<3) return {ok:false,msg:"Username must be at least 3 characters"};
  if(t.length>30) return {ok:false,msg:"Username cannot exceed 30 characters"};
  if(!USERNAME_REGEX.test(t)) return {ok:false,msg:"Username can contain letters, numbers, dots, hyphens and underscores"};
  if(/[\u0600-\u06FF]/.test(t)) return {ok:false,msg:"Username cannot contain Persian characters"};
  if(!/[a-zA-Z]/.test(t)) return {ok:false,msg:"Username must contain at least one letter"};
  return {ok:true};
}
function validateEmailField(v) { const t=(v||"").trim(); if(!t) return {ok:false,msg:"Email is required"}; if(!EMAIL_REGEX.test(t)) return {ok:false,msg:"Please enter a valid email address"}; return {ok:true}; }
function validatePasswordField(v) { if(!v) return {ok:true}; if(typeof v!=="string"||v.length<8) return {ok:false,msg:"Password must be at least 8 characters"}; return {ok:true}; }

export default function SettingsPage() {
  const [form, setForm] = useState({ firstName:"", lastName:"", username:"", email:"", password:"" });
  const [originalForm, setOriginalForm] = useState({});
  const [editable, setEditable] = useState({ firstName:false, lastName:false, username:false, email:false, password:false });
  const [errors, setErrors] = useState({});
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [saving, setSaving] = useState(false);

  const usernameCheckAbortRef = useRef();
  const bcRef = useRef();
  const isOAuthRef = useRef(false); // true means external provider -> lock username/email/password
  const providerRef = useRef("credentials");

  useEffect(()=> {
    let mounted=true;
    (async ()=>{
      try {
        const res = await fetch("/api/settings/profile", { cache: "no-store" });
        const ct = res.headers.get("content-type") || "";
        let data;
        if (ct.includes("application/json")) data = await res.json();
        else { const txt = await res.text(); throw new Error(txt || "Failed to load profile"); }

        if (!res.ok) throw new Error(data?.message || "Failed to load profile");
        if (!mounted) return;

        const u = data.user || {};
        const shaped = { firstName: u.firstName||"", lastName: u.lastName||"", username: u.username||"", email: u.email||"", password:"" };
        setForm(shaped); setOriginalForm(shaped);
        providerRef.current = u.provider || "credentials";
        // IMPORTANT: rely on hasPassword returned by server
        const hasPassword = !!u.hasPassword;
        isOAuthRef.current = !hasPassword;
      } catch(err) {
        console.error("load profile error:", err);
        toast.error(err.message || "Failed to load profile");
      }
    })();

    try {
      const bc = new BroadcastChannel("profile-updates");
      bcRef.current = bc;
      bc.onmessage = (ev)=> { const payload = ev?.data; if(payload?.fullUser){ const u = payload.fullUser; const shaped = { firstName:u.firstName||"", lastName:u.lastName||"", username:u.username||"", email:u.email||"", password:"" }; setForm(shaped); setOriginalForm(shaped); } };
    } catch(e){}

    const onStorage = (e)=> {
      try {
        if (e.key === "profile-updated") {
          const val = e.newValue; if(!val) return; const obj = JSON.parse(val);
          if (obj?.fullUser) { const u = obj.fullUser; const shaped = { firstName:u.firstName||"", lastName:u.lastName||"", username:u.username||"", email:u.email||"", password:"" }; setForm(shaped); setOriginalForm(shaped); }
        }
      } catch(err){}
    };
    window.addEventListener("storage", onStorage);

    return ()=> { mounted=false; if(usernameCheckAbortRef.current) try{ usernameCheckAbortRef.current.abort(); }catch{}; if(bcRef.current) try{ bcRef.current.close(); }catch{}; window.removeEventListener("storage", onStorage); };
  }, []);

  useEffect(()=>{
    if (isOAuthRef.current) { setUsernameAvailable(null); setCheckingUsername(false); return; }
    if (!form.username || form.username === originalForm.username) { setUsernameAvailable(null); setCheckingUsername(false); return; }
    const v = validateUsernameField(form.username); if(!v.ok) { setUsernameAvailable(null); setCheckingUsername(false); return; }
    setCheckingUsername(true); setUsernameAvailable(null);

    const t = setTimeout(async ()=> {
      try {
        if (usernameCheckAbortRef.current) try{ usernameCheckAbortRef.current.abort(); }catch{}
        const controller = new AbortController(); usernameCheckAbortRef.current = controller;
        const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(form.username)}`, { signal: controller.signal });
        const ct = res.headers.get("content-type") || "";
        let data;
        if (ct.includes("application/json")) data = await res.json();
        else data = { available: null };
        setUsernameAvailable(Boolean(data.available));
      } catch(err) {
        if (err.name === "AbortError") return;
        console.error("username check error:", err);
        setUsernameAvailable(null);
      } finally { setCheckingUsername(false); }
    }, 500);

    return ()=> { clearTimeout(t); if (usernameCheckAbortRef.current) try{ usernameCheckAbortRef.current.abort(); }catch{}; };
  }, [form.username, originalForm.username]);

  const validateFieldOnBlur = (key) => {
    if (isOAuthRef.current && (key==="username"||key==="email"||key==="password")) { setErrors(prev=>({...prev,[key]:""})); return true; }
    let v;
    if (key==="firstName") v = validateFirstName(form.firstName);
    else if (key==="lastName") v = validateLastName(form.lastName);
    else if (key==="username") v = validateUsernameField(form.username);
    else if (key==="email") v = validateEmailField(form.email);
    else if (key==="password") v = validatePasswordField(form.password);
    else v = { ok:true };
    setErrors(prev=>({...prev,[key]: v.ok? "": v.msg}));
    if (!v.ok) toast.error(v.msg);
    return v.ok;
  };

  const validateAll = () => {
    const e={}; const msgs=[];
    const v1 = validateFirstName(form.firstName); if(!v1.ok){ e.firstName = v1.msg; msgs.push(v1.msg); }
    const v2 = validateLastName(form.lastName); if(!v2.ok){ e.lastName = v2.msg; msgs.push(v2.msg); }
    if (!isOAuthRef.current) {
      const v3 = validateUsernameField(form.username); if(!v3.ok){ e.username = v3.msg; msgs.push(v3.msg); }
      const v4 = validateEmailField(form.email); if(!v4.ok){ e.email = v4.msg; msgs.push(v4.msg); }
      const v5 = validatePasswordField(form.password); if(!v5.ok){ e.password = v5.msg; msgs.push(v5.msg); }
      if (form.username !== originalForm.username && usernameAvailable === false) { e.username = "Username already exists"; msgs.push("Username already exists"); }
    }
    setErrors(e);
    if (msgs.length>0) { if (msgs.length===1) toast.error(msgs[0]); else toast.error(`Please fix ${msgs.length} validation errors`); }
    return Object.keys(e).length===0;
  };

  const handleSave = async () => {
    if (JSON.stringify(form) === JSON.stringify(originalForm)) { toast.info("No changes to save"); return; }
    if (!validateAll()) return;
    setSaving(true);
    try {
      const payload = { firstName: form.firstName.trim(), lastName: form.lastName.trim() };
      if (!isOAuthRef.current) {
        payload.username = form.username.trim().toLowerCase();
        payload.email = form.email.trim().toLowerCase();
        if (form.password) payload.password = form.password;
      }
      const res = await fetch("/api/settings/profile", { method:"PUT", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
      const ct = res.headers.get("content-type")||"";
      const data = ct.includes("application/json") ? await res.json() : {};
      if (!res.ok) throw new Error(data?.message || "Failed to update profile");
      toast.success("Profile updated successfully");
      const returned = data.user || {};
      const shaped = { firstName: returned.firstName||"", lastName: returned.lastName||"", username: returned.username||"", email: returned.email||"", password:"" };
      setForm(shaped); setOriginalForm(shaped); setEditable({ firstName:false, lastName:false, username:false, email:false, password:false }); setErrors({}); setUsernameAvailable(null);
      try { if (!bcRef.current) bcRef.current = new BroadcastChannel("profile-updates"); bcRef.current.postMessage({ fullUser: returned, timestamp: Date.now() }); } catch(e){}
      try { localStorage.setItem("profile-updated", JSON.stringify({ fullUser: returned, timestamp: Date.now() })); setTimeout(()=>localStorage.removeItem("profile-updated"),500); } catch(e){}
      try { window.dispatchEvent(new CustomEvent("profile-updated", { detail: { fullUser: returned } })); } catch(e){}
    } catch(err) { console.error("save profile error:", err); toast.error(err.message || "Failed to update profile"); } finally { setSaving(false); }
  };

  const handleInputChange = (key, value) => { setForm(p=>({...p,[key]: key==="username"? value.toLowerCase() : value })); setErrors(prev=>({...prev,[key]:""})); if (key==="username") setUsernameAvailable(null); };
  const toggleEditable = (key) => { if (isOAuthRef.current && (key==="username"||key==="email"||key==="password")) { toast.info("This field is managed by your login provider"); return; } setEditable(p=>({...p,[key]: !p[key]})); if (!editable[key]) toast.info(`Now editing ${key.replace(/([A-Z])/g," $1").toLowerCase()}`); };

  const hasChanges = JSON.stringify(form) !== JSON.stringify(originalForm);
  const hasErrors = Object.values(errors).some(v=>v && v.length > 0);
  const canSave = hasChanges && !saving && !hasErrors && (isOAuthRef.current ? true : usernameAvailable !== false);

  return (
    <div className={styles.wrapper}>
      <div className={styles.form}>
        <h4 className={styles.heading}>Account Settings</h4>

        {/* First Name */}
        <label className={styles.label}>
          First Name
          <div className={styles.inputWrapper}>
            <input className={`${styles.input} ${errors.firstName?styles.inputError:""}`} value={form.firstName} onChange={e=>handleInputChange("firstName", e.target.value)} onBlur={()=>validateFieldOnBlur("firstName")} placeholder="Enter your first name" readOnly={!editable.firstName} />
            <EditIcon className={styles.editIcon} onClick={()=>toggleEditable("firstName")} />
          </div>
          {errors.firstName && <span className={styles.error}>{errors.firstName}</span>}
        </label>

        {/* Last Name */}
        <label className={styles.label}>
          Last Name
          <div className={styles.inputWrapper}>
            <input className={`${styles.input} ${errors.lastName?styles.inputError:""}`} value={form.lastName} onChange={e=>handleInputChange("lastName", e.target.value)} onBlur={()=>validateFieldOnBlur("lastName")} placeholder="Enter your last name" readOnly={!editable.lastName} />
            <EditIcon className={styles.editIcon} onClick={()=>toggleEditable("lastName")} />
          </div>
          {errors.lastName && <span className={styles.error}>{errors.lastName}</span>}
        </label>

        {/* Username */}
        <label className={styles.label}>
          Username
          <div className={styles.inputWrapper}>
            <input className={`${styles.input} ${errors.username?styles.inputError:""}`} value={form.username} onChange={e=>handleInputChange("username", e.target.value)} onBlur={()=>validateFieldOnBlur("username")} placeholder="Choose a username" readOnly={isOAuthRef.current || !editable.username} />
            {!isOAuthRef.current && <EditIcon className={styles.editIcon} onClick={()=>toggleEditable("username")} />}
          </div>
          {checkingUsername && <span className={styles.info}>Checking availability...</span>}
          {usernameAvailable===true && <span className={styles.success}>Username is available</span>}
          {usernameAvailable===false && <span className={styles.error}>Username is already taken</span>}
          {isOAuthRef.current && <span className={styles.info}>Username is managed by your login provider</span>}
          {errors.username && <span className={styles.error}>{errors.username}</span>}
        </label>

        {/* Email */}
        <label className={styles.label}>
          Email
          <div className={styles.inputWrapper}>
            <input className={`${styles.input} ${errors.email?styles.inputError:""}`} type="email" value={form.email} onChange={e=>handleInputChange("email", e.target.value)} onBlur={()=>validateFieldOnBlur("email")} placeholder="Enter your email" readOnly={isOAuthRef.current || !editable.email} />
            {!isOAuthRef.current && <EditIcon className={styles.editIcon} onClick={()=>toggleEditable("email")} />}
          </div>
          {isOAuthRef.current && <span className={styles.info}>Email comes from your login provider</span>}
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </label>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={!canSave} type="button">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      <aside className={styles.sideCard}>
        <h4 className={styles.sideTitle}>Security</h4>
        {!isOAuthRef.current ? (
          <>
            <p className={styles.sideText}>You can reset your password anytime.</p>
            <Link href="/forgot-password" className={styles.resetBtn}>Reset password</Link>
          </>
        ) : (
          <p className={styles.sideText}>You signed in with an external provider — password is managed by the provider.</p>
        )}
      </aside>
    </div>
  );
}
