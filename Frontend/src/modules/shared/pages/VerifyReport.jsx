import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const fmt = (d) =>
  d
    ? new Date(d).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : 'N/A';

export default function VerifyReport() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(`${API_BASE}/verify/${id}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        setData(json.data);
      } catch (err) {
        setError(err.message || 'Unable to verify report.');
      } finally {
        setLoading(false);
      }
    };
    if (id) verify();
  }, [id]);

  return (
    <div style={styles.root}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div style={styles.logoWrap}>
          <span style={styles.logo}>Jaladhaara</span>
          <span style={styles.logoSub}>Digital Survey Platform</span>
        </div>
        <span style={styles.headerBadge}>🔒 Secure Verification</span>
      </div>

      {/* ── Card ── */}
      <div style={styles.card}>
        {loading && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Verifying report authenticity…</p>
          </div>
        )}

        {!loading && error && (
          <div style={styles.center}>
            <div style={styles.iconCircle('#FEE2E2')}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#EF4444" strokeWidth="2" />
                <path d="M15 9l-6 6M9 9l6 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h2 style={{ ...styles.resultTitle, color: '#991B1B' }}>Verification Failed</h2>
            <p style={styles.errorMsg}>{error}</p>
            <p style={styles.hint}>If you believe this is an error, please contact support at <strong>info@jaladhaaraapp.com</strong></p>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Status Banner */}
            <div style={data.waterFound ? styles.bannerSuccess : styles.bannerFailure}>
              <div style={styles.bannerIcon}>
                {data.waterFound ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#065F46" strokeWidth="2" />
                    <path d="M8 12l3 3 5-5" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#92400E" strokeWidth="2" />
                    <path d="M12 8v4m0 4h.01" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div>
                <p style={data.waterFound ? styles.bannerLbl : { ...styles.bannerLbl, color: '#92400E' }}>
                  Survey Outcome
                </p>
                <p style={data.waterFound ? styles.bannerTitle : { ...styles.bannerTitle, color: '#92400E' }}>
                  {data.waterFound ? 'Recommended Borewell Location Identified' : 'No Suitable Groundwater Potential Identified'}
                </p>
              </div>
            </div>

            {/* Verified Badge */}
            <div style={styles.verifiedRow}>
              <div style={styles.verifiedBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 5 }}>
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.02-.12-2.01-.382-2.976z" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                ✓ Verified — Authentic Jaladhaara Report
              </div>
              <span style={styles.reportId}>Report #{data.reportId}</span>
            </div>

            {/* Info Grid */}
            <div style={styles.grid}>
              <InfoRow label="Client Name" value={data.clientName} />
              <InfoRow label="Expert" value={data.expertName} />
              <InfoRow label="Designation" value={data.expertDesignation} />
              <InfoRow label="Survey Category" value={data.surveyCategory} />
              <InfoRow label="Purpose" value={data.purpose} />
              <InfoRow label="Location" value={[data.village, data.mandal, data.district].filter(Boolean).join(', ')} />
              <InfoRow label="Survey Date" value={fmt(data.surveyDate)} fullWidth />
              <InfoRow label="Report Issued" value={fmt(data.reportIssuedAt)} fullWidth />
            </div>

            {/* Footer note */}
            <div style={styles.footerNote}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6, flexShrink: 0 }}>
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
              </svg>
              This report was issued through the <strong>Jaladhaara Digital Survey Platform</strong>. For disputes or queries, contact <strong>info@jaladhaaraapp.com</strong>
            </div>
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <p style={styles.footerText}>© {new Date().getFullYear()} Jaladhaara. All rights reserved.</p>
    </div>
  );
}

function InfoRow({ label, value, fullWidth }) {
  return (
    <div style={{ ...styles.infoRow, gridColumn: fullWidth ? '1 / -1' : undefined }}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value || 'N/A'}</span>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0A192F 0%, #0F2D4A 50%, #0A192F 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 16px 60px',
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  header: {
    width: '100%',
    maxWidth: 560,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: { display: 'flex', flexDirection: 'column' },
  logo: { fontSize: 26, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' },
  logoSub: { fontSize: 11, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: 1 },
  headerBadge: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: 600,
    padding: '5px 12px',
    borderRadius: 20,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    background: '#FFFFFF',
    borderRadius: 16,
    boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
    overflow: 'hidden',
    padding: 0,
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '56px 32px',
    textAlign: 'center',
  },
  spinner: {
    width: 44,
    height: 44,
    border: '3px solid #E5E7EB',
    borderTop: '3px solid #0A84FF',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
    marginBottom: 16,
  },
  loadingText: { color: '#6B7280', fontSize: 14, margin: 0 },
  iconCircle: (bg) => ({
    width: 72,
    height: 72,
    borderRadius: '50%',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  }),
  resultTitle: { fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: '#111827' },
  errorMsg: { color: '#6B7280', fontSize: 14, margin: '0 0 12px', lineHeight: 1.6 },
  hint: { color: '#9CA3AF', fontSize: 12.5, lineHeight: 1.6, margin: 0 },
  bannerSuccess: {
    background: '#ECFDF5',
    borderBottom: '1px solid #A7F3D0',
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  bannerFailure: {
    background: '#FFFBEB',
    borderBottom: '1px solid #FDE68A',
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  bannerIcon: { flexShrink: 0 },
  bannerLbl: { fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700, color: '#065F46', margin: '0 0 3px' },
  bannerTitle: { fontSize: 16, fontWeight: 700, color: '#065F46', margin: 0, lineHeight: 1.3 },
  verifiedRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 28px',
    background: '#F9FAFB',
    borderBottom: '1px solid #E5E7EB',
  },
  verifiedBadge: {
    display: 'flex',
    alignItems: 'center',
    color: '#059669',
    fontSize: 12.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  reportId: { fontSize: 12, color: '#6B7280', fontWeight: 600 },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1px',
    background: '#E5E7EB',
    margin: '0 28px 20px',
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
    border: '1px solid #E5E7EB',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    background: '#FFFFFF',
    padding: '10px 14px',
    gap: 3,
  },
  infoLabel: { fontSize: 10, textTransform: 'uppercase', fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.5px' },
  infoValue: { fontSize: 13.5, fontWeight: 600, color: '#111827' },
  footerNote: {
    display: 'flex',
    alignItems: 'flex-start',
    background: '#F0F7FF',
    border: '1px solid #BFDBFE',
    borderRadius: 8,
    padding: '10px 14px',
    margin: '0 28px 28px',
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 1.6,
  },
  footerText: { color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 28 },
};
