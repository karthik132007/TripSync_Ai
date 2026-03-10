import React from 'react';

export const Loader = ({
    size = 'md', // sm, md, lg
    text = '',
    fullScreen = false,
    flexRow = false
}) => {
    const sizeClasses = {
        sm: {
            container: 'w-5 h-5',
            ring1: 'border-[2px]',
            ring2: 'border-[2px]',
            text: 'text-xs'
        },
        md: {
            container: 'w-10 h-10',
            ring1: 'border-[3px]',
            ring2: 'border-[3px]',
            text: 'text-sm'
        },
        lg: {
            container: 'w-16 h-16',
            ring1: 'border-4',
            ring2: 'border-4',
            text: 'text-base'
        }
    };

    const s = sizeClasses[size] || sizeClasses.md;

    const SpinnerContent = () => (
        <div className={`flex ${flexRow ? 'flex-row' : 'flex-col'} items-center justify-center gap-3`}>
            <div className={`relative ${s.container} flex items-center justify-center`}>
                {/* Outer Ring */}
                <div
                    className={`absolute inset-0 rounded-full border-t-coral-500 border-l-transparent border-r-transparent border-b-coral-200/50 ${s.ring1} animate-[spin_1s_linear_infinite]`}
                />
                {/* Middle Ring */}
                <div
                    className={`absolute inset-1 rounded-full border-t-ice-400 border-l-transparent border-r-transparent border-b-ice-200/50 ${s.ring2} animate-[spin_1.5s_linear_infinite_reverse]`}
                />
                {/* Inner Ring */}
                <div
                    className={`absolute inset-2 rounded-full border-t-blush-500 border-l-transparent border-r-transparent border-b-blush-200/50 ${s.ring1} animate-[spin_2s_linear_infinite]`}
                />
            </div>

            {text && (
                <div className={`${s.text} font-medium tracking-wide text-space-600 animate-pulse`}>
                    {text}
                </div>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md">
                 <SpinnerContent />
            </div>
        );
    }

    // For full page replacements where we don't want fixed positioning
    if (size === 'lg' && !fullScreen) {
        return (
             <div className="min-h-[50vh] flex items-center justify-center">
                 <SpinnerContent />
             </div>
        )
    }

    return <SpinnerContent />;
};

