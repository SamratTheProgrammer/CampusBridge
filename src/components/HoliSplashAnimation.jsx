import React, { useEffect, useRef, useState } from 'react';

// Helpers
const randomRange = (min, max) => Math.random() * (max - min) + min;

export default function HoliSplashAnimation() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let startTime = null;
    let lastTime = null;
    const duration = 8000; // Total duration of animation

    let w = window.innerWidth;
    let h = window.innerHeight;

    const resizeCanvas = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const pichkaris = [];
    const balloons = [];
    const splashes = [];
    const drops = [];

    // --- PICHKARI (Water Gun Streams) ---
    const createPichkari = (x, y, angle, color, startDelay, activeDuration) => {
      pichkaris.push({ x, y, angle, color, startDelay, duration: activeDuration, active: false });
    };

    // Setup Pichkaris (from screen edges)
    createPichkari(0, h * 0.8, -Math.PI / 4, '#FF0080', 500, 2000); // Bottom left shooting up right
    createPichkari(w, h * 0.7, -Math.PI * 0.8, '#00CED1', 1200, 1800); // Bottom right shooting up left
    createPichkari(0, h * 0.2, Math.PI / 8, '#FF8C00', 2500, 1500); // Top left shooting down right
    createPichkari(w, h * 0.3, Math.PI * 0.9, '#8A2BE2', 3000, 2000); // Top right shooting down left

    // --- WATER BALLOONS ---
    const spawnBalloon = (x, y, vx, vy, color, delay) => {
      balloons.push({ x, y, vx, vy, color, delay, active: false, burst: false, gravity: 0.15 });
    };

    // Setup Balloons
    spawnBalloon(-50, h * 0.6, 12, -15, '#FF0080', 200); // Left to right
    spawnBalloon(w + 50, h * 0.5, -15, -18, '#00CED1', 1000); // Right to left
    spawnBalloon(-50, h * 0.8, 18, -22, '#FF8C00', 2200); // High arc from left
    spawnBalloon(w + 50, h * 0.9, -12, -24, '#8A2BE2', 3500); // High arc from right

    const createSplash = (x, y, color) => {
      // Create big paint splatter (main puddle)
      splashes.push({ x, y, color, radius: 0, maxRadius: randomRange(80, 150), alpha: 1, age: 0 });
      
      // Create flying drops that explode outward
      for(let i=0; i<40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = randomRange(5, 20);
        drops.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          size: randomRange(3, 10),
          gravity: 0.3,
          alpha: 1
        });
      }
    };

    const render = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
        lastTime = timestamp;
      }
      
      const elapsed = timestamp - startTime;
      const dt = timestamp - lastTime;
      lastTime = timestamp;

      // Global fade out near the end of the 8 seconds
      let fadeOutAlpha = 1;
      if (elapsed > duration - 1000) {
         fadeOutAlpha = Math.max(0, 1 - (elapsed - (duration - 1000)) / 1000);
      }

      ctx.clearRect(0, 0, w, h);

      // 1. Render Background Splashes (from burst balloons)
      splashes.forEach(s => {
         s.age += dt;
         s.radius += (s.maxRadius - s.radius) * 0.15; // Ease out growing radius
         s.alpha = Math.max(0, 1 - s.age / 3500); // Fade out over 3.5 seconds

         ctx.globalAlpha = s.alpha * fadeOutAlpha;
         ctx.fillStyle = s.color;
         ctx.beginPath();
         // Main splatter blob
         ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
         ctx.fill();
         
         // Secondary irregular blobs around the splash
         for(let i=0; i<6; i++) {
             ctx.beginPath();
             const angle = (i * Math.PI) / 3;
             const dist = s.radius * 1.2;
             ctx.arc(s.x + Math.sin(angle)*dist, s.y + Math.cos(angle)*dist, s.radius*0.3, 0, Math.PI*2);
             ctx.fill();
         }
      });

      // 2. Process and Render Pichkaris (Water Guns)
      ctx.globalAlpha = 0.9 * fadeOutAlpha;
      pichkaris.forEach(p => {
        if (elapsed > p.startDelay && elapsed < p.startDelay + p.duration) {
          // Spawn continuous stream of drops every frame
          for(let i=0; i<6; i++) {
            const spread = randomRange(-0.12, 0.12);
            const speed = randomRange(15, 28);
            drops.push({
              x: p.x, 
              y: p.y,
              vx: Math.cos(p.angle + spread) * speed,
              vy: Math.sin(p.angle + spread) * speed,
              color: p.color,
              size: randomRange(3, 12),
              gravity: 0.15,
              alpha: 1
            });
          }
        }
      });

      // 3. Process and Render Drops
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.x += d.vx;
        d.y += d.vy;
        d.vy += d.gravity; // Gravity pulling drops down
        d.alpha -= 0.015; // Drops fade as they fly

        if (d.alpha <= 0 || d.y > h + 50) {
          drops.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, d.alpha * fadeOutAlpha);
        ctx.fillStyle = d.color;
        ctx.beginPath();
        // Drop shape (elongated horizontally based on velocity)
        const stretch = 1 + Math.abs(d.vx)*0.02 + Math.abs(d.vy)*0.02;
        ctx.ellipse(d.x, d.y, d.size * stretch, d.size, Math.atan2(d.vy, d.vx), 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Process and Render Balloons
      ctx.globalAlpha = 1 * fadeOutAlpha;
      balloons.forEach(b => {
        if (elapsed > b.delay && !b.burst) {
          b.active = true;
        }

        if (b.active) {
          b.x += b.vx;
          b.y += b.vy;
          b.vy += b.gravity;

          // Burst condition: falls below 70% of screen height and is falling downwards
          if (b.y > h * 0.7 && b.vy > 0) {
            b.burst = true;
            b.active = false;
            createSplash(b.x, b.y, b.color);
            
            // Subtle screen shake on burst
            const shakeX = randomRange(-10, 10);
            const shakeY = randomRange(-10, 10);
            container.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
            setTimeout(() => {
                if(containerRef.current) containerRef.current.style.transform = 'translate(0px, 0px)';
            }, 60);
          }

          // Draw unburst Balloon
          if (!b.burst) {
            ctx.fillStyle = b.color;
            ctx.beginPath();
            // Teardrop / oval shape aligned with trajectory
            ctx.ellipse(b.x, b.y, 25, 30, Math.atan2(b.vy, b.vx) + Math.PI/2, 0, Math.PI*2);
            ctx.fill();
            
            // White highlight reflection for a glossy wet balloon look
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            ctx.beginPath();
            ctx.arc(b.x - 8, b.y - 8, 6, 0, Math.PI*2);
            ctx.fill();
          }
        }
      });

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setIsAnimating(false);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  if (!isAnimating) return null;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999, // Render above the navbar and UI
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
