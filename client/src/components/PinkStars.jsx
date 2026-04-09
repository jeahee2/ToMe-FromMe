import { useRef, useEffect } from 'react';

export default function PinkStars() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (let i = 0; i < 200; i++) {
      const s = document.createElement('div');
      s.style.cssText = `position:absolute;border-radius:50%;background:rgba(255,230,210,0.85);
        width:${Math.random() < 0.3 ? 2 : 1}px;height:${Math.random() < 0.3 ? 2 : 1}px;
        top:${Math.random() * 100}%;left:${Math.random() * 100}%;
        opacity:${0.18 + Math.random() * 0.38};
        animation:twinkle ${3 + Math.random() * 3}s ease-in-out infinite;
        animation-delay:${Math.random() * 4}s;`;
      el.appendChild(s);
    }
  }, []);
  return <div ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />;
}
