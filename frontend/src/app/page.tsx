"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ThreeCanvas from '@/shared/components/ThreeCanvas/ThreeCanvas';

const TEXT = "haneul's portfolio";

export default function IntroPage() {
  const router = useRouter();
  const [displayed, setDisplayed] = useState("");

  // body, html, #__next 배경 투명하게 덮어쓰기
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      body, html, #__next {
        background: transparent !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 타이핑 애니메이션 (undefined 방지, TEXT가 undefined일 때도 방지)
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < TEXT.length) {
        setDisplayed((prev) => prev + TEXT[i]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 90);
    return () => clearInterval(interval);
  }, []);

  // 클릭 시 대시보드 이동
  const handleClick = () => {
    router.push("/dashboard");
  };

  return (
    <main style={{ width: '100vw', height: '100vh', minHeight: '100vh', minWidth: '100vw', overflow: 'hidden', padding: 0, margin: 0, position: 'relative' }}>
      <ThreeCanvas />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
          zIndex: 10,
        }}
        className="intro-text-container"
      >
        <h1 className="intro-title shimmer-fade-in">Hello. I’m Haneul.</h1>
        <a
          className="enter-link"
          href="#"
          style={{ pointerEvents: 'auto', padding: '18px 40px', borderRadius: '8px', minWidth: '120px', textAlign: 'center', display: 'inline-block' }}
          onClick={e => {
            e.preventDefault();
            router.push("/dashboard");
          }}
        >
          Enter
        </a>
      </div>
    </main>
  );
}