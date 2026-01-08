import styles from "./social.module.css";
import GoogleIcon from "@mui/icons-material/Google";
import GitHubIcon from "@mui/icons-material/GitHub";
import { signIn } from "next-auth/react";


export default function SocialLogin() {
  return (
    <div className={styles.social}>
      <button className={styles.socialBtn} onClick={() => signIn("google")}>
        <GoogleIcon /> Continue with Google
      </button>
    </div>
  );
}
