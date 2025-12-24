import styles from "./social.module.css";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";

export default function SocialLogin() {
  return (
    <div className={styles.social}>
      <button className={styles.socialBtn}>
        <GoogleIcon /> Continue with Google
      </button>

      <button className={styles.socialBtn}>
        <GitHubIcon /> Continue with GitHub
      </button>
    </div>
  );
}
