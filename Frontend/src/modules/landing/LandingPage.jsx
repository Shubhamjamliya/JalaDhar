import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getLandingContent } from '../../services/landingApi';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './landing.css';

import cardAgri from './assets/Agriculture.jpg';
import cardRes from './assets/Residential.jpg';
import cardCom from './assets/Commercial.jpg';
import cardInd from './assets/Industrial.jpg';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Logo from './components/Logo';
import { GooglePlayBadge, AppStoreBadge } from './components/StoreBadges';
import { Link } from 'react-router-dom';

import {
  MapPin,
  Droplets,
  CheckCircle,
  Check,
  TrendingDown,
  Crosshair,
  Activity,
  ArrowRight,
  Star,
  MessageCircle,
  Send,
  Play,
  X,
  ChevronDown,
  ShieldCheck,
  Award,
  Phone,
  GraduationCap,
  Globe,
  Rocket,
  Quote,
  Sparkles,
  Layers,
  Compass,
  CheckCircle2,
  Users,
  Briefcase,
  Download
} from 'lucide-react';

const reviewsData = [
  {
    text: "The booking process was simple, and the expert conducted a professional groundwater survey. The digital report was very helpful before drilling our borewell.",
    name: "Ramesh Reddy",
    role: "Farmer, Nalgonda"
  },
  {
    text: "Jaladhaara made it easy to find a verified groundwater survey expert. The entire experience was smooth and transparent.",
    name: "Suresh Kumar",
    role: "Property Developer, Hyderabad"
  },
  {
    text: "Jaladhaara helps me receive genuine survey requests, manage my bookings efficiently, and connect with more customers through one platform.",
    name: "Dr. K. Narayana",
    role: "Senior Hydrogeologist"
  },
  {
    text: "The app simplifies my field operations with digital booking management and report submission, allowing me to focus on delivering quality surveys.",
    name: "Mahesh Patil",
    role: "Geophysical Consultant"
  },
  {
    text: "As a professional, Jaladhaara has completely transformed how I get survey requests. It's seamless and highly reliable!",
    name: "Vikram Singh",
    role: "Senior Geologist, Indore"
  }
];

function getEmbedUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // YouTube Shorts — cannot be reliably embedded (controls don't work in iframe)
  // Return type 'shorts' so the modal shows a preview + open-on-YouTube CTA
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([-\w]{11})/i);
  if (shortsMatch) {
    return {
      type: 'shorts',
      isPortrait: true,
      videoId: shortsMatch[1],
      url: `https://www.youtube.com/shorts/${shortsMatch[1]}`,
      thumb: `https://i.ytimg.com/vi/${shortsMatch[1]}/hqdefault.jpg`,
    };
  }

  // Regular YouTube (non-Shorts) — embeds fine with full controls
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  if (ytMatch) {
    return {
      type: 'youtube',
      isPortrait: false,
      url: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`
    };
  }

  // Vimeo
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/i);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      isPortrait: false,
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
    };
  }

  // Direct video file — orientation resolved later via onLoadedMetadata
  return {
    type: 'video',
    isPortrait: null,
    url: trimmed
  };
}

export default function LandingPage() {
  const appsScrollRef = useRef(null);
  const [activeVideo, setActiveVideo] = useState(null);
  // 'landscape' | 'portrait' | 'detecting' — drives modal shape
  const [videoOrientation, setVideoOrientation] = useState('landscape');
  const [landingContent, setLandingContent] = useState(null);

  /** Open modal: immediately set orientation from URL hint, or 'detecting' for raw files */
  const openVideo = useCallback((videoData) => {
    const embed = getEmbedUrl(videoData?.url);
    if (embed?.isPortrait === true) {
      setVideoOrientation('portrait');
    } else if (embed?.isPortrait === false) {
      setVideoOrientation('landscape');
    } else {
      // null = direct video file; orientation resolved in onLoadedMetadata
      setVideoOrientation('detecting');
    }
    setActiveVideo(videoData);
  }, []);

  const closeVideo = useCallback(() => {
    setActiveVideo(null);
    setVideoOrientation('landscape');
  }, []);

  // ESC to close + body scroll lock while modal is open
  useEffect(() => {
    if (!activeVideo) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') closeVideo(); };
    window.addEventListener('keydown', onKey);

    // Pause Lenis smooth scroll so it doesn't swallow touch events inside the modal
    window.__lenis?.stop();

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      // Resume Lenis when modal closes
      window.__lenis?.start();
    };
  }, [activeVideo, closeVideo]);

  // Fetch CMS content once on mount — gracefully falls back to hardcoded defaults if unavailable
  useEffect(() => {
    getLandingContent()
      .then(res => { if (res?.success && res?.data) setLandingContent(res.data); })
      .catch(() => { /* silently use static fallbacks */ });
  }, []);

  // Helper: resolves a CMS value vs a static fallback
  const cms = useCallback((path, fallback) => {
    if (!landingContent) return fallback;
    const keys = path.split('.');
    let val = landingContent;
    for (const k of keys) {
      if (val == null) return fallback;
      val = val[k];
    }
    // Return fallback for empty strings / empty arrays
    if (val === '' || val === null || val === undefined) return fallback;
    if (Array.isArray(val) && val.length === 0) return fallback;
    return val;
  }, [landingContent]);

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    let lenis;
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      window.__lenis = lenis;

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    } catch (err) {
      console.warn('Lenis smooth scroll failed to initialize:', err);
    }

    return () => {
      if (window.__lenis === lenis) window.__lenis = null;
      if (lenis) lenis.destroy();
    };
  }, []);

  // Intersection Observer for fade-up animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );

    const timeoutId = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => {
        observer.observe(el);
      });
    }, 120);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);


  return (
    <div className="landing-page-root min-h-screen text-[var(--color-text-primary)] font-sans overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="relative flex flex-col justify-center overflow-hidden bg-[var(--color-bg)]">
        {/* Gradient Background */}
        <div className="absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-[#E2F2FC] via-[#F4F9FF] to-[#7FCDFF]/30">
          {/* Decorative blur blobs */}
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[50%] bg-[var(--color-accent)] opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] bg-[var(--color-primary)] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        </div>

        {/* Content Container */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 flex flex-col pt-24 sm:pt-28 lg:pt-32 pb-14 sm:pb-18 lg:pb-20">
          <div className="w-full grid lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-8 flex flex-col justify-center items-start py-2 sm:py-4 lg:py-6 relative">
              {/* Text Block */}
              <div className="w-full bg-white/80 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-4 sm:p-8 lg:p-0 rounded-2xl sm:rounded-3xl lg:rounded-none border border-white/50 lg:border-none shadow-lg shadow-black/5 lg:shadow-none mb-3 sm:mb-5 lg:mb-0">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.12em] sm:tracking-[0.15em] mb-2.5 sm:mb-4 border border-[var(--color-primary)]/20">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{cms('hero.badgeText', 'Dedicated Scientific Groundwater Survey Booking Platform')}</span>
                </div>

                <h1 className="text-[22px] sm:text-3xl md:text-4xl lg:text-[45px] xl:text-[52px] font-black leading-[1.2] lg:leading-[1.12] tracking-tight mb-2.5 sm:mb-4 text-[var(--color-text-primary)] font-display">
                  <span className="block mb-1 lg:mb-2">{cms('hero.headline1', "India's Trusted Platform to")}</span>
                  <span className="block text-[var(--color-primary)]">{cms('hero.headline2', "Book Verified Groundwater Survey Experts")}</span>
                  {cms('hero.headline3', '') && (
                    <span className="block mt-1 lg:mt-2 text-[var(--color-text-primary)]">{cms('hero.headline3')}</span>
                  )}
                </h1>

                <p className="text-[13px] sm:text-base lg:text-xl text-[var(--color-text-secondary)] mb-3 sm:mb-5 max-w-2xl leading-relaxed sm:leading-[1.7] font-medium">
                  {cms('hero.subtitle', "Find and connect with verified groundwater experts for Agricultural, Residential, Commercial and Industrial water needs.")}
                </p>
              </div>

              {/* Action Block */}
              <div className="w-full mt-2 sm:mt-3 lg:mt-4 pt-1 sm:pt-2 lg:pt-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-4 sm:mb-6">
                  {['FIND', 'CONNECT', 'SURVEY', 'PROTECT'].map((word, i) => (
                    <div 
                      key={i} 
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-[var(--color-primary)]/50 hover:shadow-md transition-all duration-200 group cursor-default"
                    >
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-extrabold text-slate-700 tracking-wider">
                        {word}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-row gap-2.5 sm:gap-4 w-full sm:w-auto">
                  <a 
                    href="#apps" 
                    className="flex-1 sm:flex-initial h-11 sm:h-13 px-3 sm:px-8 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs sm:text-base hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-1.5 sm:gap-2 group shadow-lg shadow-[var(--color-primary)]/20 text-center"
                  >
                    <span>{cms('hero.cta1Label') === 'Book a Survey' ? 'Download app' : cms('hero.cta1Label', 'Download app')}</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform shrink-0" />
                  </a>
                  <a 
                    href="#why-us" 
                    className="flex-1 sm:flex-initial h-11 sm:h-13 px-3 sm:px-8 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-xs sm:text-base hover:bg-[var(--color-surface)] transition-all flex items-center justify-center gap-1.5 sm:gap-2 group shadow-xs text-center"
                  >
                    <span>{cms('hero.cta2Label', 'How It Works')}</span>
                    <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-text-primary)] transition-colors shrink-0">
                      <Play className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ml-0.5 fill-current" />
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="lg:col-span-4 relative flex items-center justify-center mt-6 sm:mt-8 lg:mt-0 w-full reveal animate-fade-up-delay-2">
              <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-sm rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white/95 to-white/70 p-5 sm:p-7 lg:p-8 border border-white/80 shadow-xl lg:shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white shrink-0 shadow-md shadow-[var(--color-primary)]/20">
                    <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] leading-snug">Precision Groundwater Survey</h3>
                    <p className="text-[11px] sm:text-xs text-[var(--color-text-secondary)]">Advanced Geophysical Methods</p>
                  </div>
                </div>

                <div className="space-y-2.5 sm:space-y-3.5 text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  <div className="p-2.5 sm:p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--color-text-primary)]">Qualified Experts</span>
                    <span className="font-bold text-[var(--color-primary)] text-[11px] sm:text-xs text-right">Screened & Approved</span>
                  </div>
                  <div className="p-2.5 sm:p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between gap-2">
                    <span className="font-semibold text-[var(--color-text-primary)]">Digital Reports</span>
                    <span className="font-bold text-[var(--color-primary)] text-[11px] sm:text-xs text-right">Secure & Accessible</span>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-5 border-t border-[var(--color-border)] flex items-center gap-2.5 sm:gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-[11px] sm:text-xs">
                    <div className="font-bold text-[var(--color-text-primary)]">Pan-India Network</div>
                    <div className="text-[var(--color-text-secondary)]">Local Expertise, Wider Reach</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <section id="services" className="scroll-mt-20 sm:scroll-mt-24 pt-10 sm:pt-14 lg:pt-16 pb-4 sm:pb-6 lg:pb-8 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden bg-[var(--color-surface)] rounded-t-[32px] sm:rounded-t-[40px] lg:rounded-t-[48px] -mt-6 sm:-mt-8 lg:-mt-10 z-20 border-t border-[var(--color-border)] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-8 lg:mb-10 reveal">
            <div className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-2.5 border border-[var(--color-primary)]/20">
              Sectors We Serve
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
              Tailored Groundwater Solutions
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2 sm:mt-2.5 text-xs sm:text-base lg:text-lg max-w-3xl mx-auto">
              Specialized groundwater survey services for agriculture, residential, commercial and industrial needs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 reveal">
            {cms('services', [
              { title: "Agriculture", description: "Connect with experts for scientific site selection to ensure reliable irrigation and support rural agricultural development.", image: { url: '' } },
              { title: "Residential", description: "Book verified professionals for groundwater detection for individual homes, gated villas, apartments, and layouts.", image: { url: '' } },
              { title: "Commercial", description: "Access top surveyors for infrastructure development, commercial complexes, hospitals, and educational institutions.", image: { url: '' } },
              { title: "Industrial", description: "Comprehensive groundwater resource assessment and digital documentation for large-scale industrial and manufacturing plants.", image: { url: '' } }
            ]).map((srv, i) => {
              // Use Cloudinary URL if set, else fall back to bundled local asset
              const localImgs = [cardAgri, cardRes, cardCom, cardInd];
              const imgSrc = srv.image?.url || localImgs[i] || localImgs[0];
              return (
              <Link
                key={i}
                to="/services"
                className="bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl sm:rounded-[32px] overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:-translate-y-2 transition-all duration-300 group shadow-lg hover:shadow-2xl hover:shadow-[#0077B6]/15 flex flex-col h-full cursor-pointer"
              >
                <div className="w-full aspect-[16/9] relative overflow-hidden shrink-0 border-b border-[var(--color-border)] bg-slate-100">
                  <img src={imgSrc} alt={srv.title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-4 sm:p-5 lg:p-6 relative z-10 flex-grow flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="text-base sm:text-xl font-bold mb-1.5 sm:mb-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors leading-tight flex items-center justify-between">
                      <span>{srv.title}</span>
                      <ArrowRight className="w-4 h-4 text-[var(--color-primary)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </h3>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs sm:text-sm">{srv.description}</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-[11px] sm:text-xs font-bold text-[var(--color-primary)] group-hover:translate-x-0.5 transition-transform">
                    <span>Learn more</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </Link>
            );
            })}
          </div>
        </div>
      </section>

      {/* Ecosystem Apps */}
      <section id="apps" className="scroll-mt-20 sm:scroll-mt-24 pt-4 sm:pt-6 lg:pt-8 pb-10 sm:pb-14 lg:pb-16 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden bg-gradient-to-b from-[#F0F7FD] via-[#E8F3FA] to-[#F0F7FD] border-t border-b border-blue-100/70">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-10 reveal relative z-10">
            <div className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] sm:text-sm font-bold uppercase tracking-wider mb-2.5 sm:mb-3.5 border border-[var(--color-primary)]/20">
              Ecosystem
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto text-[var(--color-text-primary)] leading-tight">
              One platform.<br />
              <span className="text-[var(--color-text-secondary)] font-light">Two powerful apps.</span>
            </h2>
          </div>

          <div ref={appsScrollRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-6xl mx-auto w-full reveal">
            {/* User App */}
            <div className="w-full bg-gradient-to-br from-[#0077B6] to-[#023E8A] rounded-2xl sm:rounded-3xl lg:rounded-[36px] p-5 sm:p-7 lg:p-9 border border-[#0096C7]/30 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-[#023E8A]/30">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-3.5">
                  <div className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                    For Customers
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-2.5 text-white leading-tight">Jaladhaara App</h3>
                <p className="text-white/80 text-xs sm:text-base leading-relaxed mb-3.5 sm:mb-5 max-w-md">
                  Find and book verified groundwater survey experts near you for agricultural, residential, industrial and commercial needs. Track surveys and download digital reports anytime.
                </p>

                {/* Video Preview Banner */}
                {cms('appVideos.userAppVideo.enabled', true) && (
                  <div 
                    onClick={() => openVideo({
                      title: cms('appVideos.userAppVideo.title', 'Introducing User App'),
                      url: cms('appVideos.userAppVideo.url', '')
                    })}
                    className="mb-4 sm:mb-5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm cursor-pointer transition-all duration-300 group flex items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                        <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current text-[#7FCDFF]" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-[11px] text-white/70 font-medium">1. Platform Video</p>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#90E0EF] transition-colors line-clamp-1">
                          {cms('appVideos.userAppVideo.title', 'Introducing User App')}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-white/90 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-white/15 border border-white/20 shrink-0">
                      Watch
                    </span>
                  </div>
                )}
              </div>

              <div className="relative z-10 w-full mt-auto pt-3 sm:pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <GooglePlayBadge 
                  url={cms('appVideos.userPlayStoreUrl')} 
                  appName="Jaladhaara App"
                  variant="white"
                  className="flex-1 justify-center"
                />
                <AppStoreBadge 
                  url={cms('appVideos.userAppStoreUrl')} 
                  appName="Jaladhaara App"
                  variant="white"
                  className="flex-1 justify-center"
                />
              </div>
            </div>

            {/* Expert App */}
            <div className="w-full bg-gradient-to-br from-[#03045E] to-[#0077B6] rounded-2xl sm:rounded-3xl lg:rounded-[36px] p-5 sm:p-7 lg:p-9 border border-[#0096C7]/30 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-[#03045E]/30">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-3.5">
                  <div className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                    For Surveyors
                  </div>
                </div>
                <h3 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-2.5 text-white leading-tight">Jaladhaara <span className="text-[#90E0EF]">Expert</span></h3>
                <p className="text-white/80 text-xs sm:text-base leading-relaxed mb-3.5 sm:mb-5 max-w-md">
                  A dedicated workspace for verified groundwater experts to manage bookings, conduct field surveys, submit geoscientific digital reports, and build a trusted professional profile.
                </p>

                {/* Video Preview Banner */}
                {cms('appVideos.expertAppVideo.enabled', true) && (
                  <div 
                    onClick={() => openVideo({
                      title: cms('appVideos.expertAppVideo.title', 'Introducing Expert App'),
                      url: cms('appVideos.expertAppVideo.url', '')
                    })}
                    className="mb-4 sm:mb-5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-sm cursor-pointer transition-all duration-300 group flex items-center justify-between gap-3 sm:gap-4"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                        <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current text-[#90E0EF]" />
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-[11px] text-white/70 font-medium">2. Platform Video</p>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#90E0EF] transition-colors line-clamp-1">
                          {cms('appVideos.expertAppVideo.title', 'Introducing Expert App')}
                        </h4>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-white/90 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-white/15 border border-white/20 shrink-0">
                      Watch
                    </span>
                  </div>
                )}
              </div>

              <div className="relative z-10 w-full mt-auto pt-3 sm:pt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <GooglePlayBadge 
                  url={cms('appVideos.expertPlayStoreUrl')} 
                  appName="Jaladhaara Expert App"
                  variant="white"
                  className="flex-1 justify-center"
                />
                <AppStoreBadge 
                  url={cms('appVideos.expertAppStoreUrl')} 
                  appName="Jaladhaara Expert App"
                  variant="white"
                  className="flex-1 justify-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews & Social Proof Section */}
      <section id="reviews" className="scroll-mt-20 sm:scroll-mt-24 pt-10 sm:pt-14 lg:pt-16 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8 lg:mb-10 text-center reveal">
          <div className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-2.5 border border-[var(--color-primary)]/20">
            Reviews & Testimonials
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
            What People Say About Us
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-2 sm:mt-2.5 text-xs sm:text-base lg:text-lg max-w-2xl mx-auto">
            Real experiences from farmers, homeowners, and groundwater survey experts across India.
          </p>
        </div>

        {/* Testimonials 3-Card Showcase */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 reveal">
          {reviewsData.slice(0, 3).map((review, idx) => (
            <div 
              key={idx} 
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-lg shadow-blue-900/5 flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-xl hover:border-[var(--color-primary)]/40 transition-all duration-300 group"
            >
              <div>
                {/* 5-Star Rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Verified
                  </span>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed italic mb-6">
                  "{review.text}"
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0077B6] to-[#023E8A] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-[#0077B6]/30">
                  {review.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{review.name}</div>
                  <div className="text-[11px] text-slate-500 font-medium">{review.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Metrics Strip */}
        <div className="mt-10 sm:mt-14 max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 text-center reveal">
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs">
            <div className="text-2xl sm:text-3xl font-black text-[var(--color-primary)] font-display">100%</div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-700 mt-1">Screened Geoscientists</div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs">
            <div className="text-2xl sm:text-3xl font-black text-[var(--color-primary)] font-display">VES & ERT</div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-700 mt-1">Scientific Equipment</div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs">
            <div className="text-2xl sm:text-3xl font-black text-[var(--color-primary)] font-display">Digital</div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-700 mt-1">Certified Survey Reports</div>
          </div>
          <div className="p-4 sm:p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-xs">
            <div className="text-2xl sm:text-3xl font-black text-[var(--color-primary)] font-display">Zero</div>
            <div className="text-[11px] sm:text-xs font-bold text-slate-700 mt-1">False Guarantees</div>
          </div>
        </div>
      </section>

      {/* Shared Footer with Store Badges, Quick Links & Policy Modals */}
      <Footer cms={cms} />
      {/* Video Modal */}
      {activeVideo && (() => {
        const embed = getEmbedUrl(activeVideo.url);
        const isPortrait = videoOrientation === 'portrait';

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
            // Only close when clicking the BACKDROP itself, not any child element
            onClick={(e) => { if (e.target === e.currentTarget) closeVideo(); }}
            role="dialog"
            aria-modal="true"
            aria-label={activeVideo.title}
          >
            <div
              className={[
                'relative w-full bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden',
                'shadow-2xl border border-white/10 flex flex-col animate-fade-up',
                isPortrait ? 'max-w-[360px] sm:max-w-[400px] max-h-[90vh]' : 'max-w-4xl',
              ].join(' ')}
              // Stop both click and touch from bubbling to backdrop
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-white/10 bg-slate-950/70 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse shrink-0" />
                  <h3 className="text-white font-bold text-xs sm:text-sm truncate">{activeVideo.title}</h3>
                </div>
                <button
                  onClick={closeVideo}
                  className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                  aria-label="Close video"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Video Player — aspect ratio adapts to detected orientation */}
              <div
                className={[
                  'relative w-full bg-black flex items-center justify-center',
                  isPortrait ? 'aspect-[9/16]' : 'aspect-video',
                ].join(' ')}
              >
                {videoOrientation === 'detecting' && (
                  <div className="flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                )}

                {!embed ? (
                  /* No URL configured */
                  <div className="p-8 text-center text-white/70 space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center text-white/50">
                      <Play className="w-6 h-6" />
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-white">Video Coming Soon</p>
                    <p className="text-xs text-white/50 max-w-sm mx-auto">
                      The intro video for this app is being updated. Please check back shortly or download the app directly.
                    </p>
                  </div>

                ) : embed.type === 'shorts' ? (
                  /* YouTube Shorts — controls don't work when embedded; show preview + open on YouTube */
                  <div className="absolute inset-0 flex flex-col">
                    {/* Thumbnail */}
                    <div className="relative flex-1 overflow-hidden">
                      <img
                        src={embed.thumb}
                        alt={activeVideo.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {/* Shorts badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="#FF0000"><path d="M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25L7.42 14 6 14.75c-1.84.96-2.53 3.23-1.56 5.06.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.07-2.04 2-3.49-.07-1.42-.93-2.68-2.24-3.06zM10 14.65v-5.3L15 12l-5 2.65z"/></svg>
                        <span className="text-white text-[10px] font-bold tracking-wide">Shorts</span>
                      </div>
                    </div>
                    {/* CTA */}
                    <div className="shrink-0 bg-black/90 px-5 py-4 flex flex-col items-center gap-3">
                      <p className="text-white/60 text-xs text-center">
                        YouTube Shorts open in the YouTube app for the best experience
                      </p>
                      <a
                        href={embed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2.5 bg-[#FF0000] hover:bg-[#cc0000] active:bg-[#aa0000] text-white font-bold text-sm py-3 px-5 rounded-xl transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Play className="w-4 h-4 fill-white" />
                        Watch on YouTube
                      </a>
                    </div>
                  </div>

                ) : (embed.type === 'youtube' || embed.type === 'vimeo') ? (
                  /* Regular YouTube / Vimeo — embeds with full controls */
                  <iframe
                    src={embed.url}
                    title={activeVideo.title}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />

                ) : (
                  /* Direct video file */
                  <video
                    src={embed.url}
                    controls
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-contain"
                    onLoadedMetadata={(e) => {
                      const { videoWidth, videoHeight } = e.currentTarget;
                      if (videoWidth && videoHeight) {
                        setVideoOrientation(videoHeight > videoWidth ? 'portrait' : 'landscape');
                      }
                    }}
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
