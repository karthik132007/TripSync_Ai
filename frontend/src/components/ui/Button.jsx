import React from 'react';

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    ...props
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2";

    const variants = {
        primary: "bg-coral-400 text-white hover:bg-coral-500 hover:shadow-[0_0_20px_#ff949466] hover:-translate-y-0.5 focus:ring-coral-400",
        secondary: "bg-ice-400 text-space-900 hover:bg-ice-500 hover:shadow-[0_0_20px_#a6e3e966] hover:-translate-y-0.5 focus:ring-ice-400",
        outline: "border-2 border-space-200 text-space-700 hover:border-coral-400 hover:text-coral-500 focus:ring-coral-400",
        ghost: "text-space-600 hover:text-coral-500 hover:bg-coral-50 focus:ring-coral-400",
        glass: "glass-acrylic text-space-800 hover:bg-white/90 focus:ring-white/50",
        glassDark: "glass-acrylic-dark text-white hover:bg-space-800/60 focus:ring-white/50"
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg"
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
