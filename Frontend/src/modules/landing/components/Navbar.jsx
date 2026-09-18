import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Menu, 
  X, 
  Home, 
  Droplets, 
  Compass, 
  Users, 
  HelpCircle, 
  PhoneCall, 
  ChevronRight, 
  Download, 
  Mail 
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Button from './Button';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Services', path: '/services', icon: Droplets },
  { label: 'How It Works', path: '/how-it-works', icon: Compass },
  { label: 'About Us', path: '/about', icon: Users },
  { label: 'FAQs', path: '/faqs', icon: HelpCircle },
  { label: 'Contact Us', path: '/contact', icon: PhoneCall },
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

  // Lock background body scroll completely when mobile drawer is open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      const originalOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      // Lock body scroll in place
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      if (window.__lenis && typeof window.__lenis.stop === 'function') {
        window.__lenis.stop();
      }

      return () => {
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        document.body.style.overflow = originalOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.scrollTo(0, scrollY);

        if (window.__lenis && typeof window.__lenis.start === 'function') {
          window.__lenis.start();
        }
      };
    }
  }, [open]);

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
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
          : 'bg-white/90 backdrop-blur-lg border-b border-slate-200/60 shadow-[0_1px_4px_rgba(0,0,0,0.02)]'
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

        <div className="flex items-center gap-2 sm:gap-2.5 lg:hidden">
          {/* Quick Mobile App Download Pill */}
          <button
            type="button"
            onClick={handleDownloadAppClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:scale-95 text-white text-[11px] sm:text-xs font-bold shadow-xs shadow-[var(--color-primary)]/20 transition-all cursor-pointer"
          >
            <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>App</span>
          </button>

          {/* Styled Tactile Hamburger Button */}
          <button
            type="button"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200/80 border border-slate-200/80 text-[var(--color-text-primary)] flex items-center justify-center shadow-2xs active:scale-95 transition-all cursor-pointer"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-700" />
          </button>
        </div>
      </nav>

      {/* Portaled Mobile Drawer to Document Body (Ensures True Fullscreen Coverage & Isolation) */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Mobile Drawer Overlay - Background Blur OFF, Clean Dimmed Backdrop */}
          <div
            className={`fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-300 lg:hidden ${
              open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setOpen(false)}
            onTouchMove={(e) => e.preventDefault()}
          />

          {/* Mobile Drawer Menu */}
          <div
            className={`fixed top-0 right-0 z-[9999] h-screen h-[100dvh] w-[85vw] max-w-[340px] bg-white border-l border-slate-200/80 shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
              open ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 h-16 sm:h-20 border-b border-slate-100 bg-slate-50/50">
              <div className="scale-90 origin-left">
                <Logo />
              </div>
              <button
                type="button"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Nav Links */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" data-lenis-prevent>
              <ul className="flex flex-col gap-1.5">
                {navItems.map((item) => {
                  const active = isItemActive(item.path);
                  const IconComponent = item.icon;
                  return (
                    <li key={item.label}>
                      <Link
                        to={item.path}
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all group ${
                          active
                            ? 'bg-blue-50 text-[var(--color-primary)] font-bold border border-blue-200/60 shadow-xs'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-[var(--color-primary)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {IconComponent && (
                            <IconComponent className={`w-4 h-4 ${active ? 'text-[var(--color-primary)]' : 'text-slate-400 group-hover:text-[var(--color-primary)]'} transition-colors`} />
                          )}
                          <span>{item.label}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${active ? 'text-[var(--color-primary)]' : 'text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5'} transition-all`} />
                      </Link>
                    </li>
                  );
                })}
              </ul>

            </div>
            
            {/* Drawer Footer CTA & Support */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
              <Button 
                onClick={handleDownloadAppClick}
                className="w-full justify-center h-11 text-xs sm:text-sm font-bold shadow-md cursor-pointer flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Mobile App</span>
              </Button>

              <div className="flex items-center justify-center pt-0.5 text-[11px] text-slate-500">
                <a 
                  href="mailto:info@jaladhaaraapp.com" 
                  className="flex items-center gap-1.5 hover:text-[var(--color-primary)] transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span>info@jaladhaaraapp.com</span>
                </a>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}
