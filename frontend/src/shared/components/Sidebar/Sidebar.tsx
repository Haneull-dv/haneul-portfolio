"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useActiveMenu } from '../../hooks/useActiveMenu';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  isHidden: boolean;
}

interface MenuItem {
  id: string;
  icon: string;
  text: string;
  href: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Workspace',
    items: [
      { id: 'dashboard', icon: 'bx-grid-alt', text: 'Dashboard', href: '/dashboard' },
      { id: 'digest', icon: 'bx-line-chart', text: 'Market Digest', href: '/dashboard/digest' },
      { id: 'trends', icon: 'bx-trending-up', text: 'KPI Trends', href: '/dashboard/trends' },
      { id: 'validation', icon: 'bx-check-shield', text: 'Data Validation', href: '/dashboard/validation' },
      { id: 'dsd', icon: 'bx-transfer', text: 'DART Converter', href: '/dashboard/dsd' },
    ]
  },
  {
    title: 'Profile',
    items: [
      { id: 'about', icon: 'bx-user', text: 'About & Skills', href: '/about' },
      { id: 'projects', icon: 'bx-briefcase', text: 'Projects', href: '/projects' },
      { id: 'contact', icon: 'bx-envelope', text: 'Contact', href: '/contact' },
    ]
  }
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

  const isMenuActive = (item: MenuItem) => {
    return pathname === item.href;
  };

  return (
    <section id="sidebar" className={`${styles.sidebar} ${isHidden ? styles.hide : ''}`}>
      <div className={styles.brand}>
        <span className={styles.text}>Financial Workspace</span>
      </div>
      
      {menuGroups.map((group, groupIndex) => (
        <div key={group.title} className={styles.menuGroup}>
          <div className={styles.groupHeader}>
            <span className={styles.groupTitle}>{group.title}</span>
          </div>
          
          <ul className={styles.sideMenu}>
            {group.items.map((item) => (
              <li key={item.id} className={isMenuActive(item) ? styles.active : ''}>
                <a 
                  href={item.href} 
                  onClick={(e) => {
                    e.preventDefault();
                    handleMenuClick(item.id, item.href);
                  }}
                  className={styles.menuItem}
                >
                  <i className={`bx ${item.icon}`}></i>
                  <span className={styles.text}>{item.text}</span>
                </a>
              </li>
            ))}
          </ul>
          
          {groupIndex < menuGroups.length - 1 && (
            <div className={styles.divider}></div>
          )}
        </div>
      ))}
      
      <div className={styles.userProfile}>
        <div className={styles.profileInfo}>
          <div className={styles.profileAvatar}>
            <i className="bx bx-user"></i>
          </div>
          <div className={styles.profileText}>
            <span className={styles.profileName}>Haneul Kim</span>
            <span className={styles.profileRole}>Developer</span>
          </div>
        </div>
        <button className={styles.settingsButton}>
          <i className="bx bx-cog"></i>
        </button>
      </div>
    </section>
  );
};

export default Sidebar; 