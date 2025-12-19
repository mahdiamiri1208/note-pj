"use client";

import { usePathname, useRouter } from "next/navigation";
import styles from "./Header.module.css";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import SearchIcon from '@mui/icons-material/Search';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import PersonIcon from '@mui/icons-material/Person';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className={styles.header}>
      <div>
        <div className={styles.breadcrumb}>
          <button
            onClick={() => router.back()}
            className={styles.back}
            title="Go back"
          >
            <ArrowBackIosIcon sx={{ fontSize: 18 }} />
          </button>

          <span className={styles.path}>
            Home
            {segments.map((seg, i) => (
              <span key={i}> / {seg}</span>
            ))}
          </span>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}><SearchIcon /></span>
          <input
            type="text"
            className={styles.search}
            placeholder="Search your notes..."
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.iconDarkMode} title="Toggle theme"><DarkModeIcon /></button>
          <button className={styles.iconPerson} title="Profile"><PersonIcon /></button>
        </div>
      </div>
    </header>
  );
}
