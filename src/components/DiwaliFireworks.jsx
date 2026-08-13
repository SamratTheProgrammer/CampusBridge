import React, { useEffect, useRef, useState } from 'react';

const DiwaliFireworks = () => {
  const canvasRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let fireworks = [];
    let lastFireworkTime = 0;
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Warm Diwali colors
    const colors = ['#FFD700', '#FFC107', '#FFEB3B', '#FFB74D'];
    
    class Particle {
      constructor(x, y, color, speed, angle) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = Math.random() * 1.5 + 0.8;
        this.alpha = 1;
        this.life = 0;
        this.maxLife = Math.random() * 90 + 60; // 1 to 1.5 seconds lifespan
        this.friction = 0.95; // Less friction to travel much farther
        this.gravity = 0.015; // Gentle float downwards
      }
      
      update() {
        this.vx *= this.friction;
        this.vy *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.life++;
        // Smooth fade out
        this.alpha = Math.max(0, 1 - (this.life / this.maxLife));
      }
      
      draw(ctx, globalAlpha) {
        // Spark trail
        ctx.globalAlpha = this.alpha * globalAlpha;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        // Trail length based on velocity
        ctx.lineTo(this.x - this.vx * 3, this.y - this.vy * 3);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.radius * 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Gentle glow around spark
        ctx.globalAlpha = this.alpha * globalAlpha * 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }
    
    class Firework {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.age = 0;
        
        // 250 to 500px radius roughly corresponds to maxSpeed around 8 to 15
        const maxSpeed = Math.random() * 7 + 8; 
        const numParticles = Math.floor(Math.random() * 70 + 80); // 80-150 particles
        
        for (let i = 0; i < numParticles; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * maxSpeed + 0.5;
          const color = colors[Math.floor(Math.random() * colors.length)];
          this.particles.push(new Particle(x, y, color, speed, angle));
        }
      }
      
      update() {
        this.age++;
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.alpha > 0);
      }
      
      draw(ctx, globalAlpha) {
        // Initial bright point burst effect for the first few frames
        if (this.age < 10) {
           const pointAlpha = (1 - this.age / 10) * globalAlpha;
           ctx.globalAlpha = pointAlpha;
           ctx.shadowBlur = 15;
           ctx.shadowColor = '#FFD700';
           ctx.beginPath();
           ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
           ctx.fillStyle = '#FFF';
           ctx.fill();
           ctx.shadowBlur = 0; // Reset for performance
        }

        this.particles.forEach(p => p.draw(ctx, globalAlpha));
      }
    }

    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      // Stop completely after 5 seconds
      if (elapsed > 5000) {
        setIsVisible(false);
        return;
      }
      
      // Calculate global alpha for the final second fade out
      let globalAlpha = 1;
      if (elapsed > 4000) {
        globalAlpha = Math.max(0, 1 - (elapsed - 4000) / 1000);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Use lighter composition for a slight bloom effect where particles overlap
      ctx.globalCompositeOperation = 'lighter'; 
      
      // Spawn new fireworks if we haven't reached the final second fade-out
      if (elapsed < 4000 && fireworks.length < 6 && now - lastFireworkTime > Math.random() * 200 + 300) {
        // Appear across the entire screen, especially top 80%
        const fx = Math.random() * canvas.width;
        const fy = Math.random() * (canvas.height * 0.8);
        
        fireworks.push(new Firework(fx, fy));
        lastFireworkTime = now;
      }
      
      fireworks.forEach(f => {
        f.update();
        f.draw(ctx, globalAlpha);
      });
      
      // Clean up dead fireworks
      fireworks = fireworks.filter(f => f.particles.length > 0);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999, // Ensure it's on top of everything
      }}
    />
  );
};

export default DiwaliFireworks;
