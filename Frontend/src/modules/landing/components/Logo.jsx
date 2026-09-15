import React from 'react';
import logoImg from '../assets/logo.jpg';

export default function Logo({ light = false, compact = false }) {
  return (
    <a href="#home" className="group flex items-center gap-2 sm:gap-3">
      <img 
        src={logoImg} 
        alt="Jaladhaara Logo" 
        className="h-10 sm:h-12 w-auto mix-blend-darken rounded-lg"
      />
      <span className="font-display font-bold text-xl sm:text-2xl tracking-tight text-[var(--color-text-primary)]">
        Jaladhaara
      </span>
    </a>
  );
}
