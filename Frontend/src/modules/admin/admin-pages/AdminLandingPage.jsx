import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IoImageOutline, IoSaveOutline, IoCheckmarkCircle, IoCloseCircle,
  IoRefreshOutline, IoEyeOutline, IoAddCircleOutline, IoTrashOutline,
  IoChevronDown, IoChevronUp, IoInformationCircleOutline
} from 'react-icons/io5';
import { getLandingContent, updateLandingSection, uploadLandingImage } from '../../../services/landingApi';

// ─── Utility Components ──────────────────────────────────────────────────────

function SectionTab({ id, label, icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <span className="text-lg">{icon}</span>
      {label}
    </button>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, maxLength }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
      />
      {maxLength && (
        <span className="absolute right-2 bottom-2 text-[10px] text-slate-400">
          {(value || '').length}/{maxLength}
        </span>
      )}
    </div>
  );
}

function TextArea({ value, onChange, placeholder, rows = 4, maxLength }) {
  return (
    <div className="relative">
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-y"
      />
      {maxLength && (
        <span className="absolute right-2 bottom-2 text-[10px] text-slate-400">
          {(value || '').length}/{maxLength}
        </span>
      )}
    </div>
  );
}

function ImageUploadField({ label, hint, currentUrl, section, onUploaded }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || '');

  useEffect(() => { setPreview(currentUrl || ''); }, [currentUrl]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadLandingImage(file, section);
      if (res.success) {
        setPreview(res.data.url);
        onUploaded(res.data);
      }
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="flex items-start gap-4">
        <div className="w-32 h-24 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
          {preview
            ? <img src={preview} alt="" className="w-full h-full object-cover" />
            : <IoImageOutline className="text-3xl text-slate-300" />
          }
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            {uploading ? <IoRefreshOutline className="animate-spin" /> : <IoImageOutline />}
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>
          <p className="text-[10px] text-slate-400">JPG/PNG/WebP — Max 5 MB<br />Uploaded to Cloudinary</p>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </Field>
  );
}

function FaqListEditor({ faqs, onChange }) {
  const add = () => onChange([...faqs, { q: '', a: '' }]);
  const remove = (i) => onChange(faqs.filter((_, idx) => idx !== i));
  const update = (i, field, val) => onChange(faqs.map((f, idx) => idx === i ? { ...f, [field]: val } : f));

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-500">FAQ #{i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 transition-colors">
              <IoTrashOutline />
            </button>
          </div>
          <TextInput value={faq.q} onChange={v => update(i, 'q', v)} placeholder="Question..." maxLength={200} />
          <TextArea value={faq.a} onChange={v => update(i, 'a', v)} placeholder="Answer..." rows={3} maxLength={800} />
        </div>
      ))}
      {faqs.length < 20 && (
        <button
          onClick={add}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-all"
        >
          <IoAddCircleOutline className="text-lg" /> Add FAQ
        </button>
      )}
    </div>
  );
}

function StepListEditor({ steps, onChange }) {
  const update = (i, field, val) => onChange(steps.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <span className="text-xs font-bold text-slate-500">Step {s.step || i + 1}</span>
          <TextInput value={s.title} onChange={v => update(i, 'title', v)} placeholder="Step title..." maxLength={80} />
          <TextArea value={s.desc} onChange={v => update(i, 'desc', v)} placeholder="Step description..." rows={2} maxLength={200} />
        </div>
      ))}
    </div>
  );
}

// ─── Section Editors ─────────────────────────────────────────────────────────

function HeroEditor({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  return (
    <div className="space-y-5">
      <Field label="Badge Text" hint="Small pill above the headline">
        <TextInput value={data.badgeText} onChange={v => set('badgeText', v)} maxLength={60} />
      </Field>
      <Field label="Headline Line 1">
        <TextInput value={data.headline1} onChange={v => set('headline1', v)} maxLength={80} />
      </Field>
      <Field label="Headline Line 2 (highlighted)">
        <TextInput value={data.headline2} onChange={v => set('headline2', v)} maxLength={80} />
      </Field>
      <Field label="Subtitle">
        <TextArea value={data.subtitle} onChange={v => set('subtitle', v)} rows={3} maxLength={300} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Primary CTA Label">
          <TextInput value={data.cta1Label} onChange={v => set('cta1Label', v)} maxLength={40} />
        </Field>
        <Field label="Secondary CTA Label">
          <TextInput value={data.cta2Label} onChange={v => set('cta2Label', v)} maxLength={40} />
        </Field>
      </div>
    </div>
  );
}

function ServicesEditor({ data, setData }) {
  const update = (i, field, val) =>
    setData(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  const updateImage = (i, imgData) =>
    setData(prev => prev.map((s, idx) => idx === i ? { ...s, image: imgData } : s));

  const labels = ['Agriculture', 'Residential', 'Commercial', 'Industrial'];

  return (
    <div className="space-y-6">
      {data.map((srv, i) => (
        <div key={i} className="border border-slate-200 rounded-2xl p-5 space-y-4 bg-slate-50">
          <h4 className="font-bold text-slate-700">{labels[i] || `Category ${i + 1}`}</h4>
          <Field label="Title">
            <TextInput value={srv.title} onChange={v => update(i, 'title', v)} maxLength={40} />
          </Field>
          <Field label="Description">
            <TextArea value={srv.description} onChange={v => update(i, 'description', v)} rows={3} maxLength={250} />
          </Field>
          <ImageUploadField
            label="Category Image"
            hint="Recommended: 800×600px"
            currentUrl={srv.image?.url}
            section={`services-${i}`}
            onUploaded={imgData => updateImage(i, imgData)}
          />
        </div>
      ))}
    </div>
  );
}

function HowItWorksEditor({ data, setData, label }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  return (
    <div className="space-y-5">
      <Field label="Section Eyebrow Badge">
        <TextInput value={data.eyebrow} onChange={v => set('eyebrow', v)} maxLength={40} />
      </Field>
      <Field label="Heading Line 1">
        <TextInput value={data.heading1} onChange={v => set('heading1', v)} maxLength={60} />
      </Field>
      <Field label="Heading Line 2 (lighter)">
        <TextInput value={data.heading2} onChange={v => set('heading2', v)} maxLength={60} />
      </Field>
      <Field label="Subtitle">
        <TextArea value={data.subtitle} onChange={v => set('subtitle', v)} rows={2} maxLength={200} />
      </Field>
      <Field label={`${label} Steps`} hint="Edit titles and descriptions for each step">
        <StepListEditor steps={data.steps || []} onChange={v => set('steps', v)} />
      </Field>
    </div>
  );
}

function FounderEditor({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const updatePillar = (i, field, val) =>
    setData(d => ({ ...d, pillars: d.pillars.map((p, idx) => idx === i ? { ...p, [field]: val } : p) }));
  return (
    <div className="space-y-5">
      <Field label="Full Name">
        <TextInput value={data.name} onChange={v => set('name', v)} maxLength={60} />
      </Field>
      <Field label="Role / Title">
        <TextInput value={data.role} onChange={v => set('role', v)} maxLength={80} />
      </Field>
      <Field label="Company / Sub-Designation">
        <TextInput value={data.subDesignation} onChange={v => set('subDesignation', v)} maxLength={100} />
      </Field>
      <Field label="Bio / Narrative">
        <TextArea value={data.bio} onChange={v => set('bio', v)} rows={6} maxLength={1200} />
      </Field>
      <Field label="Signature Quote">
        <TextArea value={data.quote} onChange={v => set('quote', v)} rows={2} maxLength={300} />
      </Field>
      <Field label="Education Badge Text">
        <TextInput value={data.educationBadge} onChange={v => set('educationBadge', v)} maxLength={100} />
      </Field>
      <Field label="Experience Badge Text">
        <TextInput value={data.experienceBadge} onChange={v => set('experienceBadge', v)} maxLength={100} />
      </Field>
      <Field label="3 Core Pillars" hint="Edit each pillar card (icon emoji, title, description)">
        <div className="space-y-3">
          {(data.pillars || []).map((p, i) => (
            <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex gap-3">
                <div className="w-16">
                  <TextInput value={p.icon} onChange={v => updatePillar(i, 'icon', v)} placeholder="🎓" maxLength={4} />
                </div>
                <div className="flex-1">
                  <TextInput value={p.title} onChange={v => updatePillar(i, 'title', v)} placeholder="Pillar title..." maxLength={40} />
                </div>
              </div>
              <TextArea value={p.desc} onChange={v => updatePillar(i, 'desc', v)} rows={2} maxLength={200} />
            </div>
          ))}
        </div>
      </Field>
    </div>
  );
}

function FaqsEditor({ data, setData }) {
  const [tab, setTab] = useState('customer');
  return (
    <div className="space-y-4">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
        {['customer', 'expert'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
          >
            {t === 'customer' ? 'Customer FAQs' : 'Expert FAQs'}
          </button>
        ))}
      </div>
      <FaqListEditor
        faqs={data[tab] || []}
        onChange={v => setData(d => ({ ...d, [tab]: v }))}
      />
    </div>
  );
}

function StatsEditor({ data, setData }) {
  const update = (i, field, val) =>
    setData(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 flex items-center gap-1.5"><IoInformationCircleOutline /> Edit the three platform statistics displayed on the landing page.</p>
      {(data || []).map((stat, i) => (
        <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <span className="text-xs font-bold text-slate-500">Stat #{i + 1}</span>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Number">
              <TextInput value={stat.number} onChange={v => update(i, 'number', v)} placeholder="500+" maxLength={20} />
            </Field>
            <Field label="Label">
              <TextInput value={stat.label} onChange={v => update(i, 'label', v)} placeholder="Verified Experts" maxLength={40} />
            </Field>
          </div>
        </div>
      ))}
    </div>
  );
}

function FooterEditor({ data, setData }) {
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));
  const setSocial = (k, v) => setData(d => ({ ...d, socialLinks: { ...(d.socialLinks || {}), [k]: v } }));
  return (
    <div className="space-y-5">
      <Field label="Company Tagline">
        <TextArea value={data.tagline} onChange={v => set('tagline', v)} rows={2} maxLength={200} />
      </Field>
      <div className="space-y-3">
        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Social Links</p>
        {['whatsapp', 'twitter', 'linkedin', 'youtube'].map(platform => (
          <Field key={platform} label={platform.charAt(0).toUpperCase() + platform.slice(1) + ' URL'}>
            <TextInput
              value={data.socialLinks?.[platform]}
              onChange={v => setSocial(platform, v)}
              placeholder={`https://${platform}.com/...`}
              maxLength={200}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

// ─── Main AdminLandingPage ───────────────────────────────────────────────────

const SECTIONS = [
  { id: 'hero', label: 'Hero Section', icon: '🏠' },
  { id: 'services', label: 'Category Cards', icon: '🗂️' },
  { id: 'howItWorksCustomers', label: 'How It Works (Customers)', icon: '👤' },
  { id: 'howItWorksExperts', label: 'How It Works (Experts)', icon: '🔧' },
  { id: 'founder', label: 'Founder Profile', icon: '👨‍💼' },
  { id: 'stats', label: 'Platform Stats', icon: '📊' },
  { id: 'faqs', label: 'FAQs', icon: '❓' },
  { id: 'footer', label: 'Footer', icon: '🔗' },
];

const DEFAULT_DATA = {
  hero: { badgeText: '', headline1: '', headline2: '', subtitle: '', cta1Label: '', cta2Label: '' },
  services: [
    { title: 'Agriculture', description: '', image: { url: '' } },
    { title: 'Residential', description: '', image: { url: '' } },
    { title: 'Commercial', description: '', image: { url: '' } },
    { title: 'Industrial', description: '', image: { url: '' } },
  ],
  howItWorksCustomers: { eyebrow: '', heading1: '', heading2: '', subtitle: '', steps: [] },
  howItWorksExperts: { eyebrow: '', heading1: '', heading2: '', subtitle: '', steps: [] },
  founder: { name: '', role: '', subDesignation: '', bio: '', quote: '', educationBadge: '', experienceBadge: '', pillars: [] },
  stats: [{ number: '', label: '' }, { number: '', label: '' }, { number: '', label: '' }],
  faqs: { customer: [], expert: [] },
  footer: { tagline: '', socialLinks: {} },
};

export default function AdminLandingPage() {
  const [activeSection, setActiveSection] = useState('hero');
  const [sectionData, setSectionData] = useState({ ...DEFAULT_DATA });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error'
  const [error, setError] = useState(null);

  // Load current content
  useEffect(() => {
    setLoading(true);
    getLandingContent()
      .then(res => {
        if (res?.success && res?.data) {
          const d = res.data;
          setSectionData({
            hero: d.hero || DEFAULT_DATA.hero,
            services: d.services?.length ? d.services : DEFAULT_DATA.services,
            howItWorksCustomers: d.howItWorksCustomers || DEFAULT_DATA.howItWorksCustomers,
            howItWorksExperts: d.howItWorksExperts || DEFAULT_DATA.howItWorksExperts,
            founder: d.founder || DEFAULT_DATA.founder,
            stats: d.stats?.length ? d.stats : DEFAULT_DATA.stats,
            faqs: d.faqs || DEFAULT_DATA.faqs,
            footer: d.footer || DEFAULT_DATA.footer,
          });
        }
      })
      .catch(() => setError('Failed to load landing page content. Check your connection.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    try {
      await updateLandingSection(activeSection, sectionData[activeSection]);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const setSection = (key) => (updater) => {
    setSectionData(prev => ({
      ...prev,
      [key]: typeof updater === 'function' ? updater(prev[key]) : updater
    }));
  };

  const renderEditor = () => {
    const d = sectionData[activeSection];
    const set = setSection(activeSection);
    switch (activeSection) {
      case 'hero':          return <HeroEditor data={d} setData={set} />;
      case 'services':      return <ServicesEditor data={d} setData={set} />;
      case 'howItWorksCustomers': return <HowItWorksEditor data={d} setData={set} label="Customer" />;
      case 'howItWorksExperts':   return <HowItWorksEditor data={d} setData={set} label="Expert" />;
      case 'founder':       return <FounderEditor data={d} setData={set} />;
      case 'stats':         return <StatsEditor data={d} setData={set} />;
      case 'faqs':          return <FaqsEditor data={d} setData={set} />;
      case 'footer':        return <FooterEditor data={d} setData={set} />;
      default:              return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading landing page content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <IoCloseCircle className="text-5xl text-red-400" />
        <p className="text-slate-700 font-semibold">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">Retry</button>
      </div>
    );
  }

  const activeLabel = SECTIONS.find(s => s.id === activeSection)?.label || '';

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Landing Page Editor</h1>
          <p className="text-sm text-slate-500 mt-1">Edit content live — changes reflect on the public landing page instantly.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors border border-slate-200"
          >
            <IoEyeOutline className="text-lg" /> Preview Site
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
              saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            } text-white`}
          >
            {saving
              ? <IoRefreshOutline className="animate-spin text-lg" />
              : saveStatus === 'success'
              ? <IoCheckmarkCircle className="text-lg" />
              : <IoSaveOutline className="text-lg" />
            }
            {saving ? 'Saving...' : saveStatus === 'success' ? 'Saved!' : `Save ${activeLabel}`}
          </button>
        </div>
      </div>

      {/* Save status banner */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold ${
              saveStatus === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {saveStatus === 'success'
              ? <><IoCheckmarkCircle className="text-lg shrink-0" /> Section saved successfully! The public landing page now reflects your changes.</>
              : <><IoCloseCircle className="text-lg shrink-0" /> Save failed. Please try again or check your connection.</>
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-1 sticky top-28">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Sections</p>
            {SECTIONS.map(s => (
              <SectionTab key={s.id} id={s.id} label={s.label} icon={s.icon} active={activeSection === s.id} onClick={id => { setActiveSection(id); setSaveStatus(null); }} />
            ))}
          </div>
        </aside>

        {/* Editor Panel */}
        <main className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <span className="text-2xl">{SECTIONS.find(s => s.id === activeSection)?.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{activeLabel}</h2>
                <p className="text-xs text-slate-500">Make changes below, then click "Save {activeLabel}"</p>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
                {renderEditor()}
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                  saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                } text-white`}
              >
                {saving ? <IoRefreshOutline className="animate-spin" /> : <IoSaveOutline />}
                {saving ? 'Saving...' : `Save ${activeLabel}`}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
