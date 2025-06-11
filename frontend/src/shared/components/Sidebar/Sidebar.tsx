"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useActiveMenu } from '../../hooks/useActiveMenu';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  isHidden: boolean;
}

const menuItems = [
  { id: 'dashboard', icon: 'bxs-dashboard', text: 'Dashboard', href: '/dashboard' },
  { id: 'about', icon: 'bxs-shopping-bag-alt', text: 'About Me', href: '/about' },
  { id: 'skills', icon: 'bxs-doughnut-chart', text: 'Skills', href: '/skills' },
  { id: 'projects', icon: 'bxs-message-dots', text: 'Projects', href: '/projects' },
  { id: 'contact', icon: 'bxs-group', text: 'Contact', href: '/contact' },
];

const bottomMenuItems = [
  { id: 'settings', icon: 'bxs-cog', text: 'Settings', href: '#', extraClass: 'bx-spin-hover' },
  { id: 'logout', icon: 'bx-power-off', text: 'Logout', href: '#', extraClass: 'bx-burst-hover', isLogout: true },
];

const Sidebar: React.FC<SidebarProps> = ({ isHidden }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { setActive } = useActiveMenu();

  const handleMenuClick = (menuId: string, href: string) => {
    if (href !== '#') {
      router.push(href);
    }
    setActive(menuId);
  };

  // Set active menu based on current pathname
  const getActiveMenuFromPath = () => {
    const path = pathname.split('/')[1];
    return path || 'dashboard';
  };

  return (
    <section id="sidebar" className={`${styles.sidebar} ${isHidden ? styles.hide : ''}`}>
      <a href="#" className={styles.brand}>
        <span className={styles.text}>Haneul Kim</span>
      </a>
      
      <ul className={`${styles.sideMenu} ${styles.top}`}>
        {menuItems.map((item) => (
          <li 
            key={item.id} 
            className={getActiveMenuFromPath() === item.id ? styles.active : ''}
          >
            <a 
              href={item.href} 
              onClick={(e) => {
                e.preventDefault();
                handleMenuClick(item.id, item.href);
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
                handleMenuClick(item.id, item.href);
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