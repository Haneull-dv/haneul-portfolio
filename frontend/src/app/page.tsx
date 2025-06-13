"use client";

import { useRouter } from "next/navigation";
import FloatingChatbot from "@/shared/components/FloatingChatbot";

export default function IntroPage() {
  const router = useRouter();

  const handleClick = () => {
    // 대시보드로 이동
    router.push("/dashboard");
  };

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
        background: "#e3f0fa",
      }}
    >
      <div style={{ width: 600, height: 600, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <FloatingChatbot onClick={handleClick} style={{ position: "static", width: "100%", height: "100%" }} />
      </div>
    </main>
  );
}
