// components/ui/Logomark.tsx
import React from 'react';

interface LogomarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logomark({ size = 'md', className = '' }: LogomarkProps) {
  const height = size === 'lg' ? 36 : size === 'md' ? 24 : 18;
  // Spacing ratio based on height
  const width = height * 5.6;

  return (
    <div className="flex items-center select-none">
      <svg 
        viewBox="0 0 200 36" 
        width={width} 
        height={height} 
        className={className || "text-black dark:text-white transition-colors"}
      >
        {/* C */}
        <path 
          d="M 23 9 A 9 9 0 1 0 23 27" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="5.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* O */}
        <path 
          d="M 45 7 A 11 11 0 1 0 45 29 A 11 11 0 1 0 45 7 Z" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="5.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* NN (Connected Wave) */}
        <path 
          d="M 68 29 L 68 14 C 68 8 73 8 77 12 L 85 20 C 88 24 91 24 91 20 L 91 14 C 91 8 96 8 100 12 L 108 20 C 111 24 114 24 114 20 L 114 7" 
          fill="none" 
          stroke="#BFF128" 
          strokeWidth="5.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* E */}
        <path 
          d="M 137 7 L 127 7 L 127 29 L 137 29 M 127 18 L 135 18" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="5.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* C */}
        <path 
          d="M 157 9 A 9 9 0 1 0 157 27" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="5.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* T */}
        <path 
          d="M 169 7 L 185 7 M 177 7 L 177 29" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="5.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
        {/* ® */}
        <text 
          x="188" 
          y="12" 
          fontSize="8" 
          fontWeight="900" 
          fontFamily="system-ui, sans-serif" 
          fill="currentColor"
        >
          ®
        </text>
      </svg>
    </div>
  );
}
