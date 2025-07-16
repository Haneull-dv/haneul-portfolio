"use client";

import React from 'react';
import styles from './Modal.module.scss';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  hideFooter?: boolean;
  modalClassName?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, hideFooter, modalClassName }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal + (modalClassName ? ' ' + modalClassName : '')} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={styles.content}>
          {children}
        </div>
        { !hideFooter && (
          <div className={styles.footer}>
            <button onClick={onClose} className={styles.confirmButton}>
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal; 