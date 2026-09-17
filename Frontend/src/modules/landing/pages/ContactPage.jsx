import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useLandingContent from '../hooks/useLandingContent';
import { submitContactInquiry } from '../../../services/inquiryApi';
import '../landing.css';
import {
  MapPin,
  MessageCircle,
  Phone,
  Clock,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Headphones,
  Mail,
  Building
} from 'lucide-react';

export default function ContactPage() {
  const { cms } = useLandingContent();

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    userType: 'Customer',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    document.title = "Contact Us | Jaladhaara Groundwater Survey";
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.name.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!formData.mobile.trim() || formData.mobile.replace(/\D/g, '').length < 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!formData.message.trim()) {
      setSubmitError('Please enter your message or query.');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitContactInquiry({
        fullName: formData.name.trim(),
        phone: formData.mobile.trim(),
        email: formData.email.trim(),
        subject: `Landing Inquiry from ${formData.userType} (${formData.name})`,
        message: `[Category: ${formData.userType}]\n${formData.message.trim()}`
      });

      setSubmitSuccess(true);
      setFormData({
        name: '',
        mobile: '',
        email: '',
        userType: 'Customer',
        message: ''
      });
    } catch (err) {
      console.error('Contact form submission error:', err);
      setSubmitError(
        err?.response?.data?.message || 'Something went wrong while sending your message. Please try again or email us directly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landing-page-root min-h-screen text-[var(--color-text-primary)] selection:bg-[var(--color-primary)] selection:text-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow pt-24 sm:pt-28 pb-16">
        {/* Breadcrumb & Header */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-12 sm:mb-16">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[var(--color-text-secondary)] mb-4">
            <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            <span className="text-[var(--color-text-primary)] font-semibold">Contact Us</span>
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 border border-[var(--color-primary)]/20">
              <Headphones className="w-4 h-4" />
              Get In Touch
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.2] mb-5">
              We Are Here to Assist Your<br className="hidden sm:inline" />
              <span className="text-[var(--color-primary)]"> Groundwater Journey</span>
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Have questions about booking a survey, joining as a certified expert, or partnership opportunities? Reach out to our Hyderabad office or send us an inquiry below.
            </p>
          </div>
        </section>

        {/* Contact Info + Inquiry Form Grid */}
        <section className="px-4 sm:px-6 lg:px-8 xl:px-12 w-full max-w-7xl mx-auto mb-16 sm:mb-20">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* Left Column: Office & Support Cards (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Office Address Card */}
              <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center shrink-0">
                    <Building className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
                      Registered Head Office
                    </h3>
                    <p className="text-xs text-[var(--color-primary)] font-bold uppercase tracking-wider mb-2">
                      Jaladhaara Groundwater Survey Pvt. Ltd.
                    </p>
                    <address className="not-italic text-sm text-[var(--color-text-secondary)] leading-relaxed space-y-0.5">
                      <p>2-41/13/PMR/5F, 5th Floor,</p>
                      <p>Melkiors Pride, Khanamet,</p>
                      <p>Hitex Road, Hyderabad,</p>
                      <p>Telangana - 500081, India.</p>
                    </address>
                  </div>
                </div>
              </div>

              {/* Email & Digital Support */}
              <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
                      Email Communication
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                      Direct inquiries, partnership proposals & support:
                    </p>
                    <a
                      href="mailto:info@jaladhaaraapp.com"
                      className="text-sm sm:text-base font-bold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      info@jaladhaaraapp.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/5">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-sky-100">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">
                      Operating Hours
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Monday to Saturday
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">
                      9:00 AM – 7:00 PM IST
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                      Mobile app bookings are accepted 24/7.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Inquiry Form (7 cols) */}
            <div className="lg:col-span-7 bg-[var(--color-surface)] backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 border border-[var(--color-border)] shadow-xl shadow-[#0077B6]/8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1.5">
                  Send Us a Direct Message
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  Fill in your details and our team will get in touch with you shortly.
                </p>
              </div>

              {submitSuccess ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    Message Sent Successfully!
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out to Jaladhaara. Our support team has received your inquiry and will contact you via phone or email soon.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-xs sm:text-sm font-bold shadow-md hover:bg-[var(--color-primary-hover)] transition-all cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {submitError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-sm text-[var(--color-text-primary)] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                        placeholder="10-digit mobile number"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-sm text-[var(--color-text-primary)] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g. name@example.com"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-sm text-[var(--color-text-primary)] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                        I Am A <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="userType"
                        value={formData.userType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-sm text-[var(--color-text-primary)] transition-all"
                      >
                        <option value="Customer">Customer (Farmer / Homeowner)</option>
                        <option value="Expert">Groundwater Expert / Hydrogeologist</option>
                        <option value="Commercial">Commercial / Builder / Real Estate</option>
                        <option value="Industrial">Industrial Plant Representative</option>
                        <option value="Other">Other Query</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                      Your Message or Inquiry <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Please describe your property location, type of survey required, or any specific questions..."
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-sm text-[var(--color-text-primary)] transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-bold text-sm shadow-lg shadow-[#0077B6]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Inquiry
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer cms={cms} />
    </div>
  );
}
