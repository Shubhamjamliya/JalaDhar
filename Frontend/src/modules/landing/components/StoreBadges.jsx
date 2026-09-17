import React from 'react';

/**
 * Official 4-color Google Play Store SVG Logo
 */
export function GooglePlayLogo({ className = "w-5 h-5 sm:w-6 sm:h-6 shrink-0" }) {
  return (
    <svg className={className} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M38.2 24.2C34.3 28.3 32 34.6 32 43v426c0 8.4 2.3 14.7 6.2 18.8l2.2 2.2L262 268.4v-4.8L40.4 22l-2.2 2.2z"
        fill="#00C3FF"
      />
      <path
        d="M336.8 343.2l-74.8-74.8v-4.8l74.8-74.8 1.7 1 88.6 50.3c25.3 14.4 25.3 38 0 52.4l-88.6 50.3-1.7-0.4z"
        fill="#00E676"
      />
      <path
        d="M338.5 342.8L262 266 40.4 487.6c8.3 8.8 22.1 9.9 37.6 1.1l260.5-145.9z"
        fill="#FF3D00"
      />
      <path
        d="M338.5 169.2L78 23.3C62.5 14.5 48.7 15.6 40.4 24.4L262 246l76.5-76.8z"
        fill="#FFD600"
      />
    </svg>
  );
}

/**
 * Official Apple Logo SVG
 */
export function AppleLogo({ className = "w-5 h-5 sm:w-6 sm:h-6 shrink-0 fill-current" }) {
  return (
    <svg className={className} viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.07-7.75-7.85-12.14-14.34-6.43-9.58-11.41-20.47-14.93-32.67-3.52-12.2-5.28-23.75-5.28-34.65 0-14.42 3.65-26.37 10.95-35.85 7.3-9.48 16.48-14.31 27.54-14.5 5.26 0 11.01 1.49 17.25 4.48 6.24 2.99 10.15 4.54 11.73 4.65 1.8 0 6.01-1.63 12.63-4.9 6.62-3.26 12.44-4.74 17.46-4.43 13.53.64 24.36 5.66 32.48 15.07-11.83 7.18-17.63 17.1-17.4 29.77.23 10.12 4.09 18.57 11.58 25.35 7.49 6.78 16.32 10.42 26.5 10.92-2.54 7.6-5.59 15.07-9.14 22.42zm-35.88-113.88c0 4.12-1.37 8.3-4.11 12.54-2.74 4.24-6.39 7.42-10.95 9.54-.74.1-1.58.15-2.53.15-.32 0-.64-.02-.95-.05-.11-.53-.16-1.11-.16-1.74 0-4.12 1.42-8.3 4.27-12.54 2.85-4.24 6.58-7.39 11.2-9.45.63-.11 1.43-.16 2.38-.16.32 0 .63.02.95.05.1.53.15 1.1.15 1.69z" />
    </svg>
  );
}

/**
 * Reusable Official Google Play Badge Button
 */
export function GooglePlayBadge({
  url = '',
  appName = 'Jaladhaara App',
  variant = 'white', // 'white' | 'dark' | 'glass'
  className = '',
  compact = false
}) {
  const handleClick = (e) => {
    if (!url) {
      e.preventDefault();
      alert(`${appName} will be available shortly on Google Play Store!`);
    }
  };

  const variantStyles = {
    white: 'bg-white text-slate-900 hover:bg-white/95 border border-slate-200 shadow-md hover:shadow-lg',
    dark: 'bg-slate-900 text-white hover:bg-black border border-slate-800 shadow-md hover:shadow-xl',
    glass: 'bg-white/15 text-white hover:bg-white/25 border border-white/30 backdrop-blur-md shadow-md'
  }[variant] || 'bg-white text-slate-900';

  const content = (
    <>
      <GooglePlayLogo className={compact ? 'w-4 h-4 shrink-0' : 'w-5 h-5 sm:w-6 sm:h-6 shrink-0'} />
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider opacity-75">
          GET IT ON
        </span>
        <span className={`${compact ? 'text-xs font-bold' : 'text-xs sm:text-sm font-extrabold'} tracking-tight`}>
          Google Play
        </span>
      </div>
    </>
  );

  const baseClasses = `inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 cursor-pointer group select-none ${variantStyles} ${className}`;

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        aria-label={`Download ${appName} on Google Play`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={baseClasses}
      aria-label={`Download ${appName} on Google Play (Coming Soon)`}
    >
      {content}
    </button>
  );
}

/**
 * Reusable Official Apple App Store Badge Button
 */
export function AppStoreBadge({
  url = '',
  appName = 'Jaladhaara App',
  variant = 'white', // 'white' | 'dark' | 'glass'
  className = '',
  compact = false,
  showSoonBadge = true
}) {
  const handleClick = (e) => {
    if (!url) {
      e.preventDefault();
      alert(`${appName} iOS version will be available shortly on the Apple App Store!`);
    }
  };

  const isLive = Boolean(url);

  const variantStyles = {
    white: 'bg-white text-slate-900 hover:bg-white/95 border border-slate-200 shadow-md hover:shadow-lg',
    dark: 'bg-slate-900 text-white hover:bg-black border border-slate-800 shadow-md hover:shadow-xl',
    glass: 'bg-white/15 text-white hover:bg-white/25 border border-white/30 backdrop-blur-md shadow-md'
  }[variant] || 'bg-white text-slate-900';

  const content = (
    <>
      <AppleLogo className={compact ? 'w-4 h-4 shrink-0 fill-current' : 'w-5 h-5 sm:w-6 sm:h-6 shrink-0 fill-current'} />
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider opacity-75">
          Download on the
        </span>
        <span className={`${compact ? 'text-xs font-bold' : 'text-xs sm:text-sm font-extrabold'} tracking-tight`}>
          App Store
        </span>
      </div>
      {!isLive && showSoonBadge && (
        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 whitespace-nowrap">
          Soon
        </span>
      )}
    </>
  );

  const baseClasses = `inline-flex items-center gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 cursor-pointer group select-none ${variantStyles} ${className}`;

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClasses}
        aria-label={`Download ${appName} on the App Store`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={baseClasses}
      aria-label={`Download ${appName} on Apple App Store (Coming Soon)`}
    >
      {content}
    </button>
  );
}
