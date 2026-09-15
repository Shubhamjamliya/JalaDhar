import React, { useEffect, useState } from 'react';
import { Menu, X, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import Button from './Button';

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Services', href: '#services' },
  { label: 'How It Works', href: '#why-us' },
  { label: 'Download App', href: '#apps' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact Us', href: '#request' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('Home');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);

    // Scroll spy for active section highlight
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            const matchingLink = links.find((link) => link.href === `#${id}`);
            if (matchingLink) setActive(matchingLink.label);
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );

    links.forEach((link) => {
      const el = document.querySelector(link.href);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? 'bg-white/95 backdrop-blur-xl border-b border-[#7FCDFF]/40 shadow-sm'
          : 'bg-white/70 backdrop-blur-md border-b border-white/50'
      }`}
    >
      <nav className="w-full px-6 lg:px-16 xl:px-24 2xl:px-32 h-20 flex items-center justify-between">
        <Logo />

        <ul className="hidden items-center gap-4 xl:gap-7 2xl:gap-8 lg:flex">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                onClick={() => setActive(link.label)}
                className={`relative text-[13px] xl:text-sm font-semibold transition-colors py-1 ${
                  active === link.label
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {link.label}
                {active === link.label && (
                  <span className="absolute -bottom-1.5 left-0 h-[3px] w-full rounded-t-full bg-[var(--color-primary)] shadow-[0_0_8px_rgba(0,119,182,0.6)]" />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/userlogin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[var(--color-text-primary)] hover:bg-black/5 transition-colors"
          >
            <User className="w-4 h-4 text-[var(--color-primary)]" />
            Login
          </Link>
          <Button href="#request">
            Request Borewell
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
        <div className="flex items-center justify-between px-6 h-20 border-b border-[var(--color-border)]">
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
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => {
                    setActive(link.label);
                    setOpen(false);
                  }}
                  className={`block rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${
                    active === link.label
                      ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-black/5 hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-6 border-t border-[var(--color-border)] pb-8 flex flex-col gap-3">
          <Link
            to="/userlogin"
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-sm hover:bg-black/5 transition-colors"
            onClick={() => setOpen(false)}
          >
            <User className="w-4 h-4 text-[var(--color-primary)]" />
            Login to Portal
          </Link>
          <Button href="#request" className="w-full justify-center h-12 text-sm" onClick={() => setOpen(false)}>
            Request Borewell
          </Button>
        </div>
      </div>
    </header>
  );
}
