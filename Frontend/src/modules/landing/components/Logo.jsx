import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export default function Logo({ light = false, compact = false, className = "" }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      <img 
        src={logoImg} 
        alt="Jaladhaara Logo" 
        className={`${compact ? 'h-8 sm:h-9' : 'h-9 sm:h-[42px]'} w-auto mix-blend-darken object-contain transition-transform duration-200 group-hover:scale-105 shrink-0 -translate-y-1 sm:-translate-y-1.5 drop-shadow-xs`}
      />
      <span className={`font-display font-extrabold ${compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'} tracking-tight leading-none ${light ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>
        Jaladhaara
      </span>
    </Link>
  );
}


