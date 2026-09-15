import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  className = '',
  as = 'a',
  href = '#',
  type = 'button',
  onClick,
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2';

  const variants = {
    primary:
      'bg-[#0077B6] hover:bg-[#023E8A] text-white px-5 py-2.5 text-sm shadow-md shadow-[#0077B6]/20',
    secondary:
      'border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:bg-black/5 px-5 py-2.5 text-sm shadow-sm',
    dark:
      'bg-black text-white hover:bg-gray-800 px-5 py-2.5 text-sm shadow-md',
  };

  const classes = `${base} ${variants[variant] ?? variants.primary} ${className}`;

  if (as === 'button') {
    return (
      <button type={type} className={classes} onClick={onClick}>
        {children}
      </button>
    );
  }

  return (
    <a href={href} className={classes} onClick={onClick}>
      {children}
    </a>
  );
}
