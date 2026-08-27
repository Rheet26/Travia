import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

export function AnimatedTrainBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Subtle mouse tilt effect without any scroll zoom or scale expansion
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Floating Wisps / Fireflies Particle Canvas Effect (Organic non-linear floating motion)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    interface Wisp {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      alphaSpeed: number;
      angle: number;
      angleSpeed: number;
    }

    const wisps: Wisp[] = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.3,
      size: 1.2 + Math.random() * 2.2,
      alpha: 0.2 + Math.random() * 0.6,
      alphaSpeed: 0.005 + Math.random() * 0.01,
      angle: Math.random() * Math.PI * 2,
      angleSpeed: 0.01 + Math.random() * 0.02,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      wisps.forEach((w) => {
        w.angle += w.angleSpeed;
        w.x += w.vx + Math.sin(w.angle) * 0.3;
        w.y += w.vy;
        w.alpha += Math.sin(w.angle) * w.alphaSpeed;

        const currentAlpha = Math.max(0.1, Math.min(0.85, w.alpha));

        // Wrap around boundaries
        if (w.y < -20) w.y = height + 20;
        if (w.x < -20) w.x = width + 20;
        if (w.x > width + 20) w.x = -20;

        const glowRadius = w.size * 3.5;
        const gradient = ctx.createRadialGradient(
          w.x,
          w.y,
          0,
          w.x,
          w.y,
          glowRadius
        );
        gradient.addColorStop(0, `rgba(76, 215, 246, ${currentAlpha})`);
        gradient.addColorStop(0.5, `rgba(6, 182, 212, ${currentAlpha * 0.4})`);
        gradient.addColorStop(1, "rgba(6, 182, 212, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(w.x, w.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
        ctx.beginPath();
        ctx.arc(w.x, w.y, w.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#0F172A]"
      style={{ perspective: "1000px" }}
    >
      {/* Vande Bharat Hero Background (CONSTANT SCALE - No Scroll Zoom!) */}
      <motion.div
        animate={{
          rotateX: mousePos.y * -1.5,
          rotateY: mousePos.x * 1.5,
        }}
        transition={{ type: "spring", stiffness: 80, damping: 25 }}
        className="absolute inset-0 w-full h-full"
      >
        <img
          src="/vande-bharat-hero.jpg"
          alt="Vande Bharat Express Hero Backdrop"
          className="w-full h-full object-cover object-center filter contrast-110 brightness-95"
        />
      </motion.div>

      {/* Atmospheric Deep Navy (#0F172A) & Cyan (#06B6D4) Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/70 via-[#0F172A]/40 to-[#0F172A]/85 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[900px] h-[650px] bg-gradient-to-b from-[#06B6D4]/20 via-[#06B6D4]/5 to-transparent rounded-full blur-3xl opacity-70 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[550px] bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Canvas Layer for Floating Fireflies / Wisps */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen opacity-70"
      />
    </div>
  );
}

