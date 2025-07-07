import React from 'react';
import styles from './PageBanner.module.scss';

interface PageBannerProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

const PageBanner: React.FC<PageBannerProps> = ({ title, description, actions }) => (
  <div className={styles.pageBanner}>
    <div className={styles.bannerContent}>
      <h1 className={styles.bannerTitle}>{title}</h1>
      {description && <p className={styles.bannerDescription}>{description}</p>}
      {actions && <div className={styles.bannerActions}>{actions}</div>}
    </div>
  </div>
);

export default PageBanner;