"use client";

import { useRouter } from "next/navigation";
import HoverButton from "@/shared/components/HoverButton/HoverButton";

export default function IntroPage() {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
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
      }}
    >
      <HoverButton onClick={handleClick} />
    </main>
  );
}
