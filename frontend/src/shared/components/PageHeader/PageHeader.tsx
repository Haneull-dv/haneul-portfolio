import React from 'react';
import styles from './PageHeader.module.scss';

interface Breadcrumb {
  label: string;
  href?: string;
  active?: boolean;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  breadcrumbs = [],
  actions
}) => {
  return (
    <header className={styles.pageHeader}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        {breadcrumbs.length > 0 && (
          <ol>
            {breadcrumbs.map((crumb, idx) => (
              <li key={idx}>
                {crumb.href && !crumb.active ? (
                  <a href={crumb.href}>{crumb.label}</a>
                ) : (
                  <span className={crumb.active ? styles.active : ''}>{crumb.label}</span>
                )}
                {idx < breadcrumbs.length - 1 && (
                  <span className={styles.separator}>/</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </nav>
      <div className={styles.headerMain}>
        <h1 className={styles.title}>{title}</h1>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
};

export default PageHeader; 