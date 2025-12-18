"use client";

import { usePathname, useRouter } from "next/navigation";
import styles from "./Header.module.css";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className={styles.header}>
      {/* بخش بالا */}
      <div>
        <div className={styles.breadcrumb}>
          <button
            onClick={() => router.back()}
            className={styles.back}
            title="Go back"
          >
            ←
          </button>

          <span className={styles.path}>
            Home
            {segments.map((seg, i) => (
              <span key={i}> / {seg}</span>
            ))}
          </span>
        </div>
      </div>

      {/* سرچ */}
      <div className={styles.bottom}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            className={styles.search}
            placeholder="Search your notes..."
          />
        </div>

        <div className={styles.actions}>
          <button title="Toggle theme">🌙</button>
          <button title="Profile">👤</button>
        </div>
      </div>
    </header>
  );
}
