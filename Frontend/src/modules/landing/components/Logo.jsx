import React from 'react';
import { Link } from 'react-router-dom';
import headerLogo from '@/assets/Header-logoo.png';
import logoImg from '../assets/logo.png';

export default function Logo({ light = false, compact = false, className = "" }) {
  if (light) {
    return (
      <Link to="/" className={`group inline-flex items-center gap-2 sm:gap-2.5 select-none shrink-0 ${className}`}>
        <img 
          src={logoImg} 
          alt="Jaladhaara Logo" 
          className={`${compact ? 'h-7 sm:h-8' : 'h-8 sm:h-10'} w-auto object-contain transition-transform duration-200 group-hover:scale-105 shrink-0`}
        />
        <span className={`font-display font-extrabold ${compact ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl'} tracking-tight leading-none shrink-0 text-white`}>
          Jaladhaara
        </span>
      </Link>
    );
  }

  return (
    <Link to="/" className={`group inline-flex items-center select-none shrink-0 ${className}`}>
      <img 
        src={headerLogo} 
        alt="Jaladhaara Logo" 
        className={`${compact ? 'h-8 sm:h-9' : 'h-8 sm:h-10 md:h-11'} w-auto max-w-[150px] sm:max-w-[180px] md:max-w-[210px] object-contain transition-transform duration-200 group-hover:scale-105 shrink-0`}
      />
    </Link>
  );
}



