import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';

export default function Logo({ light = false, compact = false }) {
  return (
    <Link to="/" className="group flex items-center gap-2 sm:gap-2.5 select-none">
      <img 
        src={logoImg} 
        alt="Jaladhaara Logo" 
        className="h-9 sm:h-11 w-auto mix-blend-darken rounded-lg object-contain transition-transform group-hover:scale-105"
      />
      <span className="font-display font-bold text-lg sm:text-2xl tracking-tight text-[var(--color-text-primary)]">
        Jaladhaara
      </span>
    </Link>
  );
}
