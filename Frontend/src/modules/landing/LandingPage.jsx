import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getLandingContent } from '../../services/landingApi';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './landing.css';
import { Link } from 'react-router-dom';

import heroBg from './assets/hero_new.jpg';
import cardAgri from './assets/Agriculture.jpg';
import cardRes from './assets/Residential.jpg';
import cardCom from './assets/Commercial.jpg';
import cardInd from './assets/Industrial.jpg';

import Navbar from './components/Navbar';
import Logo from './components/Logo';

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
  Download,
  Loader2
} from 'lucide-react';
import { submitContactInquiry } from '../../services/inquiryApi';

const customerFaqs = [
  {
    q: "What is Jaladhaara?",
    a: "Jaladhaara is India's first dedicated groundwater survey booking platform that connects customers with verified and trained experts for conducting scientific borewell surveys."
  },
  {
    q: "How do I book a groundwater survey?",
    a: "Simply download the Jaladhaara app or use our web portal, select your location, choose a verified expert, and confirm your booking."
  },
  {
    q: "Who can use Jaladhaara app?",
    a: "Jaladhaara is designed for farmers, home owners, industries, commercial real estate developers, institutions and anyone planning to drill a borewell."
  },
  {
    q: "What survey methods are available?",
    a: "Our experts conduct Geophysical Investigations using advanced scientific methods such as Electrical resistivity, PQWT, ADMT, 3D locator and other approved groundwater survey techniques depending on the site requirements."
  },
  {
    q: "Can Jaladhaara guarantee borewell success?",
    a: "No. Groundwater occurrence depends on natural geological conditions. Jaladhaara connects customers with verified experts who use geoscientific survey methods to drastically improve borewell planning and reduce dry-bore risks."
  },
  {
    q: "How are experts verified?",
    a: "Experts undergo a strict verification process based on their qualifications, field experience, years of service, identity, and background documentation before joining the platform."
  },
  {
    q: "How do I pay for the survey?",
    a: "Payments are made securely through the Jaladhaara platform using standard digital payment options (UPI, Net Banking, Cards)."
  },
  {
    q: "Will I receive a survey report?",
    a: "Yes. The expert will provide a comprehensive digital survey report through the Jaladhaara platform after completing the on-site survey."
  },
  {
    q: "Can groundwater survey experts join Jaladhaara?",
    a: "Yes. Qualified, trained and eligible groundwater survey professionals can register through the Jaladhaara Expert portal and complete the verification process."
  },
  {
    q: "Which sectors does Jaladhaara serve?",
    a: "Jaladhaara provides bookings for groundwater survey services for:\n1. Agriculture\n2. Residential\n3. Industrial\n4. Commercial (including open plot ventures, gated communities, and real estate developments)"
  },
  {
    q: "Is Jaladhaara available across India?",
    a: "Jaladhaara is building a nationwide network of verified and trained groundwater survey experts to serve customers across India."
  },
  {
    q: "How can I contact Jaladhaara?",
    a: "You can contact us through the Jaladhaara app, website, email, phone or WhatsApp for booking assistance and support."
  }
];

const expertFaqs = [
  {
    q: "What is an Agriculture Groundwater Survey?",
    a: "An Agriculture Groundwater Survey is conducted for agricultural land and farming activities, including crop fields, plantations, orchards, nurseries and other agricultural properties, to assess groundwater conditions and identify a suitable borewell drilling location."
  },
  {
    q: "What is a Household Groundwater Survey?",
    a: "A Household Groundwater Survey is conducted for residential properties, including individual houses, residential plots, villas, apartments and residential layouts, to assess the site's groundwater conditions and identify a suitable location for borewell drilling for household water requirements."
  },
  {
    q: "What is a Commercial Groundwater Survey?",
    a: "A Commercial Groundwater Survey is conducted for properties used for commercial activities, including shops, offices, hotels, restaurants, hospitals, schools, colleges, commercial complexes, malls, apartments used for commercial purposes and other business establishments, to identify suitable borewell drilling locations."
  },
  {
    q: "What is an Industrial Groundwater Survey?",
    a: "An Industrial Groundwater Survey is conducted for industrial and manufacturing properties, including factories, manufacturing units, industrial plants, warehouses, processing units, industrial parks and other industrial facilities, to assess groundwater conditions and identify suitable borewell drilling locations."
  },
  {
    q: "What should I assess during the survey?",
    a: "Assess the site using applicable groundwater exploration methods, considering geological, geophysical and subsurface conditions and relevant groundwater indicators, and identify the most suitable drilling location."
  },
  {
    q: "What information should I provide in the survey report?",
    a: "Record the survey findings, recommended drilling point, estimated drilling depth where technically feasible, observations, applicable technical details and required site evidence as specified in the app."
  },
  {
    q: "What evidence is required after completing the survey?",
    a: "Submit the required site photographs, survey observations, location details and other supporting evidence through the Jaladhaara app as applicable to the booking."
  },
  {
    q: "Can I recommend multiple drilling points?",
    a: "Yes, where the customer's selected package includes multiple points. Each recommended point should be clearly identified and documented in the survey report."
  },
  {
    q: "Can I guarantee water or borewell success?",
    a: "No. You must not guarantee groundwater availability, yield, quality, drilling depth or borewell success. The report should reflect your professional assessment based on the survey findings."
  },
  {
    q: "Is borewell drilling part of my responsibility?",
    a: "No. Your responsibility is to conduct the assigned groundwater survey professionally and submit the required findings and report through Jaladhaara. Borewell drilling is a separate activity arranged by the customer."
  }
];

function FaqItem({ faq, isOpen, onClick }) {
  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md rounded-2xl mb-3 overflow-hidden shadow-sm transition-all duration-300">
      <button 
        onClick={onClick} 
        className="w-full text-left px-4 py-3.5 sm:px-6 sm:py-4 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50"
      >
        <span className="font-bold text-[var(--color-text-primary)] pr-4 text-sm sm:text-base">{faq.q}</span>
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'}`}>
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </button>
      <div 
        className={`grid transition-all duration-300 ease-in-out px-5 sm:px-6 ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-5' : 'grid-rows-[0fr] opacity-0 pb-0'}`}
      >
        <div className="overflow-hidden">
          <div className="text-[var(--color-text-secondary)] text-sm sm:text-base leading-relaxed whitespace-pre-wrap pt-2">
            {faq.a}
          </div>
        </div>
      </div>
    </div>
  );
}

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

  // YouTube match
  const ytMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  if (ytMatch) {
    return {
      type: 'youtube',
      url: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`
    };
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeoMatch) {
    return {
      type: 'vimeo',
      url: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`
    };
  }

  // Direct video file or URL
  return {
    type: 'video',
    url: trimmed
  };
}

export default function LandingPage() {
  const appsScrollRef = useRef(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [activeFaqTab, setActiveFaqTab] = useState('customers');
  const [activeFooterTab, setActiveFooterTab] = useState('customer');
  const [selectedUserType, setSelectedUserType] = useState('');
  const [isUserTypeDropdownOpen, setIsUserTypeDropdownOpen] = useState(false);
  const userTypeDropdownRef = useRef(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState('');
  const [landingContent, setLandingContent] = useState(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviewsData.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Initialize Lenis for smooth scrolling
  useEffect(() => {
    let lenis;
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    } catch (err) {
      console.warn('Lenis smooth scroll failed to initialize:', err);
    }

    return () => {
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

  // Dismiss custom dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userTypeDropdownRef.current && !userTypeDropdownRef.current.contains(event.target)) {
        setIsUserTypeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactError('');
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name')?.toString().trim();
    const mobile = formData.get('mobile')?.toString().trim();
    const email = formData.get('email')?.toString().trim();
    const userType = selectedUserType || formData.get('userType')?.toString() || 'Customer / User';
    const message = formData.get('message')?.toString().trim();

    if (!name || !mobile || !email || !message) {
      setContactError('Please fill in all required fields.');
      return;
    }

    setContactSubmitting(true);
    try {
      await submitContactInquiry({ name, mobile, email, userType, message });
      setContactSubmitted(true);
      setTimeout(() => {
        if (form) form.reset();
        setSelectedUserType('');
        setContactSubmitted(false);
      }, 5000);
    } catch (err) {
      setContactError(err.response?.data?.message || 'Failed to submit inquiry. Please try again or reach us via WhatsApp.');
    } finally {
      setContactSubmitting(false);
    }
  };

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
      <section id="services" className="scroll-mt-20 sm:scroll-mt-24 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden bg-[var(--color-surface)] rounded-t-[32px] sm:rounded-t-[40px] lg:rounded-t-[48px] -mt-6 sm:-mt-8 lg:-mt-10 z-20 border-t border-[var(--color-border)] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-10 lg:mb-12 reveal">
            <div className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 sm:mb-3.5 border border-[var(--color-primary)]/20">
              Sectors We Serve
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
              Tailored Groundwater Solutions
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2 sm:mt-3 text-xs sm:text-base lg:text-lg max-w-3xl mx-auto">
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
              <div key={i} className="bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl sm:rounded-[32px] overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:-translate-y-2 transition-all duration-300 group shadow-lg hover:shadow-2xl hover:shadow-[#0077B6]/15 flex flex-col h-full">
                <div className="w-full aspect-[16/9] relative overflow-hidden shrink-0 border-b border-[var(--color-border)] bg-slate-100">
                  <img src={imgSrc} alt={srv.title} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-4 sm:p-5 lg:p-6 relative z-10 flex-grow flex flex-col justify-start bg-white">
                  <h3 className="text-base sm:text-xl font-bold mb-1.5 sm:mb-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors leading-tight">{srv.title}</h3>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs sm:text-sm">{srv.description}</p>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      {/* How It Works For Users */}
      <section id="why-us" className="scroll-mt-20 sm:scroll-mt-24 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-10 reveal">
            <div className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 sm:mb-3.5 border border-[var(--color-primary)]/20">
              {cms('howItWorksCustomers.eyebrow', 'FOR USERS')}
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
              {cms('howItWorksCustomers.heading1', 'Find Trusted Groundwater Experts')}<br />
              <span className="text-[var(--color-text-secondary)] font-light">{cms('howItWorksCustomers.heading2', 'in Minutes.')}</span>
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2 sm:mt-3 text-xs sm:text-base max-w-2xl mx-auto">
              {cms('howItWorksCustomers.subtitle', 'Find and connect with verified groundwater survey professionals for your specific requirements.')}
            </p>

            <div className="mt-3 sm:mt-5 inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-blue-50 text-[var(--color-primary)] text-xs sm:text-sm font-bold tracking-wide border border-blue-100">
              How It Works
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 reveal mb-8 sm:mb-12 max-w-6xl mx-auto w-full">
            {cms('howItWorksCustomers.steps', [
              { step: '01', title: 'Download the App', desc: 'Get the Jaladhaara app from the Play Store or App Store.' },
              { step: '02', title: 'Select a Service', desc: 'Choose the groundwater survey service you need.' },
              { step: '03', title: 'Connect with an Expert', desc: 'Get connected with a verified expert in your area.' },
              { step: '04', title: 'Get Your Report', desc: 'Receive your professional digital survey report.' }
            ]).map((item, i) => (
              <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center hover:border-[var(--color-primary)]/50 hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-[#0077B6]/10 hover:shadow-2xl hover:shadow-[#0077B6]/20">
                <div className="w-11 h-11 sm:w-14 sm:h-14 mx-auto rounded-xl sm:rounded-2xl bg-[var(--color-primary)] text-white font-black flex items-center justify-center text-lg sm:text-2xl mb-3 sm:mb-4 shadow-lg shadow-[#0077B6]/30 rotate-3 group-hover:rotate-0 transition-transform">{item.step}</div>
                <h3 className="text-base sm:text-xl font-bold text-[var(--color-text-primary)] mb-1 sm:mb-2">{item.title}</h3>
                <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {cms('whyChoose.enabled', true) && (
            <>
              {cms('whyChoose.whyChooseEnabled', true) && (
                <div className="max-w-5xl mx-auto reveal mb-6 sm:mb-10">
                  <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-5 text-center text-[var(--color-text-primary)]">
                    {cms('whyChoose.title', 'Why Choose Jaladhaara?')}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
                    {cms('whyChoose.items', [
                      'Verified Experts',
                      'Live Expert Tracking',
                      'Transparent Pricing',
                      'Digital Reports',
                      'Secure & Reliable'
                    ]).map((benefit, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md hover:shadow-lg hover:border-[var(--color-primary)]/50 transition-all last:col-span-2 md:last:col-span-1"
                      >
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-primary)] shrink-0" />
                        <span className="text-xs sm:text-sm lg:text-base font-bold text-[var(--color-text-primary)]">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cms('whyChoose.whoForEnabled', true) && (
                <div className="max-w-5xl mx-auto reveal text-center">
                  <h3 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4 text-[var(--color-text-primary)]">
                    {cms('whyChoose.whoForTitle', 'Who Is Jaladhaara For?')}
                  </h3>
                  <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                    {cms('whyChoose.whoForCategories', [
                      'Farmers',
                      'Homeowners',
                      'Industries',
                      'Builders',
                      'Institutions',
                      'Commercial'
                    ]).map((userType, i) => (
                      <div 
                        key={i} 
                        className="px-3.5 py-1.5 sm:px-5 sm:py-2.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-base font-semibold text-[var(--color-text-primary)] shadow-sm hover:border-[var(--color-primary)]/50 hover:shadow-md transition-all"
                      >
                        {userType}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>      {/* For Experts Section */}
      <section id="experts" className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden bg-[var(--color-surface)] border-t border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-6 sm:mb-10 lg:mb-12 reveal">
            <div className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-2.5 sm:mb-3.5 border border-[var(--color-primary)]/20">
              For Professionals
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto text-[var(--color-text-primary)] leading-[1.2]">
              Join India's Growing Groundwater Expert Network<br />
              <span className="block mt-2 sm:mt-3 text-xs sm:text-lg lg:text-2xl text-[var(--color-text-secondary)] font-medium leading-[1.5]">
                Be part of a growing community of verified hydrogeologists, geophysicists and groundwater professionals.
              </span>
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2 sm:mt-3 text-xs sm:text-lg">Grow your business. Expand your reach. Make a bigger impact.</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 max-w-6xl mx-auto items-start reveal">
            <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
              <h3 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4 text-[var(--color-text-primary)]">Why Join Jaladhaara?</h3>
              <div className="grid gap-2.5 sm:gap-3">
                {[
                  { title: 'More Genuine Client Leads', desc: 'Connect with customers looking for professional groundwater survey services.' },
                  { title: 'Professional Digital Profile', desc: 'Showcase your qualifications, expertise, experience and service areas.' },
                  { title: 'Secure Digital Payments', desc: 'Receive payments securely through the Jaladhaara platform.' },
                  { title: 'Grow Your Practice', desc: 'Expand your reach and discover new professional opportunities.' }
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-all shadow-md hover:shadow-lg">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-primary)] rotate-180" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm sm:text-base mb-0.5 text-[var(--color-text-primary)]">{b.title}</h4>
                      <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--color-bg)] rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-7 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/10 order-1 lg:order-2">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-center text-[var(--color-text-primary)]">How It Works for Experts</h3>
              <div className="space-y-2.5 sm:space-y-3">
                {cms('howItWorksExperts.steps', [
                  { step: '01', title: 'Create Your Profile', desc: 'Showcase your qualifications, expertise and service areas.' },
                  { step: '02', title: 'Receive Service Requests', desc: 'Get relevant groundwater survey opportunities in your area.' },
                  { step: '03', title: 'Connect & Deliver', desc: 'Connect with customers and provide professional survey services.' },
                  { step: '04', title: 'Receive Secure Payments', desc: 'Get paid securely through the Jaladhaara platform.' }
                ]).map((s, i) => (
                  <div key={i} className="flex items-start gap-3 sm:gap-3.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                    <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs sm:text-sm shrink-0 shadow-md">
                      {s.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs sm:text-sm lg:text-base text-[var(--color-text-primary)] mb-0.5">{s.title}</div>
                      {s.desc && (
                        <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">{s.desc}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Link 
                to="/vendorsignup" 
                className="w-full mt-4 sm:mt-5 h-11 sm:h-12 rounded-xl sm:rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm sm:text-base hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20"
              >
                Join as an Expert
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>

              <button
                onClick={() => {
                  setActiveFaqTab('experts');
                  setOpenFaqIndex(null);
                  document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full mt-2 sm:mt-2.5 h-8 sm:h-9 rounded-xl text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-black/5 transition-all flex items-center justify-center gap-1.5"
              >
                Have questions? Read Expert FAQs
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Who Can Join Jaladhaara? & Final Expert CTA */}
          <div className="max-w-4xl mx-auto mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-[var(--color-border)] text-center reveal">
            <h3 className="text-xl sm:text-3xl font-bold mb-2 sm:mb-3 text-[var(--color-text-primary)]">
              Who Can Join Jaladhaara?
            </h3>
            <p className="text-[var(--color-text-secondary)] text-xs sm:text-base max-w-xl mx-auto mb-4 sm:mb-5">
              Open to verified and experienced groundwater professionals across India.
            </p>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-5 sm:mb-7">
              {[
                'Hydrogeologists',
                'Geophysicists',
                'Groundwater Professionals',
                'Water Resource Consultants',
                'Qualified Earth Science Professionals'
              ].map((prof, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] shadow-sm hover:border-[var(--color-primary)]/50 hover:shadow-md transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-primary)] shrink-0" />
                  <span>{prof}</span>
                </div>
              ))}
            </div>

            {/* CTA Box */}
            <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 bg-gradient-to-br from-[var(--color-primary)]/10 via-[var(--color-surface)] to-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 text-center relative overflow-hidden shadow-xl shadow-[#0077B6]/10">
              <div className="inline-block px-3 py-0.5 sm:px-3.5 sm:py-1 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 sm:mb-2.5 border border-[var(--color-primary)]/20">
                Ready to Join?
              </div>
              <h4 className="text-xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                Your Expertise. Your Opportunities.
              </h4>
              <p className="text-[var(--color-text-secondary)] mt-1.5 sm:mt-2.5 max-w-xl mx-auto text-xs sm:text-base leading-relaxed">
                Turn your professional expertise into new opportunities with Jaladhaara.
              </p>
              <div className="mt-4 sm:mt-6 flex justify-center">
                <Link 
                  to="/vendorsignup"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[var(--color-primary)] text-white font-bold text-sm sm:text-base hover:bg-[var(--color-primary-hover)] transition-all shadow-lg shadow-[var(--color-primary)]/25 hover:shadow-xl hover:-translate-y-0.5 duration-200"
                >
                  Join as an Expert
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Apps */}
      <section id="apps" className="scroll-mt-20 sm:scroll-mt-24 py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden bg-[var(--color-surface)] border-t border-[var(--color-border)]">
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
                  {cms('appVideos.userAppVideo.enabled', true) && (
                    <button
                      onClick={() => setActiveVideo({
                        title: cms('appVideos.userAppVideo.title', 'Introducing User App'),
                        url: cms('appVideos.userAppVideo.url', '')
                      })}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-[11px] sm:text-xs font-semibold text-white transition-all hover:scale-105"
                    >
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-[#7FCDFF]" />
                      <span>Watch Intro Video</span>
                    </button>
                  )}
                </div>
                <h3 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-2.5 text-white leading-tight">Jaladhaara App</h3>
                <p className="text-white/80 text-xs sm:text-base leading-relaxed mb-3.5 sm:mb-5 max-w-md">
                  Find and book verified groundwater survey experts near you for agricultural, residential, industrial and commercial needs. Track surveys and download digital reports anytime.
                </p>

                {/* Video Preview Banner */}
                {cms('appVideos.userAppVideo.enabled', true) && (
                  <div 
                    onClick={() => setActiveVideo({
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

              <div className="relative z-10 w-full mt-auto pt-3 sm:pt-4">
                <a 
                  href={cms('appVideos.userPlayStoreUrl') || '#'}
                  target={cms('appVideos.userPlayStoreUrl') ? "_blank" : undefined}
                  rel={cms('appVideos.userPlayStoreUrl') ? "noopener noreferrer" : undefined}
                  onClick={(e) => {
                    if (!cms('appVideos.userPlayStoreUrl')) {
                      e.preventDefault();
                      alert("Jaladhaara App will be available shortly on Google Play Store!");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 sm:py-3.5 bg-white text-[#0077B6] rounded-xl hover:bg-white/95 hover:shadow-xl transition-all text-sm sm:text-base font-bold shadow-lg group cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#0077B6] group-hover:translate-y-0.5 transition-transform shrink-0" />
                  <span>Download App</span>
                </a>
              </div>
            </div>

            {/* Expert App */}
            <div className="w-full bg-gradient-to-br from-[#03045E] to-[#0077B6] rounded-2xl sm:rounded-3xl lg:rounded-[36px] p-5 sm:p-7 lg:p-9 border border-[#0096C7]/30 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-[#03045E]/30">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3 sm:mb-3.5">
                  <div className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/20 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                    For Surveyors
                  </div>
                  {cms('appVideos.expertAppVideo.enabled', true) && (
                    <button
                      onClick={() => setActiveVideo({
                        title: cms('appVideos.expertAppVideo.title', 'Introducing Expert App'),
                        url: cms('appVideos.expertAppVideo.url', '')
                      })}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-[11px] sm:text-xs font-semibold text-white transition-all hover:scale-105"
                    >
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current text-[#90E0EF]" />
                      <span>Watch Intro Video</span>
                    </button>
                  )}
                </div>
                <h3 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-2.5 text-white leading-tight">Jaladhaara <span className="text-[#90E0EF]">Expert</span></h3>
                <p className="text-white/80 text-xs sm:text-base leading-relaxed mb-3.5 sm:mb-5 max-w-md">
                  A dedicated workspace for verified groundwater experts to manage bookings, conduct field surveys, submit geoscientific digital reports, and build a trusted professional profile.
                </p>

                {/* Video Preview Banner */}
                {cms('appVideos.expertAppVideo.enabled', true) && (
                  <div 
                    onClick={() => setActiveVideo({
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

              <div className="flex flex-wrap gap-2.5 sm:gap-3 relative z-10 w-full mt-auto pt-3 sm:pt-4">
                <Link 
                  to="/vendorlogin" 
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-5 sm:py-3.5 bg-[#7FCDFF] text-[#03045E] rounded-xl hover:bg-[#7FCDFF]/90 transition-all text-xs sm:text-base font-bold shadow-lg"
                >
                  Expert Login
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
                <Link 
                  to="/vendorsignup" 
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 sm:gap-2 px-4 py-2.5 sm:px-5 sm:py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all text-xs sm:text-base font-semibold shadow-lg border border-white/20"
                >
                  Register as an Expert
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder, Leadership & About Us Section */}
      <section id="about" className="scroll-mt-20 sm:scroll-mt-24 pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        {/* Subtle background ambient glows */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 -right-20 w-80 h-80 bg-[var(--color-accent)]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-6 sm:mb-8 reveal">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 border border-[var(--color-primary)]/20">
              <Award className="w-3.5 h-3.5" />
              Founder & Leadership
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight">
              Grounded in Geophysics.<br className="hidden sm:block" />
              <span className="text-[var(--color-primary)]">Driven by Scientific Integrity.</span>
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2 text-xs sm:text-sm max-w-2xl mx-auto">
              Bringing 14+ years of specialized groundwater exploration expertise and scientific geophysical investigations to every borewell decision across India.
            </p>
          </div>

          {/* Founder Profile Card */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/8 p-5 sm:p-7 lg:p-8 reveal">
            {/* Bio Narrative & Quote */}
            <div className="flex flex-col justify-between">
              <div>
                {/* Header & Designation */}
                <div className="mb-3.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[11px] font-bold uppercase tracking-wider mb-1.5 border border-[var(--color-primary)]/20">
                    {cms('founder.role', 'Founder & Managing Director')}
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                    {cms('founder.name', 'Bommala Anjaiah')}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium mt-0.5">
                    {cms('founder.subDesignation', 'Jaladhaara Groundwater Survey Pvt. Ltd.')}
                  </p>
                </div>

                {/* Academic & Experience Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-[var(--color-primary)] border border-blue-100 text-xs font-bold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    {cms('founder.educationBadge', 'M.Sc. Geophysics – Osmania University, Hyderabad')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold">
                    <Globe className="w-3.5 h-3.5" />
                    {cms('founder.experienceBadge', '14+ Years of Professional Experience')}
                  </span>
                </div>

                {/* Bio Description Paragraphs */}
                <div className="space-y-3 text-xs sm:text-sm lg:text-base text-[var(--color-text-secondary)] leading-relaxed font-normal">
                  {cms('founder.bio', '') ? (
                    <p className="whitespace-pre-line">{cms('founder.bio')}</p>
                  ) : (
                    <>
                      <p>
                        A Geophysics professional with over <strong className="text-[var(--color-text-primary)] font-semibold">14 years of experience</strong> in groundwater exploration and geophysical investigations, Bommala Anjaiah brings strong technical and field expertise to Jaladhaara.
                      </p>
                      <p>
                        His experience includes groundwater exploration, <strong className="text-[var(--color-text-primary)] font-semibold">VES, ERT, borewell site assessment, subsurface investigation, hydrogeological studies</strong>, and <strong className="text-[var(--color-text-primary)] font-semibold">geophysical data interpretation</strong>.
                      </p>
                      <p>
                        He founded Jaladhaara with a vision to make professional groundwater survey services <strong className="text-[var(--color-text-primary)] font-semibold">more accessible, transparent and technology-driven</strong>, while connecting customers with qualified groundwater experts across India.
                      </p>
                    </>
                  )}
                </div>

                {/* Vision Statement */}
                <div className="mt-3.5 sm:mt-4 p-3.5 sm:p-4 rounded-xl bg-sky-50/70 border border-sky-100/80 flex items-start sm:items-center gap-3 shadow-2xs">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <Rocket className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] mb-0.5">
                      Vision
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)] leading-snug">
                      {cms('founder.vision', 'Building a trusted technology platform for groundwater exploration across India')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote Block */}
              <div className="mt-4 sm:mt-5 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-50/90 via-[#F4F9FF] to-white border-l-4 border-[var(--color-primary)] border border-blue-100 shadow-xs relative">
                <Quote className="w-6 h-6 text-[var(--color-primary)]/15 absolute top-3 right-3" />
                <p className="text-xs sm:text-sm lg:text-base font-bold text-[var(--color-text-primary)] italic leading-relaxed pr-6">
                  {cms('founder.quote', '“Our goal is simple — help people make better-informed groundwater decisions before they drill.”')}
                </p>
                <div className="mt-2 text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5">
                  <span>— {cms('founder.name', 'Bommala Anjaiah')}</span>
                  <span className="text-[var(--color-text-secondary)] font-normal text-[11px]">• {cms('founder.role', 'Founder & Managing Director')}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Banner / Reviews */}
      <section id="reviews" className="scroll-mt-20 sm:scroll-mt-24 pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden reveal">
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8 text-center">
          <div className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-2.5 border border-[var(--color-primary)]/20">
            Reviews & Testimonials
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
            What People Say About Us
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-1.5 sm:mt-2 text-xs sm:text-base max-w-2xl mx-auto">
            Real experiences from farmers, homeowners, and groundwater survey experts across India.
          </p>
        </div>

        <div className="relative w-full max-w-6xl mx-auto rounded-2xl sm:rounded-3xl lg:rounded-[36px] overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)] p-6 sm:p-8 lg:p-10 grid lg:grid-cols-2 gap-6 sm:gap-8 items-center shadow-2xl shadow-[#0077B6]/15">
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#7FCDFF]/20 to-[#E2F2FC] pointer-events-none">
            <img src={heroBg} alt="Team Background" className="w-full h-full object-cover opacity-20 transition-opacity duration-300" />
          </div>

          <div className="relative z-10 bg-white/80 backdrop-blur-md p-5 sm:p-7 rounded-2xl sm:rounded-3xl border border-white/60 shadow-xl max-w-lg">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold mb-2 sm:mb-3 leading-tight text-[var(--color-text-primary)]">
              Get Started with <br className="hidden sm:block" /> Jaladhaara Today.
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-3.5 sm:mb-5 text-xs sm:text-base font-medium leading-relaxed">
              Find, connect, survey, and plan with India's first dedicated groundwater survey booking platform.
            </p>

            <div className="flex flex-row gap-2.5 sm:gap-3 w-full">
              <Link
                to="/userlogin"
                className="flex-1 h-11 sm:h-12 px-3 sm:px-6 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs sm:text-base hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-[var(--color-primary)]/20 text-center"
              >
                <span>Customer Portal</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </Link>
              <Link
                to="/vendorlogin"
                className="flex-1 h-11 sm:h-12 px-3 sm:px-6 rounded-xl bg-black text-white font-bold text-xs sm:text-base hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg text-center"
              >
                <span>Expert Portal</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </Link>
            </div>
          </div>

          {/* Testimonials Card */}
          <div className="relative z-10 flex justify-center lg:justify-end">
            <div className="glass-panel p-5 sm:p-7 rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl border border-[var(--color-border)]">
              <div className="flex gap-1 mb-3 sm:mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                ))}
              </div>
              <p className="text-xs sm:text-base text-[var(--color-text-primary)] font-medium mb-3.5 sm:mb-5 leading-relaxed italic">
                "{reviewsData[currentReviewIndex].text}"
              </p>
              <div className="flex items-center gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-[var(--color-border)]">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--color-primary)] shrink-0 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                  {reviewsData[currentReviewIndex].name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">{reviewsData[currentReviewIndex].name}</div>
                  {reviewsData[currentReviewIndex].role && (
                    <div className="text-[11px] sm:text-xs text-[var(--color-text-secondary)]">{reviewsData[currentReviewIndex].role}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faqs" className="scroll-mt-20 sm:scroll-mt-24 pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-5 sm:mb-8 reveal">
            <div className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 sm:mb-3 border border-[var(--color-primary)]/20">
              FAQs
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
              Frequently Asked Questions
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-2 sm:mt-3 text-xs sm:text-base max-w-xl mx-auto">
              Find answers to common questions about groundwater surveys, booking procedures, and expert professional standards.
            </p>
          </div>

          {/* FAQ Tabs for Customers & Experts */}
          <div className="flex justify-center mb-5 sm:mb-7 reveal">
            <div className="inline-flex p-1 sm:p-1.5 rounded-xl sm:rounded-2xl bg-white border border-[var(--color-border)] shadow-sm">
              <button
                onClick={() => {
                  setActiveFaqTab('customers');
                  setOpenFaqIndex(null);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeFaqTab === 'customers'
                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-50'
                }`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>For Customers</span>
                <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${
                  activeFaqTab === 'customers' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {customerFaqs.length}
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveFaqTab('experts');
                  setOpenFaqIndex(null);
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeFaqTab === 'experts'
                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>For Experts</span>
                <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${
                  activeFaqTab === 'experts' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {expertFaqs.length}
                </span>
              </button>
            </div>
          </div>

          {/* FAQ List */}
          <div className="max-w-3xl mx-auto w-full reveal">
            {activeFaqTab === 'experts' && (
              <div className="mb-4 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-blue-50/70 border border-blue-100/80 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
                  Groundwater Survey Guidelines & Field FAQs
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-[var(--color-primary)] bg-white px-2 py-0.5 rounded-md border border-blue-200">
                  10 FAQs
                </span>
              </div>
            )}

            {(activeFaqTab === 'customers'
              ? cms('faqs.customer', customerFaqs)
              : cms('faqs.expert', expertFaqs)
            ).map((faq, index) => (
              <FaqItem 
                key={`${activeFaqTab}-${index}`} 
                faq={faq} 
                isOpen={openFaqIndex === index} 
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Request / Contact Form Section */}
      <section id="request" className="scroll-mt-20 sm:scroll-mt-24 pt-8 sm:pt-10 lg:pt-12 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 xl:px-12 w-full relative overflow-hidden reveal bg-[var(--color-bg)]">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-4 sm:mb-6">
            <div className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 border border-[var(--color-primary)]/20">
              CONTACT US
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
              We’re Here to Help
            </h2>
            <p className="text-[var(--color-text-secondary)] mt-1.5 sm:mt-2 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Have a question about groundwater surveys, bookings, or joining Jaladhaara? Send us a message and our team will get back to you.
            </p>
          </div>

          <div className="max-w-3xl mx-auto w-full bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-8 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/10">
            {contactSubmitted ? (
              <div className="p-6 sm:p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-600 mx-auto mb-2.5 sm:mb-3" />
                <h3 className="text-lg sm:text-xl font-bold text-emerald-900 mb-1">Thank You!</h3>
                <p className="text-emerald-700 text-xs sm:text-sm">Your message has been received. Our team will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3 sm:space-y-3.5">
                {/* 2-Column Grid: Name & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label htmlFor="name" className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                      Full Name <span className="text-[var(--color-primary)]">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      required 
                      placeholder="Enter your full name" 
                      className="w-full px-3.5 py-2 sm:py-2.5 text-sm bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 outline-none transition-all placeholder:text-gray-400 text-[var(--color-text-primary)] shadow-xs" 
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <label htmlFor="mobile" className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                      Mobile Number <span className="text-[var(--color-primary)]">*</span>
                    </label>
                    <input 
                      type="tel" 
                      id="mobile" 
                      name="mobile" 
                      required 
                      placeholder="Enter 10-digit mobile number" 
                      className="w-full px-3.5 py-2 sm:py-2.5 text-sm bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 outline-none transition-all placeholder:text-gray-400 text-[var(--color-text-primary)] shadow-xs" 
                    />
                  </div>
                </div>

                {/* 2-Column Grid: Email & User Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label htmlFor="email" className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                      Email Address <span className="text-[var(--color-primary)]">*</span>
                    </label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      required 
                      placeholder="Enter your email address" 
                      className="w-full px-3.5 py-2 sm:py-2.5 text-sm bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 outline-none transition-all placeholder:text-gray-400 text-[var(--color-text-primary)] shadow-xs" 
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-1.5 relative" ref={userTypeDropdownRef}>
                    <label htmlFor="userType" className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                      I am a <span className="text-[var(--color-primary)]">*</span>
                    </label>
                    
                    {/* Hidden input to ensure native form submission captures the field */}
                    <input 
                      type="hidden" 
                      name="userType" 
                      value={selectedUserType} 
                      required 
                    />

                    <button
                      type="button"
                      id="userType"
                      onClick={() => setIsUserTypeDropdownOpen(prev => !prev)}
                      className={`w-full px-3.5 py-2 sm:py-2.5 text-sm bg-white rounded-lg sm:rounded-xl border transition-all flex items-center justify-between shadow-xs cursor-pointer text-left ${
                        isUserTypeDropdownOpen 
                          ? 'border-[var(--color-primary)] ring-4 ring-[var(--color-primary)]/10' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className={selectedUserType ? 'text-[var(--color-text-primary)] font-medium text-xs sm:text-sm' : 'text-gray-400 text-xs sm:text-sm'}>
                        {selectedUserType || 'Select an option'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isUserTypeDropdownOpen ? 'rotate-180 text-[var(--color-primary)]' : ''
                      }`} />
                    </button>

                    {/* Dropdown Options Menu */}
                    {isUserTypeDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 p-1.5 animate-fade-in">
                        {[
                          { value: 'Customer / User', label: 'Customer / User', desc: 'Looking for groundwater survey services' },
                          { value: 'Groundwater Expert', label: 'Groundwater Expert', desc: 'Qualified surveyor or geologist' },
                          { value: 'Business / Organization', label: 'Business / Organization', desc: 'Commercial or corporate inquiries' },
                          { value: 'Other', label: 'Other', desc: 'General queries & partnerships' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setSelectedUserType(opt.value);
                              setIsUserTypeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group cursor-pointer ${
                              selectedUserType === opt.value
                                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold'
                                : 'text-[var(--color-text-primary)] hover:bg-slate-50'
                            }`}
                          >
                            <div>
                              <div className="font-medium text-xs sm:text-sm">{opt.label}</div>
                              <div className="text-[11px] text-gray-400 font-normal">{opt.desc}</div>
                            </div>
                            {selectedUserType === opt.value && (
                              <Check className="w-4 h-4 text-[var(--color-primary)] shrink-0 ml-2" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label htmlFor="message" className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                    How can we help? <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <textarea 
                    id="message" 
                    name="message" 
                    required 
                    rows={3} 
                    placeholder="Tell us how we can help you..." 
                    className="w-full px-3.5 py-2 sm:py-2.5 text-sm bg-white rounded-lg sm:rounded-xl border border-slate-200 hover:border-slate-300 focus:border-[var(--color-primary)] focus:ring-4 focus:ring-[var(--color-primary)]/10 outline-none transition-all placeholder:text-gray-400 text-[var(--color-text-primary)] resize-none shadow-xs" 
                  />
                </div>

                {contactError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl flex items-center gap-2">
                    <span className="font-semibold">Error:</span> {contactError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={contactSubmitting}
                  className="w-full h-10 sm:h-11 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm sm:text-base hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {contactSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Message...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] pt-10 sm:pt-14 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8 xl:px-12 w-full">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10 mb-8 sm:mb-10">
          {/* Column 1: Brand & Social */}
          <div className="space-y-4">
            <div>
              <Logo />
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
              {cms('footer.tagline', 'Simplifying groundwater exploration by connecting customers with verified experts through secure booking, professional surveys, and digital reports.')}
            </p>
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-[var(--color-text-primary)] mb-2.5">
                Follow Us
              </h5>
              <div className="flex gap-2.5">
                <a href="https://www.instagram.com/jaladhaara_groundwatersurvey?utm_source=qr&igsh=MWVoeDQwcnZ1YzU1OA==" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[#E1306C] hover:border-[#E1306C]/40 transition-all shadow-sm" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href="https://youtube.com/@jaladhaaragroundwatersurvey?si=4AdCDECSZdqOP6Cs" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[#FF0000] hover:border-[#FF0000]/40 transition-all shadow-sm" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
                <a href="https://www.facebook.com/share/1Dpw3CdKWk/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[#1877F2] hover:border-[#1877F2]/40 transition-all shadow-sm" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" /></svg>
                </a>
                <a href="https://www.linkedin.com/in/jaladhaara-groundwater-survey-pvt-ltd-097617350?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[#0A66C2] hover:border-[#0A66C2]/40 transition-all shadow-sm" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href="https://x.com/jaladhaara" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[#1DA1F2] hover:border-[#1DA1F2]/40 transition-all shadow-sm" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-bold mb-3 sm:mb-4 text-[var(--color-text-primary)]">Quick Links</h4>
            <ul className="space-y-2.5">
              <li>
                <button onClick={() => setIsAboutModalOpen(true)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors text-left cursor-pointer">
                  About us
                </button>
              </li>
              <li>
                <a href="#services" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  Our services
                </a>
              </li>
              <li>
                <a href="#why-us" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#experts" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  For professionals
                </a>
              </li>
              <li>
                <a href="#why-us" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  For customers
                </a>
              </li>
              <li>
                <button onClick={() => setIsTermsModalOpen(true)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors text-left cursor-pointer">
                  Terms and conditions
                </button>
              </li>
              <li>
                <button onClick={() => setIsPrivacyModalOpen(true)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors text-left cursor-pointer">
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Us */}
          <div>
            <h4 className="font-bold mb-3 sm:mb-4 text-[var(--color-text-primary)]">Contact Us</h4>
            <div className="space-y-2">
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-1">
                  Registered Office
                </span>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    2-41/13/PMR/5F, 5th Floor,<br />
                    Melkiors Pride, Khanamet,<br />
                    Hitex Road, Hyderabad,<br />
                    Telangana - 500081.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-border)]">
                <a 
                  href="mailto:info@jaladhaaraapp.com" 
                  className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm font-semibold transition-colors group"
                >
                  <MessageCircle className="w-4 h-4 text-[var(--color-primary)] shrink-0 group-hover:scale-110 transition-transform" />
                  <span>info@jaladhaaraapp.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Download App (Customer & Expert) */}
          <div className="bg-[var(--color-surface)] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-[var(--color-border)] shadow-sm flex flex-col justify-between">
            <div>
              {/* Audience Tab Switcher */}
              <div className="flex p-1 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] mb-3 sm:mb-4">
                <button
                  type="button"
                  onClick={() => setActiveFooterTab('customer')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    activeFooterTab === 'customer'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  For Customers
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFooterTab('expert')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                    activeFooterTab === 'expert'
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  For Experts
                </button>
              </div>

              {activeFooterTab === 'customer' ? (
                <div>
                  <h4 className="font-bold text-sm sm:text-base mb-1 text-[var(--color-text-primary)]">
                    Download the Jaladhaara app
                  </h4>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-1.5">
                    Get started Today
                  </div>
                  <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm leading-relaxed mb-4 min-h-[40px]">
                    Find verified groundwater survey experts, book your survey, and receive your digital report- all in one app.
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="font-bold text-sm sm:text-base mb-1 text-[var(--color-text-primary)]">
                    Download Jaladhaara Expert
                  </h4>
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-1.5">
                    For Surveyors
                  </div>
                  <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm leading-relaxed mb-4 min-h-[40px]">
                    Manage survey bookings, conduct field investigations, submit geoscientific digital reports, and grow your practice.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {activeFooterTab === 'customer' ? (
                <>
                  <Link 
                    to="/userlogin" 
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[var(--color-primary)] text-white text-xs sm:text-sm font-bold hover:bg-[var(--color-primary-hover)] transition-all shadow-md shadow-[var(--color-primary)]/20"
                  >
                    Book Survey Online
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a 
                    href={cms('appVideos.userPlayStoreUrl') || '#'}
                    target={cms('appVideos.userPlayStoreUrl') ? "_blank" : undefined}
                    rel={cms('appVideos.userPlayStoreUrl') ? "noopener noreferrer" : undefined}
                    onClick={(e) => {
                      if (!cms('appVideos.userPlayStoreUrl')) {
                        e.preventDefault();
                        alert("Customer mobile app will be available shortly on Google Play Store.");
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 text-[var(--color-text-primary)] text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    Download Mobile App
                  </a>
                </>
              ) : (
                <>
                  <Link 
                    to="/vendorsignup" 
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[var(--color-primary)] text-white text-xs sm:text-sm font-bold hover:bg-[var(--color-primary-hover)] transition-all shadow-md shadow-[var(--color-primary)]/20"
                  >
                    Join as an Expert
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a 
                    href={cms('appVideos.expertPlayStoreUrl') || '#'}
                    target={cms('appVideos.expertPlayStoreUrl') ? "_blank" : undefined}
                    rel={cms('appVideos.expertPlayStoreUrl') ? "noopener noreferrer" : undefined}
                    onClick={(e) => {
                      if (!cms('appVideos.expertPlayStoreUrl')) {
                        e.preventDefault();
                        alert("Expert mobile app will be available shortly on Google Play Store.");
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 text-[var(--color-text-primary)] text-xs sm:text-sm font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                    Download Expert App
                  </a>
                  <div className="text-center pt-0.5">
                    <Link 
                      to="/vendorlogin" 
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] font-medium transition-colors"
                    >
                      Already registered? <span className="underline font-semibold text-[var(--color-primary)]">Expert Login</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 sm:pt-8 border-t border-[var(--color-border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm text-center sm:text-left">
            &copy; {new Date().getFullYear()} Jaladhaara Groundwater Survey Pvt Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            Designed with <Droplets className="w-4 h-4 text-[var(--color-primary)]" /> for precision water solutions.
          </div>
        </div>
      </footer>

      {/* About Us Modal */}
      {isAboutModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsAboutModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">About Jaladhaara</h2>
              <button 
                onClick={() => setIsAboutModalOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[var(--color-text-secondary)] leading-relaxed text-sm sm:text-base">
              {/* Mission & Vision */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-[var(--color-bg)] p-6 rounded-2xl border border-[var(--color-border)]">
                  <h3 className="text-lg font-bold text-[var(--color-primary)] mb-2 flex items-center gap-2">
                    <Crosshair className="w-5 h-5" /> Our Mission
                  </h3>
                  <p className="text-sm">To become India's most trusted groundwater survey booking platform by connecting customers with verified groundwater experts through technology for reliable borewell planning.</p>
                </div>
                <div className="bg-[var(--color-bg)] p-6 rounded-2xl border border-[var(--color-border)]">
                  <h3 className="text-lg font-bold text-[var(--color-primary)] mb-2 flex items-center gap-2">
                    <Activity className="w-5 h-5" /> Our Vision
                  </h3>
                  <p className="text-sm">To revolutionize groundwater survey services by building a nationwide network of verified experts and empowering borewell decisions through scientific geophysical methods.</p>
                </div>
              </div>

              {/* Why Jaladhaara */}
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Why Jaladhaara</h3>
                <p className="bg-blue-50/60 p-5 rounded-2xl text-sm leading-relaxed">
                  Jaladhaara is India's first dedicated groundwater survey booking platform, connecting customers with verified and trained groundwater experts through a transparent, technology driven, and seamless booking experience. We make scientific groundwater surveys more accessible, reliable and convenient.
                </p>
              </div>

              {/* Founder Story */}
              <div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Founder Story</h3>
                <p className="text-sm leading-relaxed">
                  Jaladhaara was founded by <strong>Bommala Anjaiah</strong> (M.Sc. Geophysics, Osmania University, Hyderabad), bringing over 14 years of professional experience in groundwater exploration, VES, ERT, and subsurface geophysical investigations. Guided by a mission to help people make better-informed groundwater decisions before drilling, he built Jaladhaara to make scientific survey services transparent, accessible, and technology-driven across India.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {isTermsModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsTermsModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">Terms & Conditions</h2>
              <button 
                onClick={() => setIsTermsModalOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-[var(--color-text-secondary)] leading-relaxed text-sm">
              <p><strong>Effective Date:</strong> July 22, 2026</p>
              <p>Welcome to Jaladhaara, India's first dedicated groundwater survey booking platform, operated by Jaladhaara Groundwater Survey Pvt. Ltd. By accessing our platform, you agree to comply with and be bound by these Terms & Conditions.</p>

              <h4 className="font-bold text-[var(--color-text-primary)] text-base pt-2">1. Nature of Platform</h4>
              <p>Jaladhaara operates as a digital intermediary connecting clients with independent, verified groundwater survey professionals. Jaladhaara does not drill borewells, nor does it guarantee the presence, depth, quality, or discharge rate of underground water, which is dictated entirely by natural hydrogeological conditions.</p>

              <h4 className="font-bold text-[var(--color-text-primary)] text-base pt-2">2. Scientific Investigations</h4>
              <p>All surveys conducted by registered experts use geophysical methods (resistivity, ADMT, PQWT). These provide scientific assessments to reduce guesswork and increase probability of success, but cannot provide a 100% water strike guarantee.</p>

              <h4 className="font-bold text-[var(--color-text-primary)] text-base pt-2">3. User Obligations</h4>
              <p>Users must provide accurate property access, site details, and ensure peaceful entry for the assigned survey expert.</p>

              <h4 className="font-bold text-[var(--color-text-primary)] text-base pt-2">4. Contact & Support</h4>
              <p>For any queries regarding terms or bookings, contact us at: <a href="mailto:info@jaladhaaraapp.com" className="text-[var(--color-primary)] font-semibold">info@jaladhaaraapp.com</a></p>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsPrivacyModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">Privacy Policy</h2>
              <button 
                onClick={() => setIsPrivacyModalOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 overflow-y-auto space-y-4 text-[var(--color-text-secondary)] leading-relaxed text-sm">
              <p><strong>Effective Date:</strong> July 22, 2026</p>
              <p>Jaladhaara Groundwater Survey Pvt. Ltd. respects your privacy and is dedicated to protecting personal information. This policy outlines how information is collected, processed, and secured.</p>

              <h4 className="font-bold text-[var(--color-text-primary)] text-base pt-2">1. Information Collected</h4>
              <p>We collect essential operational details: name, phone number, email, property location for survey coordination, and digital booking transaction data.</p>

              <h4 className="font-bold text-[var(--color-text-primary)] text-base pt-2">2. Data Security & Sharing</h4>
              <p>We never sell or rent your personal data to advertisers. Information is only shared with the specific verified expert assigned to your survey and certified payment gateways for transaction processing.</p>

              <h4 className="font-bold text-[var(--color-text-primary)] text-base pt-2">3. Inquiries</h4>
              <p>For data inquiries or account deletion requests, write to: <a href="mailto:info@jaladhaaraapp.com" className="text-[var(--color-primary)] font-semibold">info@jaladhaaraapp.com</a></p>
            </div>
          </div>
        </div>
      )}
      {/* Video Modal */}
      {activeVideo && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md transition-all duration-300"
          onClick={() => setActiveVideo(null)}
        >
          <div 
            className="relative w-full max-w-4xl bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                <h3 className="text-white font-bold text-sm sm:text-base">{activeVideo.title}</h3>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close video"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              {(() => {
                const embed = getEmbedUrl(activeVideo.url);
                if (!embed) {
                  return (
                    <div className="p-8 text-center text-white/70 space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-white/10 flex items-center justify-center text-white/50">
                        <Play className="w-6 h-6" />
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-white">Video Coming Soon</p>
                      <p className="text-xs text-white/50 max-w-sm mx-auto">
                        The intro video for this app is being updated. Please check back shortly or explore the portal directly.
                      </p>
                    </div>
                  );
                }
                if (embed.type === 'youtube' || embed.type === 'vimeo') {
                  return (
                    <iframe
                      src={embed.url}
                      title={activeVideo.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  );
                }
                return (
                  <video
                    src={embed.url}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
