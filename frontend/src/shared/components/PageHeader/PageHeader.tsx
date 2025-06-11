import React from 'react';
import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    active?: boolean;
  }>;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  breadcrumbs = [], 
  actions 
}) => {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
        {breadcrumbs.length > 0 && (
          <ul className={styles.breadcrumb}>
            {breadcrumbs.map((crumb, index) => (
              <li key={index}>
                {crumb.href ? (
                  <a 
                    href={crumb.href} 
                    className={crumb.active ? styles.active : ''}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className={crumb.active ? styles.active : ''}>
                    {crumb.label}
                  </span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <i className='bx bx-chevron-right'></i>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {actions && (
        <div className={styles.actions}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader; 