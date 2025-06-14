import React from "react";
import { useRouter } from "next/navigation";
import styles from "./CloudBackground.module.css";

const CloudBackground = () => {
  const router = useRouter();

  const goProjects = () => router.push("/projects");
  const goAbout = () => router.push("/about");

  return (
    <div className={styles.background}>
      {/* 구름 1 - Projects */}
      <div className={styles.cloudClickable} onClick={goProjects}>
        <svg className={styles.cloudSvg} viewBox="0 0 512 512">
          <path d="M406.1 227.63c-8.23-103.65-144.71-137.8-200.49-49.05 -36.18-20.46-82.33 3.61-85.22 45.9C80.73 229.34 50 263.12 50 304.1c0 44.32 35.93 80.25 80.25 80.25h251.51c44.32 0 80.25-35.93 80.25-80.25C462 268.28 438.52 237.94 406.1 227.63z" />
        </svg>
        <span className={styles.cloudText}>Projects</span>
      </div>

      {/* 구름 2 - About Me */}
      <div className={styles.cloudClickable2} onClick={goAbout}>
        <svg className={styles.cloudSvg} viewBox="0 0 512 512">
          <path d="M406.1 227.63c-8.23-103.65-144.71-137.8-200.49-49.05 -36.18-20.46-82.33 3.61-85.22 45.9C80.73 229.34 50 263.12 50 304.1c0 44.32 35.93 80.25 80.25 80.25h251.51c44.32 0 80.25-35.93 80.25-80.25C462 268.28 438.52 237.94 406.1 227.63z" />
        </svg>
        <span className={styles.cloudText}>About Me</span>
      </div>
    </div>
  );
};

export default CloudBackground;
