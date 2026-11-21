import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { GooglePlayBadge, AppStoreBadge } from './StoreBadges';
import { MapPin, MessageCircle, Droplets } from 'lucide-react';

export default function Footer({ cms = (path, fallback) => fallback }) {
  return (
    <>
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] pt-5 sm:pt-8 pb-5 sm:pb-8 px-4 sm:px-6 lg:px-8 xl:px-12 w-full">
        <div className="w-full max-w-7xl mx-auto">
          {/* Main Footer Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-8 xl:gap-10 mb-2 sm:mb-3.5 lg:mb-5">
            
            {/* Column 1: Brand */}
            <div className="lg:col-span-3 space-y-2.5">
              <Logo />
              <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm leading-relaxed max-w-sm">
                {cms('footer.tagline', 'Simplifying groundwater exploration by connecting customers with verified experts through secure booking, professional surveys, and digital reports.')}
              </p>
            </div>

            {/* Middle: Quick Links + Contact Us (Side by Side with compact gap and balanced width) */}
            <div className="lg:col-span-5 grid grid-cols-[auto_1fr] gap-3 sm:gap-5 lg:gap-6">
              {/* Quick Links */}
              <div className="pr-1 sm:pr-2">
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-[var(--color-text-primary)] mb-2.5 sm:mb-3 whitespace-nowrap">
                  Quick Links
                </h4>
                <ul className="space-y-2 text-xs sm:text-sm whitespace-nowrap">
                  <li>
                    <Link to="/about" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                      About us
                    </Link>
                  </li>
                  <li>
                    <Link to="/services" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                      Our services
                    </Link>
                  </li>
                  <li>
                    <Link to="/how-it-works" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                      How it works
                    </Link>
                  </li>
                  <li>
                    <Link to="/faqs" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                      FAQs
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                      Contact us
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/terms" 
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      Terms & Conditions
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/privacy" 
                      className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact Us */}
              <div className="min-w-0 pl-1 sm:pl-2">
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-[var(--color-text-primary)] mb-2.5 sm:mb-3">
                  Contact Us
                </h4>
                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div>
                    <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] mb-1">
                      Registered Office
                    </span>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                      <p className="text-[var(--color-text-secondary)] leading-relaxed text-[11px] sm:text-xs">
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
                      className="inline-flex items-center gap-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] font-semibold transition-colors group text-[11px] sm:text-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="whitespace-nowrap">info@jaladhaaraapp.com</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4: App Downloads */}
            <div className="lg:col-span-4">
              <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-[var(--color-text-primary)] mb-2.5 sm:mb-3">
                Download Mobile Apps
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {/* Customer app */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="mb-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <h5 className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)]">Customer App</h5>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-[var(--color-primary)] border border-blue-200/60">
                        Landowners
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] mt-0.5">Book surveys & reports</p>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 sm:gap-2">
                    <GooglePlayBadge 
                      url={cms('appVideos.userPlayStoreUrl')} 
                      appName="Jaladhaara Customer App"
                      variant="dark"
                      compact={true}
                      className="w-full justify-center sm:justify-start"
                    />
                    <AppStoreBadge 
                      url={cms('appVideos.userAppStoreUrl')} 
                      appName="Jaladhaara Customer App"
                      variant="dark"
                      showSoonBadge={true}
                      compact={true}
                      className="w-full justify-center sm:justify-start"
                    />
                  </div>
                </div>

                {/* Expert app */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-white/70 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                  <div className="mb-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <h5 className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)]">Expert App</h5>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                        Surveyors
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] mt-0.5">Field bookings & reports</p>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:flex-col gap-1.5 sm:gap-2">
                    <GooglePlayBadge 
                      url={cms('appVideos.expertPlayStoreUrl')} 
                      appName="Jaladhaara Expert App"
                      variant="dark"
                      compact={true}
                      className="w-full justify-center sm:justify-start"
                    />
                    <AppStoreBadge 
                      url={cms('appVideos.expertAppStoreUrl')} 
                      appName="Jaladhaara Expert App"
                      variant="dark"
                      showSoonBadge={true}
                      compact={true}
                      className="w-full justify-center sm:justify-start"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar: Follow Us + Copyright Row */}
          <div className="pt-2 sm:pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-3">
            {/* Social Icons (Follow Us) at the bottom */}
            <div className="flex items-center gap-2.5 order-1 sm:order-2">
              <span className="font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[var(--color-text-primary)]">
                Follow Us:
              </span>
              <div className="flex gap-2">
                <a href={cms('footer.socialLinks.instagram', "https://www.instagram.com/jaladhaara_groundwatersurvey?utm_source=qr&igsh=MWVoeDQwcnZ1YzU1OA==")} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-[#E1306C] hover:border-[#E1306C]/50 hover:shadow-xs transition-all" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href={cms('footer.socialLinks.youtube', "https://youtube.com/@jaladhaaragroundwatersurvey?si=4AdCDECSZdqOP6Cs")} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-[#FF0000] hover:border-[#FF0000]/50 hover:shadow-xs transition-all" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </a>
                <a href={cms('footer.socialLinks.facebook', "https://www.facebook.com/share/1Dpw3CdKWk/")} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-[#1877F2] hover:border-[#1877F2]/50 hover:shadow-xs transition-all" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" /></svg>
                </a>
                <a href={cms('footer.socialLinks.linkedin', "https://www.linkedin.com/in/jaladhaara-groundwater-survey-pvt-ltd-097617350?utm_source=share_via&utm_content=profile&utm_medium=member_android")} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-[#0A66C2] hover:border-[#0A66C2]/50 hover:shadow-xs transition-all" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href={cms('footer.socialLinks.twitter', "https://x.com/jaladhaara")} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/50 hover:shadow-xs transition-all" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                </a>
                {cms('footer.socialLinks.whatsapp') && (
                  <a href={cms('footer.socialLinks.whatsapp')} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-700 hover:text-[#25D366] hover:border-[#25D366]/50 hover:shadow-xs transition-all" aria-label="WhatsApp">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.979-.276-.1-.477-.15-.678.15-.201.3-.778.979-.954 1.18-.176.2-.352.225-.653.075-.3-.15-1.268-.468-2.415-1.491-.894-.797-1.498-1.782-1.674-2.083-.176-.3-.019-.462.132-.612.136-.135.301-.35.452-.525.15-.175.2-.3.301-.5.1-.2.05-.375-.025-.525-.075-.15-.678-1.636-.929-2.242-.244-.59-.493-.51-.678-.52l-.578-.01c-.2 0-.525.075-.8.375s-1.05 1.026-1.05 2.5 1.076 2.898 1.226 3.1c.15.2 2.117 3.232 5.129 4.533.716.31 1.275.495 1.71.634.72.228 1.376.196 1.895.118.579-.087 1.78-.727 2.031-1.43.251-.703.251-1.305.176-1.43-.075-.125-.276-.2-.577-.35zM12.042 21.673c-1.848 0-3.659-.498-5.244-1.442l-.376-.224-3.896 1.022 1.04-3.797-.245-.39A9.972 9.972 0 0 1 2.063 12.04c0-5.503 4.478-9.981 9.984-9.981 2.666 0 5.172 1.039 7.058 2.925a9.92 9.92 0 0 1 2.924 7.058c0 5.503-4.479 9.981-9.987 9.981zM12.042 0C5.393 0 0 5.393 0 12.042c0 2.122.554 4.195 1.608 6.02L.036 24l6.113-1.603a11.96 11.96 0 0 0 5.893 1.545h.005c6.649 0 12.042-5.393 12.042-12.042 0-3.218-1.253-6.243-3.528-8.519C18.286 1.253 15.26 0 12.042 0z"/></svg>
                  </a>
                )}
              </div>
            </div>

            {/* Copyright */}
            <p className="text-[var(--color-text-secondary)] text-xs sm:text-sm text-center sm:text-left order-2 sm:order-1">
              &copy; {new Date().getFullYear()} Jaladhaara Groundwater Survey Pvt Ltd. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
