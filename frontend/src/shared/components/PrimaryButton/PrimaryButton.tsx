import React from 'react';
import styles from './PrimaryButton.module.scss';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
  small?: boolean;
}
const PrimaryButton: React.FC<PrimaryButtonProps> = ({ children, fullWidth, small, ...props }) => (
  <button
    className={[
      styles.primaryButton,
      fullWidth ? styles.fullWidth : '',
      small ? styles.small : '',
    ].join(' ')}
    {...props}
  >
    {children}
  </button>
);
export default PrimaryButton;