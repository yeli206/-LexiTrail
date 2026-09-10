"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const root = document.documentElement;
      const available = root.scrollHeight - root.clientHeight;
      setProgress(available > 0 ? (root.scrollTop / available) * 100 : 0);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="progress-track" aria-hidden="true" style={{ position: "fixed", inset: "0 0 auto", zIndex: 60, height: 4, borderRadius: 0 }}>
      <span style={{ width: `${progress}%` }} />
    </div>
  );
}