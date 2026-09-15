import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getLandingContent } from '../../services/landingApi';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import './landing.css';
import { Link } from 'react-router-dom';

import heroBg from './assets/hero_new.jpg';
import cardAgri from './assets/Agriculture.png';
import cardRes from './assets/Residential.png';
import cardCom from './assets/Commercial.png';
import cardInd from './assets/Industrial.png';

import Navbar from './components/Navbar';
import Logo from './components/Logo';

import {
  MapPin,
  Droplets,
  CheckCircle,
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
  Briefcase
} from 'lucide-react';

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
  const contentRef = useRef(null);
  
  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md rounded-2xl mb-4 overflow-hidden shadow-sm transition-all duration-300">
      <button 
        onClick={onClick} 
        className="w-full text-left px-5 py-4 sm:px-6 sm:py-5 flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50"
      >
        <span className="font-bold text-[var(--color-text-primary)] pr-4 text-sm sm:text-base">{faq.q}</span>
        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)]'}`}>
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </button>
      <div 
        className="transition-all duration-300 ease-in-out px-5 sm:px-6"
        style={{ 
          maxHeight: isOpen ? (contentRef.current?.scrollHeight ? `${contentRef.current.scrollHeight + 40}px` : '300px') : '0px',
          opacity: isOpen ? 1 : 0,
          paddingBottom: isOpen ? '1.25rem' : '0'
        }}
        ref={contentRef}
      >
        <div className="text-[var(--color-text-secondary)] text-sm sm:text-base leading-relaxed whitespace-pre-wrap pt-2">
          {faq.a}
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

export default function LandingPage() {
  const appsScrollRef = useRef(null);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [activeFaqTab, setActiveFaqTab] = useState('customers');
  const [contactSubmitted, setContactSubmitted] = useState(false);
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

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      e.target.reset();
      setContactSubmitted(false);
    }, 4000);
  };

  return (
    <div className="landing-page-root min-h-screen text-[var(--color-text-primary)] font-sans overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section id="home" className="relative min-h-[100svh] lg:min-h-screen flex flex-col lg:justify-center overflow-hidden bg-[var(--color-bg)] pb-12 lg:pb-0">
        {/* Gradient Background */}
        <div className="absolute inset-0 w-full h-full z-0 bg-gradient-to-br from-[#E2F2FC] via-[#F4F9FF] to-[#7FCDFF]/30">
          {/* Decorative blur blobs */}
          <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[50%] bg-[var(--color-accent)] opacity-20 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] bg-[var(--color-primary)] opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
        </div>

        {/* Content Container */}
        <div className="w-full px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 relative z-10 flex-1 flex flex-col pt-32 pb-8 lg:py-0">
          <div className="w-full flex-1 grid lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-8 flex flex-col justify-center items-start reveal py-12 lg:py-24 relative h-full">
              {/* Text Block */}
              <div className="w-full bg-white/70 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none p-5 sm:p-8 lg:p-0 rounded-3xl lg:rounded-none border border-white/40 lg:border-none shadow-xl shadow-black/5 lg:shadow-none mb-6 lg:mb-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[11px] sm:text-xs font-extrabold uppercase tracking-[0.15em] mb-4 sm:mb-6 border border-[var(--color-primary)]/20">
                  <ShieldCheck className="w-4 h-4" />
                  {cms('hero.badgeText', 'EXPLORING AND PROTECTING OUR GROUNDWATER')}
                </div>

                <h1 className="text-[28px] sm:text-4xl lg:text-[45px] xl:text-[54px] font-black leading-[1.25] lg:leading-[1.12] tracking-tight mb-3 sm:mb-6 text-[var(--color-text-primary)] font-display">
                  <span className="block mb-1 lg:mb-2">{cms('hero.headline1', "India's Trusted Platform to")}</span>
                  <span className="block mb-1 lg:mb-2 text-[var(--color-primary)]">{cms('hero.headline2', "Book Verified Groundwater")}</span>
                  <span className="block">Survey Experts</span>
                </h1>

                <p className="text-[14px] sm:text-xl text-[var(--color-text-secondary)] mb-2 sm:mb-6 max-w-2xl leading-[1.6] sm:leading-[1.7] font-medium">
                  {cms('hero.subtitle', "India's Groundwater Experts at Your Fingertips. Find, connect, survey, and protect our vital resources with certified and verified professionals.")}
                </p>
              </div>

              {/* Action Block */}
              <div className="w-full mt-4 lg:mt-6 pt-2 lg:pt-0">
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-10">
                  {['FIND', 'CONNECT', 'SURVEY', 'PROTECT'].map((word, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white border border-[var(--color-border)] shadow-sm">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-primary)]" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-[var(--color-text-primary)] tracking-wider">{word}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                  <a 
                    href="#apps" 
                    className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm sm:text-base hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[var(--color-primary)]/20"
                  >
                    {cms('hero.cta1Label', 'Download App Now')}
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <a 
                    href="#why-us" 
                    className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 rounded-xl bg-white border border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-sm sm:text-base hover:bg-[var(--color-surface)] transition-all flex items-center justify-center gap-3 group shadow-sm"
                  >
                    {cms('hero.cta2Label', 'How It Works')}
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center group-hover:border-[var(--color-text-primary)] transition-colors">
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5 fill-current" />
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Card / Visual */}
            <div className="lg:col-span-4 relative h-full min-h-[360px] hidden lg:flex items-center justify-center reveal animate-fade-up-delay-2">
              <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-br from-white/90 to-white/60 p-8 border border-white/80 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center text-white">
                    <Droplets className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--color-text-primary)]">Precision Survey</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">Scientific Geoscientific Methods</p>
                  </div>
                </div>

                <div className="space-y-4 text-sm text-[var(--color-text-secondary)]">
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                    <span className="font-semibold text-[var(--color-text-primary)]">Survey Accuracy</span>
                    <span className="font-bold text-[var(--color-primary)]">Verified</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                    <span className="font-semibold text-[var(--color-text-primary)]">Expert Qualification</span>
                    <span className="font-bold text-[var(--color-primary)]">Certified</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                    <span className="font-semibold text-[var(--color-text-primary)]">Digital Report</span>
                    <span className="font-bold text-[var(--color-primary)]">Instant</span>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-[var(--color-text-primary)]">100% Verified Surveyors</div>
                    <div className="text-[var(--color-text-secondary)]">Pan India Professional Network</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <section id="services" className="min-h-[auto] lg:min-h-screen py-12 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 w-full relative overflow-hidden bg-[var(--color-surface)] flex flex-col justify-center rounded-t-[40px] lg:rounded-t-[60px] -mt-8 lg:-mt-12 z-20 border-t border-[var(--color-border)] shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="text-center mb-16 reveal">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold uppercase tracking-wider mb-6 border border-[var(--color-primary)]/20">
            Sectors We Serve
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
            Tailored Groundwater Solutions
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-4 text-sm sm:text-lg">Specialized survey techniques designed for diverse land and water requirements.</p>
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
              <div className="w-full h-44 sm:h-48 md:h-56 relative overflow-hidden shrink-0 border-b border-[var(--color-border)] bg-slate-100">
                <img src={imgSrc} alt={srv.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="p-5 sm:p-6 lg:p-7 relative z-10 flex-grow flex flex-col justify-start bg-white">
                <h3 className="text-lg sm:text-xl font-bold mb-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors leading-tight">{srv.title}</h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs sm:text-sm">{srv.description}</p>
              </div>
            </div>
          );
          })}
        </div>
      </section>

      {/* How It Works For Users */}
      <section id="why-us" className="min-h-[auto] lg:min-h-screen py-12 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 w-full relative overflow-hidden flex flex-col justify-center">
        <div className="text-center mb-16 reveal">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold uppercase tracking-wider mb-6 border border-[var(--color-primary)]/20">
            For Customers
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
            Find Trusted Experts<br />
            <span className="text-[var(--color-text-secondary)] font-light">in Minutes.</span>
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-4 text-sm sm:text-lg">Everything you need for groundwater solutions — in one platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 reveal mb-16 max-w-6xl mx-auto w-full">
          {cms('howItWorksCustomers.steps', [
            { step: '1', title: 'Download App', desc: 'Get the Jaladhaara app from Play Store or App Store.' },
            { step: '2', title: 'Select Service', desc: 'Choose the type and location of groundwater survey you need.' },
            { step: '3', title: 'Connect', desc: 'Get connected with a verified hydrogeologist in your area.' },
            { step: '4', title: 'Receive Report', desc: 'Get a professional, digital survey report on your device.' }
          ]).map((item, i) => (
            <div key={i} className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-6 sm:p-8 text-center hover:border-[var(--color-primary)]/50 hover:-translate-y-2 transition-all duration-300 shadow-xl shadow-[#0077B6]/10 hover:shadow-2xl hover:shadow-[#0077B6]/20">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-[var(--color-primary)] text-white font-black flex items-center justify-center text-2xl mb-6 shadow-lg shadow-[#0077B6]/30 rotate-3 group-hover:rotate-0 transition-transform">{item.step}</div>
              <h3 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)] mb-3">{item.title}</h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 max-w-5xl mx-auto reveal mb-16">
          {['Verified Experts', 'Accurate Reports', 'Transparent Pricing', 'Fast Service', 'Digital Reports', 'Secure & Reliable'].map((benefit, i) => (
            <div key={i} className="flex items-center justify-center sm:justify-start gap-3 p-4 sm:p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-md hover:shadow-lg transition-shadow">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)] shrink-0" />
              <span className="text-xs sm:text-base font-bold text-[var(--color-text-primary)]">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="max-w-5xl mx-auto reveal text-center">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 text-[var(--color-text-primary)]">Who Can Benefit?</h3>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {['Farmers', 'Home Owners', 'Industries', 'Builders', 'Institutions'].map((userType, i) => (
              <div key={i} className="px-5 py-2.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-sm sm:text-base font-semibold text-[var(--color-text-primary)] shadow-sm">
                {userType}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Experts Section */}
      <section id="experts" className="py-12 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 w-full relative overflow-hidden bg-[var(--color-surface)] border-t border-b border-[var(--color-border)]">
        <div className="text-center mb-12 sm:mb-20 reveal">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold uppercase tracking-wider mb-6 border border-[var(--color-primary)]/20">
            For Professionals
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto text-[var(--color-text-primary)] leading-[1.2]">
            Join India's First Groundwater Experts Network<br />
            <span className="block mt-4 text-base sm:text-xl lg:text-2xl text-[var(--color-text-secondary)] font-medium leading-[1.5]">
              Be part of India's growing community of verified hydrogeologists, geophysicists, and groundwater survey professionals.
            </span>
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-6 text-base sm:text-xl">Grow your business. Make a bigger impact.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 max-w-6xl mx-auto items-start reveal">
          <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
            <h3 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Why Join Us?</h3>
            <div className="grid gap-4 sm:gap-6">
              {[
                { title: 'More Client Leads', desc: 'Get connected with verified customers across your service region.' },
                { title: 'Digital Profile', desc: 'Showcase your expertise, equipment, qualifications & experience.' },
                { title: 'Secure Payments', desc: 'Receive survey payments digitally and reliably.' },
                { title: 'Business Growth', desc: 'Expand your practice with continuous opportunities.' }
              ].map((b, i) => (
                <div key={i} className="flex items-start gap-4 p-5 sm:p-6 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-all shadow-md hover:shadow-lg">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center shrink-0">
                    <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-primary)] rotate-180" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg mb-1 text-[var(--color-text-primary)]">{b.title}</h4>
                    <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-[var(--color-border)]">
              <h3 className="text-xl sm:text-2xl font-bold mb-5 text-[var(--color-text-primary)]">Who Can Join?</h3>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {['Hydrogeologists', 'Geophysicists', 'Water Resource Consultants', 'Groundwater Professionals'].map((prof, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-xs sm:text-sm font-medium shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" />
                    {prof}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-bg)] rounded-[32px] sm:rounded-[40px] p-6 sm:p-10 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/10 order-1 lg:order-2">
            <h3 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-[var(--color-text-primary)]">How It Works for Experts</h3>
            <div className="space-y-4 sm:space-y-6">
              {cms('howItWorksExperts.steps', [
                { step: 1, title: 'Register & Complete KYC' },
                { step: 2, title: 'Set Your Availability & Working Zones' },
                { step: 3, title: 'Accept Bookings & Conduct Surveys' },
                { step: 4, title: 'Receive Direct & Secure Disbursals' }
              ]).map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[var(--color-primary)] text-white font-bold text-base sm:text-lg shrink-0 shadow-md">
                    {s.step}
                  </div>
                  <div className="font-bold text-sm sm:text-base text-[var(--color-text-primary)]">{s.title}</div>
                </div>
              ))}
            </div>

            <Link 
              to="/vendorsignup"
              className="w-full mt-8 h-14 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-base hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20"
            >
              Join As Expert Today
              <ArrowRight className="w-5 h-5" />
            </Link>

            <button
              onClick={() => {
                setActiveFaqTab('experts');
                setOpenFaqIndex(null);
                document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full mt-3 h-10 rounded-xl text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-black/5 transition-all flex items-center justify-center gap-1.5"
            >
              Have questions? Read Expert FAQs
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Ecosystem Apps */}
      <section id="apps" className="min-h-[auto] py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 w-full relative overflow-hidden bg-[var(--color-surface)] flex flex-col justify-center border-t border-[var(--color-border)]">
        <div className="text-center mb-8 sm:mb-16 reveal relative z-10">
          <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] sm:text-sm font-bold uppercase tracking-wider mb-4 sm:mb-6 border border-[var(--color-primary)]/20">
            Ecosystem
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto text-[var(--color-text-primary)] leading-tight">
            One platform.<br />
            <span className="text-[var(--color-text-secondary)] font-light">Two powerful portals.</span>
          </h2>
        </div>

        <div ref={appsScrollRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 max-w-6xl mx-auto w-full reveal">
          {/* User App */}
          <div className="w-full bg-gradient-to-br from-[#0077B6] to-[#023E8A] rounded-3xl lg:rounded-[40px] p-6 sm:p-10 lg:p-12 border border-[#0096C7]/30 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-[#023E8A]/30">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-4">
                For Customers
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-white leading-tight">Jaladhaara App</h3>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
                Find and book verified groundwater survey experts near you for agricultural, residential, industrial and commercial needs. Track surveys and download digital reports anytime.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 relative z-10 w-full mt-auto pt-4">
              <Link 
                to="/userlogin" 
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-[#0077B6] rounded-xl hover:bg-white/90 transition-all font-bold shadow-lg"
              >
                Access Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button 
                onClick={() => alert("Mobile app download links will be available shortly on the app store.")} 
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3.5 bg-black/60 text-white rounded-xl hover:bg-black/80 transition-all font-semibold shadow-lg border border-white/20"
              >
                Get App
              </button>
            </div>
          </div>

          {/* Expert App */}
          <div className="w-full bg-gradient-to-br from-[#03045E] to-[#0077B6] rounded-3xl lg:rounded-[40px] p-6 sm:p-10 lg:p-12 border border-[#0096C7]/30 text-white flex flex-col justify-between relative overflow-hidden shadow-2xl shadow-[#03045E]/30">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider mb-4">
                For Surveyors
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 text-white leading-tight">Jaladhaara <span className="text-[#90E0EF]">Expert</span></h3>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8 max-w-md">
                A dedicated workspace for verified groundwater experts to manage bookings, conduct field surveys, submit geoscientific digital reports, and build a trusted professional profile.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 relative z-10 w-full mt-auto pt-4">
              <Link 
                to="/vendorlogin" 
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3.5 bg-[#7FCDFF] text-[#03045E] rounded-xl hover:bg-[#7FCDFF]/90 transition-all font-bold shadow-lg"
              >
                Expert Login
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/vendorsignup" 
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all font-semibold shadow-lg border border-white/20"
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Founder & Managing Director Section */}
      <section id="founder" className="scroll-mt-20 sm:scroll-mt-24 py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-12 xl:px-20 w-full relative overflow-hidden bg-[var(--color-surface)] border-t border-[var(--color-border)]">
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
            {/* Top Grid: Executive ID Card & Bio Narrative */}
            <div className="grid lg:grid-cols-12 gap-5 lg:gap-7 items-stretch">
              
              {/* Left Column: Executive Identity Card */}
              <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-[#023E8A] via-[#0077B6] to-[#03045E] p-5 sm:p-6 text-white relative overflow-hidden shadow-lg border border-white/20">
                {/* Geological waveform / contour decorative background */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-[#7FCDFF]/20 blur-2xl pointer-events-none" />

                <div className="relative z-10">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border border-white/20 text-white">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#90E0EF]" />
                      Verified Leader
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-semibold text-white/80 bg-black/20 px-2.5 py-0.5 rounded-full">
                      Osmania Univ. Alum
                    </span>
                  </div>

                  {/* Profile Visual / Monogram Emblem */}
                  <div className="flex items-center gap-3.5 sm:gap-4 mb-4">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-white/25 to-white/10 backdrop-blur-xl border-2 border-white/40 shadow-inner flex items-center justify-center text-white font-black text-xl sm:text-2xl tracking-tight">
                        BA
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                        {cms('founder.name', 'Bommala Anjaiah')}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-[#90E0EF] font-medium mt-0.5">
                        {cms('founder.role', 'Founder & Managing Director')}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-white/80 mt-0.5">
                        {cms('founder.subDesignation', 'Jaladhaara Groundwater Survey Pvt. Ltd.')}
                      </p>
                    </div>
                  </div>

                  {/* Key Highlights Pill Grid */}
                  <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                      <div className="text-lg sm:text-xl font-extrabold text-white">14+</div>
                      <div className="text-[10px] sm:text-[11px] text-white/80 font-medium">Years Experience</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
                      <div className="text-lg sm:text-xl font-extrabold text-[#90E0EF]">M.Sc.</div>
                      <div className="text-[10px] sm:text-[11px] text-white/80 font-medium">Geophysics Postgrad</div>
                    </div>
                  </div>

                  {/* Technical Competencies List */}
                  <div className="pt-3 border-t border-white/15">
                    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#90E0EF] mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> Core Investigation Domains
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'VES Sounding',
                        'ERT Tomography',
                        'Subsurface Mapping',
                        'Hydrogeological Studies',
                        'Borewell Site Assessment',
                        'Data Interpretation'
                      ].map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-black/20 text-white/90 text-[10px] font-medium border border-white/10">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="relative z-10 mt-3.5 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-[#90E0EF]" /> Pan-India Operations
                  </span>
                  <span className="font-semibold text-white">Hyderabad, India</span>
                </div>
              </div>

              {/* Right Column: Bio Narrative & Quote */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  {/* Header & Designation */}
                  <div className="mb-3">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[11px] font-bold uppercase tracking-wider mb-1 border border-[var(--color-primary)]/20">
                      {cms('founder.role', 'Founder & Managing Director')}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)] tracking-tight">
                      {cms('founder.name', 'Bommala Anjaiah')}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] font-medium mt-0.5">
                      {cms('founder.subDesignation', 'Jaladhaara Groundwater Survey Pvt. Ltd.')}
                    </p>
                  </div>

                  {/* Academic & Experience Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3.5">
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
                  <div className="space-y-2.5 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed font-normal">
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
                </div>

                {/* Quote Block */}
                <div className="mt-3.5 p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-blue-50/90 via-[#F4F9FF] to-white border-l-4 border-[var(--color-primary)] border border-blue-100 shadow-xs relative">
                  <Quote className="w-6 h-6 text-[var(--color-primary)]/15 absolute top-3 right-3" />
                  <p className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] italic leading-relaxed pr-6">
                    {cms('founder.quote', '“Our goal is simple — help people make better-informed groundwater decisions before they drill.”')}
                  </p>
                  <div className="mt-1.5 text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5">
                    <span>— {cms('founder.name', 'Bommala Anjaiah')}</span>
                    <span className="text-[var(--color-text-secondary)] font-normal text-[11px]">• {cms('founder.role', 'Founder & Managing Director')}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row: 3 Core Pillars (Education, Experience, Vision) */}
            <div className="mt-5 pt-5 border-t border-[var(--color-border)] grid sm:grid-cols-3 gap-3">
              {cms('founder.pillars', [
                { icon: '🎓', title: 'Education', subtitle: 'M.Sc. Geophysics', desc: 'Osmania University, Hyderabad, Telangana' },
                { icon: '🌍', title: 'Experience', subtitle: '14+ Years', desc: 'Geophysics • Groundwater Exploration • Geophysical Investigations' },
                { icon: '🚀', title: 'Vision', subtitle: 'Technology Platform', desc: 'Pan-India Reach • Building a trusted technology platform for groundwater exploration across India' }
              ]).map((pillar, i) => {
                const colorMap = [
                  { box: 'bg-blue-50/40 border-blue-100 hover:border-[var(--color-primary)]/40', badge: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
                  { box: 'bg-emerald-50/40 border-emerald-100 hover:border-emerald-300', badge: 'bg-emerald-600/10 text-emerald-700' },
                  { box: 'bg-sky-50/40 border-sky-100 hover:border-sky-300', badge: 'bg-sky-600/10 text-sky-700' }
                ];
                const c = colorMap[i % colorMap.length];
                return (
                  <div key={i} className={`p-3.5 rounded-xl ${c.box} border transition-colors flex flex-col justify-between`}>
                    <div>
                      <div className={`w-7 h-7 rounded-lg ${c.badge} flex items-center justify-center mb-2 text-sm`}>
                        {pillar.icon || (i === 0 ? <GraduationCap className="w-4 h-4" /> : i === 1 ? <Globe className="w-4 h-4" /> : <Rocket className="w-4 h-4" />)}
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${c.badge.split(' ')[1]}`}>
                        {pillar.title}
                      </div>
                      <div className="text-xs sm:text-sm font-extrabold text-[var(--color-text-primary)] mt-0.5">
                        {pillar.subtitle || pillar.title}
                      </div>
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] mt-1.5 leading-snug">
                      {pillar.desc}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Suggested CTA */}
            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <a
                  href="#services"
                  className="h-10 sm:h-11 px-6 rounded-xl bg-[var(--color-primary)] text-white font-bold text-xs sm:text-sm hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-2 group shadow-md shadow-[var(--color-primary)]/20"
                >
                  Explore Jaladhaara
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#request"
                  className="h-10 sm:h-11 px-5 rounded-xl bg-white border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 text-[var(--color-text-primary)] font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  Request Borewell Survey
                </a>
              </div>
              <div className="text-[11px] sm:text-xs text-[var(--color-text-secondary)] font-medium text-center sm:text-right hidden md:block">
                Dedicated Scientific Groundwater Exploration Platform
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner / Reviews */}
      <section id="reviews" className="min-h-[auto] py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 w-full relative overflow-hidden flex flex-col justify-center reveal">
        <div className="relative w-full rounded-3xl lg:rounded-[40px] overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)] p-6 sm:p-10 lg:p-16 grid lg:grid-cols-2 gap-8 items-center shadow-2xl shadow-[#0077B6]/15">
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#7FCDFF]/20 to-[#E2F2FC] pointer-events-none">
            <img src={heroBg} alt="Team Background" className="w-full h-full object-cover opacity-20 transition-opacity duration-300" />
          </div>

          <div className="relative z-10 bg-white/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/60 shadow-xl max-w-lg">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3 leading-tight text-[var(--color-text-primary)]">
              Get Started with <br className="hidden sm:block" /> Jaladhaara Today.
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6 text-sm sm:text-base font-medium leading-relaxed">
              Find, connect, survey, and plan with India's first dedicated groundwater survey booking platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Link
                to="/userlogin"
                className="h-12 sm:h-14 px-6 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm sm:text-base hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20"
              >
                Customer Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/vendorlogin"
                className="h-12 sm:h-14 px-6 rounded-xl bg-black text-white font-bold text-sm sm:text-base hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                Expert Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Testimonials Card */}
          <div className="relative z-10 flex justify-center lg:justify-end">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl border border-[var(--color-border)]">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                ))}
              </div>
              <p className="text-sm sm:text-base text-[var(--color-text-primary)] font-medium mb-6 leading-relaxed italic">
                "{reviewsData[currentReviewIndex].text}"
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border)]">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)] shrink-0 flex items-center justify-center text-white font-bold text-sm">
                  {reviewsData[currentReviewIndex].name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-[var(--color-text-primary)]">{reviewsData[currentReviewIndex].name}</div>
                  {reviewsData[currentReviewIndex].role && (
                    <div className="text-xs text-[var(--color-text-secondary)]">{reviewsData[currentReviewIndex].role}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faqs" className="scroll-mt-20 sm:scroll-mt-24 py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 w-full relative overflow-hidden flex flex-col justify-center bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <div className="text-center mb-8 sm:mb-12 reveal">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold uppercase tracking-wider mb-4 border border-[var(--color-primary)]/20">
            FAQs
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
            Frequently Asked Questions
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-3 text-sm sm:text-base max-w-xl mx-auto">
            Find answers to common questions about groundwater surveys, booking procedures, and expert professional standards.
          </p>
        </div>

        {/* FAQ Tabs for Customers & Experts */}
        <div className="flex justify-center mb-8 sm:mb-10 reveal">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-[var(--color-border)] shadow-sm">
            <button
              onClick={() => {
                setActiveFaqTab('customers');
                setOpenFaqIndex(null);
              }}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeFaqTab === 'customers'
                  ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              For Customers
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
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
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeFaqTab === 'experts'
                  ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              For Experts
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
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
            <div className="mb-5 px-4 py-3 rounded-xl bg-blue-50/70 border border-blue-100/80 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
                Groundwater Survey Guidelines & Field FAQs for Surveyors
              </span>
              <span className="text-[11px] font-bold text-[var(--color-primary)] bg-white px-2.5 py-0.5 rounded-md border border-blue-200">
                10 Official FAQs
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
      </section>

      {/* Request / Contact Form Section */}
      <section id="request" className="py-12 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 w-full relative overflow-hidden flex flex-col justify-center reveal bg-[var(--color-bg)]">
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold uppercase tracking-wider mb-6 border border-[var(--color-primary)]/20">
            Contact Us
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-2xl mx-auto text-[var(--color-text-primary)]">
            Find Help for Your Queries
          </h2>
          <p className="text-[var(--color-text-secondary)] mt-4 text-sm sm:text-lg">Fill out the form below and our team will get in touch shortly.</p>
        </div>

        <div className="max-w-2xl mx-auto w-full bg-[var(--color-surface)] backdrop-blur-xl rounded-[32px] p-6 sm:p-12 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/10">
          {contactSubmitted ? (
            <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-emerald-900 mb-1">Thank You!</h3>
              <p className="text-emerald-700 text-sm">Your query has been received. Our team will contact you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-bold text-[var(--color-text-primary)]">
                  Name <span className="text-[var(--color-primary)]">*</span>
                </label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  required 
                  placeholder="Enter your name" 
                  className="w-full px-4 py-3 bg-white/80 rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all placeholder:text-gray-400 text-[var(--color-text-primary)]" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-bold text-[var(--color-text-primary)]">
                    Email Address <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    placeholder="Enter your email" 
                    className="w-full px-4 py-3 bg-white/80 rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all placeholder:text-gray-400 text-[var(--color-text-primary)]" 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="mobile" className="text-sm font-bold text-[var(--color-text-primary)]">
                    Mobile Number <span className="text-[var(--color-primary)]">*</span>
                  </label>
                  <input 
                    type="tel" 
                    id="mobile" 
                    name="mobile" 
                    required 
                    placeholder="Enter your mobile number" 
                    className="w-full px-4 py-3 bg-white/80 rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all placeholder:text-gray-400 text-[var(--color-text-primary)]" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="userType" className="text-sm font-bold text-[var(--color-text-primary)]">
                  You are a <span className="text-[var(--color-primary)]">*</span>
                </label>
                <select 
                  id="userType" 
                  name="userType" 
                  required 
                  defaultValue="" 
                  className="w-full px-4 py-3 bg-white/80 rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all text-[var(--color-text-primary)] cursor-pointer"
                >
                  <option value="" disabled>- Select your category -</option>
                  <option value="farmer">Farmer</option>
                  <option value="individual">Individual Home Owner</option>
                  <option value="commercial">Commercial / Builder</option>
                  <option value="industrial">Industry / Factory</option>
                  <option value="expert">Groundwater Survey Expert</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-bold text-[var(--color-text-primary)]">
                  Message / Requirements
                </label>
                <textarea 
                  id="message" 
                  name="message" 
                  rows={3} 
                  placeholder="Tell us about your location and requirement..." 
                  className="w-full px-4 py-3 bg-white/80 rounded-xl border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none transition-all placeholder:text-gray-400 text-[var(--color-text-primary)] resize-none"
                />
              </div>

              <button 
                type="submit" 
                className="w-full h-14 rounded-2xl bg-[var(--color-primary)] text-white font-bold text-base hover:bg-[var(--color-primary-hover)] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20"
              >
                <Send className="w-5 h-5" />
                Submit Enquiry
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] pt-12 sm:pt-20 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-16 xl:px-24 2xl:px-32 w-full">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12 sm:mb-16">
          <div className="md:col-span-2 lg:col-span-1">
            <div className="mb-4 sm:mb-6">
              <Logo />
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6 leading-relaxed">
              {cms('footer.tagline', 'Jaladhaara simplifies groundwater surveys by connecting customers with verified experts through secure booking, digital reports, and scientific survey methods.')}
            </p>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/jaladhaara_groundwatersurvey?utm_source=qr&igsh=MWVoeDQwcnZ1YzU1OA==" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[#E1306C] transition-colors" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
              </a>
              <a href="https://youtube.com/@jaladhaaragroundwatersurvey?si=4AdCDECSZdqOP6Cs" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[#FF0000] transition-colors" aria-label="YouTube">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              </a>
              <a href="https://www.facebook.com/share/1Dpw3CdKWk/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[#1877F2] transition-colors" aria-label="Facebook">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" /></svg>
              </a>
              <a href="https://www.linkedin.com/in/jaladhaara-groundwater-survey-pvt-ltd-097617350?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[#0A66C2] transition-colors" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </a>
              <a href="https://x.com/jaladhaara" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-secondary)] hover:text-[#1DA1F2] transition-colors" aria-label="Twitter">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-[var(--color-text-primary)]">Quick Links</h4>
            <ul className="space-y-3.5">
              <li>
                <button onClick={() => setIsAboutModalOpen(true)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <a href="#services" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  Our Services
                </a>
              </li>
              <li>
                <a href="#founder" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  Leadership & Founder
                </a>
              </li>
              <li>
                <button onClick={() => setIsTermsModalOpen(true)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => setIsPrivacyModalOpen(true)} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <Link to="/vendorlogin" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  Surveyor Portal
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 lg:col-span-2">
            <h4 className="font-bold mb-6 text-[var(--color-text-primary)]">Contact Information</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <span className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                  2-41/13/PMR/5F, 5th Floor, MELKIORS PRIDE,<br />
                  Khanamet, Hitex road, Hyderabad, Telangana 500081
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <a href="mailto:info@jaladhaaraapp.in" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] text-sm transition-colors">
                  info@jaladhaaraapp.in
                </a>
              </li>
            </ul>
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
              <p>For any queries regarding terms or bookings, contact us at: <a href="mailto:info@jaladhaaraapp.in" className="text-[var(--color-primary)] font-semibold">info@jaladhaaraapp.in</a></p>
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
              <p>For data inquiries or account deletion requests, write to: <a href="mailto:info@jaladhaaraapp.in" className="text-[var(--color-primary)] font-semibold">info@jaladhaaraapp.in</a></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
