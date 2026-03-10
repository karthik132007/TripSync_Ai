import React from 'react';

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer";

    const variants = {
        primary: "btn-gradient hover:-translate-y-0.5 focus:ring-ice-400",
        secondary: "bg-pink-100 text-pink-600 hover:bg-pink-200 hover:shadow-[0_0_20px_rgba(255,138,170,0.3)] hover:-translate-y-0.5 focus:ring-pink-400",
        outline: "border-2 border-space-200 text-space-700 hover:border-ice-400 hover:text-ice-600 focus:ring-ice-400",
        ghost: "text-space-600 hover:text-ice-600 hover:bg-ice-50 focus:ring-ice-400",
        glass: "glass-acrylic text-space-800 hover:bg-white/90 focus:ring-white/50",
        glassDark: "glass-acrylic-dark text-white hover:bg-space-800/60 focus:ring-white/50",
        dark: "bg-space-900 text-white hover:bg-space-800 hover:-translate-y-0.5 focus:ring-space-700",
    };

    const sizes = {
        sm: "px-5 py-2.5 text-sm",
        md: "px-6 py-3 text-[15px]",
        lg: "px-8 py-4 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
