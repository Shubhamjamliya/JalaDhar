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
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
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
    dark: 'bg-black text-white hover:bg-neutral-900 border border-neutral-700 hover:border-neutral-500 shadow-sm',
    glass: 'bg-white/15 text-white hover:bg-white/25 border border-white/30 backdrop-blur-md shadow-md'
  }[variant] || 'bg-white text-slate-900';

  const content = (
    <>
      <GooglePlayLogo className={compact ? 'w-4 h-4 shrink-0' : 'w-5 h-5 sm:w-6 sm:h-6 shrink-0'} />
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[9px] sm:text-[10px] uppercase font-semibold tracking-wider opacity-75 whitespace-nowrap">
          GET IT ON
        </span>
        <span className={`${compact ? 'text-xs font-bold' : 'text-xs sm:text-sm font-extrabold'} tracking-tight whitespace-nowrap`}>
          Google Play
        </span>
      </div>
    </>
  );

  const padClasses = compact 
    ? 'gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2' 
    : 'gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5';
  const baseClasses = `inline-flex items-center ${padClasses} rounded-xl transition-all duration-200 cursor-pointer group select-none ${variantStyles} ${className}`;

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
    dark: 'bg-black text-white hover:bg-neutral-900 border border-neutral-700 hover:border-neutral-500 shadow-sm',
    glass: 'bg-white/15 text-white hover:bg-white/25 border border-white/30 backdrop-blur-md shadow-md'
  }[variant] || 'bg-white text-slate-900';

  const content = (
    <>
      <AppleLogo className={compact ? 'w-4 h-4 shrink-0 fill-current' : 'w-5 h-5 sm:w-6 sm:h-6 shrink-0 fill-current'} />
      <div className="flex flex-col text-left leading-tight">
        <span className="text-[9px] sm:text-[10px] font-semibold tracking-wider opacity-75 whitespace-nowrap">
          Download on the
        </span>
        <span className={`${compact ? 'text-xs font-bold' : 'text-xs sm:text-sm font-extrabold'} tracking-tight whitespace-nowrap`}>
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

  const padClasses = compact 
    ? 'gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2' 
    : 'gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5';
  const baseClasses = `inline-flex items-center ${padClasses} rounded-xl transition-all duration-200 cursor-pointer group select-none ${variantStyles} ${className}`;

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
