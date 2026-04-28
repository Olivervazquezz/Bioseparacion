import React, { useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const TWO_PI = 2 * Math.PI
const glass = 'rgba(255,255,255,0.55)'
const glassBorder = 'rgba(255,255,255,0.70)'
const accent = '#7c3aed'
const accentSoft = 'rgba(124,58,237,0.12)'
const accentMed = 'rgba(124,58,237,0.25)'
const textPrimary = '#1e1b2e'
const textSecondary = 'rgba(30,27,46,0.55)'
const mono = '"JetBrains Mono", "Courier New", monospace'
const sans = '"Inter", sans-serif'

const initialInputs = {
  particleDiameter: 0.01,
  particleDiameterUnit: 'cm',
  particleDensity: 1.2,
  particleDensityUnit: 'gcm3',
  fluidDensity: 1.0,
  fluidDensityUnit: 'gcm3',
  tweenDensity: 1.1,
  tweenDensityUnit: 'gcm3',
  viscosity: 0.012,
  viscosityUnit: 'gcm_s',
  rpm: 4000,
  rotorRadius: 4.5,
  rotorRadiusUnit: 'cm',
  sedimentationDistance: 3,
  sedimentationDistanceUnit: 'cm',
  operationTime: 10,
  operationTimeUnit: 'min',
  targetTime: 10,
  targetTimeUnit: 'min',
  maxEquipmentRpm: 6000,
  predictedAnthocyanins: '',
}

function toNumber(value) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : NaN
}

export function convertParticleDiameter(value, unit) {
  if (unit === 'm') return value
  if (unit === 'um') return value * 1e-6
  return value * 0.01
}

export function convertDensity(value, unit) {
  return unit === 'kgm3' ? value : value * 1000
}

export function convertViscosity(value, unit) {
  return unit === 'pa_s' ? value : value * 0.1
}

export function convertLength(value, unit) {
  return unit === 'm' ? value : value * 0.01
}

export function convertTime(value, unit) {
  return unit === 's' ? value : value * 60
}

export function rpmToAngularVelocity(rpm) {
  return (TWO_PI * rpm) / 60
}

export function angularVelocityToRpm(omega) {
  return (60 * omega) / TWO_PI
}

export function calculateCentrifugalSedimentationVelocity({ Dp, rhoP, rhoF, omega, r, mu }) {
  return (Dp ** 2 * (rhoP - rhoF) * omega ** 2 * r) / (18 * mu)
}

export function calculateSedimentationTime(L, vc) {
  if (vc <= 0) return Infinity
  return L / vc
}

export function evaluateSedimentation(tOp, tSed) {
  return tOp >= tSed
}

export function calculateRequiredRpm({ Dp, rhoP, rhoF, r, mu, L, tObj }) {
  const denominator = Dp ** 2 * (rhoP - rhoF) * r * tObj
  if (denominator <= 0) return Infinity
  const omegaReq = Math.sqrt((18 * mu * L) / denominator)
  return angularVelocityToRpm(omegaReq)
}

export function convertInputs(inputs) {
  return {
    Dp: convertParticleDiameter(toNumber(inputs.particleDiameter), inputs.particleDiameterUnit),
    rhoP: convertDensity(toNumber(inputs.particleDensity), inputs.particleDensityUnit),
    rhoF: convertDensity(toNumber(inputs.fluidDensity), inputs.fluidDensityUnit),
    rhoTween: convertDensity(toNumber(inputs.tweenDensity), inputs.tweenDensityUnit),
    mu: convertViscosity(toNumber(inputs.viscosity), inputs.viscosityUnit),
    rpm: toNumber(inputs.rpm),
    r: convertLength(toNumber(inputs.rotorRadius), inputs.rotorRadiusUnit),
    L: convertLength(toNumber(inputs.sedimentationDistance), inputs.sedimentationDistanceUnit),
    tOp: convertTime(toNumber(inputs.operationTime), inputs.operationTimeUnit),
    tObj: convertTime(toNumber(inputs.targetTime), inputs.targetTimeUnit),
    maxEquipmentRpm: toNumber(inputs.maxEquipmentRpm),
    predictedAnthocyanins: inputs.predictedAnthocyanins,
  }
}

export function validateConvertedInputs(values) {
  const errors = []
  const warnings = []

  if (!Number.isFinite(values.Dp) || values.Dp <= 0) errors.push('El diámetro de partícula debe ser mayor que cero.')
  if (!Number.isFinite(values.mu) || values.mu <= 0) errors.push('La viscosidad debe ser mayor que cero.')
  if (!Number.isFinite(values.rpm) || values.rpm <= 0) errors.push('La rpm debe ser mayor que cero.')
  if (!Number.isFinite(values.L) || values.L <= 0) errors.push('La distancia de sedimentación debe ser mayor que cero.')
  if (!Number.isFinite(values.r) || values.r <= 0) errors.push('El radio del rotor debe ser mayor que cero.')
  if (!Number.isFinite(values.tOp) || values.tOp <= 0) errors.push('El tiempo de operación debe ser mayor que cero.')
  if (!Number.isFinite(values.tObj) || values.tObj <= 0) errors.push('El tiempo objetivo debe ser mayor que cero.')
  if (!Number.isFinite(values.rhoP) || !Number.isFinite(values.rhoF)) errors.push('Las densidades deben ser valores numéricos.')
  if (values.rhoP <= values.rhoF) warnings.push('rho_p <= rho_f: no habría sedimentación positiva bajo este modelo.')

  return { errors, warnings }
}

export function runCentrifugationSimulation(inputs) {
  const values = convertInputs(inputs)
  const validation = validateConvertedInputs(values)

  if (validation.errors.length > 0) {
    return { values, validation, ok: false }
  }

  const omega = rpmToAngularVelocity(values.rpm)
  const vc = calculateCentrifugalSedimentationVelocity({
    Dp: values.Dp,
    rhoP: values.rhoP,
    rhoF: values.rhoF,
    omega,
    r: values.r,
    mu: values.mu,
  })
  const tSed = calculateSedimentationTime(values.L, vc)
  const sediments = evaluateSedimentation(values.tOp, tSed)
  const rpmRequired = calculateRequiredRpm({
    Dp: values.Dp,
    rhoP: values.rhoP,
    rhoF: values.rhoF,
    r: values.r,
    mu: values.mu,
    L: values.L,
    tObj: values.tObj,
  })
  const reynolds = Number.isFinite(vc) ? (values.rhoF * Math.abs(vc) * values.Dp) / values.mu : Infinity
  const extraWarnings = [...validation.warnings]

  if (Number.isFinite(rpmRequired) && values.maxEquipmentRpm > 0 && rpmRequired > values.maxEquipmentRpm) {
    extraWarnings.push('La rpm requerida excede la rpm máxima permitida por el equipo.')
  }

  return {
    ok: true,
    values,
    validation: { ...validation, warnings: extraWarnings },
    omega,
    vc,
    tSed,
    sediments,
    rpmRequired,
    reynolds,
  }
}

export function buildSensitivityData(result) {
  if (!result.ok) {
    return {
      rpmData: [],
      diameterData: [],
      targetTimeData: [],
      comparisonData: [],
    }
  }

  const { values } = result
  const rpmSteps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((factor) => Math.max(1, values.rpm * factor))
  const rpmData = rpmSteps.map((rpm) => {
    const omega = rpmToAngularVelocity(rpm)
    const vc = calculateCentrifugalSedimentationVelocity({ ...values, omega })
    const tSed = calculateSedimentationTime(values.L, vc)

    return {
      rpm: Math.round(rpm),
      vc,
      vc_mm_s: +(vc * 1000).toFixed(3),
      tSed_s: +tSed.toFixed(4),
      tSed_min: +(tSed / 60).toFixed(4),
      tOp_s: +values.tOp.toFixed(2),
      sediments: values.tOp >= tSed ? 1 : 0,
    }
  })

  const diameterFactors = [0.1, 0.25, 0.5, 1, 1.5, 2, 3]
  const diameterData = diameterFactors.map((factor) => {
    const Dp = values.Dp * factor
    const vc = calculateCentrifugalSedimentationVelocity({
      ...values,
      Dp,
      omega: result.omega,
    })
    const tSed = calculateSedimentationTime(values.L, vc)

    return {
      Dp_um: +(Dp * 1e6).toFixed(2),
      tSed_s: +tSed.toFixed(4),
      tSed_min: +(tSed / 60).toFixed(4),
    }
  })

  const targetTimes = [0.25, 0.5, 1, 1.5, 2, 3].map((factor) => values.tObj * factor)
  const targetTimeData = targetTimes.map((tObj) => ({
    tObj_min: +(tObj / 60).toFixed(2),
    rpmRequired: +calculateRequiredRpm({ ...values, tObj }).toFixed(2),
  }))

  const comparisonData = rpmData.map((item) => ({
    rpm: item.rpm,
    tSed_s: item.tSed_s,
    tOp_s: item.tOp_s,
    estado: item.sediments ? 'Sedimenta' : 'No sedimenta',
  }))

  return { rpmData, diameterData, targetTimeData, comparisonData }
}

function NumberInput({ label, value, unit, unitOptions, onValueChange, onUnitChange, step = 'any' }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <div style={styles.inputRow}>
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

function StatCard({ label, value, detail }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>{value}</strong>
      {detail && <span style={styles.statDetail}>{detail}</span>}
    </div>
  )
}

function formatNumber(value, digits = 4) {
  if (!Number.isFinite(value)) return 'No aplica'
  if (Math.abs(value) >= 1000) return value.toLocaleString('es-MX', { maximumFractionDigits: 2 })
  return value.toLocaleString('es-MX', { maximumFractionDigits: digits })
}

function updateInput(setInputs, key, value) {
  setInputs((current) => ({ ...current, [key]: value }))
}

export default function CentrifugationTwin({ onBack }) {
  const [inputs, setInputs] = useState(initialInputs)
  const [activeChartTab, setActiveChartTab] = useState('sedimentationTime')

  const result = useMemo(() => runCentrifugationSimulation(inputs), [inputs])
  const sensitivity = useMemo(() => buildSensitivityData(result), [result])

  const recommendation = useMemo(() => {
    if (!result.ok) return 'Corrige los datos marcados para correr la simulación.'
    if (result.sediments) {
      const excessTime = Math.max(0, result.values.tOp - result.tSed)
      return `La condición es suficiente para sedimentar los residuos sólidos. El margen de tiempo disponible es de ${formatNumber(excessTime, 2)} s. De acuerdo al tiempo de operación que es ${formatNumber(result.values.tOp / 60, 2)} min.`
    }
    const extraTime = result.tSed - result.values.tOp
    const rpmIncrease = Number.isFinite(result.rpmRequired) ? Math.max(0, result.rpmRequired - result.values.rpm) : Infinity
    return `La condición no es suficiente; se recomienda aumentar el tiempo al menos ${formatNumber(extraTime, 2)} s o subir la velocidad en aproximadamente ${formatNumber(rpmIncrease, 2)} rpm.`
  }, [result])

  const targetTimeDetail = `Para tiempo objetivo: ${formatNumber(toNumber(inputs.targetTime), 2)} ${inputs.targetTimeUnit}`

  return (
    <div style={styles.page}>
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />
      <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>Volver</button>
        <div>
          <div style={styles.kicker}>Escala Laboratorio</div>
          <h1 style={styles.title}>Clarificación por Centrifugación</h1>
          <p style={styles.subtitle}>
            Simulación batch para evaluar si los residuos sólidos de la lisis celular sedimentan y permiten recuperar
            un sobrenadante clarificado con antocianinas.
          </p>
        </div>
      </div>

      <div style={styles.notice}>
        <strong>Modo batch:</strong> este módulo compara el tiempo de operación con el tiempo requerido de
        sedimentación.
      </div>

      {result.ok && (
        <div style={styles.topMetricsGrid}>
          <StatCard label="RPM mínima" value={`${formatNumber(result.rpmRequired, 2)} rpm`} detail={targetTimeDetail} />
          <StatCard label="Velocidad de Sedimentación" value={`${formatNumber(result.vc, 6)} m/s`} detail={`${formatNumber(result.vc * 100, 3)} cm/s`} />
        </div>
      )}

      <div style={styles.layout}>
        <section style={styles.controlsPanel}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Datos de entrada</h2>
            <button style={styles.primaryButton} onClick={() => setInputs({ ...initialInputs })}>
              Restaurar defaults
            </button>
          </div>

          <div style={styles.inputSection}>
            <h3 style={styles.groupTitle}>Partícula</h3>
            <NumberInput
              label="Diámetro de partícula"
              value={inputs.particleDiameter}
              unit={inputs.particleDiameterUnit}
              unitOptions={[
                { value: 'cm', label: 'cm' },
                { value: 'um', label: 'µm' },
                { value: 'm', label: 'm' },
              ]}
              onValueChange={(value) => updateInput(setInputs, 'particleDiameter', value)}
              onUnitChange={(value) => updateInput(setInputs, 'particleDiameterUnit', value)}
            />
            <NumberInput
              label="Densidad del residuo"
              value={inputs.particleDensity}
              unit={inputs.particleDensityUnit}
              unitOptions={[
                { value: 'gcm3', label: 'g/cm3' },
                { value: 'kgm3', label: 'kg/m3' },
              ]}
              onValueChange={(value) => updateInput(setInputs, 'particleDensity', value)}
              onUnitChange={(value) => updateInput(setInputs, 'particleDensityUnit', value)}
            />
          </div>

          <div style={styles.inputSection}>
            <h3 style={styles.groupTitle}>Operación</h3>
            <NumberInput
              label="rpm de centrifugación"
              value={inputs.rpm}
              onValueChange={(value) => updateInput(setInputs, 'rpm', value)}
            />
            <NumberInput
              label="Radio efectivo del rotor"
              value={inputs.rotorRadius}
              unit={inputs.rotorRadiusUnit}
              unitOptions={[
                { value: 'cm', label: 'cm' },
                { value: 'm', label: 'm' },
              ]}
              onValueChange={(value) => updateInput(setInputs, 'rotorRadius', value)}
              onUnitChange={(value) => updateInput(setInputs, 'rotorRadiusUnit', value)}
            />
            <NumberInput
              label="Distancia de sedimentación"
              value={inputs.sedimentationDistance}
              unit={inputs.sedimentationDistanceUnit}
              unitOptions={[
                { value: 'cm', label: 'cm' },
                { value: 'm', label: 'm' },
              ]}
              onValueChange={(value) => updateInput(setInputs, 'sedimentationDistance', value)}
              onUnitChange={(value) => updateInput(setInputs, 'sedimentationDistanceUnit', value)}
            />
            <NumberInput
              label="Tiempo de operación"
              value={inputs.operationTime}
              unit={inputs.operationTimeUnit}
              unitOptions={[
                { value: 'min', label: 'min' },
                { value: 's', label: 's' },
              ]}
              onValueChange={(value) => updateInput(setInputs, 'operationTime', value)}
              onUnitChange={(value) => updateInput(setInputs, 'operationTimeUnit', value)}
            />
            <NumberInput
              label="Tiempo objetivo"
              value={inputs.targetTime}
              unit={inputs.targetTimeUnit}
              unitOptions={[
                { value: 'min', label: 'min' },
                { value: 's', label: 's' },
              ]}
              onValueChange={(value) => updateInput(setInputs, 'targetTime', value)}
              onUnitChange={(value) => updateInput(setInputs, 'targetTimeUnit', value)}
            />
            <NumberInput
              label="rpm máxima del equipo"
              value={inputs.maxEquipmentRpm}
              onValueChange={(value) => updateInput(setInputs, 'maxEquipmentRpm', value)}
            />
          </div>

          <div style={styles.inputSection}>
            <h3 style={styles.groupTitle}>Propiedades del fluido</h3>
            <NumberInput
              label="Densidad del fluido"
              value={inputs.fluidDensity}
              unit={inputs.fluidDensityUnit}
              unitOptions={[
                { value: 'gcm3', label: 'g/cm3' },
                { value: 'kgm3', label: 'kg/m3' },
              ]}
              onValueChange={(value) => updateInput(setInputs, 'fluidDensity', value)}
              onUnitChange={(value) => updateInput(setInputs, 'fluidDensityUnit', value)}
            />
            <NumberInput
              label="Viscosidad dinámica"
              value={inputs.viscosity}
              unit={inputs.viscosityUnit}
              unitOptions={[
                { value: 'gcm_s', label: 'g/(cm*s)' },
                { value: 'pa_s', label: 'Pa*s' },
              ]}
              onValueChange={(value) => updateInput(setInputs, 'viscosity', value)}
              onUnitChange={(value) => updateInput(setInputs, 'viscosityUnit', value)}
            />
          </div>
        </section>

        <main style={styles.resultsPanel}>
          <section style={styles.resultsSection}>
            {!result.ok && (
              <div style={styles.errorBox}>
                {result.validation.errors.map((error) => (
                  <div key={error}>{error}</div>
                ))}
              </div>
            )}

            {result.ok && (
              <>
                <div style={styles.statusCard(result.sediments)}>
                  {result.sediments
                    ? 'La condición es suficiente para sedimentar los residuos sólidos.'
                    : 'La condición no es suficiente; se recomienda aumentar rpm o tiempo de centrifugación.'}
                </div>

                <div style={styles.statsGrid}>
                  <StatCard label="Tiempo de Sedimentación" value={`${formatNumber(result.tSed / 60, 4)} min`} detail={`${formatNumber(result.tSed, 4)} s`} />
                  <StatCard label="Velocidad angular" value={`${formatNumber(result.omega, 3)} rad/s`} detail="Omega" />
                </div>

                <div style={styles.interpretation}>
                  <strong>Interpretación automática:</strong> {recommendation}
                </div>

                {inputs.predictedAnthocyanins && (
                  <div style={styles.linkedModel}>
                    Concentración de antocianinas recibida del módulo Weibull-Page: <strong>{inputs.predictedAnthocyanins}</strong>.
                    Este módulo evalúa la remoción de sólidos, no la pureza ni la concentración final.
                  </div>
                )}

                {result.validation.warnings.length > 0 && (
                  <div style={styles.warningBox}>
                    {result.validation.warnings.map((warning) => (
                      <div key={warning}>{warning}</div>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {result.ok && (
            <>
              <section style={styles.chartSection}>
                <div style={styles.tabs}>
                  <button
                    style={styles.tab(activeChartTab === 'sedimentationTime')}
                    onClick={() => setActiveChartTab('sedimentationTime')}
                  >
                    Tiempo vs RPM
                  </button>
                  <button
                    style={styles.tab(activeChartTab === 'requiredRpm')}
                    onClick={() => setActiveChartTab('requiredRpm')}
                  >
                    RPM mínima
                  </button>
                </div>

                {activeChartTab === 'sedimentationTime' && (
                  <div>
                    <h3 style={styles.chartTitle}>Tiempo de sedimentación vs rpm</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={sensitivity.rpmData} margin={{ top: 12, right: 18, left: 0, bottom: 18 }}>
                        <CartesianGrid stroke="rgba(30,27,46,0.08)" strokeDasharray="3 4" />
                        <XAxis dataKey="rpm" label={{ value: 'rpm', position: 'insideBottom', offset: -8 }} />
                        <YAxis label={{ value: 't_sed [s]', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="tSed_s" name="t_sed [s]" stroke="#2563eb" strokeWidth={2.5} dot />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeChartTab === 'requiredRpm' && (
                  <div>
                    <h3 style={styles.chartTitle}>rpm mínima requerida vs tiempo objetivo</h3>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={sensitivity.targetTimeData} margin={{ top: 12, right: 18, left: 0, bottom: 18 }}>
                        <CartesianGrid stroke="rgba(30,27,46,0.08)" strokeDasharray="3 4" />
                        <XAxis dataKey="tObj_min" label={{ value: 't_obj [min]', position: 'insideBottom', offset: -8 }} />
                        <YAxis label={{ value: 'rpm req.', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="rpmRequired" name="rpm requerida" stroke="#dc2626" strokeWidth={2.5} dot />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </section>

            </>
          )}
        </main>
      </div>
      </div>
    </div>
  )
}

function InfoBlock({ title, items }) {
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

const styles = {
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
    maxWidth: 880,
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
  layout: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: 24,
    alignItems: 'start',
  },
  controlsPanel: {
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
  resultsSection: {
    background: glass,
    border: '1px solid ' + glassBorder,
    padding: 22,
    borderRadius: 16,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
    animation: 'fade-in-up 0.5s ease-out both',
  },
  chartSection: {
    display: 'grid',
    background: glass,
    border: '1px solid ' + glassBorder,
    padding: 22,
    borderRadius: 16,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
    animation: 'fade-in-up 0.5s ease-out both',
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
  topMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 14,
    marginBottom: 28,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
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
  statusCard: (sediments) => ({
    padding: 12,
    marginBottom: 12,
    fontFamily: mono,
    fontSize: 12,
    borderRadius: 10,
    backdropFilter: 'blur(12px)',
    border: `1px solid ${sediments ? 'rgba(5,150,105,0.28)' : 'rgba(239,68,68,0.25)'}`,
    background: sediments ? 'rgba(5,150,105,0.10)' : 'rgba(239,68,68,0.08)',
    color: sediments ? '#047857' : '#dc2626',
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
  linkedModel: {
    marginTop: 12,
    padding: '14px 20px',
    borderRadius: 12,
    background: glass,
    border: '1px solid ' + glassBorder,
    color: textSecondary,
    lineHeight: 1.45,
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
  assumptionSection: {
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
