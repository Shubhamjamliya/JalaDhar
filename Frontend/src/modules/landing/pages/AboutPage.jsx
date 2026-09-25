import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useLandingContent from '../hooks/useLandingContent';
import '../landing.css';
import {
  Award,
  GraduationCap,
  Rocket,
  CheckCircle2,
  Target,
  Compass,
  ShieldCheck,
  Layers,
  Users,
  Activity,
  ChevronRight
} from 'lucide-react';

export default function AboutPage() {
  const { cms } = useLandingContent();

  useEffect(() => {
    document.title = "About Us | Jaladhaara - Scientific Groundwater Exploration";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page-root min-h-screen text-[var(--color-text-primary)] selection:bg-[var(--color-primary)] selection:text-white flex flex-col justify-between">
      <Navbar />

      <main 
        style={{ paddingTop: 'calc(var(--landing-header-height, 80px) + 14px)' }}
        className="flex-grow pb-5 sm:pb-8"
      >
        {/* Foundation & Leadership Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-6xl mx-auto mb-10 sm:mb-16">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] sm:text-sm text-[var(--color-text-secondary)] mb-4 sm:mb-6">
            <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60" />
            <span className="text-[var(--color-text-primary)] font-semibold">About Us</span>
          </div>

          <div className="text-center max-w-4xl mx-auto mb-6 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2.5 border border-[var(--color-primary)]/20">
              <Award className="w-3.5 h-3.5" />
              FOUNDATION & LEADERSHIP
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-tight mb-3 sm:mb-4">
              Grounded in Geophysics.<br className="hidden sm:inline" />
              <span className="text-[var(--color-primary)]"> Driven by Scientific Integrity.</span>
            </h1>
            <p className="text-xs sm:text-base lg:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-3xl mx-auto">
              14+ years of experience in groundwater exploration and applied geophysical investigations, bringing field expertise and scientific methodology to better-informed borewell decisions across India.
            </p>
          </div>

          {/* Founder Profile Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-[var(--color-border)] shadow-md sm:shadow-xl shadow-[#0077B6]/8 p-4.5 sm:p-8 lg:p-10">
            <div className="flex flex-col justify-between">
              <div>
                {/* Header & Designation */}
                <div className="mb-3.5 sm:mb-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 sm:mb-2 border border-[var(--color-primary)]/20">
                    {cms('founder.role', 'FOUNDER & MANAGING DIRECTOR')}
                  </div>
                  <h2 className="text-xl sm:text-3xl lg:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                    {cms('founder.name', 'Bommala Anjaiah')}
                  </h2>
                  <p className="text-xs sm:text-base text-[var(--color-text-secondary)] font-semibold mt-0.5 sm:mt-1">
                    {cms('founder.subDesignation', 'Jaladhaara Groundwater Survey Pvt. Ltd.')}
                  </p>
                </div>

                {/* Academic Qualifications */}
                <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-blue-50 text-[var(--color-primary)] border border-blue-100 text-[11px] sm:text-sm font-bold shadow-xs">
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>{cms('founder.educationBadge', 'M.Sc. Geophysics — Osmania University, Hyderabad')}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[11px] sm:text-sm font-bold shadow-xs">
                    <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-600" />
                    <span>{cms('founder.educationBadge2', 'M.Sc. Environmental Science (BRAOU)')}</span>
                  </span>
                </div>

                {/* Bio Narrative */}
                <p className="text-xs sm:text-base text-[var(--color-text-secondary)] leading-relaxed font-normal">
                  {cms('founder.bio', 'With extensive field experience in groundwater assessment, Bommala Anjaiah brings a strong geophysical foundation to Jaladhaara and its technology-driven approach to groundwater exploration.')}
                </p>

                {/* Vision & Approach Cards */}
                <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Vision Box */}
                  <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-sky-50/80 border border-sky-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                          <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
                          VISION
                        </span>
                      </div>
                      <p className="text-xs sm:text-base font-semibold text-[var(--color-text-primary)] leading-snug">
                        {cms('founder.vision', 'To build a trusted technology platform for groundwater exploration across India.')}
                      </p>
                    </div>
                  </div>

                  {/* Approach Box */}
                  <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-blue-50/50 border border-emerald-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center shrink-0">
                          <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700">
                          OUR APPROACH
                        </span>
                      </div>
                      <p className="text-xs sm:text-base font-semibold text-[var(--color-text-primary)] leading-snug">
                        {cms('founder.approach', 'Helping people make better-informed groundwater decisions before they drill.')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Problem & Our Mission */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-10 sm:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12 items-stretch">
            {/* Why Jaladhaara Exists */}
            <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 border border-[var(--color-border)] shadow-md sm:shadow-xl shadow-[#0077B6]/5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 sm:gap-3.5 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-text-primary)]">
                    Why Jaladhaara Exists
                  </h2>
                </div>
                <div className="space-y-2.5 sm:space-y-4 text-xs sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
                  <p>
                    Across India, thousands of borewells are drilled every day based on unscientific guesswork, traditional water dowsing, or hearsay. The consequence? Devastating financial losses, dry borewells, wasted investments, and deepening groundwater depletion.
                  </p>
                  <p>
                    Jaladhaara was created to change this reality fundamentally. By combining <strong className="text-[var(--color-text-primary)] font-semibold">rigorous geophysical investigations</strong> (VES, ERT, electromagnetic scanning) with an intuitive mobile app ecosystem, we empower landowners with dependable subsurface insights before spending lakhs on drilling.
                  </p>
                </div>
              </div>
            </div>

            {/* Our Core Mission */}
            <div className="bg-gradient-to-br from-[#0077B6] to-[#03045E] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-lg sm:shadow-2xl shadow-[#0077B6]/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 sm:gap-3.5 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0">
                    <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#7FCDFF]" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                    Our Core Mission
                  </h2>
                </div>
                <p className="text-white/90 text-xs sm:text-base leading-relaxed mb-4 sm:mb-6">
                  To democratize access to certified hydrogeological science, eliminate the financial risk of dry borewells, and foster sustainable groundwater stewardship throughout the country.
                </p>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#7FCDFF] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-base text-white/95">Eliminate blind drilling and protect citizen finances</span>
                  </div>
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#7FCDFF] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-base text-white/95">Verify every hydrogeologist on qualifications and field tools</span>
                  </div>
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#7FCDFF] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-base text-white/95">Provide tamper-proof digital survey documentation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pillars of Jaladhaara */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-0">
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2 border border-[var(--color-primary)]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Our Scientific Pillars
            </div>
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-text-primary)]">
              Why Scientific Exploration Matters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {[
              {
                icon: Activity,
                title: "Calibrated Geophysical Tools",
                desc: "We mandate scientific methodologies like VES, ERT, and PQWT/ADMT electromagnetic detectors instead of intuition or dowsing."
              },
              {
                icon: GraduationCap,
                title: "Strict Academic Screening",
                desc: "Surveyors must hold recognized qualifications in Geophysics, Geology, or Hydrogeology, verified by our expert panel."
              },
              {
                icon: Layers,
                title: "Verifiable Digital Reports",
                desc: "Detailed site findings, fracture depth estimates, expected casing depth, and GPS coordinates delivered securely via app."
              },
              {
                icon: Users,
                title: "Zero False Guarantees",
                desc: "Groundwater is a natural subsurface resource. We do not make false guarantees — we deliver rigorous, honest scientific assessment."
              }
            ].map((pillar, i) => (
              <div
                key={i}
                className="p-4.5 sm:p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm sm:shadow-lg shadow-[#0077B6]/5 hover:border-[var(--color-primary)]/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-2.5 sm:mb-3.5">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                      <pillar.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold text-[var(--color-text-primary)] leading-snug">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer cms={cms} />
    </div>
  );
}
