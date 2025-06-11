"use client";

import React, { useState } from 'react';
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
  const { messages, isTyping, sendMessage } = useChat();

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <Sidebar isHidden={isHidden} />
      
      {/* Content */}
      <section 
        id="content" 
        className={`${styles.content} ${isHidden ? styles.sidebarHidden : ''}`}
      >
        <Header 
          onMenuToggle={toggleSidebar}
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