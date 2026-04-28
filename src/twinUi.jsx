const glass = 'rgba(255,255,255,0.55)'
const glassBorder = 'rgba(255,255,255,0.70)'
const accent = '#7c3aed'
const accentSoft = 'rgba(124,58,237,0.12)'
const accentMed = 'rgba(124,58,237,0.25)'
const textPrimary = '#1e1b2e'
const textSecondary = 'rgba(30,27,46,0.55)'
const mono = '"JetBrains Mono", "Courier New", monospace'
const sans = '"Inter", sans-serif'

export function formatNumber(value, digits = 3) {
  if (!Number.isFinite(value)) return 'No aplica'
  if (Math.abs(value) >= 1000) return value.toLocaleString('es-MX', { maximumFractionDigits: 2 })
  if (Math.abs(value) > 0 && Math.abs(value) < 0.001) return value.toExponential(3)
  return value.toLocaleString('es-MX', { maximumFractionDigits: digits })
}

export function toNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : NaN
}

export function NumberInput({ label, value, unit, unitOptions, onValueChange, onUnitChange, step = 'any' }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <div style={unitOptions ? styles.inputRow : styles.singleInputRow}>
        <input
          style={styles.input}
          type="number"
          step={step}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
        />
        {unitOptions && (
          <select style={styles.select} value={unit} onChange={(event) => onUnitChange(event.target.value)}>
            {unitOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </label>
  )
}

export function SelectField({ label, value, options, onChange }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <select style={styles.selectFull} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function StatCard({ label, value, detail }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
      {detail && <span style={styles.statDetail}>{detail}</span>}
    </div>
  )
}

export function InfoBlock({ title, items }) {
  return (
    <div style={styles.infoBlock}>
      <h3 style={styles.groupTitle}>{title}</h3>
      <ul style={styles.infoList}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

export const chartTooltipStyle = {
  background: 'rgba(255,255,255,0.85)',
  color: textPrimary,
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 10,
  backdropFilter: 'blur(16px)',
  fontFamily: mono,
}

export const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #e8e0f0 0%, #f0e6f6 20%, #fce4ec 45%, #e3f2fd 70%, #ede7f6 100%)',
    color: textPrimary,
    fontFamily: sans,
    padding: '32px 24px',
    position: 'relative',
    overflowX: 'hidden',
  },
  orb1: { position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)', top: '-10%', left: '-5%', filter: 'blur(80px)', animation: 'float-orb 20s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 },
  orb2: { position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.12) 0%,transparent 70%)', bottom: '-15%', right: '-8%', filter: 'blur(90px)', animation: 'float-orb 25s ease-in-out infinite reverse', pointerEvents: 'none', zIndex: 0 },
  orb3: { position: 'fixed', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.10) 0%,transparent 70%)', top: '50%', left: '40%', filter: 'blur(60px)', animation: 'float-orb 18s ease-in-out infinite 5s', pointerEvents: 'none', zIndex: 0 },
  container: { maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 },
  header: {
    borderBottom: '1px solid rgba(255,255,255,0.5)',
    paddingBottom: 20,
    marginBottom: 28,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 16,
    animation: 'fade-in-up 0.6s ease-out',
  },
  backButton: {
    order: 2,
    flex: '0 0 auto',
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: '0.1em',
    padding: '8px 16px',
    border: '1px solid ' + accentMed,
    background: accentSoft,
    backdropFilter: 'blur(12px)',
    color: accent,
    textTransform: 'uppercase',
    borderRadius: 8,
    fontWeight: 600,
    cursor: 'pointer',
  },
  kicker: {
    fontSize: 11,
    fontFamily: mono,
    textTransform: 'uppercase',
    letterSpacing: '0.2em',
    color: accent,
    marginBottom: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: 800,
    letterSpacing: '-0.03em',
    lineHeight: 1.05,
    margin: 0,
    background: 'linear-gradient(135deg, #1e1b2e 0%, #7c3aed 60%, #ec4899 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    maxWidth: 920,
    fontSize: 13,
    marginTop: 8,
    color: 'rgba(30,27,46,0.5)',
    lineHeight: 1.5,
  },
  notice: {
    fontFamily: sans,
    fontStyle: 'italic',
    fontSize: 15,
    background: glass,
    border: '1px solid ' + glassBorder,
    backdropFilter: 'blur(16px)',
    color: textPrimary,
    padding: '14px 20px',
    marginBottom: 20,
    letterSpacing: '0.02em',
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  },
  topMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 14,
    marginBottom: 28,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: '340px 1fr',
    gap: 24,
    alignItems: 'start',
  },
  panel: {
    background: glass,
    border: '1px solid ' + glassBorder,
    padding: 22,
    borderRadius: 16,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
    animation: 'fade-in-up 0.5s ease-out both',
  },
  resultsPanel: {
    display: 'grid',
    gap: 16,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    marginBottom: 18,
    gap: 4,
    overflowX: 'auto',
  },
  tab: (active) => ({
    padding: '10px 18px',
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    background: active ? accentSoft : 'transparent',
    color: active ? accent : textSecondary,
    border: 'none',
    borderRadius: '8px 8px 0 0',
    fontWeight: active ? 600 : 400,
    borderBottom: active ? '2px solid ' + accent : '2px solid transparent',
    whiteSpace: 'nowrap',
  }),
  sectionHeader: {
    display: 'grid',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: mono,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(124,58,237,0.15)',
    paddingBottom: 10,
    marginBottom: 4,
    color: accent,
    fontWeight: 600,
  },
  groupTitle: {
    marginBottom: 12,
    fontSize: 10,
    fontFamily: mono,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: accent,
    fontWeight: 600,
  },
  inputSection: {
    paddingTop: 16,
    marginTop: 16,
    borderTop: '1px solid rgba(124,58,237,0.15)',
  },
  field: {
    display: 'grid',
    gap: 6,
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontFamily: mono,
    letterSpacing: '0.05em',
    color: textSecondary,
    fontWeight: 600,
  },
  inputRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 108px',
    gap: 8,
  },
  singleInputRow: {
    display: 'grid',
  },
  input: {
    width: '100%',
    minHeight: 38,
    padding: '9px 12px',
    fontFamily: mono,
    fontSize: 14,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255,255,255,0.6)',
    color: textPrimary,
    borderRadius: 8,
    boxSizing: 'border-box',
  },
  select: {
    minHeight: 38,
    padding: '9px 8px',
    fontFamily: mono,
    fontSize: 12,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255,255,255,0.6)',
    color: textPrimary,
    borderRadius: 8,
    fontWeight: 600,
  },
  selectFull: {
    width: '100%',
    minHeight: 38,
    padding: '9px 8px',
    fontFamily: mono,
    fontSize: 12,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255,255,255,0.6)',
    color: textPrimary,
    borderRadius: 8,
    fontWeight: 600,
  },
  primaryButton: {
    width: '100%',
    padding: '11px',
    background: 'linear-gradient(135deg, ' + accent + ', #9333ea)',
    color: '#fff',
    border: 'none',
    fontFamily: mono,
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    marginTop: 2,
    borderRadius: 10,
    fontWeight: 600,
    boxShadow: '0 4px 18px rgba(124,58,237,0.25)',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
    marginTop: 14,
  },
  statCard: {
    minHeight: 126,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 10,
    background: glass,
    border: '1px solid ' + glassBorder,
    padding: 18,
    borderRadius: 14,
    backdropFilter: 'blur(16px)',
    borderLeft: '3px solid ' + accent,
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    animation: 'fade-in-up 0.5s ease-out both',
  },
  statLabel: {
    display: 'block',
    fontSize: 10,
    fontFamily: mono,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: accent,
    fontWeight: 500,
    lineHeight: 1.45,
  },
  statValue: {
    display: 'block',
    fontSize: 24,
    fontWeight: 800,
    lineHeight: 1.1,
    color: textPrimary,
    wordBreak: 'normal',
  },
  statDetail: {
    display: 'block',
    fontSize: 12,
    fontFamily: mono,
    color: textSecondary,
    lineHeight: 1.35,
  },
  statusCard: (ok) => ({
    padding: 12,
    marginBottom: 12,
    fontFamily: mono,
    fontSize: 12,
    borderRadius: 10,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${ok ? 'rgba(5,150,105,0.28)' : 'rgba(239,68,68,0.25)'}`,
    background: ok ? 'rgba(5,150,105,0.10)' : 'rgba(239,68,68,0.08)',
    color: ok ? '#047857' : '#dc2626',
    fontWeight: 600,
  }),
  interpretation: {
    marginTop: 14,
    padding: '14px 20px',
    borderRadius: 12,
    background: glass,
    border: '1px solid ' + glassBorder,
    color: textPrimary,
    lineHeight: 1.45,
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
    backdropFilter: 'blur(16px)',
  },
  warningBox: {
    display: 'grid',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    border: '1px solid rgba(245,158,11,0.3)',
    background: 'rgba(245,158,11,0.10)',
    color: '#b45309',
    fontFamily: mono,
    fontSize: 12,
    backdropFilter: 'blur(12px)',
  },
  errorBox: {
    display: 'grid',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    border: '1px solid rgba(239,68,68,0.25)',
    background: 'rgba(239,68,68,0.08)',
    color: '#dc2626',
    fontFamily: mono,
    fontSize: 12,
    backdropFilter: 'blur(12px)',
  },
  chartTitle: {
    marginBottom: 10,
    fontSize: 10,
    fontFamily: mono,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: accent,
    fontWeight: 600,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 16,
  },
  infoBlock: {
    padding: 18,
    border: '1px solid ' + glassBorder,
    borderRadius: 14,
    background: glass,
    backdropFilter: 'blur(16px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
  },
  infoList: {
    paddingLeft: 18,
    display: 'grid',
    gap: 8,
    color: textSecondary,
    lineHeight: 1.45,
    fontSize: 13,
  },
}
