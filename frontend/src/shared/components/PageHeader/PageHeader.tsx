import React from 'react';
import styles from './PageHeader.module.scss';

interface Breadcrumb {
  label: string;
  href?: string;
  active?: boolean;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs = [],
  actions,
  className,
  style,
  children,
}) => (
  <header className={`${styles.pageHeader} ${className || ''}`} style={style}>
    {breadcrumbs.length > 0 && (
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
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
      </nav>
    )}
    <div className={styles.headerMain}>
      <h1 className={styles.title}>{title}</h1>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
    {description && <p className={styles.description}>{description}</p>}
    {children}
  </header>
);

export default PageHeader; 