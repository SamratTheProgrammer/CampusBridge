import React, { useEffect, useRef, useState } from 'react';

// Helpers
const randomRange = (min, max) => Math.random() * (max - min) + min;
const colors = ['#FFD700', '#FF4500', '#FF8C00', '#FFFFFF', '#00FFFF', '#FF1493', '#39FF14'];

export default function DiwaliFireworks() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let animationFrameId;
    let startTime = null;
    let lastTime = null;
    const duration = 8000; 

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

    const rockets = [];
    const particles = [];
    let flashes = [];

    const spawnRocket = (delay, targetHeight) => {
      rockets.push({
        x: randomRange(w * 0.1, w * 0.9),
        y: h + 10,
        vx: randomRange(-2, 2),
        vy: -randomRange(15, 23),
        color: colors[Math.floor(Math.random() * colors.length)],
        delay,
        active: false,
        exploded: false,
        targetHeight: h * targetHeight // Explode when reaching this height
      });
    };

    // Cinematic sequence of rockets
    spawnRocket(200, 0.3);
    spawnRocket(800, 0.4);
    spawnRocket(1500, 0.2);
    spawnRocket(2200, 0.5);
    spawnRocket(3000, 0.3);
    spawnRocket(3200, 0.4);
    spawnRocket(3500, 0.15); // Huge Finale burst
    spawnRocket(4500, 0.3);
    spawnRocket(5000, 0.4);
    spawnRocket(5500, 0.2);

    const explode = (x, y, color, isHuge = false) => {
      const count = isHuge ? 250 : 120;
      const blastRadius = isHuge ? 25 : 15;
      
      for(let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * blastRadius;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          // Mix primary explosion color with some random festive colors
          color: Math.random() > 0.3 ? color : colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          size: randomRange(1.5, 3.5),
          gravity: 0.15,
          friction: 0.94,
          flicker: Math.random() > 0.5
        });
      }

      // Immersive screen flash
      flashes.push({ alpha: isHuge ? 0.3 : 0.15, color, decay: 0.015 });

      // Screen shake for impact
      const shakeIntensity = isHuge ? 12 : 5;
      container.style.transform = `translate(${randomRange(-shakeIntensity, shakeIntensity)}px, ${randomRange(-shakeIntensity, shakeIntensity)}px)`;
      setTimeout(() => {
          if(containerRef.current) containerRef.current.style.transform = 'translate(0px, 0px)';
      }, 60);
    };

    const render = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
        lastTime = timestamp;
      }
      
      const elapsed = timestamp - startTime;
      const dt = timestamp - lastTime;
      lastTime = timestamp;

      // Darken the background slowly to create glowing trails
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'; // Higher value = shorter trails
      ctx.fillRect(0, 0, w, h);
      
      ctx.globalCompositeOperation = 'lighter';

      let fadeOutAlpha = 1;
      if (elapsed > duration - 1000) {
         fadeOutAlpha = Math.max(0, 1 - (elapsed - (duration - 1000)) / 1000);
      }

      // Render screen flashes
      if (flashes.length > 0) {
        ctx.globalCompositeOperation = 'source-over';
        flashes.forEach(f => {
          ctx.globalAlpha = f.alpha * fadeOutAlpha;
          ctx.fillStyle = f.color;
          ctx.fillRect(0, 0, w, h);
          f.alpha -= f.decay;
        });
        flashes = flashes.filter(f => f.alpha > 0);
        ctx.globalCompositeOperation = 'lighter';
      }

      // Render Rockets
      rockets.forEach(r => {
        if (elapsed > r.delay && !r.exploded) {
          r.active = true;
        }

        if (r.active) {
          r.x += r.vx;
          r.y += r.vy;
          r.vy += 0.2; // Gravity pulling rocket down

          // Explode when reaching apex or target height
          if (r.vy >= -2 || r.y <= r.targetHeight) {
            r.exploded = true;
            r.active = false;
            explode(r.x, r.y, r.color, r.targetHeight <= h * 0.2); // High rockets trigger huge explosions
          } else {
            // Draw rocket glowing head
            ctx.globalAlpha = fadeOutAlpha;
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(r.x, r.y, 2, 0, Math.PI*2);
            ctx.fill();
            
            // Halo
            ctx.globalAlpha = 0.5 * fadeOutAlpha;
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(r.x, r.y, 6, 0, Math.PI*2);
            ctx.fill();

            // Leave a trail of sparks
            if (Math.random() > 0.4) {
              particles.push({
                x: r.x, y: r.y,
                vx: randomRange(-1.5, 1.5),
                vy: randomRange(0, 3),
                color: '#FF4500',
                alpha: 1,
                size: randomRange(1, 2.5),
                gravity: 0.05,
                friction: 0.98,
                flicker: false
              });
            }
          }
        }
      });

      // Render Particles (Explosions & Sparks)
      ctx.globalAlpha = fadeOutAlpha;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        
        // Flicker effect for dying sparks
        if (p.flicker && Math.random() > 0.7) {
          p.alpha -= randomRange(0.05, 0.15);
        } else {
          p.alpha -= 0.015; // Natural fade
        }

        if (p.alpha <= 0 || p.y > h) {
          particles.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, p.alpha * fadeOutAlpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
        
        // Inner intense glow
        ctx.globalAlpha = Math.max(0, p.alpha * 0.4 * fadeOutAlpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI*2);
        ctx.fill();
      }

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
        zIndex: 9999, // Render above everything
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
