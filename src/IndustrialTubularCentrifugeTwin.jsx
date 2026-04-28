import React, { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  InfoBlock,
  NumberInput,
  SelectField,
  StatCard,
  chartTooltipStyle,
  formatNumber,
  styles,
  toNumber,
} from './twinUi.jsx'

const G = 9.81
const TWO_PI = 2 * Math.PI

const initialInputs = {
  mode: 'processGoal',
  processVolume: 2000,
  processVolumeUnit: 'L',
  objectiveTime: 2,
  objectiveTimeUnit: 'h',
  directFlow: 1000,
  directFlowUnit: 'L/h',
  vgMode: 'direct',
  vg: 9.08e-4,
  dp: 0.01,
  dpUnit: 'cm',
  rhoP: 1.2,
  rhoPUnit: 'gcm3',
  rhoF: 1.0,
  rhoFUnit: 'gcm3',
  mu: 0.012,
  muUnit: 'gcm_s',
  r1: 1.0,
  r1Unit: 'cm',
  r2: 2.5,
  r2Unit: 'cm',
  length: 50,
  lengthUnit: 'cm',
  rpm: 10000,
  rpmMax: 15000,
}

const volumeUnits = [
  { value: 'L', label: 'L' },
  { value: 'm3', label: 'm3' },
]

const flowUnits = [
  { value: 'L/min', label: 'L/min' },
  { value: 'L/h', label: 'L/h' },
  { value: 'm3/s', label: 'm3/s' },
  { value: 'm3/h', label: 'm3/h' },
]

const timeUnits = [
  { value: 's', label: 's' },
  { value: 'min', label: 'min' },
  { value: 'h', label: 'h' },
]

const lengthUnits = [
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
]

const densityUnits = [
  { value: 'gcm3', label: 'g/cm3' },
  { value: 'kgm3', label: 'kg/m3' },
]

export function convertVolumeToM3(value, unit) {
  if (unit === 'm3') return value
  return value * 0.001
}

export function convertFlowToM3S(value, unit) {
  if (unit === 'm3/s') return value
  if (unit === 'm3/h') return value / 3600
  if (unit === 'L/min') return (value * 0.001) / 60
  return (value * 0.001) / 3600
}

export function convertTimeToS(value, unit) {
  if (unit === 'h') return value * 3600
  if (unit === 'min') return value * 60
  return value
}

export function convertLengthToM(value, unit) {
  if (unit === 'm') return value
  return value * 0.01
}

export function convertParticleDiameterToM(value, unit) {
  if (unit === 'um') return value * 1e-6
  return convertLengthToM(value, unit)
}

export function convertDensityToKgm3(value, unit) {
  if (unit === 'kgm3') return value
  return value * 1000
}

export function convertViscosityToPaS(value, unit) {
  if (unit === 'pa_s') return value
  return value * 0.1
}

export function calculateVg(dpM, rhoP, rhoF, mu) {
  return (dpM ** 2 * (rhoP - rhoF) * G) / (18 * mu)
}

export function calculateRequiredFlow(volumeM3, timeS) {
  return volumeM3 / timeS
}

export function calculateOmega(rpm) {
  return (TWO_PI * rpm) / 60
}

export function calculateSigmaRequired(flowM3S, vg) {
  return flowM3S / vg
}

export function calculateSigmaTubular({ omega, lengthM, r1M, r2M }) {
  return (Math.PI * omega ** 2 * lengthM * (r2M ** 2 - r1M ** 2)) / (G * Math.log(r2M / r1M))
}

export function calculateQmax(vg, sigmaTubular) {
  return vg * sigmaTubular
}

export function calculateProcessTime(volumeM3, flowM3S) {
  return volumeM3 / flowM3S
}

export function calculateBowlVolume(r1M, r2M, lengthM) {
  return Math.PI * (r2M ** 2 - r1M ** 2) * lengthM
}

export function calculateResidenceTime(bowlVolumeM3, flowM3S) {
  return bowlVolumeM3 / flowM3S
}

export function calculateRadialSedimentationTime({ vg, omega, r1M, r2M }) {
  return (G * Math.log(r2M / r1M)) / (vg * omega ** 2)
}

export function calculateRequiredRpm({ sigmaRequired, lengthM, r1M, r2M }) {
  const omegaReq = Math.sqrt((sigmaRequired * G * Math.log(r2M / r1M)) / (Math.PI * lengthM * (r2M ** 2 - r1M ** 2)))
  return (60 * omegaReq) / TWO_PI
}

export function calculateRequiredBowlLength({ sigmaRequired, omega, r1M, r2M }) {
  return (sigmaRequired * G * Math.log(r2M / r1M)) / (Math.PI * omega ** 2 * (r2M ** 2 - r1M ** 2))
}

export function calculateNumberOfCentrifuges(flowRequiredM3S, qMaxM3S) {
  if (qMaxM3S <= 0) return Infinity
  return Math.max(1, Math.ceil(flowRequiredM3S / qMaxM3S))
}

function flowFormats(qM3S) {
  return {
    m3s: qM3S,
    lmin: qM3S * 60000,
    lh: qM3S * 3600000,
  }
}

function convertInputs(inputs) {
  const dpM = convertParticleDiameterToM(toNumber(inputs.dp), inputs.dpUnit)
  const rhoP = convertDensityToKgm3(toNumber(inputs.rhoP), inputs.rhoPUnit)
  const rhoF = convertDensityToKgm3(toNumber(inputs.rhoF), inputs.rhoFUnit)
  const mu = convertViscosityToPaS(toNumber(inputs.mu), inputs.muUnit)
  const vgStokes = calculateVg(dpM, rhoP, rhoF, mu)

  return {
    mode: inputs.mode,
    processVolumeM3: convertVolumeToM3(toNumber(inputs.processVolume), inputs.processVolumeUnit),
    objectiveTimeS: convertTimeToS(toNumber(inputs.objectiveTime), inputs.objectiveTimeUnit),
    directFlowM3S: convertFlowToM3S(toNumber(inputs.directFlow), inputs.directFlowUnit),
    vgMode: inputs.vgMode,
    vgDirect: toNumber(inputs.vg),
    vgStokes,
    vg: inputs.vgMode === 'stokes' ? vgStokes : toNumber(inputs.vg),
    dpM,
    rhoP,
    rhoF,
    mu,
    r1M: convertLengthToM(toNumber(inputs.r1), inputs.r1Unit),
    r2M: convertLengthToM(toNumber(inputs.r2), inputs.r2Unit),
    lengthM: convertLengthToM(toNumber(inputs.length), inputs.lengthUnit),
    rpm: toNumber(inputs.rpm),
    rpmMax: toNumber(inputs.rpmMax),
  }
}

function validate(values) {
  const errors = []
  const warnings = []

  if (!Number.isFinite(values.vg) || values.vg <= 0) errors.push('vg debe ser mayor que cero.')
  if (!Number.isFinite(values.dpM) || values.dpM <= 0) errors.push('El diámetro de partícula debe ser mayor que cero.')
  if (!Number.isFinite(values.mu) || values.mu <= 0) errors.push('La viscosidad debe ser mayor que cero.')
  if (!Number.isFinite(values.r1M) || values.r1M <= 0) errors.push('r1 debe ser mayor que cero.')
  if (!Number.isFinite(values.r2M) || values.r2M <= values.r1M) errors.push('r2 debe ser mayor que r1.')
  if (!Number.isFinite(values.lengthM) || values.lengthM <= 0) errors.push('La longitud efectiva del bowl debe ser mayor que cero.')
  if (!Number.isFinite(values.rpm) || values.rpm <= 0) errors.push('La rpm debe ser mayor que cero.')
  if (values.mode === 'processGoal') {
    if (!Number.isFinite(values.processVolumeM3) || values.processVolumeM3 <= 0) errors.push('El volumen a procesar debe ser mayor que cero.')
    if (!Number.isFinite(values.objectiveTimeS) || values.objectiveTimeS <= 0) errors.push('El tiempo objetivo debe ser mayor que cero.')
  }
  if (values.mode === 'directFlow' && (!Number.isFinite(values.directFlowM3S) || values.directFlowM3S <= 0)) errors.push('El caudal directo debe ser mayor que cero.')
  if (values.rhoP <= values.rhoF) warnings.push('rho_p <= rho_f: la partícula no sedimentaría favorablemente bajo Stokes.')

  return { errors, warnings }
}

export function runSimulation(inputs) {
  const values = convertInputs(inputs)
  const validation = validate(values)

  if (validation.errors.length > 0) return { ok: false, values, validation }

  const flowRequiredM3S = values.mode === 'processGoal'
    ? calculateRequiredFlow(values.processVolumeM3, values.objectiveTimeS)
    : values.directFlowM3S
  const omega = calculateOmega(values.rpm)
  const sigmaRequired = calculateSigmaRequired(flowRequiredM3S, values.vg)
  const sigmaTubular = calculateSigmaTubular({ omega, lengthM: values.lengthM, r1M: values.r1M, r2M: values.r2M })
  const qMaxM3S = calculateQmax(values.vg, sigmaTubular)
  const processTimeS = calculateProcessTime(values.processVolumeM3, qMaxM3S)
  const bowlVolumeM3 = calculateBowlVolume(values.r1M, values.r2M, values.lengthM)
  const residenceTimeS = calculateResidenceTime(bowlVolumeM3, flowRequiredM3S)
  const radialSedimentationTimeS = calculateRadialSedimentationTime({ vg: values.vg, omega, r1M: values.r1M, r2M: values.r2M })
  const rpmRequired = calculateRequiredRpm({ sigmaRequired, lengthM: values.lengthM, r1M: values.r1M, r2M: values.r2M })
  const lengthRequiredM = calculateRequiredBowlLength({ sigmaRequired, omega, r1M: values.r1M, r2M: values.r2M })
  const centrifugesRequired = calculateNumberOfCentrifuges(flowRequiredM3S, qMaxM3S)
  const sigmaOk = sigmaTubular >= sigmaRequired
  const flowOk = qMaxM3S >= flowRequiredM3S
  const sedimentationOk = residenceTimeS >= radialSedimentationTimeS
  const warnings = [...validation.warnings]

  if (rpmRequired > values.rpmMax) warnings.push('La rpm mínima requerida excede la rpm máxima definida.')
  if (!sedimentationOk) warnings.push('El tiempo de residencia es menor que el tiempo de sedimentación radial.')
  if (!flowOk) warnings.push('La centrífuga no tiene capacidad suficiente para el caudal requerido.')
  if (!sigmaOk) warnings.push('Sigma_tubular es menor que Sigma_req.')

  return {
    ok: true,
    values,
    validation: { ...validation, warnings },
    flowRequiredM3S,
    omega,
    sigmaRequired,
    sigmaTubular,
    qMaxM3S,
    processTimeS,
    bowlVolumeM3,
    residenceTimeS,
    radialSedimentationTimeS,
    rpmRequired,
    lengthRequiredM,
    centrifugesRequired,
    sigmaOk,
    flowOk,
    sedimentationOk,
    viable: sigmaOk && flowOk && sedimentationOk,
  }
}

function buildSensitivity(result) {
  if (!result.ok) return {}
  const { values } = result
  const rpmStart = Math.max(500, values.rpm * 0.25)
  const rpmEnd = Math.max(values.rpmMax, values.rpm * 1.5)
  const rpmData = Array.from({ length: 22 }, (_, i) => {
    const rpm = rpmStart + ((rpmEnd - rpmStart) * i) / 21
    const omega = calculateOmega(rpm)
    const sigma = calculateSigmaTubular({ omega, lengthM: values.lengthM, r1M: values.r1M, r2M: values.r2M })
    const qMax = calculateQmax(values.vg, sigma)
    const processTime = calculateProcessTime(values.processVolumeM3, qMax)
    const residence = calculateResidenceTime(result.bowlVolumeM3, result.flowRequiredM3S)
    const sedimentation = calculateRadialSedimentationTime({ vg: values.vg, omega, r1M: values.r1M, r2M: values.r2M })
    return {
      rpm: Math.round(rpm),
      sigma,
      sigmaReq: result.sigmaRequired,
      qMaxLh: qMax * 3600000,
      qReqLh: result.flowRequiredM3S * 3600000,
      processTimeH: processTime / 3600,
      targetTimeH: values.objectiveTimeS / 3600,
      residenceS: residence,
      sedimentationS: sedimentation,
    }
  })

  const lengthStart = Math.max(values.lengthM * 0.2, 0.05)
  const lengthEnd = Math.max(values.lengthM * 2, lengthStart * 2)
  const lengthData = Array.from({ length: 18 }, (_, i) => {
    const lengthM = lengthStart + ((lengthEnd - lengthStart) * i) / 17
    const sigma = calculateSigmaTubular({ omega: result.omega, lengthM, r1M: values.r1M, r2M: values.r2M })
    const qMax = calculateQmax(values.vg, sigma)
    return {
      lengthM,
      sigma,
      qMaxLh: qMax * 3600000,
      sigmaReq: result.sigmaRequired,
      qReqLh: result.flowRequiredM3S * 3600000,
    }
  })

  const flowStart = Math.max(result.flowRequiredM3S * 0.2, 1e-9)
  const flowEnd = Math.max(result.flowRequiredM3S * 2, flowStart * 2)
  const viabilityMap = []
  for (let i = 0; i < 9; i += 1) {
    for (let j = 0; j < 9; j += 1) {
      const rpm = rpmStart + ((rpmEnd - rpmStart) * i) / 8
      const q = flowStart + ((flowEnd - flowStart) * j) / 8
      const omega = calculateOmega(rpm)
      const sigma = calculateSigmaTubular({ omega, lengthM: values.lengthM, r1M: values.r1M, r2M: values.r2M })
      const qMax = calculateQmax(values.vg, sigma)
      const residence = calculateResidenceTime(result.bowlVolumeM3, q)
      const sedimentation = calculateRadialSedimentationTime({ vg: values.vg, omega, r1M: values.r1M, r2M: values.r2M })
      viabilityMap.push({
        rpm: Math.round(rpm),
        flowLh: +(q * 3600000).toFixed(2),
        viable: qMax >= q && residence >= sedimentation,
      })
    }
  }

  return { rpmData, lengthData, viabilityMap }
}

function updateInput(setInputs, key, value) {
  setInputs((current) => ({ ...current, [key]: value }))
}

const modeLabels = {
  processGoal: 'Diseño por volumen y tiempo',
  directFlow: 'Evaluación por caudal directo',
}

const modeGuides = {
  processGoal: {
    question: '¿Qué capacidad de centrifugación necesito para procesar un volumen en cierto tiempo?',
    description: 'Este modo calcula el caudal requerido con Q_req = V_proceso / t_objetivo y después estima Sigma_req, Qmax y viabilidad.',
    formula: 'Q_req = V_proceso / t_objetivo  →  Sigma_req = Q_req / vg',
  },
  directFlow: {
    question: '¿La centrífuga propuesta puede operar al caudal que quiero usar?',
    description: 'Este modo toma el caudal directo ingresado y evalúa si la geometría, rpm y vg disponibles cumplen capacidad y sedimentación.',
    formula: 'Sigma_req = Q_operación / vg  ·  t_res = V_bowl / Q_operación',
  },
}

const chartTabsByMode = {
  processGoal: [
    { id: 'sigmaRpm', label: 'Sigma vs RPM' },
    { id: 'qmaxRpm', label: 'Qmax vs RPM' },
    { id: 'timeRpm', label: 'Tiempo vs RPM' },
  ],
  directFlow: [
    { id: 'sigmaRpm', label: 'Sigma vs RPM' },
    { id: 'qmaxRpm', label: 'Qmax vs RPM' },
  ],
}

function getDefaultInputsForMode(mode) {
  return {
    ...initialInputs,
    mode,
  }
}

export default function IndustrialTubularCentrifugeTwin({ onBack, fixedMode = null }) {
  const initialMode = fixedMode ?? initialInputs.mode
  const [inputs, setInputs] = useState(getDefaultInputsForMode(initialMode))
  const [activeChartTab, setActiveChartTab] = useState(chartTabsByMode[initialMode][0].id)
  const result = useMemo(() => runSimulation(inputs), [inputs])
  const sensitivity = useMemo(() => buildSensitivity(result), [result])
  const requiredFlow = result.ok ? flowFormats(result.flowRequiredM3S) : null
  const qMax = result.ok ? flowFormats(result.qMaxM3S) : null
  const activeMode = inputs.mode
  const modeGuide = modeGuides[activeMode]
  const chartTabs = chartTabsByMode[activeMode]

  const interpretation = result.ok
    ? activeMode === 'processGoal'
      ? `Para procesar ${formatNumber(result.values.processVolumeM3 * 1000, 2)} L en ${formatNumber(result.values.objectiveTimeS / 3600, 2)} h, se requiere un caudal de ${formatNumber(requiredFlow.lh, 2)} L/h. Con el valor de vg usado, el sigma mínimo requerido es ${formatNumber(result.sigmaRequired, 3)} m2. La centrífuga tubular propuesta tiene un sigma de ${formatNumber(result.sigmaTubular, 3)} m2, por lo que ${result.sigmaOk ? 'sí' : 'no'} cumple con el criterio de capacidad. El caudal máximo estimado es ${formatNumber(qMax.lh, 2)} L/h y el tiempo necesario para procesar el volumen total sería ${formatNumber(result.processTimeS / 3600, 3)} h. Además, el tiempo de residencia es ${formatNumber(result.residenceTimeS, 3)} s y el tiempo de sedimentación radial es ${formatNumber(result.radialSedimentationTimeS, 3)} s, por lo que la condición de sedimentación ${result.sedimentationOk ? 'sí' : 'no'} se cumple.`
      : `Con un caudal de operación de ${formatNumber(requiredFlow.lh, 2)} L/h, el sigma mínimo requerido es ${formatNumber(result.sigmaRequired, 3)} m2. La centrífuga tubular propuesta entrega ${formatNumber(result.sigmaTubular, 3)} m2 y un Q máximo estimado de ${formatNumber(qMax.lh, 2)} L/h. El tiempo de residencia es ${formatNumber(result.residenceTimeS, 3)} s frente a un tiempo de sedimentación radial de ${formatNumber(result.radialSedimentationTimeS, 3)} s, por lo que la condición de sedimentación ${result.sedimentationOk ? 'sí' : 'no'} se cumple.`
    : 'Corrige los datos marcados para correr la simulación.'

  return (
    <div style={styles.page}>
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div style={styles.kicker}>Escala Industrial</div>
            <h1 style={styles.title}>Clarificación por centrífuga tubular continua</h1>
            <p style={styles.subtitle}>
              {fixedMode ? `${modeLabels[fixedMode]}. ` : ''}
              Escalamiento de separación sólido-líquido usando teoría sigma, caudal de proceso y tiempo de sedimentación radial.
            </p>
          </div>
          <button style={styles.backButton} onClick={onBack}>Volver</button>
        </div>

        <div style={styles.notice}>
          <strong>Criterio continuo:</strong> se usa Q = vg · Sigma para evaluar si la centrífuga tubular puede clarificar el sobrenadante a la escala deseada.
        </div>

        <div style={styles.notice}>
          <strong>{modeGuide.question}</strong> {modeGuide.description}
          <div style={{ marginTop: 8, fontFamily: '"JetBrains Mono", monospace', color: 'rgba(30,27,46,0.55)' }}>
            {modeGuide.formula}
          </div>
        </div>

        {result.ok && (
          <div style={styles.topMetricsGrid}>
            <StatCard label={activeMode === 'processGoal' ? 'Caudal requerido' : 'Caudal operación'} value={`${formatNumber(requiredFlow.lh, 2)} L/h`} detail={`${formatNumber(requiredFlow.m3s, 6)} m3/s`} />
            <StatCard label="Sigma requerido" value={`${formatNumber(result.sigmaRequired, 3)} m2`} detail="Q_req / vg" />
            <StatCard label="Sigma tubular" value={`${formatNumber(result.sigmaTubular, 3)} m2`} detail={result.sigmaOk ? 'Cumple sigma' : 'No cumple sigma'} />
            <StatCard label="Q máximo" value={`${formatNumber(qMax.lh, 2)} L/h`} detail={`${formatNumber(qMax.m3s, 6)} m3/s`} />
          </div>
        )}

        <div style={styles.layout}>
          <section style={styles.panel}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Datos de entrada</h2>
              <button style={styles.primaryButton} onClick={() => setInputs(getDefaultInputsForMode(fixedMode ?? activeMode))}>Restaurar defaults</button>
            </div>

            {!fixedMode && (
              <SelectField
                label="Modo de simulación"
                value={inputs.mode}
                options={[
                  { value: 'processGoal', label: 'Diseño por volumen y tiempo' },
                  { value: 'directFlow', label: 'Evaluación por caudal directo' },
                ]}
                onChange={(value) => {
                  setInputs(getDefaultInputsForMode(value))
                  setActiveChartTab(chartTabsByMode[value][0].id)
                }}
              />
            )}

            {activeMode === 'processGoal' && (
              <div style={styles.inputSection}>
                <h3 style={styles.groupTitle}>Meta de proceso</h3>
                <NumberInput label="Volumen a procesar" value={inputs.processVolume} unit={inputs.processVolumeUnit} unitOptions={volumeUnits} onValueChange={(value) => updateInput(setInputs, 'processVolume', value)} onUnitChange={(value) => updateInput(setInputs, 'processVolumeUnit', value)} />
                <NumberInput label="Tiempo objetivo" value={inputs.objectiveTime} unit={inputs.objectiveTimeUnit} unitOptions={timeUnits} onValueChange={(value) => updateInput(setInputs, 'objectiveTime', value)} onUnitChange={(value) => updateInput(setInputs, 'objectiveTimeUnit', value)} />
              </div>
            )}

            {activeMode === 'directFlow' && (
              <div style={styles.inputSection}>
                <h3 style={styles.groupTitle}>Caudal de operación</h3>
                <NumberInput label="Caudal directo" value={inputs.directFlow} unit={inputs.directFlowUnit} unitOptions={flowUnits} onValueChange={(value) => updateInput(setInputs, 'directFlow', value)} onUnitChange={(value) => updateInput(setInputs, 'directFlowUnit', value)} />
                <NumberInput label="Volumen a procesar opcional" value={inputs.processVolume} unit={inputs.processVolumeUnit} unitOptions={volumeUnits} onValueChange={(value) => updateInput(setInputs, 'processVolume', value)} onUnitChange={(value) => updateInput(setInputs, 'processVolumeUnit', value)} />
              </div>
            )}

            <div style={styles.inputSection}>
              <h3 style={styles.groupTitle}>vg y propiedades</h3>
              <SelectField label="Fuente de vg" value={inputs.vgMode} options={[{ value: 'direct', label: 'Usar vg directo' }, { value: 'stokes', label: 'Calcular vg con Stokes' }]} onChange={(value) => updateInput(setInputs, 'vgMode', value)} />
              <NumberInput label="vg directo" value={inputs.vg} onValueChange={(value) => updateInput(setInputs, 'vg', value)} />
              <NumberInput label="Diámetro de partícula" value={inputs.dp} unit={inputs.dpUnit} unitOptions={[{ value: 'cm', label: 'cm' }, { value: 'um', label: 'µm' }, { value: 'm', label: 'm' }]} onValueChange={(value) => updateInput(setInputs, 'dp', value)} onUnitChange={(value) => updateInput(setInputs, 'dpUnit', value)} />
              <NumberInput label="Densidad partícula" value={inputs.rhoP} unit={inputs.rhoPUnit} unitOptions={densityUnits} onValueChange={(value) => updateInput(setInputs, 'rhoP', value)} onUnitChange={(value) => updateInput(setInputs, 'rhoPUnit', value)} />
              <NumberInput label="Densidad fluido" value={inputs.rhoF} unit={inputs.rhoFUnit} unitOptions={densityUnits} onValueChange={(value) => updateInput(setInputs, 'rhoF', value)} onUnitChange={(value) => updateInput(setInputs, 'rhoFUnit', value)} />
              <NumberInput label="Viscosidad dinámica" value={inputs.mu} unit={inputs.muUnit} unitOptions={[{ value: 'gcm_s', label: 'g/(cm*s)' }, { value: 'pa_s', label: 'Pa*s' }]} onValueChange={(value) => updateInput(setInputs, 'mu', value)} onUnitChange={(value) => updateInput(setInputs, 'muUnit', value)} />
            </div>

            <div style={styles.inputSection}>
              <h3 style={styles.groupTitle}>Geometría tubular</h3>
              <NumberInput label="r1 superficie libre" value={inputs.r1} unit={inputs.r1Unit} unitOptions={lengthUnits} onValueChange={(value) => updateInput(setInputs, 'r1', value)} onUnitChange={(value) => updateInput(setInputs, 'r1Unit', value)} />
              <NumberInput label="r2 pared del bowl" value={inputs.r2} unit={inputs.r2Unit} unitOptions={lengthUnits} onValueChange={(value) => updateInput(setInputs, 'r2', value)} onUnitChange={(value) => updateInput(setInputs, 'r2Unit', value)} />
              <NumberInput label="Longitud efectiva" value={inputs.length} unit={inputs.lengthUnit} unitOptions={lengthUnits} onValueChange={(value) => updateInput(setInputs, 'length', value)} onUnitChange={(value) => updateInput(setInputs, 'lengthUnit', value)} />
              <NumberInput label="rpm operación" value={inputs.rpm} onValueChange={(value) => updateInput(setInputs, 'rpm', value)} />
              <NumberInput label="rpm máxima" value={inputs.rpmMax} onValueChange={(value) => updateInput(setInputs, 'rpmMax', value)} />
            </div>
          </section>

          <main style={styles.resultsPanel}>
            <section style={styles.panel}>
              {!result.ok && (
                <div style={styles.errorBox}>
                  {result.validation.errors.map((error) => <div key={error}>{error}</div>)}
                </div>
              )}

              {result.ok && (
                <>
                  <div style={styles.statusCard(result.viable)}>
                    {result.viable ? 'La centrífuga tubular propuesta es viable para la meta de proceso.' : 'La centrífuga tubular propuesta no cumple todas las condiciones de viabilidad.'}
                  </div>
                  <div style={styles.metricsGrid}>
                    <StatCard label="Tiempo de proceso" value={`${formatNumber(result.processTimeS / 3600, 3)} h`} detail="Con Q máximo estimado" />
                    <StatCard label="Volumen del bowl" value={`${formatNumber(result.bowlVolumeM3 * 1000, 4)} L`} detail={`${formatNumber(result.bowlVolumeM3, 6)} m3`} />
                    <StatCard label="t_res vs t_sed" value={`${formatNumber(result.residenceTimeS, 3)} s`} detail={`t_sed = ${formatNumber(result.radialSedimentationTimeS, 3)} s`} />
                    <StatCard label="RPM mínima" value={`${formatNumber(result.rpmRequired, 2)} rpm`} detail={`rpm max = ${formatNumber(result.values.rpmMax, 0)}`} />
                    <StatCard label="Longitud requerida" value={`${formatNumber(result.lengthRequiredM, 4)} m`} detail="Para la rpm y radios actuales" />
                    <StatCard label="Centrífugas paralelo" value={`${result.centrifugesRequired}`} detail="Redondeado hacia arriba" />
                  </div>
                  <div style={styles.interpretation}>
                    <strong>Interpretación automática:</strong> {interpretation}
                    {!result.viable && ' Se puede aumentar rpm, aumentar la longitud del bowl, aumentar r2, disminuir caudal, aumentar el tiempo de proceso o usar varias centrífugas en paralelo.'}
                  </div>
                  {result.validation.warnings.length > 0 && (
                    <div style={styles.warningBox}>
                      {result.validation.warnings.map((warning) => <div key={warning}>{warning}</div>)}
                    </div>
                  )}
                </>
              )}
            </section>

            {result.ok && (
              <section style={styles.panel}>
                <div style={styles.tabs}>
                  {chartTabs.map((tab) => (
                    <button
                      key={tab.id}
                      style={styles.tab(activeChartTab === tab.id)}
                      onClick={() => setActiveChartTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeChartTab === 'sigmaRpm' && (
                  <div>
                    <h3 style={styles.chartTitle}>Sigma tubular vs rpm</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={sensitivity.rpmData} margin={{ top: 12, right: 28, left: 0, bottom: 22 }}>
                        <CartesianGrid stroke="rgba(30,27,46,0.08)" strokeDasharray="3 4" />
                        <XAxis dataKey="rpm" label={{ value: 'rpm', position: 'insideBottom', offset: -8 }} />
                        <YAxis label={{ value: 'Sigma [m2]', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <ReferenceLine y={result.sigmaRequired} stroke="#dc2626" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="sigma" name="Sigma tubular" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeChartTab === 'qmaxRpm' && (
                  <div>
                    <h3 style={styles.chartTitle}>Q máximo vs rpm</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={sensitivity.rpmData} margin={{ top: 12, right: 28, left: 0, bottom: 22 }}>
                        <CartesianGrid stroke="rgba(30,27,46,0.08)" strokeDasharray="3 4" />
                        <XAxis dataKey="rpm" label={{ value: 'rpm', position: 'insideBottom', offset: -8 }} />
                        <YAxis label={{ value: 'Q [L/h]', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <ReferenceLine y={requiredFlow.lh} stroke="#dc2626" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="qMaxLh" name="Q máximo" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeChartTab === 'timeRpm' && (
                  <div>
                    <h3 style={styles.chartTitle}>Tiempo de proceso vs rpm</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={sensitivity.rpmData} margin={{ top: 12, right: 28, left: 0, bottom: 22 }}>
                        <CartesianGrid stroke="rgba(30,27,46,0.08)" strokeDasharray="3 4" />
                        <XAxis dataKey="rpm" label={{ value: 'rpm', position: 'insideBottom', offset: -8 }} />
                        <YAxis label={{ value: 't proceso [h]', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <ReferenceLine y={result.values.objectiveTimeS / 3600} stroke="#dc2626" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="processTimeH" name="t proceso" stroke="#059669" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

              </section>
            )}

            <section style={styles.infoGrid}>
              <InfoBlock
                title="Supuestos"
                items={[
                  'La centrífuga tubular opera en régimen continuo.',
                  'El proceso se modela como clarificación sólido-líquido y las antocianinas permanecen en el sobrenadante.',
                  'Las partículas se representan con un diámetro equivalente y sedimentan bajo Stokes.',
                  'El flujo se considera ideal y uniforme; r1 es la superficie libre y r2 la pared del bowl.',
                  'La eficiencia se evalúa por capacidad teórica de sedimentación, no por turbidez experimental.',
                ]}
              />
              <InfoBlock
                title="Limitaciones"
                items={[
                  'La teoría sigma es una aproximación ideal y no predice perfectamente la eficiencia real.',
                  'El resultado depende fuertemente del diámetro de partícula y de vg.',
                  'No considera sedimentación obstaculizada, capacidad máxima de sólidos, vibración, calentamiento ni espuma.',
                  'No predice pérdidas de antocianinas por adsorción al pellet ni degradación durante el proceso.',
                  'Este módulo se conecta después del modelo Weibull-Page: lisis predice concentración y centrifugación evalúa clarificación.',
                ]}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
