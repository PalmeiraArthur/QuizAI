// src/hooks/useShinyEffect.js
import { useRef } from 'react';

export const useShinyEffect = () => {
  const containerRef = useRef(null);
  
  const handleMouseMove = (e) => {
    if (containerRef.current) {
      const { x, y } = containerRef.current.getBoundingClientRect();
      containerRef.current.style.setProperty('--x', e.clientX - x);
      containerRef.current.style.setProperty('--y', e.clientY - y);
    }
  };

  return { containerRef, handleMouseMove };
};