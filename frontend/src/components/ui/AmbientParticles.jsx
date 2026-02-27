import React, { useRef, useEffect, useCallback } from 'react';

export const AmbientParticles = () => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const rafRef = useRef(null);

    const COLORS = [
        { r: 166, g: 227, b: 233 },
        { r: 255, g: 209, b: 209 },
        { r: 255, g: 148, b: 148 },
        { r: 82, g: 196, b: 208 },
        { r: 182, g: 234, b: 238 },
    ];

    const initParticles = useCallback((w, h) => {
        return Array.from({ length: 50 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3 - 0.15,
            size: Math.random() * 2.5 + 0.8,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            opacity: Math.random() * 0.4 + 0.1,
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.02 + 0.005,
        }));
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = document.documentElement.scrollHeight;
            if (particlesRef.current.length === 0) {
                particlesRef.current = initParticles(canvas.width, canvas.height);
            }
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                p.pulse += p.pulseSpeed;

                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.y < -10) p.y = canvas.height + 10;
                if (p.y > canvas.height + 10) p.y = -10;

                const dynamicOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
                const dynamicSize = p.size * (0.85 + 0.15 * Math.sin(p.pulse));

                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, dynamicSize * 4);
                glow.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${dynamicOpacity * 0.3})`);
                glow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.beginPath();
                ctx.arc(p.x, p.y, dynamicSize * 4, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, dynamicSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${dynamicOpacity})`;
                ctx.fill();
            });

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', resize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [initParticles]);

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
};
