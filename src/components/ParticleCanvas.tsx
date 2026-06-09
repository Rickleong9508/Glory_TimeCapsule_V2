import { useEffect, useRef } from "react";

interface ParticleCanvasProps {
  triggerBurst: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  drag: number;
  sparkle: boolean;
}

export default function ParticleCanvas({ triggerBurst }: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  
  // Colors for magic dust - Retro Warm Gold and Cinematic Blue
  const COLORS = [
    "#FFE082", // Retro Champagne Gold
    "#FFB300", // Nostalgic Amber Gold
    "#FFF9C4", // Sparkle White Gold
    "#60A5FA", // Sky Blue Stardust
    "#3B82F6", // Oceanic Blue Light
    "#93C5FD", // Ice Blue Sparkle
    "#FFFFFF", // Pure White Light
  ];

  // Ambient stars generation
  const initStars = (width: number, height: number) => {
    const stars: Star[] = [];
    const count = Math.min(120, Math.floor((width * height) / 10000));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        speed: Math.random() * 0.02 + 0.005,
      });
    }
    starsRef.current = stars;
  };

  // Sparkle burst creation
  const spawnBurst = (x: number, y: number) => {
    const count = 260; // Highly dense constellation explosive blast
    const particles: Particle[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      // High-resolution physics: fast inner cores, ultra-slow halo floaters
      const speed = Math.random() > 0.4 ? (Math.random() * 10 + 4) : (Math.random() * 4 + 1.5);
      
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * (Math.random() * 1.3 + 0.5),
        vy: Math.sin(angle) * speed * (Math.random() * 1.3 + 0.5) - 3.2, // Gravity defying updrift
        size: Math.random() * 4.5 + 1.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: 1,
        decay: Math.random() * 0.012 + 0.005, // Retain stardust longer in ambient air
        gravity: 0.1, // Softer physical fall for nostalgic elegance
        drag: 0.985, // Retain float speed
        sparkle: Math.random() > 0.3,
      });
    }
    particlesRef.current = [...particlesRef.current, ...particles];
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    initStars(width, height);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars(width, height);
    };

    window.addEventListener("resize", handleResize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw and update Ambient Stars
      starsRef.current.forEach((star) => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.1) {
          star.speed = -star.speed;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, star.alpha))})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Draw and update Sparkle Particles
      const activeParticles: Particle[] = [];
      particlesRef.current.forEach((p) => {
        p.vx *= p.drag;
        p.vy *= p.drag;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha > 0) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          
          // Outer glowing shadow
          ctx.shadowBlur = p.size * 2;
          ctx.shadowColor = p.color;

          // Sparkle blinking
          let currentSize = p.size;
          if (p.sparkle && Math.random() > 0.5) {
            currentSize *= 1.4;
          }

          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
          activeParticles.push(p);
        }
      });
      particlesRef.current = activeParticles;

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Monitor burst trigger timestamps
  useEffect(() => {
    if (triggerBurst > 0) {
      // Spawn burst from the center area
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2 - 40; // Align with Capsule visually
      spawnBurst(centerX, centerY);
    }
  }, [triggerBurst]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      id="cosmic-particle-canvas"
    />
  );
}
