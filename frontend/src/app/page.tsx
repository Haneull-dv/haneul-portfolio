"use client";

import { useRouter } from "next/navigation";
import FloatingChatbot from "@/shared/components/FloatingChatbot";
import CloudBackground from "@/shared/components/CloudBackground/CloudBackground";

export default function IntroPage() {
  const router = useRouter();

  const handleClick = () => {
    // 대시보드로 이동
    router.push("/dashboard");
  };

  return (
    <main
      className="intro-main"
      style={{
        position: "relative",
        overflow: "hidden",
        display: "block",
        height: "100vh",
        background: "#0a0a15",
      }}
    >
      <CloudBackground />
      <div 
        className="character-container"
        style={{ 
          position: "relative", 
          margin: "0 auto", 
          top: "50%", 
          transform: "translateY(-50%)", 
          zIndex: 1, 
          display: "flex", 
        justifyContent: "center",
        alignItems: "center",
          width: "min(600px, 90vw)",
          height: "min(600px, 90vw)",
          maxWidth: "600px",
          maxHeight: "600px"
      }}
    >
        <FloatingChatbot 
          onClick={handleClick} 
          style={{ 
            position: "static", 
            width: "100%", 
            height: "100%" 
          }}
          hideTooltip={true}
        />
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .character-container {
            width: min(400px, 85vw) !important;
            height: min(400px, 85vw) !important;
          }
        }
        
        @media (max-width: 480px) {
          .character-container {
            width: min(300px, 80vw) !important;
            height: min(300px, 80vw) !important;
          }
        }
      `}</style>
    </main>
  );
}
