import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  ChevronDown,
  Check,
  Download, 
  Mail
} from 'lucide-react';
import { IoGlobeOutline } from 'react-icons/io5';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import Button from './Button';
import LandingNoticeSpotlight from './LandingNoticeSpotlight';
import { useLanguage, DEFAULT_SUPPORTED_LANGUAGES } from '../../../contexts/LanguageContext';

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
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const langDropdownRef = useRef(null);
  const headerRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { language, setLanguage, supportedLanguages, isLanguageEnabled } = useLanguage();

  const availableLanguages = useMemo(() => {
    const list = Array.isArray(supportedLanguages) && supportedLanguages.length > 0 
      ? supportedLanguages 
      : DEFAULT_SUPPORTED_LANGUAGES;
    const enabled = list.filter((l) => l.isEnabled !== false);
    return enabled.length > 0 ? enabled : list;
  }, [supportedLanguages]);

  const currentLangObj = useMemo(() => {
    return availableLanguages.find((l) => l.code === language) || 
           (Array.isArray(supportedLanguages) ? supportedLanguages.find((l) => l.code === language) : null) || 
           availableLanguages[0] || 
           { code: 'en', name: 'English', nativeName: 'English', badge: 'EN' };
  }, [availableLanguages, supportedLanguages, language]);

  // Dynamically track header height to adjust layout padding smoothly across notice states
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const updateHeight = () => {
      if (el) {
        document.documentElement.style.setProperty('--landing-header-height', `${el.offsetHeight}px`);
      }
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    ro.observe(el);
    window.addEventListener('resize', updateHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close desktop language dropdown on outside click or touch
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setShowLangMenu(false);
      }
    };

    if (showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showLangMenu]);

  // Lock background body scroll completely when mobile drawer or modal is open
  useEffect(() => {
    if (open || showLangModal) {
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

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (showLangModal) setShowLangModal(false);
          if (open) setOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        document.body.style.overflow = originalOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        window.scrollTo(0, scrollY);
        window.removeEventListener('keydown', handleKeyDown);

        if (window.__lenis && typeof window.__lenis.start === 'function') {
          window.__lenis.start();
        }
      };
    }
  }, [open, showLangModal]);

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
      ref={headerRef}
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

        {/* Right Section: Language Switcher & Download CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Desktop Language Switcher (Same as User/Expert Portal) */}
          {isLanguageEnabled && (
            <div className="relative" ref={langDropdownRef}>
              <button
                type="button"
                onClick={() => setShowLangMenu((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-xs font-bold text-slate-700 hover:border-blue-300 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Change Regional Language"
                aria-label="Change Language"
                aria-expanded={showLangMenu}
              >
                <IoGlobeOutline className="text-[#0A84FF] text-base shrink-0" />
                <span className="font-semibold text-slate-800">{currentLangObj.nativeName}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
              </button>

              {showLangMenu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                    <span>Select Language</span>
                    <span className="text-[10px] font-medium text-slate-400">भाषा चुनें</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {availableLanguages.map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer ${
                            isSelected ? 'bg-blue-50 text-[#0A84FF]' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{lang.nativeName}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#0A84FF] shrink-0" />}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">{lang.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button 
            onClick={handleDownloadAppClick}
            className="whitespace-nowrap px-4 xl:px-5 py-2.5 text-xs xl:text-sm shadow-md cursor-pointer"
          >
            Download App
          </Button>
        </div>

        {/* Mobile Header Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 lg:hidden">
          {/* Quick Mobile Language Switcher Pill (Opens Regional Language Modal) */}
          {isLanguageEnabled && (
            <button
              type="button"
              onClick={() => setShowLangModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 active:scale-95 border border-slate-200/90 text-slate-700 text-[11px] sm:text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title="Change Language"
              aria-label="Change Language"
            >
              <IoGlobeOutline className="text-[#0A84FF] text-sm shrink-0" />
              <span className="max-w-[58px] truncate">{currentLangObj.nativeName}</span>
            </button>
          )}

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

      {/* Sub-Navbar Announcement Bar (Naukri Campus Style) */}
      <LandingNoticeSpotlight variant="subnav" />

      {/* Portaled Mobile Drawer to Document Body (Ensures True Fullscreen Coverage & Isolation) */}
      {typeof document !== 'undefined' && createPortal(
        <>
          {/* Mobile Drawer Overlay - Clean Dimmed Backdrop */}
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

            {/* Drawer Nav Links & Language Switcher */}
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

              {/* Drawer Regional Language Selection Section */}
              {isLanguageEnabled && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between px-1 mb-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <IoGlobeOutline className="text-[#0A84FF] text-base" />
                      <span>Language / क्षेत्रीय भाषा</span>
                    </div>
                    <span className="text-[11px] font-bold text-[#0A84FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {currentLangObj.nativeName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {availableLanguages.map((lang) => {
                      const isSelected = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setLanguage(lang.code);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                            isSelected
                              ? 'bg-blue-50/90 border-[#0A84FF] ring-1 ring-blue-500/20 text-[#0A84FF] shadow-2xs'
                              : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100/80 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#0A84FF] text-white' : 'bg-slate-200/80 text-slate-600'}`}>
                              {lang.badge || lang.code.toUpperCase()}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#0A84FF] shrink-0" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold block text-slate-900 truncate">{lang.nativeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">{lang.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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

      {/* Regional Language Selection Modal (Same as User/Expert Portal) */}
      {typeof document !== 'undefined' && showLangModal && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowLangModal(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0A84FF] flex items-center justify-center border border-blue-100 shrink-0 shadow-2xs">
                  <IoGlobeOutline className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Regional Language</h3>
                  <p className="text-xs text-slate-500">क्षेत्रीय भाषा चुनें • Choose your language</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLangModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language Grid */}
            <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto py-1 pr-0.5">
              {availableLanguages.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLangModal(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-blue-50/90 border-[#0A84FF] ring-2 ring-blue-500/20 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isSelected ? 'bg-[#0A84FF] text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {lang.badge || lang.code.toUpperCase()}
                      </span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-[#0A84FF] text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={`text-sm font-bold block ${isSelected ? 'text-[#0A84FF]' : 'text-slate-900'}`}>
                        {lang.nativeName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {lang.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Active: <span className="font-bold text-slate-800">{currentLangObj.nativeName} ({currentLangObj.name})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLangModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}

