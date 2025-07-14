// src/shared/hooks/useMediaQuery.ts

import { useState, useEffect } from 'react';

/**
 * SSR 환경을 고려하여 클라이언트 사이드에서만 미디어 쿼리를 실행하는 커스텀 훅
 * @param query - 확인할 미디어 쿼리 문자열 (e.g., '(max-width: 1024px)')
 * @returns 미디어 쿼리 매칭 여부 (boolean)
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // window 객체는 클라이언트에서만 접근 가능하므로 useEffect 내부에서 사용
    const media = window.matchMedia(query);
    
    // 초기 상태 업데이트
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => {
      setMatches(media.matches);
    };

    // 이벤트 리스너 등록 (최신 브라우저 방식)
    media.addEventListener('change', listener);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};