"use client";

import { useState, useCallback } from 'react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const getAIResponse = useCallback((userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('안녕') || lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "안녕하세요! 반가워요! 😊 무엇을 도와드릴까요?";
    }
    
    if (lowerMessage.includes('이름') || lowerMessage.includes('name')) {
      return "저는 Haneul Kim의 AI 어시스턴트입니다! 궁금한 것이 있으시면 언제든 물어보세요.";
    }
    
    if (lowerMessage.includes('기술') || lowerMessage.includes('skill') || lowerMessage.includes('개발')) {
      return "Haneul Kim은 React, TypeScript, Node.js, Python, FastAPI 등 다양한 기술을 다룰 수 있어요. 특히 풀스택 개발에 관심이 많답니다! 💻";
    }
    
    if (lowerMessage.includes('프로젝트') || lowerMessage.includes('project')) {
      return "다양한 프로젝트를 진행했어요! 웹 애플리케이션부터 AI 서비스까지 경험이 있답니다. Projects 페이지에서 자세히 확인해보세요! 🚀";
    }
    
    if (lowerMessage.includes('연락') || lowerMessage.includes('contact') || lowerMessage.includes('이메일')) {
      return "연락을 원하신다면 Contact 페이지를 확인해주세요! 이메일이나 소셜 미디어를 통해 연락할 수 있어요. 📧";
    }
    
    if (lowerMessage.includes('경험') || lowerMessage.includes('경력') || lowerMessage.includes('experience')) {
      return "About Me 페이지에서 자세한 경험과 배경을 확인할 수 있어요. 다양한 분야에서 경험을 쌓아왔답니다! 📚";
    }

    if (lowerMessage.includes('재무') || lowerMessage.includes('financial')) {
      return "재무제표 관련 서비스를 제공하고 있어요! 합계검증이나 DSD 생성 기능을 사용해보세요. 💼";
    }

    if (lowerMessage.includes('주가') || lowerMessage.includes('stock')) {
      return "국내/해외 업계 주가 분석 서비스를 제공합니다! 실시간 데이터와 분석을 확인해보세요. 📈";
    }

    if (lowerMessage.includes('증권') || lowerMessage.includes('securities')) {
      return "증권사 리포트 분석 서비스를 통해 전문적인 투자 정보를 얻을 수 있어요! 📊";
    }
    
    if (lowerMessage.includes('고마워') || lowerMessage.includes('감사') || lowerMessage.includes('thank')) {
      return "천만에요! 언제든 궁금한 것이 있으면 물어보세요! 😊";
    }
    
    if (lowerMessage.includes('잘가') || lowerMessage.includes('bye') || lowerMessage.includes('안녕히')) {
      return "안녕히 가세요! 다음에 또 만나요! 👋✨";
    }

    // 기본 응답들
    const defaultResponses = [
      "흥미로운 질문이네요! 더 구체적으로 설명해주시면 더 도움을 드릴 수 있어요. 🤔",
      "좋은 질문입니다! 다른 페이지들도 둘러보시면 더 많은 정보를 찾을 수 있어요! 📖",
      "음, 잘 이해하지 못했어요. 다른 방식으로 질문해주시겠어요? 🤷‍♂️",
      "궁금한 것이 많으시군요! 😄 어떤 부분에 대해 더 자세히 알고 싶으신가요?",
      "도움이 되고 싶은데, 좀 더 구체적으로 말씀해주시면 좋겠어요! 💡"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }, []);

  const sendMessage = useCallback((text: string) => {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiResponse: Message = {
        id: `bot-${Date.now()}`,
        text: getAIResponse(text),
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  }, [getAIResponse]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
  }, []);

  return {
    messages,
    isTyping,
    sendMessage,
    clearMessages,
  };
}; 