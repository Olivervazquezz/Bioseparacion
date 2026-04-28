import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine, ComposedChart, Bar } from 'recharts';

// =====================================================================
// NÚCLEO CINÉTICO — Modelo Weibull/Page modificado
// C(t) = C0 + (C∞ - C0) * (1 - exp(-(t/τ)^β))
// =====================================================================
const C_t = (t, C0, Cinf, tau, beta) =>
  C0 + (Cinf - C0) * (1 - Math.exp(-Math.pow(t / tau, beta)));

const F_t = (t, tau, beta) => 1 - Math.exp(-Math.pow(t / tau, beta));

// Inversa: tiempo para alcanzar concentración objetivo
const t_for_C = (Cobj, C0, Cinf, tau, beta) => {
  if (Cobj <= C0 || Cobj >= Cinf) return null;
  const f = (Cobj - C0) / (Cinf - C0);
  return tau * Math.pow(-Math.log(1 - f), 1 / beta);
};

// Inversa: tiempo para alcanzar fracción objetivo
const t_for_F = (f, tau, beta) => {
  if (f <= 0 || f >= 1) return null;
  return tau * Math.pow(-Math.log(1 - f), 1 / beta);
};

// Datos experimentales base (Modelo WeibullPage — Con Tween)
const EXPERIMENTAL = [
  { t: 0,  C: 2.554929368 },
  { t: 3,  C: 3.907539033 },
  { t: 6,  C: 3.832394052 },
  { t: 9,  C: 4.567144981 },
  { t: 12, C: 6.220334572 },
  { t: 15, C: 7.823427509 },
];

// Parámetros base del Excel
const BASE_PARAMS = {
  C0:   2.554929368,
  Cinf: 14.0,
  tau:  20.7737,
  beta: 1.6873,
};

const METRICS = { SSE: 1.138979113, RMSE: 0.435694678, R2: 0.936666774 };
const T_EXP_MAX = 15; // límite del rango experimental

// =====================================================================
// COMPONENTE PRINCIPAL
// =====================================================================
export default function DigitalTwin() {
  // Parámetros cinéticos editables
  const [C0,   setC0]   = useState(BASE_PARAMS.C0);
  const [Cinf, setCinf] = useState(BASE_PARAMS.Cinf);
  const [tau,  setTau]  = useState(BASE_PARAMS.tau);
  const [beta, setBeta] = useState(BASE_PARAMS.beta);

  // Variables de simulación
  const [tMax, setTMax]     = useState(60);
  const [dt,   setDt]       = useState(1);
  const [tEval, setTEval]   = useState(15);
  const [Cobj, setCobj]     = useState(10);
  const [Fobj, setFobj]     = useState(0.9);

  const [activeTab, setActiveTab] = useState('kinetic');

  // ==========================================================
  // SIMULACIÓN — genera tabla y series
  // ==========================================================
  const simulation = useMemo(() => {
    const data = [];
    for (let t = 0; t <= tMax + 1e-9; t += dt) {
      const tr = Math.round(t * 1000) / 1000;
      const c = C_t(tr, C0, Cinf, tau, beta);
      const f = F_t(tr, tau, beta);
      const cExp = EXPERIMENTAL.find(p => Math.abs(p.t - tr) < 1e-6);
      data.push({
        t: tr,
        C: +c.toFixed(4),
        F: +f.toFixed(4),
        pct: +(f * 100).toFixed(2),
        Cexp: cExp ? cExp.C : null,
        extrapolated: tr > T_EXP_MAX,
      });
    }
    return data;
  }, [C0, Cinf, tau, beta, tMax, dt]);

  // Predicciones puntuales
  const C_at_eval = C_t(tEval, C0, Cinf, tau, beta);
  const F_at_eval = F_t(tEval, tau, beta);

  // Análisis de objetivos
  const t_for_Cobj = t_for_C(Cobj, C0, Cinf, tau, beta);
  const t_for_Fobj = t_for_F(Fobj, tau, beta);

  // Hitos de fracción
  const milestones = [0.5, 0.8, 0.9, 0.95].map(f => ({
    f,
    t: t_for_F(f, tau, beta),
    C: C0 + (Cinf - C0) * f,
  }));

  // Residuales (validación del ajuste base)
  const residuals = EXPERIMENTAL.map(p => {
    const Cmod = C_t(p.t, C0, Cinf, tau, beta);
    return { t: p.t, Cexp: p.C, Cmod: +Cmod.toFixed(4), residual: +(p.C - Cmod).toFixed(4) };
  });

  // Validaciones
  const warnings = [];
  if (Cinf <= C0) warnings.push('C∞ debe ser mayor que C₀');
  if (tau <= 0)   warnings.push('τ debe ser positivo');
  if (beta <= 0)  warnings.push('β debe ser positivo');
  if (tMax > T_EXP_MAX * 4) warnings.push(`Simulación muy fuera del rango experimental (0–${T_EXP_MAX} min)`);
  if (Cobj <= C0 || Cobj >= Cinf) warnings.push(`C objetivo debe estar entre ${C0.toFixed(2)} y ${Cinf.toFixed(2)} mg/L`);

  const isExtrapolating = tEval > T_EXP_MAX;

  // ==========================================================
  // ESTILOS — Aesthetic: laboratorio editorial / técnico
  // ==========================================================
  // Light Glassmorphism color tokens
  const glass = 'rgba(255,255,255,0.55)';
  const glassBorder = 'rgba(255,255,255,0.70)';
  const accent = '#7c3aed';
  const accentSoft = 'rgba(124,58,237,0.12)';
  const accentMed = 'rgba(124,58,237,0.25)';
  const textPrimary = '#1e1b2e';
  const textSecondary = 'rgba(30,27,46,0.55)';
  const mono = '"JetBrains Mono", "Courier New", monospace';
  const sans = '"Inter", sans-serif';

  const styles = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8e0f0 0%, #f0e6f6 20%, #fce4ec 45%, #e3f2fd 70%, #ede7f6 100%)',
      color: textPrimary,
      fontFamily: sans,
      padding: '32px 24px',
      position: 'relative',
      overflow: 'hidden',
    },
    orb1: { position:'fixed',width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)',top:'-10%',left:'-5%',filter:'blur(80px)',animation:'float-orb 20s ease-in-out infinite',pointerEvents:'none',zIndex:0 },
    orb2: { position:'fixed',width:600,height:600,borderRadius:'50%',background:'radial-gradient(circle,rgba(236,72,153,0.12) 0%,transparent 70%)',bottom:'-15%',right:'-8%',filter:'blur(90px)',animation:'float-orb 25s ease-in-out infinite reverse',pointerEvents:'none',zIndex:0 },
    orb3: { position:'fixed',width:350,height:350,borderRadius:'50%',background:'radial-gradient(circle,rgba(59,130,246,0.10) 0%,transparent 70%)',top:'50%',left:'40%',filter:'blur(60px)',animation:'float-orb 18s ease-in-out infinite 5s',pointerEvents:'none',zIndex:0 },
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
      fontSize: 11,
      fontFamily: mono,
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      color: accent,
      marginTop: 8,
    },
    badge: {
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
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '320px 1fr',
      gap: 24,
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
    panelTitle: {
      fontSize: 10,
      fontFamily: mono,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      borderBottom: '1px solid rgba(124,58,237,0.15)',
      paddingBottom: 10,
      marginBottom: 16,
      color: accent,
      fontWeight: 600,
    },
    inputRow: { marginBottom: 14 },
    label: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      fontFamily: mono,
      marginBottom: 5,
      letterSpacing: '0.05em',
      color: textSecondary,
    },
    labelKey: { fontWeight: 600, color: textPrimary },
    labelUnit: { color: accent, fontSize: 10 },
    input: {
      width: '100%',
      padding: '9px 12px',
      fontFamily: mono,
      fontSize: 14,
      border: '1px solid rgba(0,0,0,0.08)',
      background: 'rgba(255,255,255,0.6)',
      color: textPrimary,
      borderRadius: 8,
      boxSizing: 'border-box',
    },
    button: {
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
      marginTop: 10,
      borderRadius: 10,
      fontWeight: 600,
      boxShadow: '0 4px 18px rgba(124,58,237,0.25)',
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 14,
      marginBottom: 28,
    },
    metric: {
      background: glass,
      border: '1px solid ' + glassBorder,
      padding: 18,
      borderRadius: 14,
      backdropFilter: 'blur(16px)',
      borderLeft: '3px solid ' + accent,
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      animation: 'fade-in-up 0.5s ease-out both',
    },
    metricLabel: {
      fontSize: 10,
      fontFamily: mono,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: accent,
      fontWeight: 500,
    },
    metricValue: {
      fontSize: 28,
      fontWeight: 800,
      lineHeight: 1.1,
      marginTop: 6,
      color: textPrimary,
    },
    metricUnit: { fontSize: 12, fontFamily: mono, color: textSecondary },
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
    }),
    eq: {
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
    warn: {
      background: 'rgba(245,158,11,0.10)',
      border: '1px solid rgba(245,158,11,0.3)',
      padding: 10,
      marginBottom: 12,
      fontFamily: mono,
      fontSize: 12,
      color: '#b45309',
      borderRadius: 10,
      backdropFilter: 'blur(12px)',
    },
    extrap: {
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.25)',
      padding: 8,
      fontSize: 11,
      fontFamily: mono,
      color: '#dc2626',
      marginTop: 8,
      borderRadius: 8,
    },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: mono, color: textPrimary },
    th: { background: accentSoft, color: accent, padding: '10px 12px', textAlign: 'left', letterSpacing: '0.1em', fontSize: 10, fontWeight: 600, borderBottom: '1px solid ' + accentMed },
    td: { padding: '7px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)' },
    footer: {
      marginTop: 36,
      paddingTop: 18,
      borderTop: '1px solid rgba(0,0,0,0.08)',
      fontSize: 10,
      fontFamily: mono,
      letterSpacing: '0.1em',
      color: textSecondary,
      textAlign: 'center',
    },
  };

  const resetParams = () => {
    setC0(BASE_PARAMS.C0); setCinf(BASE_PARAMS.Cinf);
    setTau(BASE_PARAMS.tau); setBeta(BASE_PARAMS.beta);
  };

  return (
    <div style={styles.page}>
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <div style={styles.subtitle}>Bioseparación · Digital Twin v1.0</div>
            <h1 style={styles.title}>Antocianinas <span style={{ color: '#7c3aed' }}>/</span> Bead Mill</h1>
            <div style={{ fontSize: 13, marginTop: 8, color: 'rgba(30,27,46,0.5)' }}>
              Modelo Weibull/Page modificado — Condición base: con Tween
            </div>
          </div>
          <div style={styles.badge}>R² = {METRICS.R2.toFixed(4)}</div>
        </div>

        {/* ECUACIÓN */}
        <div style={styles.eq}>
          C(t) = C₀ + (C<sub>∞</sub> − C₀) · [1 − exp(−(t/τ)<sup>β</sup>)]
        </div>

        {/* MÉTRICAS PRINCIPALES */}
        <div style={styles.metricsGrid}>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>C(t = {tEval} min)</div>
            <div style={styles.metricValue}>{C_at_eval.toFixed(3)} <span style={{ fontSize: 14, color: 'rgba(30,27,46,0.4)' }}>mg/L</span></div>
            <div style={styles.metricUnit}>F = {(F_at_eval * 100).toFixed(2)} %</div>
            {isExtrapolating && <div style={styles.extrap}>⚡ Extrapolación: t &gt; {T_EXP_MAX} min</div>}
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>t para C = {Cobj} mg/L</div>
            <div style={styles.metricValue}>
              {t_for_Cobj !== null ? t_for_Cobj.toFixed(2) : '—'} <span style={{ fontSize: 14, color: 'rgba(30,27,46,0.4)' }}>min</span>
            </div>
            <div style={styles.metricUnit}>
              {t_for_Cobj === null ? 'Fuera de rango (C₀, C∞)' : 'Tiempo necesario'}
            </div>
          </div>
          <div style={styles.metric}>
            <div style={styles.metricLabel}>R²</div>
            <div style={styles.metricValue}>{METRICS.R2.toFixed(3)}</div>
            <div style={styles.metricUnit}>bondad de ajuste</div>
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div style={styles.grid}>

          {/* PANEL IZQUIERDO — Controles */}
          <div>
            <div style={styles.panel}>
              <div style={styles.panelTitle}>Parámetros cinéticos</div>

              <div style={styles.inputRow}>
                <div style={styles.label}><span style={styles.labelKey}>C₀</span><span style={styles.labelUnit}>mg/L</span></div>
                <input style={styles.input} type="number" step="0.01" value={C0} onChange={e => setC0(+e.target.value)} />
              </div>
              <div style={styles.inputRow}>
                <div style={styles.label}><span style={styles.labelKey}>C<sub>∞</sub></span><span style={styles.labelUnit}>mg/L</span></div>
                <input style={styles.input} type="number" step="0.1" value={Cinf} onChange={e => setCinf(+e.target.value)} />
              </div>
              <div style={styles.inputRow}>
                <div style={styles.label}><span style={styles.labelKey}>τ</span><span style={styles.labelUnit}>min</span></div>
                <input style={styles.input} type="number" step="0.1" value={tau} onChange={e => setTau(+e.target.value)} />
              </div>
              <div style={styles.inputRow}>
                <div style={styles.label}><span style={styles.labelKey}>β</span><span style={styles.labelUnit}>—</span></div>
                <input style={styles.input} type="number" step="0.01" value={beta} onChange={e => setBeta(+e.target.value)} />
              </div>

              <button style={styles.button} onClick={resetParams}>↻ Restaurar Datos</button>
            </div>

            <div style={{ ...styles.panel, marginTop: 16 }}>
              <div style={styles.panelTitle}>Simulación</div>

              <div style={styles.inputRow}>
                <div style={styles.label}><span style={styles.labelKey}>t máx.</span><span style={styles.labelUnit}>min</span></div>
                <input style={styles.input} type="number" step="1" value={tMax} onChange={e => setTMax(+e.target.value)} />
              </div>
              <div style={styles.inputRow}>
                <div style={styles.label}><span style={styles.labelKey}>Δt</span><span style={styles.labelUnit}>min</span></div>
                <input style={styles.input} type="number" step="0.5" min="0.1" value={dt} onChange={e => setDt(+e.target.value)} />
              </div>
              <div style={styles.inputRow}>
                <div style={styles.label}><span style={styles.labelKey}>t evaluación</span><span style={styles.labelUnit}>min</span></div>
                <input style={styles.input} type="number" step="0.5" value={tEval} onChange={e => setTEval(+e.target.value)} />
              </div>
            </div>

            <div style={{ ...styles.panel, marginTop: 16 }}>
              <div style={styles.panelTitle}>Análisis inverso</div>

              <div style={styles.inputRow}>
                <div style={styles.label}><span style={styles.labelKey}>C objetivo</span><span style={styles.labelUnit}>mg/L</span></div>
                <input style={styles.input} type="number" step="0.1" value={Cobj} onChange={e => setCobj(+e.target.value)} />
              </div>
              <div style={styles.inputRow}>
                <div style={styles.label}><span style={styles.labelKey}>F objetivo</span><span style={styles.labelUnit}>0–1</span></div>
                <input style={styles.input} type="number" step="0.05" min="0.01" max="0.99" value={Fobj} onChange={e => setFobj(+e.target.value)} />
              </div>
            </div>

            <div style={{ ...styles.panel, marginTop: 16 }}>
              <div style={styles.panelTitle}>Bondad de ajuste</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={styles.metricLabel}>SSE</div>
                  <div style={{ ...styles.metricValue, fontSize: 20 }}>{METRICS.SSE.toFixed(3)}</div>
                  <div style={styles.metricUnit}>suma cuadrática</div>
                </div>
                <div>
                  <div style={styles.metricLabel}>RMSE</div>
                  <div style={{ ...styles.metricValue, fontSize: 20 }}>{METRICS.RMSE.toFixed(3)}</div>
                  <div style={styles.metricUnit}>mg/L</div>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL DERECHO — Resultados */}
          <div>

            {/* Warnings */}
            {warnings.length > 0 && warnings.map((w, i) => (
              <div key={i} style={styles.warn}>⚠ {w}</div>
            ))}

            {/* Predicciones puntuales */}
            <div style={{ ...styles.panel, marginBottom: 16 }}>
              <div style={styles.panelTitle}>Predicciones puntuales</div>

              <div>
                <div style={styles.metricLabel}>t para F = {(Fobj * 100).toFixed(0)}%</div>
                <div style={{ ...styles.metricValue, fontSize: 22 }}>
                  {t_for_Fobj !== null ? t_for_Fobj.toFixed(2) : '—'} <span style={{ fontSize: 13, color: 'rgba(30,27,46,0.4)' }}>min</span>
                  {t_for_Fobj && (
                    <span style={{ marginLeft: 16, fontSize: 14, color: '#7c3aed' }}>
                      → C = {(C0 + (Cinf - C0) * Fobj).toFixed(3)} mg/L
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={styles.metricLabel}>Hitos de liberación</div>
                <table style={{ ...styles.table, marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th style={styles.th}>F</th>
                      <th style={styles.th}>C [mg/L]</th>
                      <th style={styles.th}>t [min]</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.map((m, i) => (
                      <tr key={i}>
                        <td style={styles.td}>{(m.f * 100).toFixed(0)} %</td>
                        <td style={styles.td}>{m.C.toFixed(3)}</td>
                        <td style={styles.td}>{m.t ? m.t.toFixed(2) : '—'} {m.t > T_EXP_MAX && <span style={{ color: '#dc2626' }}>⚡</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabs de gráficas */}
            <div style={styles.panel}>
              <div style={styles.tabs}>
                <button style={styles.tab(activeTab === 'kinetic')} onClick={() => setActiveTab('kinetic')}>Cinética C(t)</button>
                <button style={styles.tab(activeTab === 'fraction')} onClick={() => setActiveTab('fraction')}>Fracción F(t)</button>
                <button style={styles.tab(activeTab === 'compare')} onClick={() => setActiveTab('compare')}>Vs Experimental</button>
                <button style={styles.tab(activeTab === 'residuals')} onClick={() => setActiveTab('residuals')}>Residuales</button>
                <button style={styles.tab(activeTab === 'table')} onClick={() => setActiveTab('table')}>Tabla</button>
              </div>

              {activeTab === 'kinetic' && (
                <div>
                  <h3 style={{ fontSize: 14, margin: '8px 0 4px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                    Concentración predicha vs tiempo
                  </h3>
                  <div style={{ fontSize: 11, color: 'rgba(30,27,46,0.45)', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                    Curva cinética generada por el modelo Weibull/Page
                  </div>
                  <ResponsiveContainer width="100%" height={360}>
                    <LineChart data={simulation} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                      <CartesianGrid stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
                      <XAxis dataKey="t" label={{ value: 't [min]', position: 'insideBottom', offset: -5, fill: 'rgba(30,27,46,0.5)' }} stroke="rgba(0,0,0,0.15)" tick={{ fill: 'rgba(30,27,46,0.6)' }} />
                      <YAxis label={{ value: 'C [mg/L]', angle: -90, position: 'insideLeft', fill: 'rgba(30,27,46,0.5)' }} stroke="rgba(0,0,0,0.15)" domain={[0, 'auto']} tick={{ fill: 'rgba(30,27,46,0.6)' }} />
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.85)', color: '#1e1b2e', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, backdropFilter: 'blur(16px)', fontFamily: 'JetBrains Mono' }} />
                      <ReferenceLine y={Cinf} stroke="#7c3aed" strokeDasharray="4 4" label={{ value: `C∞ = ${Cinf}`, fill: '#7c3aed', fontSize: 11, position: 'top', offset: 6 }} />
                      <ReferenceLine x={T_EXP_MAX} stroke="rgba(0,0,0,0.2)" strokeDasharray="2 2" label={{ value: 'rango exp.', fill: 'rgba(0,0,0,0.35)', fontSize: 14 }} />
                      <ReferenceLine x={tEval} stroke="#059669" strokeDasharray="4 2" />
                      <Line type="monotone" dataKey="C" stroke="url(#lineGradient)" strokeWidth={2.5} dot={false} name="C(t) modelo" />
                      <defs><linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient></defs>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeTab === 'fraction' && (
                <div>
                  <h3 style={{ fontSize: 14, margin: '8px 0 4px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                    Fracción liberada vs tiempo
                  </h3>
                  <div style={{ fontSize: 11, color: 'rgba(30,27,46,0.45)', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                    F(t) = (C(t) − C₀) / (C∞ − C₀) — aproximación al 100 %
                  </div>
                  <ResponsiveContainer width="100%" height={360}>
                    <LineChart data={simulation} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                      <CartesianGrid stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
                      <XAxis dataKey="t" label={{ value: 't [min]', position: 'insideBottom', offset: -5, fill: 'rgba(30,27,46,0.5)' }} stroke="rgba(0,0,0,0.15)" tick={{ fill: 'rgba(30,27,46,0.6)' }} />
                      <YAxis label={{ value: 'F (—)', angle: -90, position: 'insideLeft', fill: 'rgba(30,27,46,0.5)' }} stroke="rgba(0,0,0,0.15)" domain={[0, 1]} tick={{ fill: 'rgba(30,27,46,0.6)' }} />
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.85)', color: '#1e1b2e', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontFamily: 'JetBrains Mono' }} />
                      <ReferenceLine y={Fobj} stroke="#7c3aed" strokeDasharray="4 4" label={{ value: `F objetivo = ${Fobj}`, fill: '#7c3aed', fontSize: 11, position: 'top', offset: 6 }} />
                      <ReferenceLine y={1} stroke="#059669" strokeDasharray="2 2" />
                      <Line type="monotone" dataKey="F" stroke="#7c3aed" strokeWidth={2.5} dot={false} name="F(t)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeTab === 'compare' && (
                <div>
                  <h3 style={{ fontSize: 14, margin: '8px 0 4px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                    Modelo vs datos experimentales (Con Tween)
                  </h3>
                  <div style={{ fontSize: 11, color: 'rgba(30,27,46,0.45)', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                    Calibración del núcleo cinético — Excel: Modelo WeibullPage
                  </div>
                  <ResponsiveContainer width="100%" height={360}>
                    <ComposedChart data={simulation} margin={{ top: 10, right: 30, left: 10, bottom: 45 }}>
                      <CartesianGrid stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
                      <XAxis dataKey="t" label={{ value: 't [min]', position: 'insideBottom', offset: -5, fill: 'rgba(30,27,46,0.5)' }} stroke="rgba(0,0,0,0.15)" tick={{ fill: 'rgba(30,27,46,0.6)' }} />
                      <YAxis label={{ value: 'C [mg/L]', angle: -90, position: 'insideLeft', fill: 'rgba(30,27,46,0.5)' }} stroke="rgba(0,0,0,0.15)" tick={{ fill: 'rgba(30,27,46,0.6)' }} />
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.85)', color: '#1e1b2e', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontFamily: 'JetBrains Mono' }} />
                      <Legend wrapperStyle={{ color: 'rgba(30,27,46,0.6)', paddingTop: 14 }} iconSize={10} formatter={(value) => <span style={{ marginRight: 20, fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{value}</span>} />
                      <Line type="monotone" dataKey="C" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="Modelo Weibull/Page" />
                      <Scatter dataKey="Cexp" fill="#7c3aed" name="Experimental" shape="circle" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeTab === 'residuals' && (
                <div>
                  <h3 style={{ fontSize: 14, margin: '8px 0 4px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                    Residuales del ajuste base
                  </h3>
                  <div style={{ fontSize: 11, color: 'rgba(30,27,46,0.45)', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                    Residual = C<sub>experimental</sub> − C<sub>modelo</sub>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={residuals} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                      <CartesianGrid stroke="rgba(0,0,0,0.06)" strokeDasharray="2 4" />
                      <XAxis dataKey="t" label={{ value: 't [min]', position: 'insideBottom', offset: -5, fill: 'rgba(30,27,46,0.5)' }} stroke="rgba(0,0,0,0.15)" tick={{ fill: 'rgba(30,27,46,0.6)' }} />
                      <YAxis label={{ value: 'residual [mg/L]', angle: -90, position: 'insideLeft', fill: 'rgba(30,27,46,0.5)' }} stroke="rgba(0,0,0,0.15)" tick={{ fill: 'rgba(30,27,46,0.6)' }} />
                      <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.85)', color: '#1e1b2e', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontFamily: 'JetBrains Mono' }} />
                      <ReferenceLine y={0} stroke="rgba(0,0,0,0.2)" />
                      <Bar dataKey="residual" fill="#7c3aed" radius={[4,4,0,0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <table style={{ ...styles.table, marginTop: 16 }}>
                    <thead>
                      <tr>
                        <th style={styles.th}>t [min]</th>
                        <th style={styles.th}>C exp</th>
                        <th style={styles.th}>C modelo</th>
                        <th style={styles.th}>Residual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {residuals.map((r, i) => (
                        <tr key={i}>
                          <td style={styles.td}>{r.t}</td>
                          <td style={styles.td}>{r.Cexp.toFixed(3)}</td>
                          <td style={styles.td}>{r.Cmod.toFixed(3)}</td>
                          <td style={{ ...styles.td, color: r.residual >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                            {r.residual > 0 ? '+' : ''}{r.residual.toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'table' && (
                <div>
                  <h3 style={{ fontSize: 14, margin: '8px 0 4px', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>
                    Tabla de simulación
                  </h3>
                  <div style={{ fontSize: 11, color: 'rgba(30,27,46,0.45)', marginBottom: 12, fontFamily: 'JetBrains Mono, monospace' }}>
                    {simulation.length} puntos · t = 0 → {tMax} min · Δt = {dt} min
                  </div>
                  <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10 }}>
                    <table style={styles.table}>
                      <thead style={{ position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={styles.th}>t [min]</th>
                          <th style={styles.th}>C [mg/L]</th>
                          <th style={styles.th}>F</th>
                          <th style={styles.th}>%</th>
                          <th style={styles.th}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulation.map((row, i) => (
                          <tr key={i} style={{ background: row.extrapolated ? 'rgba(245,158,11,0.08)' : 'transparent' }}>
                            <td style={styles.td}>{row.t}</td>
                            <td style={styles.td}>{row.C.toFixed(3)}</td>
                            <td style={styles.td}>{row.F.toFixed(4)}</td>
                            <td style={styles.td}>{row.pct.toFixed(2)}</td>
                            <td style={styles.td}>
                              {row.extrapolated
                                ? <span style={{ color: '#b45309' }}>extrapolación</span>
                                : <span style={{ color: '#059669' }}>rango exp.</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          GEMELO DIGITAL · BIOSEPARACIÓN ANTOCIANINAS · BEAD MILL CON TWEEN ·
          C(t) = {C0.toFixed(3)} + ({Cinf.toFixed(2)} − {C0.toFixed(3)}) · [1 − exp(−(t/{tau.toFixed(2)})<sup>{beta.toFixed(3)}</sup>)]
        </div>

      </div>
    </div>
  );
}
