import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useLandingContent from '../hooks/useLandingContent';
import '../landing.css';

import cardAgri from '../assets/Agriculture.jpg';
import cardRes from '../assets/Residential.jpg';
import cardCom from '../assets/Commercial.jpg';
import cardInd from '../assets/Industrial.jpg';

import {
  Layers,
  ChevronRight,
  Droplets,
  CheckCircle2,
  Activity,
  ArrowRight,
  FileText,
  MapPin,
  ShieldCheck,
  ChevronDown,
  Building,
  Home,
  Tractor,
  Factory
} from 'lucide-react';

const sectorDetails = [
  {
    id: 'agriculture',
    title: 'Agriculture Groundwater Survey',
    icon: Tractor,
    image: cardAgri,
    badge: 'Farming & Crop Irrigation',
    desc: 'Borewell point selection for farm lands, plantations, orchards, and crop fields to ensure dependable irrigation throughout dry seasons.',
    benefits: [
      'Identifies high-yield fracture zones to prevent dry borewells',
      'Considers optimum distance between existing neighboring borewells',
      'Assesses groundwater depth to help farmers plan drilling budgets',
      'Detects hard rock barriers and brackish water layers'
    ],
    whoItIsFor: 'Farmers, agriculturalists, estate managers, plantation owners, and horticulturists.'
  },
  {
    id: 'residential',
    title: 'Residential Groundwater Survey',
    icon: Home,
    image: cardRes,
    badge: 'Homes & Villas',
    desc: 'Precision survey tailored for individual homes, gated communities, residential plots, and villas with urban spatial limitations.',
    benefits: [
      'Navigates boundary setbacks, structural foundations, and paved areas',
      'Filters out underground electrical and metal pipe interference',
      'Maintains safe buffer distances from septic tanks and sewer lines',
      'Provides actionable drilling recommendations before house construction starts'
    ],
    whoItIsFor: 'Individual plot owners, house builders, gated community associations, and architects.'
  },
  {
    id: 'commercial',
    title: 'Commercial Groundwater Survey',
    icon: Building,
    image: cardCom,
    badge: 'Business & Real Estate',
    desc: 'High-capacity groundwater investigations for commercial complexes, hospitals, schools, hotels, IT campuses, and real estate layouts.',
    benefits: [
      'Multi-point survey package for large land parcels and developments',
      'Evaluates high-capacity recharge potential to sustain commercial consumption',
      'Generates comprehensive digital reports for board approvals and compliance',
      'Identifies primary and alternate drilling spots for redundancy'
    ],
    whoItIsFor: 'Commercial real estate developers, educational institutions, hospital administrators, and resort owners.'
  },
  {
    id: 'industrial',
    title: 'Industrial Groundwater Survey',
    icon: Factory,
    image: cardInd,
    badge: 'Manufacturing & Plants',
    desc: 'Specialized deep hydrogeological and geophysical investigations for manufacturing units, industrial parks, and processing facilities.',
    benefits: [
      'Subsurface geological stratification and structural fault mapping',
      'High-depth profiling to evaluate long-term aquifer stability',
      'Digital verifiable survey documentation suitable for industrial audits',
      'Provides casing depth calculations to safeguard against surface runoff'
    ],
    whoItIsFor: 'Factory managers, industrial plant operators, warehouse developers, and infrastructure firms.'
  }
];

const geophysicalMethods = [
  {
    name: 'Vertical Electrical Sounding (VES)',
    abbr: 'VES Method',
    desc: 'Measures electrical resistivity variations with depth using calibrated electrode configurations to identify weathered and fractured rock zones containing groundwater.'
  },
  {
    name: 'Electrical Resistivity Tomography (ERT)',
    abbr: 'ERT 2D/3D Imaging',
    desc: 'Creates high-resolution 2D and 3D cross-sectional images of the subsurface, highlighting subsurface resistivity contrasts, geological contacts, and fracture pathways.'
  },
  {
    name: 'Natural Field Electromagnetic Detectors',
    abbr: 'ADMT & PQWT',
    desc: 'Utilizes electromagnetic field frequency spectrums to detect variations in earth’s natural electromagnetic field caused by groundwater aquifers and shear zones.'
  },
  {
    name: 'Hydrogeological Field Assessment',
    abbr: 'Geological Inspection',
    desc: 'Comprehensive visual evaluation of surface geology, local terrain, slope, rock lineation, nearby well yield patterns, and regional aquifer characteristics.'
  }
];

const serviceFaqs = [
  {
    q: 'What is the main advantage of a scientific groundwater survey over water divining?',
    a: 'Scientific surveys use calibrated electronic instruments (VES, ERT, ADMT) to measure objective physical properties of underground rocks, rock fractures, and resistivity. Traditional water divining relies on subjective intuition with zero scientific validity, often resulting in dry borewells.'
  },
  {
    q: 'Can Jaladhaara guarantee 100% water yield or borewell success?',
    a: 'No. Groundwater is a natural, subsurface geological phenomenon that cannot be 100% guaranteed by any legitimate scientist. Jaladhaara guarantees scientific accuracy in data collection and interpretation, which drastically maximizes success probability and prevents drilling in non-viable spots.'
  },
  {
    q: 'What information is included in the digital survey report?',
    a: 'The digital report includes the recommended drilling point with exact GPS coordinates, estimated drilling depth to water fractures, recommended casing depth to prevent cave-ins, subsurface rock observations, and surveyor credentials.'
  },
  {
    q: 'How do I book a survey for my property?',
    a: 'Simply download the Jaladhaara Customer App from the Google Play Store or Apple App Store, choose your property type (Agriculture, Residential, Commercial, Industrial), enter your location, select a verified expert, and confirm your booking.'
  }
];

export default function ServicesPage() {
  const { cms } = useLandingContent();
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    document.title = "Groundwater Survey Services | Jaladhaara";
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page-root min-h-screen text-[var(--color-text-primary)] selection:bg-[var(--color-primary)] selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 pb-16">
        {/* Breadcrumb & Header */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-12 sm:mb-16">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4">
            <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[var(--color-text-primary)] font-semibold">Services</span>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 border border-[var(--color-primary)]/20">
              <Layers className="w-4 h-4" />
              Sectors & Survey Offerings
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.2] mb-5">
              Specialized Geophysical Solutions<br className="hidden sm:inline" />
              <span className="text-[var(--color-primary)]"> for Every Sector</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
              From individual farms to large commercial real estate and industrial complexes, Jaladhaara connects you with certified experts equipped for precise subsurface investigations.
            </p>
          </div>
        </section>

        {/* In-depth 4 Sectors */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-16 sm:mb-20 space-y-12 sm:space-y-16">
          {sectorDetails.map((sector, idx) => {
            const isEven = idx % 2 === 0;
            const Icon = sector.icon;
            return (
              <div
                key={sector.id}
                id={sector.id}
                className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/5 overflow-hidden grid lg:grid-cols-12 gap-6 sm:gap-8 items-center"
              >
                {/* Image side */}
                <div
                  className={`lg:col-span-5 h-64 sm:h-80 lg:h-full relative overflow-hidden bg-slate-100 ${
                    isEven ? 'order-1' : 'order-1 lg:order-2'
                  }`}
                >
                  <img
                    src={sector.image}
                    alt={sector.title}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
                  <div className="absolute bottom-4 left-4 right-4 text-white lg:hidden">
                    <span className="text-xs font-bold uppercase tracking-wider bg-[var(--color-primary)] px-2.5 py-1 rounded-md">
                      {sector.badge}
                    </span>
                  </div>
                </div>

                {/* Content side */}
                <div
                  className={`p-6 sm:p-8 lg:p-10 lg:col-span-7 flex flex-col justify-between ${
                    isEven ? 'order-2' : 'order-2 lg:order-1'
                  }`}
                >
                  <div>
                    <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-3">
                      <Icon className="w-3.5 h-3.5" />
                      {sector.badge}
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)] mb-3">
                      {sector.title}
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed mb-6">
                      {sector.desc}
                    </p>

                    <div className="mb-6">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-3">
                        Key Survey Objectives & Benefits:
                      </h4>
                      <ul className="space-y-2.5">
                        {sector.benefits.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[var(--color-text-primary)]">
                            <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-[var(--color-text-secondary)]">
                      <strong className="text-[var(--color-text-primary)]">Who it is for: </strong>
                      {sector.whoItIsFor}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4">
                    <Link
                      to="/#apps"
                      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-xs sm:text-sm hover:bg-[var(--color-primary-hover)] transition-all shadow-md"
                    >
                      <Droplets className="w-4 h-4" />
                      Book in Mobile App
                    </Link>
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[var(--color-primary)] hover:underline"
                    >
                      Inquire about this service
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Scientific Geophysical Methods */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-16 sm:mb-20">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider mb-2.5 border border-[var(--color-primary)]/20">
              <Activity className="w-3.5 h-3.5" />
              Instrumentation
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--color-text-primary)]">
              Scientific Methodologies Conducted by Our Experts
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-2 max-w-2xl mx-auto">
              Our verified hydrogeologists utilize industry-standard electronic equipment and proven geophysical analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {geophysicalMethods.map((m, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg shadow-[#0077B6]/5 flex flex-col justify-between"
              >
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-[var(--color-primary)] border border-blue-100 mb-3">
                    {m.abbr}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mb-2">
                    {m.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {m.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What You Receive in the Report */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-6xl mx-auto mb-16 sm:mb-20">
          <div className="bg-gradient-to-br from-[#0077B6] to-[#03045E] text-white rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#7FCDFF] text-xs font-bold uppercase tracking-wider mb-4 border border-white/20">
                <FileText className="w-4 h-4" />
                Digital Deliverables
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
                What Is Included in Your Survey Report?
              </h2>
              <p className="text-white/85 text-xs sm:text-base leading-relaxed mb-6">
                Following the on-site survey, the verified expert issues an official, tamper-proof digital report directly through the Jaladhaara app containing:
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  'Precise GPS coordinates of the recommended drilling point',
                  'Estimated depth ranges for primary and secondary water fractures',
                  'Recommended casing pipe depth to protect against surface soil collapse',
                  'Observed subsurface rock stratification and geology notes',
                  'Alternative drilling points where package includes multi-point analysis',
                  'Digital verification QR code for lender, builder, or property records'
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#7FCDFF] shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-white/95">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Service FAQs */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-4xl mx-auto mb-16 sm:mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-text-primary)]">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
              Common inquiries regarding our survey services and scientific procedures.
            </p>
          </div>

          <div className="space-y-3">
            {serviceFaqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div
                  key={i}
                  className="border border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md rounded-2xl overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full text-left px-5 py-4 flex items-center justify-between focus:outline-none"
                  >
                    <span className="font-bold text-sm sm:text-base text-[var(--color-text-primary)] pr-4">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[var(--color-primary)] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border)]/50">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-[#011E36] via-[#023E8A] to-[#0077B6] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center">
            <div className="max-w-3xl mx-auto relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4">
                Schedule a Scientific Groundwater Survey
              </h2>
              <p className="text-white/85 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto">
                Download the Jaladhaara Customer App to find verified hydrogeologists near you and book an accurate site survey.
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
                  to="/how-it-works"
                  className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm backdrop-blur-md hover:scale-105 transition-all inline-flex items-center gap-2"
                >
                  See How It Works
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
