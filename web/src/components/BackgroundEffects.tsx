import { useEffect, useRef } from "react";

interface MousePos {
  x: number;
  y: number;
}

export default function BackgroundEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<MousePos>({ x: 0, y: 0 });
  const particlesRef = useRef<
    { x: number; y: number; vx: number; vy: number; size: number; alpha: number; speed: number }[]
  >([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Mouse tracking
    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMouse);

    // Init particles
    const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 15000));
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.4 + 0.1,
      speed: Math.random() * 0.2 + 0.05,
    }));

    // Update mouse glow position
    const glow = document.querySelector('.mouse-glow') as HTMLElement;
    const onMouseMoveForGlow = (e: MouseEvent) => {
      if (!glow) return;
      glow.style.background = `radial-gradient(600px circle at ${e.clientX}px ${e.clientY}px, rgba(139, 38, 53, 0.06), transparent 60%)`;
    };
    // Throttle via raf
    let glowRaf: number;
    const scheduleGlow = (e: MouseEvent) => {
      if (glowRaf) cancelAnimationFrame(glowRaf);
      glowRaf = requestAnimationFrame(() => onMouseMoveForGlow(e));
    };
    window.addEventListener('mousemove', scheduleGlow);

    // Animation loop – draw particles
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particles
      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Mouse interaction – gentle push away
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 0) {
          const force = (120 - dist) / 120;
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${p.alpha * 0.6})`;
        ctx.fill();

        // Draw connection lines between close particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx2 = p.x - p2.x;
          const dy2 = p.y - p2.y;
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          if (dist2 < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(139, 38, 53, ${0.08 * (1 - dist2 / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      if (glowRaf) cancelAnimationFrame(glowRaf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("mousemove", scheduleGlow);
    };
  }, []);

  return (
    <>
      {/* Base dark layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#050505",
          zIndex: -4,
        }}
      />

      {/* Background image (if user uploads one) */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -3,
          backgroundImage: "url(/appbackground.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.15,
          filter: "blur(8px) saturate(1.2)",
          transform: "scale(1.1)",
        }}
      />

      {/* Aurora gradient overlay */}
      <div
        className="aurora-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -2,
          overflow: "hidden",
        }}
      >
        <div className="aurora-blob blob-1" />
        <div className="aurora-blob blob-2" />
        <div className="aurora-blob blob-3" />
      </div>

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          pointerEvents: "none",
        }}
      />

      {/* Vignette overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="noise-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.03,
          mixBlendMode: "overlay",
        }}
      />

      {/* Mouse-tracking glow */}
      <div
        className="mouse-glow"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
