import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Button from './Button';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Services', path: '/services' },
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'About Us', path: '/about' },
  { label: 'Contact Us', path: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isItemActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/landing';
    }
    return location.pathname === path;
  };

  const handleDownloadAppClick = (e) => {
    if (location.pathname === '/' || location.pathname === '/landing') {
      e.preventDefault();
      const el = document.getElementById('apps');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/#apps');
    }
    if (open) setOpen(false);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? 'bg-white/95 backdrop-blur-xl border-b border-[#7FCDFF]/40 shadow-sm'
          : 'bg-white/70 backdrop-blur-md border-b border-white/50'
      }`}
    >
      <nav className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2">
        <Logo />

        <ul className="hidden items-center gap-2 xl:gap-5 2xl:gap-7 lg:flex">
          {navItems.map((item) => {
            const active = isItemActive(item.path);
            return (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className={`relative text-[12px] xl:text-[13px] 2xl:text-sm font-semibold transition-colors py-1 whitespace-nowrap ${
                    active
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute -bottom-1.5 left-0 h-[3px] w-full rounded-t-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(0,119,182,0.6)]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:flex items-center">
          <Button 
            onClick={handleDownloadAppClick}
            className="whitespace-nowrap px-4 xl:px-5 py-2.5 text-xs xl:text-sm shadow-md cursor-pointer"
          >
            Download App
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-[var(--color-text-primary)] hover:bg-black/5 transition-colors"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-[var(--color-overlay)] backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      ></div>

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed top-0 right-0 z-50 h-screen w-[280px] sm:w-[320px] bg-white border-l border-[var(--color-border)] shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 h-16 sm:h-20 border-b border-[var(--color-border)]">
          <span className="text-[var(--color-text-primary)] font-bold text-lg">Menu</span>
          <button
            type="button"
            className="rounded-lg p-2 text-[var(--color-text-primary)] hover:bg-black/10 transition-colors"
            onClick={() => setOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active = isItemActive(item.path);
              return (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${
                      active
                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-black/5 hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        <div className="p-6 border-t border-[var(--color-border)] pb-8 flex flex-col gap-3">
          <Button 
            onClick={handleDownloadAppClick}
            className="w-full justify-center h-12 text-sm cursor-pointer"
          >
            Download App
          </Button>
        </div>
      </div>
    </header>
  );
}
