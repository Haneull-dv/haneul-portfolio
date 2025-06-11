"use client";

import { useSearchToggle } from '../../hooks/useSearchToggle';
import { useDarkMode } from '../../hooks/useDarkMode';
import NotificationMenu from '../NotificationMenu/NotificationMenu';
import ProfileMenu from '../ProfileMenu/ProfileMenu';
import styles from './Header.module.scss';

interface HeaderProps {
  onMenuToggle: () => void;
  isNotificationOpen: boolean;
  isProfileOpen: boolean;
  onNotificationToggle: () => void;
  onProfileToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onMenuToggle,
  isNotificationOpen,
  isProfileOpen,
  onNotificationToggle,
  onProfileToggle,
}) => {
  const { isSearchVisible, toggleSearch } = useSearchToggle();
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <nav className={styles.nav}>
      <i 
        className='bx bx-menu bx-sm' 
        onClick={onMenuToggle}
        style={{ cursor: 'pointer' }}
      ></i>
      
      <a href="#" className={styles.navLink}>Categories</a>
      
      <form action="#" className={`${styles.form} ${isSearchVisible ? styles.show : ''}`}>
        <div className={styles.formInput}>
          <input type="search" placeholder="Search..." />
          <button 
            type="submit" 
            className={styles.searchBtn}
            onClick={toggleSearch}
          >
            <i className={`bx ${isSearchVisible ? 'bx-x' : 'bx-search'}`}></i>
          </button>
        </div>
      </form>
      
      <input 
        type="checkbox" 
        className={styles.checkbox} 
        id="switch-mode" 
        hidden 
        checked={isDark}
        onChange={toggleDarkMode}
      />
      <label className={styles.switchLm} htmlFor="switch-mode">
        <i className="bx bxs-moon"></i>
        <i className="bx bx-sun"></i>
        <div className={styles.ball}></div>
      </label>

      <NotificationMenu 
        isOpen={isNotificationOpen}
        onToggle={onNotificationToggle}
      />

      <ProfileMenu 
        isOpen={isProfileOpen}
        onToggle={onProfileToggle}
      />
    </nav>
  );
};

export default Header; 