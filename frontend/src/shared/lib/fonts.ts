// 경로 예시: src/lib/fonts.ts

import { Playfair_Display } from 'next/font/google';

// 'Playfair Display' 폰트를 구글에서 불러옵니다.
export const playfairDisplay = Playfair_Display({
  subsets: ['latin'], // 라틴어 문자셋을 사용합니다.
  weight: ['400', '700', '900'], // 사용할 폰트 굵기 (일반, 볼드, 엑스트라 볼드)
  style: ['normal', 'italic'], // 일반 스타일과 이탤릭 스타일 모두 포함
  variable: '--font-playfair-display', // CSS에서 사용할 변수 이름
});