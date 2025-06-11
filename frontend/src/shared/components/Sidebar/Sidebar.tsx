"use client";

import { useActiveMenu } from '../../hooks/useActiveMenu';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  isHidden: boolean;
}

const menuItems = [
  { id: 'dashboard', icon: 'bxs-dashboard', text: 'Dashboard', href: '#' },
  { id: 'store', icon: 'bxs-shopping-bag-alt', text: 'About Me', href: '#' },
  { id: 'analytics', icon: 'bxs-doughnut-chart', text: 'Skills', href: '#' },
  { id: 'message', icon: 'bxs-message-dots', text: 'Projects', href: '#' },
  { id: 'team', icon: 'bxs-group', text: 'Contact', href: '#' },
];

const bottomMenuItems = [
  { id: 'settings', icon: 'bxs-cog', text: 'Settings', href: '#', extraClass: 'bx-spin-hover' },
  { id: 'logout', icon: 'bx-power-off', text: 'Logout', href: '#', extraClass: 'bx-burst-hover', isLogout: true },
];

const Sidebar: React.FC<SidebarProps> = ({ isHidden }) => {
  const { activeMenu, setActive } = useActiveMenu();

  const handleMenuClick = (menuId: string) => {
    setActive(menuId);
  };

  return (
    <section id="sidebar" className={`${styles.sidebar} ${isHidden ? styles.hide : ''}`}>
      <a href="#" className={styles.brand}>
        <i className='bx bxs-smile bx-lg'></i>
        <span className={styles.text}>AdminHub</span>
      </a>
      
      <ul className={`${styles.sideMenu} ${styles.top}`}>
        {menuItems.map((item) => (
          <li 
            key={item.id} 
            className={activeMenu === item.id ? styles.active : ''}
          >
            <a 
              href={item.href} 
              onClick={(e) => {
                e.preventDefault();
                handleMenuClick(item.id);
              }}
            >
              <i className={`bx ${item.icon} bx-sm`}></i>
              <span className={styles.text}>{item.text}</span>
            </a>
          </li>
        ))}
      </ul>
      
      <ul className={`${styles.sideMenu} ${styles.bottom}`}>
        {bottomMenuItems.map((item) => (
          <li key={item.id}>
            <a 
              href={item.href} 
              className={item.isLogout ? styles.logout : ''}
              onClick={(e) => {
                e.preventDefault();
                handleMenuClick(item.id);
              }}
            >
              <i className={`bx ${item.icon} bx-sm ${item.extraClass || ''}`}></i>
              <span className={styles.text}>{item.text}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Sidebar; 