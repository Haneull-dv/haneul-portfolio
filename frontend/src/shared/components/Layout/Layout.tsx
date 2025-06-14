"use client";

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../../hooks/useSidebar';
import { useMenuToggle } from '../../hooks/useMenuToggle';
import { useChat } from '../../hooks/useChat';
import Sidebar from '../Sidebar/Sidebar';
import Header from '../Header/Header';
import FloatingChatbot from '../FloatingChatbot/FloatingChatbot';
import ChatWindow from '../ChatWindow/ChatWindow';
import styles from './Layout.module.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isHidden, toggleSidebar } = useSidebar();
  const { 
    isNotificationOpen, 
    isProfileOpen, 
    toggleNotification, 
    toggleProfile 
  } = useMenuToggle();
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const { messages, isTyping, sendMessage } = useChat();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMenuToggle = () => {
    if (isMobile) {
      setShowMobileSidebar(!showMobileSidebar);
    } else {
      toggleSidebar();
    }
  };

  const handleOverlayClick = () => {
    if (isMobile && showMobileSidebar) {
      setShowMobileSidebar(false);
    }
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Overlay */}
      {isMobile && showMobileSidebar && (
        <div 
          className={styles.overlay} 
          onClick={handleOverlayClick}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isHidden={isHidden} 
        className={isMobile && showMobileSidebar ? styles.showMobile : ''} 
      />
      
      {/* Content */}
      <section 
        id="content" 
        className={`${styles.content} ${isHidden ? styles.sidebarHidden : ''}`}
      >
        <Header 
          onMenuToggle={handleMenuToggle}
          isNotificationOpen={isNotificationOpen}
          isProfileOpen={isProfileOpen}
          onNotificationToggle={toggleNotification}
          onProfileToggle={toggleProfile}
        />
        
        <main className={styles.main}>
          {children}
        </main>
      </section>
      
      {/* Floating Chatbot */}
      <FloatingChatbot onClick={() => setIsChatOpen(true)} />
      
      {/* Chat Window */}
      <ChatWindow
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={messages}
        onSendMessage={sendMessage}
        isTyping={isTyping}
      />
    </div>
  );
};

export default Layout; 