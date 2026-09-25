import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export default function Logo({ light = false, compact = false, className = "" }) {
  return (
    <Link to="/" className={`group inline-flex items-center gap-2 sm:gap-2.5 select-none shrink-0 ${className}`}>
      <img 
        src={logoImg} 
        alt="Jaladhaara Logo" 
        className={`${compact ? 'h-7 sm:h-8' : 'h-8 sm:h-[40px]'} w-auto mix-blend-darken object-contain transition-transform duration-200 group-hover:scale-105 shrink-0 -translate-y-0.5 sm:-translate-y-1 drop-shadow-xs`}
      />
      <span className={`font-display font-extrabold ${compact ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl'} tracking-tight leading-none shrink-0 ${light ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>
        Jaladhaara
      </span>
    </Link>
  );
}



