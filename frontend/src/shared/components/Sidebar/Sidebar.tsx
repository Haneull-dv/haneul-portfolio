"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { useActiveMenu } from '../../hooks/useActiveMenu';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  isHidden: boolean;
}

interface SubMenuItem {
  id: string;
  text: string;
  href: string;
}

interface MenuItem {
  id: string;
  icon: string;
  text: string;
  href: string;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { 
    id: 'dashboard', 
    icon: 'bxs-dashboard', 
    text: 'Dashboard', 
    href: '/dashboard',
    subItems: [
      { id: 'validation', text: 'Validation', href: '/dashboard/validation' },
      { id: 'dsd', text: 'DSD', href: '/dashboard/dsd' },
      { id: 'trends', text: 'Trends', href: '/dashboard/trends' },
      { id: 'digest', text: 'Digest', href: '/dashboard/digest' },
    ]
  },
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
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const handleMenuClick = (menuId: string, href: string) => {
    if (href !== '#') {
      router.push(href);
    }
    setActive(menuId);
  };

  const toggleSubmenu = (menuId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // Set active menu based on current pathname
  const getActiveMenuFromPath = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0) return 'dashboard';
    if (pathSegments.length === 1) return pathSegments[0];
    if (pathSegments[0] === 'dashboard' && pathSegments.length > 1) {
      return pathSegments[1]; // Return the sub-page (validation, dsd, etc.)
    }
    return pathSegments[0];
  };

  const isSubItemActive = (subItem: SubMenuItem) => {
    return pathname === subItem.href;
  };

  const isParentActive = (item: MenuItem) => {
    if (item.subItems) {
      return item.subItems.some(subItem => pathname === subItem.href) || pathname === item.href;
    }
    return pathname === item.href;
  };

  return (
    <section id="sidebar" className={`${styles.sidebar} ${isHidden ? styles.hide : ''}`}>
      <a href="#" className={styles.brand}>
        <span className={styles.text}>Haneul Kim</span>
      </a>
      
      <ul className={`${styles.sideMenu} ${styles.top}`}>
        {menuItems.map((item) => (
          <li key={item.id}>
            <div className={isParentActive(item) ? styles.active : ''}>
              <a 
                href={item.href} 
                onClick={(e) => {
                  e.preventDefault();
                  handleMenuClick(item.id, item.href);
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <i className={`bx ${item.icon} bx-sm`}></i>
                  <span className={styles.text}>{item.text}</span>
                </div>
                {item.subItems && (
                  <div
                    onClick={(e) => toggleSubmenu(item.id, e)}
                    style={{ 
                      padding: '4px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i 
                      className={`bx ${expandedMenus.includes(item.id) ? 'bx-chevron-down' : 'bx-chevron-right'}`}
                      style={{ 
                        fontSize: '14px',
                        transition: 'transform 0.3s ease'
                      }}
                    ></i>
                  </div>
                )}
              </a>
            </div>
            
            {item.subItems && expandedMenus.includes(item.id) && (
              <ul style={{ 
                paddingLeft: '20px', 
                marginTop: '4px',
                marginBottom: '8px'
              }}>
                {item.subItems.map((subItem) => (
                  <li 
                    key={subItem.id}
                    style={{ 
                      height: '36px',
                      margin: '2px 0',
                      background: 'transparent'
                    }}
                    className={isSubItemActive(subItem) ? styles.active : ''}
                  >
                    <a
                      href={subItem.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleMenuClick(subItem.id, subItem.href);
                      }}
                      style={{
                        fontSize: '13px',
                        paddingLeft: '16px',
                        height: '36px',
                        borderRadius: '18px'
                      }}
                    >
                      <i className="bx bx-circle" style={{ fontSize: '8px' }}></i>
                      <span className={styles.text}>{subItem.text}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
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