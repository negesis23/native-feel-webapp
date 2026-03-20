'use client';

import { useEffect, useRef } from 'react';
import { startApp } from '@/lib/todo-app';

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const cleanup = startApp(canvasRef.current);
      return cleanup;
    }
  }, []);

  // ONLY a canvas element. No HTML UI, no JSX components, no VDOM for the UI.
  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        touchAction: 'none', // Prevent browser scrolling
        backgroundColor: '#141218',
      }}
    />
  );
}
