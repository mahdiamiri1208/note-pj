import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MainContent from "../components/layout/MainContent";
import styles from "./layout.module.css";

export default function ProtectedLayout({ children }) {
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
