"use client";

import styles from './NotificationMenu.module.scss';

interface NotificationMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  notificationCount?: number;
}

const notifications = [
  'New message from John',
  'Your order has been shipped',
  'New comment on your post',
  'Update available for your app',
  'Reminder: Meeting at 3PM',
];

const NotificationMenu: React.FC<NotificationMenuProps> = ({ 
  isOpen, 
  onToggle, 
  notificationCount = 8 
}) => {
  return (
    <div className={styles.notificationContainer}>
      <a 
        href="#" 
        className={`${styles.notification} notification`} 
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
      >
        <i className='bx bxs-bell bx-tada-hover'></i>
        <span className={styles.num}>{notificationCount}</span>
      </a>
      
      <div className={`${styles.notificationMenu} ${isOpen ? styles.show : ''}`}>
        <ul>
          {notifications.map((notification, index) => (
            <li key={index}>
              <a href="#">{notification}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default NotificationMenu; 