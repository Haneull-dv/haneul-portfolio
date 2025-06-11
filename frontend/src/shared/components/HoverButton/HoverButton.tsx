"use client";

import { useEffect } from "react";
import styles from "./HoverButton.module.scss";
import initHoverEffect from "./HoverEffect";

interface HoverButtonProps {
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  children?: React.ReactNode;
  text?: string;
}

const HoverButton: React.FC<HoverButtonProps> = ({ 
  onClick, 
  children, 
  text = "Haneul Kim" 
}) => {
  useEffect(() => {
    initHoverEffect();
  }, []);

    return (
    <div className={styles.container}>
      <a
        className={`${styles.link} anim-explode-container`}
        href="#"
        onClick={onClick}
      >
        {children || <p>{text}</p>}
        <svg
          className="anim-explode"
          role="presentation"
          viewBox="0 0 500 500"
        ></svg>
      </a>
    </div>
  );
};

export default HoverButton;
