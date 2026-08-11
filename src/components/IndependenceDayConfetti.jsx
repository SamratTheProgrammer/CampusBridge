import React, { useEffect, useRef, useState } from 'react';

export default function IndependenceDayConfetti() {
    const canvasRef = useRef(null);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        resize();
        window.addEventListener('resize', resize);

        const particles = [];
        const flagW = Math.min(width * 0.8, 700);
        const flagH = flagW * (2 / 3);
        const bandH = flagH / 3;
        const cx = width / 2;
        const cy = height / 2;

        // Burst origins
        const startSaffron = { x: -50, y: height * 0.4 };
        const startGreen = { x: width + 50, y: height * 0.6 };
        const startWhite = { x: cx, y: height + 50 };

        const colors = {
            saffron: '#FF9933',
            white: '#FFFFFF',
            green: '#138808',
            navy: '#000080'
        };

        const easeInOutQuad = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        // Create particles for horizontal bands
        const createBand = (color, startPos, bandIndex, count) => {
            for (let i = 0; i < count; i++) {
                // Target position within the band
                const tx = cx - flagW / 2 + Math.random() * flagW;
                const ty = cy - flagH / 2 + (bandIndex * bandH) + Math.random() * bandH;

                let vx, vy;
                if (startPos.x < 0) { // Saffron (left)
                    vx = Math.random() * 25 + 10;
                    vy = (Math.random() - 0.5) * 30 - 10;
                } else if (startPos.x > width) { // Green (right)
                    vx = Math.random() * -25 - 10;
                    vy = (Math.random() - 0.5) * 30 - 10;
                } else { // White (bottom)
                    vx = (Math.random() - 0.5) * 20;
                    vy = Math.random() * -35 - 15;
                }

                particles.push({
                    x: startPos.x, y: startPos.y,
                    vx, vy,
                    targetX: tx, targetY: ty,
                    color: color,
                    size: Math.random() * 2.5 + 1.5,
                    ix: 0, iy: 0, // interpolation origin (saved at t=2.0)
                    phase2Delay: Math.random() * 0.4 // staggered start for smooth formation
                });
            }
        };

        createBand(colors.saffron, startSaffron, 0, 800);
        createBand(colors.white, startWhite, 1, 600);
        createBand(colors.green, startGreen, 2, 800);

        // Create Ashoka Chakra
        const radius = bandH / 2 * 0.8;
        
        // Chakra Outer Ring
        for (let i = 0; i < 300; i++) {
            const angle = (i / 300) * Math.PI * 2;
            const tx = cx + Math.cos(angle) * radius;
            const ty = cy + Math.sin(angle) * radius;

            particles.push({
                x: startWhite.x, y: startWhite.y,
                vx: (Math.random() - 0.5) * 20, vy: Math.random() * -35 - 15,
                targetX: tx, targetY: ty,
                color: colors.navy,
                size: 2,
                ix: 0, iy: 0,
                phase2Delay: Math.random() * 0.4
            });
        }
        
        // Chakra 24 Spokes
        for (let i = 0; i < 24; i++) {
            const angle = (i * Math.PI * 2) / 24;
            // Draw particles along each spoke
            for (let r = 0; r < radius; r += radius / 12) {
                const tx = cx + Math.cos(angle) * r;
                const ty = cy + Math.sin(angle) * r;
                particles.push({
                    x: startWhite.x, y: startWhite.y,
                    vx: (Math.random() - 0.5) * 20, vy: Math.random() * -35 - 15,
                    targetX: tx, targetY: ty,
                    color: colors.navy,
                    size: 1.8,
                    ix: 0, iy: 0,
                    phase2Delay: Math.random() * 0.4
                });
            }
        }

        const startTime = Date.now();
        const gravity = 0.2;
        const friction = 0.96; // 0.96 friction creates a nice floaty confetti effect

        const render = () => {
            ctx.clearRect(0, 0, width, height);
            
            const elapsed = (Date.now() - startTime) / 1000; // time in seconds

            // Phase 4: Fade out (8s - 9s)
            let globalAlpha = 1;
            if (elapsed > 8) {
                globalAlpha = Math.max(0, 1 - (elapsed - 8));
            }
            ctx.globalAlpha = globalAlpha;

            particles.forEach(p => {
                if (elapsed < 2.0) {
                    // Phase 1: Free physics burst (0 - 2s)
                    p.vy += gravity;
                    p.vx *= friction;
                    p.vy *= friction;
                    p.x += p.vx;
                    p.y += p.vy;
                    
                    // Continually snapshot position so it's ready exactly when phase 2 begins
                    p.ix = p.x;
                    p.iy = p.y;
                } else if (elapsed < 5.0) {
                    // Phase 2: Smooth convergence to flag targets (2 - 5s)
                    let progress = (elapsed - 2.0 - p.phase2Delay) / (3.0 - p.phase2Delay);
                    progress = Math.max(0, Math.min(1, progress));
                    
                    const eased = easeInOutQuad(progress);
                    
                    // Animate smoothly from the snapped burst position (ix, iy) to the target
                    p.x = p.ix + (p.targetX - p.ix) * eased;
                    p.y = p.iy + (p.targetY - p.iy) * eased;
                } else {
                    // Phase 3: Hold flag in place (5 - 8s) & Phase 4: Fade out (8 - 9s)
                    p.x = p.targetX;
                    p.y = p.targetY;
                }

                // Render particle
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            if (elapsed < 9.0) {
                animationFrameId = requestAnimationFrame(render);
            } else {
                setIsVisible(false); // Triggers unmount
            }
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
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
                width: '100vw',
                height: '100vh',
                zIndex: 9990,
                pointerEvents: 'none'
            }}
        />
    );
}