import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { GooglePlayBadge, AppStoreBadge } from '../components/StoreBadges';
import useLandingContent from '../hooks/useLandingContent';
import '../landing.css';
import {
  Award,
  GraduationCap,
  Globe,
  Rocket,
  Quote,
  CheckCircle2,
  Target,
  Compass,
  ShieldCheck,
  Layers,
  Users,
  ArrowRight,
  Droplets,
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

      <main className="flex-grow pt-24 sm:pt-28 pb-16">
        {/* Breadcrumb & Hero Header */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-12 sm:mb-16">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4">
            <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[var(--color-text-primary)] font-semibold">About Us</span>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 border border-[var(--color-primary)]/20">
              <Award className="w-4 h-4" />
              About Jaladhaara
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.2] mb-5">
              Grounded in Geophysics.<br className="hidden sm:inline" />
              <span className="text-[var(--color-primary)]"> Driven by Scientific Integrity.</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Jaladhaara is India’s first dedicated groundwater exploration platform connecting farmers, homeowners, builders, and industries with certified geoscientists for data-backed borewell surveys.
            </p>
          </div>
        </section>

        {/* The Problem & Our Mission */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-16 sm:mb-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/5">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-5">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-4">
                Why Jaladhaara Exists
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
                <p>
                  Across India, thousands of borewells are drilled every day based on unscientific guesswork, traditional water dowsing, or hearsay. The consequence? Devastating financial losses, dry borewells, wasted investments, and deepening groundwater depletion.
                </p>
                <p>
                  Jaladhaara was created to change this reality fundamentally. By combining <strong>rigorous geophysical investigations</strong> (VES, ERT, electromagnetic scanning) with an intuitive mobile app ecosystem, we empower landowners with dependable subsurface insights before spending lakhs on drilling.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#0077B6] to-[#03045E] text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-[#0077B6]/20 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mb-5">
                  <Compass className="w-6 h-6 text-[#7FCDFF]" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                  Our Core Mission
                </h3>
                <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6">
                  To democratize access to certified hydrogeological science, eliminate the financial risk of dry borewells, and foster sustainable groundwater stewardship throughout the country.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#7FCDFF] shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-white/95">Eliminate blind drilling and protect citizen finances</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#7FCDFF] shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-white/95">Verify every hydrogeologist on qualifications and field tools</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#7FCDFF] shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-white/95">Provide tamper-proof digital survey documentation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founder & Leadership Section */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-6xl mx-auto mb-16 sm:mb-20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-2.5 border border-[var(--color-primary)]/20">
              <Award className="w-3.5 h-3.5" />
              Leadership
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-text-primary)]">
              Leadership Grounded in Science
            </h2>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/8 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col justify-between">
              <div>
                {/* Header & Designation */}
                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-2 border border-[var(--color-primary)]/20">
                    {cms('founder.role', 'Founder & Managing Director')}
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
                    {cms('founder.name', 'Bommala Anjaiah')}
                  </h3>
                  <p className="text-sm sm:text-base text-[var(--color-text-secondary)] font-medium mt-1">
                    {cms('founder.subDesignation', 'Jaladhaara Groundwater Survey Pvt. Ltd.')}
                  </p>
                </div>

                {/* Academic & Experience Badges */}
                <div className="flex flex-wrap items-center gap-2.5 mb-6">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 text-[var(--color-primary)] border border-blue-100 text-xs sm:text-sm font-bold shadow-xs">
                    <GraduationCap className="w-4 h-4" />
                    {cms('founder.educationBadge', 'M.Sc. Geophysics – Osmania University, Hyderabad')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs sm:text-sm font-bold shadow-xs">
                    <Globe className="w-4 h-4" />
                    {cms('founder.experienceBadge', '14+ Years of Professional Experience')}
                  </span>
                </div>

                {/* Bio Narrative */}
                <div className="space-y-4 text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed font-normal">
                  {cms('founder.bio', '') ? (
                    <p className="whitespace-pre-line">{cms('founder.bio')}</p>
                  ) : (
                    <>
                      <p>
                        A Geophysics professional with over <strong className="text-[var(--color-text-primary)] font-semibold">14 years of experience</strong> in groundwater exploration and geophysical investigations, Bommala Anjaiah brings extensive technical and field expertise to Jaladhaara.
                      </p>
                      <p>
                        His deep field domain includes groundwater exploration, <strong className="text-[var(--color-text-primary)] font-semibold">Vertical Electrical Sounding (VES), Electrical Resistivity Tomography (ERT), borewell site assessment, subsurface investigation, hydrogeological studies</strong>, and comprehensive <strong className="text-[var(--color-text-primary)] font-semibold">geophysical data interpretation</strong>.
                      </p>
                      <p>
                        Having observed first-hand the severe financial distress caused to farmers and property developers by failed borewells, he founded Jaladhaara to establish a standardized, transparent, and technology-driven ecosystem that connects customers directly with certified groundwater scientists across India.
                      </p>
                    </>
                  )}
                </div>

                {/* Vision Box */}
                <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-sky-50/80 border border-sky-100 flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <Rocket className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] mb-0.5">
                      Company Vision
                    </div>
                    <p className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] leading-snug">
                      {cms('founder.vision', 'Building a trusted technology platform for groundwater exploration across India')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote Block */}
              <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-50/90 via-[#F4F9FF] to-white border-l-4 border-[var(--color-primary)] border border-blue-100 relative">
                <Quote className="w-8 h-8 text-[var(--color-primary)]/15 absolute top-3 right-4" />
                <p className="text-sm sm:text-base font-bold text-[var(--color-text-primary)] italic leading-relaxed pr-8">
                  {cms('founder.quote', '“Our goal is simple — help people make better-informed groundwater decisions before they drill.”')}
                </p>
                <div className="mt-3 text-xs sm:text-sm font-bold text-[var(--color-primary)] flex items-center gap-2">
                  <span>— {cms('founder.name', 'Bommala Anjaiah')}</span>
                  <span className="text-[var(--color-text-secondary)] font-normal text-xs">• {cms('founder.role', 'Founder & Managing Director')}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Pillars of Jaladhaara */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-16 sm:mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-2.5 border border-[var(--color-primary)]/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Our Scientific Pillars
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-text-primary)]">
              Why Scientific Exploration Matters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
                className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg shadow-[#0077B6]/5 hover:border-[var(--color-primary)]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-4">
                  <pillar.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
                  {pillar.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-[#011E36] via-[#023E8A] to-[#0077B6] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center">
            <div className="max-w-3xl mx-auto relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
                Ready to Experience Scientific Groundwater Exploration?
              </h2>
              <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
                Download the Jaladhaara Customer App to schedule your survey with a verified expert, or download the Expert App if you are a qualified geoscientist.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/#apps"
                  className="px-6 py-3.5 rounded-xl bg-white text-[var(--color-primary)] font-bold text-sm shadow-xl hover:bg-slate-100 hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  <Droplets className="w-4 h-4" />
                  Download Mobile Apps
                </Link>
                <Link
                  to="/services"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm backdrop-blur-md hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  Explore Survey Services
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer cms={cms} />
    </div>
  );
}
