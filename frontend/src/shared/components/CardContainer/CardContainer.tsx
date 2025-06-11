import React from 'react';
import styles from './CardContainer.module.scss';

interface CardContainerProps {
  children: React.ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'small' | 'medium' | 'large';
}

const CardContainer: React.FC<CardContainerProps> = ({ 
  children, 
  className = '', 
  columns = 2,
  gap = 'medium'
}) => {
  const containerClass = `${styles.cardContainer} ${styles[`columns${columns}`]} ${styles[`gap${gap.charAt(0).toUpperCase() + gap.slice(1)}`]} ${className}`;

  return (
    <div className={containerClass}>
      {children}
    </div>
  );
};

export default CardContainer; 