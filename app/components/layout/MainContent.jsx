import styles from "./MainContent.module.css";

export default function MainContent({ children }) {
  return (
    <main className={styles.wrapper}>
      <div className={styles.main}>{children}</div>
    </main>
  );
}
