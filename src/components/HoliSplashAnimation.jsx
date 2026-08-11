import React, { useEffect, useRef, useState } from 'react';

// Easing functions
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

// Offscreen cache for rendering performance
const plumeCache = {};
const getPlumeCanvas = (colorStr) => {
  if (plumeCache[colorStr]) return plumeCache[colorStr];
  
  const offCanvas = document.createElement('canvas');
  const size = 128; // Reduced for massive performance gains, scaling up naturally blurs it
  offCanvas.width = size;
  offCanvas.height = size;
  const offCtx = offCanvas.getContext('2d');
  
  // Parse hex color
  let r = 255, g = 255, b = 255;
  if (colorStr.startsWith('#')) {
    r = parseInt(colorStr.slice(1, 3), 16);
    g = parseInt(colorStr.slice(3, 5), 16);
    b = parseInt(colorStr.slice(5, 7), 16);
  }

  // Create soft cinematic smoke plume gradient
  const gradient = offCtx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
  gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, 0.6)`);
  gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.2)`);
  gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

  offCtx.fillStyle = gradient;
  offCtx.fillRect(0, 0, size, size);
  
  plumeCache[colorStr] = offCanvas;
  return offCanvas;
};

export default function HoliSplashAnimation() {
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
    const duration = 7000;

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

    const plumes = [];
    const dustParticles = [];

    // Factory for spawning a cloud of smoke plumes and edge dust
    const createBurst = (emitTime, startX, startY, vxBase, vyBase, color, plumeCount, dustCount) => {
      // Spawn large smoke plumes
      for (let i = 0; i < plumeCount; i++) {
        const speed = Math.random() * 0.6 + 0.4;
        const spread = (Math.random() - 0.5) * 1.2; // Cone spread
        
        const baseAngle = Math.atan2(vyBase, vxBase);
        const finalAngle = baseAngle + spread;
        const finalSpeed = Math.sqrt(vxBase*vxBase + vyBase*vyBase) * speed;

        plumes.push({
          x: startX * w,
          y: startY * h,
          vx: Math.cos(finalAngle) * finalSpeed,
          vy: Math.sin(finalAngle) * finalSpeed,
          radius: Math.random() * 300 + 150, // Massive soft plumes
          color: color,
          alpha: Math.random() * 0.4 + 0.4,
          emitTime: emitTime,
          drag: Math.random() * 0.02 + 0.95, // Glides further
          turbulence: Math.random() * 1.5,
          offset: Math.random() * 100
        });
      }

      // Spawn fine edge dust
      for (let i = 0; i < dustCount; i++) {
        const speed = Math.random() * 1.2 + 0.8; // Dust flies faster and wider
        const spread = (Math.random() - 0.5) * 2.0; 
        const baseAngle = Math.atan2(vyBase, vxBase);
        const finalAngle = baseAngle + spread;
        const finalSpeed = Math.sqrt(vxBase*vxBase + vyBase*vyBase) * speed;

        dustParticles.push({
          x: startX * w,
          y: startY * h,
          vx: Math.cos(finalAngle) * finalSpeed,
          vy: Math.sin(finalAngle) * finalSpeed,
          size: Math.random() * 4 + 1,
          color: color,
          alpha: Math.random() * 0.6 + 0.2,
          emitTime: emitTime,
          drag: Math.random() * 0.03 + 0.93,
          turbulence: Math.random() * 3,
          offset: Math.random() * 100
        });
      }
    };

    // 0-1s: Massive Red & Pink from Left
    createBurst(0, -0.1, 0.4, 30, 8, '#FF1744', 20, 60); // Red
    createBurst(200, -0.1, 0.6, 35, -5, '#FF4DA6', 20, 60); // Pink

    // 0.4-1.4s: Massive Blue & Green from Right
    createBurst(400, 1.1, 0.5, -35, -5, '#4D96FF', 20, 60); // Blue
    createBurst(600, 1.1, 0.7, -40, -12, '#4CAF50', 20, 60); // Green

    // 1-2s: Yellow & Orange from Corners
    createBurst(1000, 0.1, -0.1, 20, 25, '#FFD93D', 15, 40); // Yellow (top left)
    createBurst(1200, 0.9, 1.1, -20, -25, '#FF8A3D', 15, 40); // Orange (bottom right)

    const render = (timestamp) => {
      if (!startTime) {
        startTime = timestamp;
        lastTime = timestamp;
      }
      
      const elapsed = timestamp - startTime;
      const dt = timestamp - lastTime;
      lastTime = timestamp;

      const safeDt = Math.min(dt, 32); 
      const timeScale = safeDt / 16.66;

      // Use a subtle blur on the entire canvas to melt the plumes together smoothly
      // and contrast to keep colors vibrant.
      ctx.clearRect(0, 0, w, h);
      
      let globalAlpha = 1;
      let upwardWind = 0; // The 4-6s upward drift

      if (elapsed > 4000 && elapsed <= 6000) {
        // 4-6s: translucent + wind drift
        const t = (elapsed - 4000) / 2000;
        globalAlpha = 1 - (easeInOutQuad(t) * 0.4); 
        upwardWind = easeInOutQuad(t) * -2; // Start drifting up
      } else if (elapsed > 6000) {
        // 6-7s: dissolve
        const t = (elapsed - 6000) / 1000;
        globalAlpha = 0.6 * (1 - easeOutCubic(t));
        upwardWind = -2 - (easeOutCubic(t) * 1); // Accelerate upward
      }

      // Use 'screen' blending to prevent muddy colors when clouds overlap
      ctx.globalCompositeOperation = 'screen';

      // 1. Draw volumetric smoke plumes
      plumes.forEach(p => {
        if (elapsed < p.emitTime) return;

        p.x += p.vx * timeScale;
        p.y += (p.vy + upwardWind) * timeScale;
        
        p.vx *= Math.pow(p.drag, timeScale);
        p.vy *= Math.pow(p.drag, timeScale);

        // Fluid turbulence
        if (elapsed > 1000) {
          const t = elapsed * 0.001;
          p.x += Math.sin(t + p.offset) * p.turbulence * timeScale;
          p.y += Math.cos(t + p.offset) * p.turbulence * timeScale;
          // Plumes slowly expand as they dissipate
          p.radius += 0.2 * timeScale;
        }

        const pAlpha = p.alpha * globalAlpha;
        if (pAlpha <= 0.01) return;

        ctx.globalAlpha = pAlpha;
        const img = getPlumeCanvas(p.color);
        // Draw the cached radial gradient image
        ctx.drawImage(img, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
      });

      // 2. Draw fine edge dust
      // Use 'lighter' for dust so it pops brightly
      ctx.globalCompositeOperation = 'lighter';
      dustParticles.forEach(d => {
        if (elapsed < d.emitTime) return;

        d.x += d.vx * timeScale;
        d.y += (d.vy + upwardWind * 1.5) * timeScale; // Dust catches wind faster
        
        d.vx *= Math.pow(d.drag, timeScale);
        d.vy *= Math.pow(d.drag, timeScale);

        if (elapsed > 1000) {
          const t = elapsed * 0.002;
          d.x += Math.sin(t + d.offset) * d.turbulence * timeScale;
          d.y += Math.cos(t + d.offset) * d.turbulence * timeScale;
        }

        const dAlpha = d.alpha * globalAlpha;
        if (dAlpha <= 0.01) return;

        ctx.globalAlpha = dAlpha;
        ctx.fillStyle = d.color;
        // Small arc for dust
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Center Masking (The Clear Reveal)
      // We use destination-out to gently punch a hole in the rendered smoke
      if (elapsed > 2000) {
        ctx.globalCompositeOperation = 'destination-out';
        let maskOpacity = 0;
        
        if (elapsed <= 4000) {
           // Slowly reveal the center between 2-4s
           maskOpacity = easeInOutQuad((elapsed - 2000) / 2000) * 0.85;
        } else {
           maskOpacity = 0.85;
        }

        if (maskOpacity > 0) {
           const maskRadius = Math.min(w, h) * 0.35; // 35% of screen
           const maskGradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, maskRadius);
           maskGradient.addColorStop(0, `rgba(0,0,0, ${maskOpacity})`);
           maskGradient.addColorStop(0.5, `rgba(0,0,0, ${maskOpacity * 0.5})`);
           maskGradient.addColorStop(1, 'rgba(0,0,0,0)');
           
           ctx.globalAlpha = 1;
           ctx.fillStyle = maskGradient;
           ctx.fillRect(0, 0, w, h);
        }
      }

      // Screen shake (highest intensity during main collisions)
      let shakeX = 0;
      let shakeY = 0;
      if (elapsed > 400 && elapsed < 1400) {
        const shakeIntensity = (1 - Math.abs(elapsed - 900) / 500) * 12; 
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
      }
      container.style.transform = `translate(${shakeX}px, ${shakeY}px)`;

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
        zIndex: 9990,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          // Removed expensive CSS filter for massive performance boost
        }}
      />
      
      {/* Noise overlay to add grain texture to the smoke clouds */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.08, // Very low opacity, removed mixBlendMode for performance
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
