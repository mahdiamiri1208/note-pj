import styles from "./social.module.css";
import GitHubIcon from "@mui/icons-material/GitHub";
import { signIn } from "next-auth/react";

export default function SocialLogin() {
  return (
    <div className={styles.social}>
      <button
        className={styles.socialBtn}
        onClick={() => signIn("github", { callbackUrl: "/notes" })}
        type="button"
      >
        <GitHubIcon /> Continue with GitHub
      </button>
    </div>
  );
}
