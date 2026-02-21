import React, { useEffect, useRef, useCallback } from 'react';

/**
 * Electron-style cursor particles — particles orbit the cursor
 * in perfectly circular paths across multiple orbital shells,
 * like electrons revolving around a nucleus.
 */
const CursorParticles = () => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: -200, y: -200 });
    const smoothMouseRef = useRef({ x: -200, y: -200 });
    const particlesRef = useRef([]);
    const rafRef = useRef(null);

    const COLORS = [
        { r: 166, g: 227, b: 233 },  // ice
        { r: 255, g: 209, b: 209 },  // blush
        { r: 255, g: 148, b: 148 },  // coral
        { r: 82, g: 196, b: 208 },  // ice-500
        { r: 182, g: 234, b: 238 },  // ice-200
    ];

    // Orbital shells — like electron shells (K, L, M)
    const SHELLS = [
        { radius: 28, count: 4, speed: 0.035, size: 2.0, opacity: 0.7 },  // inner shell
        { radius: 50, count: 6, speed: 0.022, size: 1.8, opacity: 0.55 }, // middle shell
        { radius: 78, count: 8, speed: 0.014, size: 1.5, opacity: 0.4 },  // outer shell
    ];

    const initParticles = useCallback(() => {
        const particles = [];
        SHELLS.forEach((shell, shellIndex) => {
            for (let i = 0; i < shell.count; i++) {
                // Evenly space particles in each shell
                const baseAngle = (Math.PI * 2 * i) / shell.count;
                // Tilt each shell differently (like electron orbital planes)
                const tiltX = shellIndex === 0 ? 0 : (shellIndex === 1 ? 0.4 : -0.3);
                const tiltY = shellIndex === 0 ? 0 : (shellIndex === 1 ? -0.2 : 0.5);

                particles.push({
                    shellIndex,
                    angle: baseAngle,
                    radius: shell.radius,
                    speed: shell.speed * (Math.random() > 0.5 ? 1 : -1), // some orbit clockwise, some counter-clockwise
                    size: shell.size,
                    color: COLORS[Math.floor(Math.random() * COLORS.length)],
                    opacity: shell.opacity,
                    tiltX,
                    tiltY,
                    x: 0,
                    y: 0,
                    trail: [], // position trail for motion blur
                });
            }
        });
        return particles;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        particlesRef.current = initParticles();

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove, { passive: true });

        const handleMouseLeave = () => {
            mouseRef.current.x = -200;
            mouseRef.current.y = -200;
        };
        document.addEventListener('mouseleave', handleMouseLeave);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const mx = mouseRef.current.x;
            const my = mouseRef.current.y;

            // Smooth follow for the orbit center
            smoothMouseRef.current.x += (mx - smoothMouseRef.current.x) * 0.12;
            smoothMouseRef.current.y += (my - smoothMouseRef.current.y) * 0.12;

            const cx = smoothMouseRef.current.x;
            const cy = smoothMouseRef.current.y;

            // Don't render if cursor is off-screen
            if (mx < -100 || my < -100) {
                rafRef.current = requestAnimationFrame(animate);
                return;
            }

            // Draw faint orbital rings
            SHELLS.forEach((shell) => {
                ctx.beginPath();
                ctx.arc(cx, cy, shell.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(166, 227, 233, 0.04)`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            });

            // Update and draw particles
            particlesRef.current.forEach((p) => {
                // Advance orbital angle
                p.angle += p.speed;

                // Calculate 3D-projected position (tilted orbital plane)
                const cosA = Math.cos(p.angle);
                const sinA = Math.sin(p.angle);

                // Apply tilt to create 3D elliptical projection
                const projX = cosA * p.radius;
                const projY = sinA * p.radius * (1 - Math.abs(p.tiltX) * 0.4);

                // Depth factor for 3D feel (particles behind cursor are smaller/dimmer)
                const depth = 0.7 + 0.3 * (sinA * p.tiltX + cosA * p.tiltY + 1) / 2;

                p.x = cx + projX;
                p.y = cy + projY;

                // Update trail (last 4 positions for motion blur)
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 4) p.trail.shift();

                // Draw motion trail
                for (let t = 0; t < p.trail.length - 1; t++) {
                    const trailOpacity = (t / p.trail.length) * p.opacity * depth * 0.3;
                    const trailSize = p.size * depth * (t / p.trail.length) * 0.7;
                    ctx.beginPath();
                    ctx.arc(p.trail[t].x, p.trail[t].y, trailSize, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${trailOpacity})`;
                    ctx.fill();
                }

                // Draw main particle
                const mainSize = p.size * depth;
                ctx.beginPath();
                ctx.arc(p.x, p.y, mainSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity * depth})`;
                ctx.fill();

                // Glow halo
                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, mainSize * 3);
                glow.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.opacity * depth * 0.25})`);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(p.x, p.y, mainSize * 3, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [initParticles]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[999] pointer-events-none"
        />
    );
};

export default CursorParticles;
