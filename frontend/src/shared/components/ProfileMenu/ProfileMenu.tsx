"use client";

import Image from 'next/image';
import styles from './ProfileMenu.module.scss';

interface ProfileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  profileImage?: string;
  userName?: string;
}

const profileMenuItems = [
  { label: 'My Profile', href: '#' },
  { label: 'Settings', href: '#' },
  { label: 'Log Out', href: '#' },
];

const ProfileMenu: React.FC<ProfileMenuProps> = ({ 
  isOpen, 
  onToggle, 
  profileImage = 'https://placehold.co/600x400/png',
  userName = 'User' 
}) => {
  return (
    <div className={styles.profileContainer}>
      <a 
        href="#" 
        className={`${styles.profile} profile`} 
        onClick={(e) => {
          e.preventDefault();
          onToggle();
        }}
      >
        <Image src={profileImage} alt={`${userName} Profile`} width={40} height={40} />
      </a>
      
      <div className={`${styles.profileMenu} ${isOpen ? styles.show : ''}`}>
        <ul>
          {profileMenuItems.map((item, index) => (
            <li key={index}>
              <a href={item.href}>{item.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProfileMenu; 