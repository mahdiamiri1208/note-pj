// components/auth/useAuth.js
// این نمونه فقط برای توسعه محلی است — بعدا به سرویس واقعی auth متصل کن
export default function useAuth() {
  // برای تست می‌تونی user را null یا یک آبجکت قرار بدی
  const user = {
    name: "Mahdi meydan miri",

  };

  // const user = null; // برای حالت لاگین‌نشده تست کن

  return {
    user,
    isAuthenticated: !!user,
  };
}
