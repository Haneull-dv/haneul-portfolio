import React from 'react';
import styles from './Card.module.scss';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  children, 
  className = '', 
  headerActions 
}) => {
  return (
    <div className={`${styles.card} ${className}`}>
      {title && (
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>{title}</h3>
          {headerActions && (
            <div className={styles.cardActions}>
              {headerActions}
            </div>
          )}
        </div>
      )}
      <div className={styles.cardContent}>
        {children}
      </div>
    </div>
  );
};

export default Card; 