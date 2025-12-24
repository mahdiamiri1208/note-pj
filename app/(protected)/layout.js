// app/protected/ProtectedLayout.jsx
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import MainContent from "../components/layout/MainContent";
import styles from "./layout.module.css";

export default function ProtectedLayout({ children, landing }) {
  return (
    <div className={styles.main}>
      <div className={styles.appWrapper}>
        <Sidebar />
        <div className={styles.contentArea}>
          <Header />
          <MainContent>{children}</MainContent>
        </div>
      </div>
    </div>
  );
}
