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

const initialInputs = {
  mode: 'processGoal',
  processVolume: 2000,
  processVolumeUnit: 'L',
  objectiveTime: 2,
  objectiveTimeUnit: 'h',
  chamberVolume: 30,
  chamberVolumeUnit: 'L',
  operatingFlow: 1000,
  operatingFlowUnit: 'L/h',
  residenceTarget: 3,
  residenceTargetUnit: 'min',
  passes: 3,
  totalTreatmentTarget: 15,
  totalTreatmentTargetUnit: 'min',
  flowMin: 0,
  flowMinUnit: 'L/h',
  flowMax: 1200,
  flowMaxUnit: 'L/h',
  chamberMin: 0,
  chamberMinUnit: 'L',
  chamberMax: 50,
  chamberMaxUnit: 'L',
  cMax: 150,
  k: 0.25,
  weibullN: 1.2,
  weibullTimeUnit: 'min',
  concentrationTarget: 120,
  labOptimalTime: 5,
  labOptimalTimeUnit: 'min',
}

const modeDefaultOverrides = {
  processGoal: {
    chamberVolume: 30,
    operatingFlow: 1000,
    residenceTarget: 3,
    flowMax: 1200,
    chamberMax: 80,
    labOptimalTime: 5,
  },
  knownFlow: {
    chamberVolume: 5,
    operatingFlow: 100,
    residenceTarget: 3,
    flowMax: 1200,
    chamberMax: 80,
    labOptimalTime: 5,
  },
  residenceTarget: {
    chamberVolume: 5,
    operatingFlow: 1000,
    residenceTarget: 3,
    flowMax: 10000,
    chamberMax: 80,
    labOptimalTime: 5,
  },
}

function getDefaultInputsForMode(mode) {
  return {
    ...initialInputs,
    ...modeDefaultOverrides[mode],
    mode,
  }
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

export function convertTimeForWeibull(seconds, unit) {
  if (unit === 'h') return seconds / 3600
  if (unit === 'min') return seconds / 60
  return seconds
}

function flowFormats(qM3S) {
  return {
    m3s: qM3S,
    lmin: qM3S * 60000,
    lh: qM3S * 3600000,
  }
}

export function calculateRequiredFlowFromProcessGoal(volumeM3, timeS) {
  return volumeM3 / timeS
}

export function calculateResidenceTime(chamberVolumeM3, flowM3S) {
  return chamberVolumeM3 / flowM3S
}

export function calculateRequiredFlowForResidenceTime(chamberVolumeM3, residenceTimeS) {
  return chamberVolumeM3 / residenceTimeS
}

export function calculateRequiredChamberVolume(flowM3S, residenceTimeS) {
  return flowM3S * residenceTimeS
}

export function calculateTotalEffectiveTime(passes, residenceTimeS) {
  return passes * residenceTimeS
}

export function weibullPageConcentration(cMax, k, n, timeForModel) {
  const predicted = cMax * (1 - Math.exp(-k * timeForModel ** n))
  return Math.min(cMax, Math.max(0, predicted))
}

export function calculateRecoveryPercentage(concentration, cMax) {
  return (concentration / cMax) * 100
}

export function calculateRequiredPasses(totalTargetS, residenceTimeS) {
  return Math.max(1, Math.ceil(totalTargetS / residenceTimeS))
}

function optionalNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  return toNumber(value)
}

function convertInputs(inputs) {
  return {
    mode: inputs.mode,
    processVolumeM3: convertVolumeToM3(toNumber(inputs.processVolume), inputs.processVolumeUnit),
    objectiveTimeS: convertTimeToS(toNumber(inputs.objectiveTime), inputs.objectiveTimeUnit),
    chamberVolumeM3: convertVolumeToM3(toNumber(inputs.chamberVolume), inputs.chamberVolumeUnit),
    operatingFlowM3S: convertFlowToM3S(toNumber(inputs.operatingFlow), inputs.operatingFlowUnit),
    residenceTargetS: convertTimeToS(toNumber(inputs.residenceTarget), inputs.residenceTargetUnit),
    passes: Math.max(1, Math.round(toNumber(inputs.passes))),
    totalTreatmentTargetS: convertTimeToS(toNumber(inputs.totalTreatmentTarget), inputs.totalTreatmentTargetUnit),
    flowMinM3S: convertFlowToM3S(toNumber(inputs.flowMin), inputs.flowMinUnit),
    flowMaxM3S: convertFlowToM3S(toNumber(inputs.flowMax), inputs.flowMaxUnit),
    chamberMinM3: convertVolumeToM3(toNumber(inputs.chamberMin), inputs.chamberMinUnit),
    chamberMaxM3: convertVolumeToM3(toNumber(inputs.chamberMax), inputs.chamberMaxUnit),
    cMax: toNumber(inputs.cMax),
    k: toNumber(inputs.k),
    n: toNumber(inputs.weibullN),
    weibullTimeUnit: inputs.weibullTimeUnit,
    concentrationTarget: optionalNumber(inputs.concentrationTarget),
    labOptimalTimeS: convertTimeToS(toNumber(inputs.labOptimalTime), inputs.labOptimalTimeUnit),
  }
}

function validate(values) {
  const errors = []
  const warnings = []

  if (!Number.isFinite(values.chamberVolumeM3) || values.chamberVolumeM3 <= 0) errors.push('El volumen efectivo de cámara debe ser mayor que cero.')
  if (!Number.isFinite(values.passes) || values.passes < 1) errors.push('El número de pases debe ser al menos 1.')
  if (!Number.isFinite(values.cMax) || values.cMax <= 0) errors.push('Cmax debe ser mayor que cero.')
  if (!Number.isFinite(values.k) || values.k <= 0) errors.push('k debe ser mayor que cero.')
  if (!Number.isFinite(values.n) || values.n <= 0) errors.push('n debe ser mayor que cero.')

  if (values.mode === 'knownFlow' && (!Number.isFinite(values.operatingFlowM3S) || values.operatingFlowM3S <= 0)) errors.push('El caudal de operación debe ser mayor que cero.')
  if (values.mode === 'processGoal') {
    if (!Number.isFinite(values.processVolumeM3) || values.processVolumeM3 <= 0) errors.push('El volumen total a procesar debe ser mayor que cero.')
    if (!Number.isFinite(values.objectiveTimeS) || values.objectiveTimeS <= 0) errors.push('El tiempo objetivo de proceso debe ser mayor que cero.')
  }
  if (values.mode === 'residenceTarget' && (!Number.isFinite(values.residenceTargetS) || values.residenceTargetS <= 0)) errors.push('El tiempo de residencia objetivo debe ser mayor que cero.')

  if (values.concentrationTarget !== null && values.concentrationTarget > values.cMax) warnings.push('La concentración objetivo es mayor que Cmax; el modelo no puede alcanzarla sin recalibrar Cmax.')

  return { errors, warnings }
}

export function runSimulation(inputs) {
  const values = convertInputs(inputs)
  const validation = validate(values)

  if (validation.errors.length > 0) return { ok: false, values, validation }

  const flowM3S = values.mode === 'processGoal'
    ? calculateRequiredFlowFromProcessGoal(values.processVolumeM3, values.objectiveTimeS)
    : values.mode === 'residenceTarget'
      ? calculateRequiredFlowForResidenceTime(values.chamberVolumeM3, values.residenceTargetS)
      : values.operatingFlowM3S

  const residenceTimeS = values.mode === 'residenceTarget'
    ? values.residenceTargetS
    : calculateResidenceTime(values.chamberVolumeM3, flowM3S)

  const totalEffectiveTimeS = calculateTotalEffectiveTime(values.passes, residenceTimeS)
  const timeForWeibull = convertTimeForWeibull(totalEffectiveTimeS, values.weibullTimeUnit)
  const concentration = weibullPageConcentration(values.cMax, values.k, values.n, timeForWeibull)
  const recovery = calculateRecoveryPercentage(concentration, values.cMax)
  const requiredChamberVolumeM3 = calculateRequiredChamberVolume(values.operatingFlowM3S, values.residenceTargetS)
  const requiredPasses = calculateRequiredPasses(values.totalTreatmentTargetS, residenceTimeS)
  const processTimeS = values.processVolumeM3 > 0 ? values.processVolumeM3 / flowM3S : null
  const targetMet = values.concentrationTarget === null ? true : concentration >= values.concentrationTarget
  const flowWithinMax = values.flowMaxM3S <= 0 || flowM3S <= values.flowMaxM3S
  const flowWithinMin = values.flowMinM3S <= 0 || flowM3S >= values.flowMinM3S
  const warnings = [...validation.warnings]

  if (!flowWithinMax) warnings.push('El caudal requerido excede el caudal máximo permitido por el equipo.')
  if (!flowWithinMin) warnings.push('El caudal calculado está por debajo del caudal mínimo definido para el equipo.')
  if (values.chamberMaxM3 > 0 && requiredChamberVolumeM3 > values.chamberMaxM3) warnings.push('El volumen de cámara requerido supera el límite máximo definido.')
  if (totalEffectiveTimeS < values.labOptimalTimeS) warnings.push('El tiempo total efectivo es menor que el tiempo óptimo de laboratorio ingresado.')
  if (values.passes > 10) warnings.push('El número de pases es alto; puede ser operativamente poco viable.')
  if (!targetMet) warnings.push('La concentración predicha no alcanza la concentración objetivo.')
  if (recovery > 95 && totalEffectiveTimeS > values.labOptimalTimeS * 2) warnings.push('La concentración se acerca a Cmax, pero el tiempo efectivo es alto; aumentar más el tiempo puede ser poco eficiente.')

  return {
    ok: true,
    values,
    validation: { ...validation, warnings },
    flowM3S,
    residenceTimeS,
    totalEffectiveTimeS,
    timeForWeibull,
    concentration,
    recovery,
    requiredChamberVolumeM3,
    requiredPasses,
    processTimeS,
    targetMet,
    viable: targetMet && flowWithinMax && flowWithinMin,
  }
}

function buildSensitivity(result) {
  if (!result.ok) return {}
  const { values } = result
  const currentFlow = Math.max(result.flowM3S, 1e-9)
  const maxResidenceMin = Math.max(30, (result.totalEffectiveTimeS / 60) * 2, values.labOptimalTimeS / 60)
  const concentrationVsTime = Array.from({ length: 18 }, (_, i) => {
    const tMin = (maxResidenceMin * i) / 17
    const tS = tMin * 60
    return {
      tMin: +tMin.toFixed(3),
      concentration: +weibullPageConcentration(values.cMax, values.k, values.n, convertTimeForWeibull(tS, values.weibullTimeUnit)).toFixed(4),
      target: values.concentrationTarget,
    }
  })

  const maxFlow = Math.max(currentFlow * 2, values.flowMaxM3S > 0 ? values.flowMaxM3S * 1.1 : currentFlow * 2)
  const minFlow = Math.max(currentFlow * 0.2, 1e-9)
  const flowData = Array.from({ length: 18 }, (_, i) => {
    const q = minFlow + ((maxFlow - minFlow) * i) / 17
    const residenceTimeS = calculateResidenceTime(values.chamberVolumeM3, q)
    const totalEffectiveTimeS = calculateTotalEffectiveTime(values.passes, residenceTimeS)
    const concentration = weibullPageConcentration(values.cMax, values.k, values.n, convertTimeForWeibull(totalEffectiveTimeS, values.weibullTimeUnit))
    return {
      flowLh: +(q * 3600000).toFixed(2),
      residenceMin: +(residenceTimeS / 60).toFixed(4),
      concentration: +concentration.toFixed(4),
      target: values.concentrationTarget,
    }
  })

  const passesData = Array.from({ length: 12 }, (_, i) => {
    const passes = i + 1
    const totalS = calculateTotalEffectiveTime(passes, result.residenceTimeS)
    const concentration = weibullPageConcentration(values.cMax, values.k, values.n, convertTimeForWeibull(totalS, values.weibullTimeUnit))
    return {
      passes,
      totalMin: +(totalS / 60).toFixed(4),
      concentration: +concentration.toFixed(4),
      target: values.concentrationTarget,
    }
  })

  const flowStart = Math.max(currentFlow * 0.25, 1e-9)
  const flowEnd = Math.max(currentFlow * 2, flowStart * 2)
  const chamberStart = Math.max(values.chamberVolumeM3 * 0.25, 1e-6)
  const chamberEnd = Math.max(values.chamberVolumeM3 * 2, chamberStart * 2)
  const viabilityMap = []

  for (let i = 0; i < 8; i += 1) {
    for (let j = 0; j < 8; j += 1) {
      const chamber = chamberStart + ((chamberEnd - chamberStart) * i) / 7
      const q = flowStart + ((flowEnd - flowStart) * j) / 7
      const totalS = calculateTotalEffectiveTime(values.passes, calculateResidenceTime(chamber, q))
      const concentration = weibullPageConcentration(values.cMax, values.k, values.n, convertTimeForWeibull(totalS, values.weibullTimeUnit))
      const viable = values.concentrationTarget === null ? concentration >= values.cMax * 0.8 : concentration >= values.concentrationTarget
      viabilityMap.push({
        chamberL: +(chamber * 1000).toFixed(3),
        flowLh: +(q * 3600000).toFixed(2),
        concentration: +concentration.toFixed(3),
        viable,
      })
    }
  }

  return { concentrationVsTime, flowData, passesData, viabilityMap }
}

function updateInput(setInputs, key, value) {
  setInputs((current) => ({ ...current, [key]: value }))
}

const modeLabels = {
  processGoal: 'Volumen y tiempo objetivo',
  knownFlow: 'Volumen de cámara y caudal',
  residenceTarget: 'Tiempo de residencia objetivo',
}

const modeGuides = {
  processGoal: {
    question: '¿Qué caudal necesito para procesar cierto volumen en el tiempo disponible?',
    description: 'Este modo parte de una meta de producción. Primero calcula Q_req = V_proceso / t_objetivo y después estima el tiempo de residencia con la cámara ingresada.',
    formula: 'Q_req = V_proceso / t_objetivo  →  t_res = V_cámara / Q_req',
  },
  knownFlow: {
    question: '¿Qué pasa si opero un molino conocido a un caudal definido?',
    description: 'Este modo evalúa una condición operativa real. El usuario fija cámara y caudal; el simulador calcula residencia, tiempo efectivo y concentración predicha.',
    formula: 't_res = V_cámara / Q_operación',
  },
  residenceTarget: {
    question: '¿Qué caudal o cámara necesito para conservar un tiempo de residencia deseado?',
    description: 'Este modo diseña alrededor de un tiempo de contacto. Es útil cuando quieres mantener el tiempo que funcionó en laboratorio.',
    formula: 'Q_req = V_cámara / t_res_obj  ·  V_cámara_req = Q_operación · t_res_obj',
  },
}

const chartTabsByMode = {
  processGoal: [
    { id: 'concentrationTime', label: 'C vs tiempo' },
    { id: 'concentrationFlow', label: 'C vs caudal' },
    { id: 'residenceFlow', label: 't_res vs caudal' },
  ],
  knownFlow: [
    { id: 'concentrationFlow', label: 'C vs caudal' },
    { id: 'residenceFlow', label: 't_res vs caudal' },
  ],
  residenceTarget: [
    { id: 'concentrationTime', label: 'C vs tiempo' },
  ],
}

export default function IndustrialBeadMillTwin({ onBack, fixedMode = null }) {
  const initialMode = fixedMode ?? initialInputs.mode
  const [inputs, setInputs] = useState(getDefaultInputsForMode(initialMode))
  const [activeChartTab, setActiveChartTab] = useState(chartTabsByMode[initialMode][0].id)
  const result = useMemo(() => runSimulation(inputs), [inputs])
  const sensitivity = useMemo(() => buildSensitivity(result), [result])
  const activeMode = inputs.mode
  const modeGuide = modeGuides[activeMode]
  const chartTabs = chartTabsByMode[activeMode]

  const flow = result.ok ? flowFormats(result.flowM3S) : null
  const topMetrics = result.ok
    ? activeMode === 'residenceTarget'
      ? [
          { label: 'Caudal para t_res', value: `${formatNumber(flow.lh, 2)} L/h`, detail: `${formatNumber(flow.lmin, 3)} L/min` },
          { label: 'Volumen cámara req.', value: `${formatNumber(result.requiredChamberVolumeM3 * 1000, 3)} L`, detail: 'Con el caudal de operación ingresado' },
          { label: 'Concentración predicha', value: `${formatNumber(result.concentration, 3)} mg/L`, detail: `${formatNumber(result.recovery, 2)}% de Cmax` },
        ]
      : [
          { label: activeMode === 'knownFlow' ? 'Caudal de operación' : 'Caudal requerido', value: `${formatNumber(flow.lh, 2)} L/h`, detail: `${formatNumber(flow.lmin, 3)} L/min · ${formatNumber(flow.m3s, 6)} m3/s` },
          { label: 'Tiempo residencia', value: `${formatNumber(result.residenceTimeS / 60, 4)} min`, detail: `${formatNumber(result.residenceTimeS, 3)} s por pase` },
          { label: 'Concentración predicha', value: `${formatNumber(result.concentration, 3)} mg/L`, detail: `${formatNumber(result.recovery, 2)}% de Cmax` },
        ]
    : []

  const interpretation = result.ok
    ? activeMode === 'processGoal'
      ? `Para procesar ${formatNumber(result.values.processVolumeM3 * 1000, 2)} L en ${formatNumber(result.values.objectiveTimeS / 3600, 2)} h, se requiere un caudal de ${formatNumber(flow.lh, 2)} L/h. Con una cámara de ${formatNumber(result.values.chamberVolumeM3 * 1000, 2)} L, el tiempo de residencia por pase es ${formatNumber(result.residenceTimeS / 60, 4)} min. Con ${result.values.passes} pases, el tiempo efectivo es ${formatNumber(result.totalEffectiveTimeS / 60, 4)} min y la concentración predicha es ${formatNumber(result.concentration, 3)} mg/L.`
      : activeMode === 'knownFlow'
        ? `Con una cámara de ${formatNumber(result.values.chamberVolumeM3 * 1000, 2)} L y un caudal de operación de ${formatNumber(flow.lh, 2)} L/h, el tiempo de residencia por pase es ${formatNumber(result.residenceTimeS / 60, 4)} min. Considerando ${result.values.passes} pases, el tiempo total efectivo es ${formatNumber(result.totalEffectiveTimeS / 60, 4)} min y la concentración predicha es ${formatNumber(result.concentration, 3)} mg/L.`
        : `Para alcanzar un tiempo de residencia objetivo de ${formatNumber(result.residenceTimeS / 60, 4)} min con una cámara de ${formatNumber(result.values.chamberVolumeM3 * 1000, 2)} L, se requiere un caudal de ${formatNumber(flow.lh, 2)} L/h. Si se opera con el caudal ingresado, el volumen de cámara requerido sería ${formatNumber(result.requiredChamberVolumeM3 * 1000, 3)} L. Con ${result.values.passes} pases, la concentración predicha es ${formatNumber(result.concentration, 3)} mg/L.`
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
            <h1 style={styles.title}>Escalamiento de molino de perlas por tiempo de residencia</h1>
            <p style={styles.subtitle}>
              {fixedMode ? `${modeLabels[fixedMode]}. ` : ''}
              Modelo continuo para estimar el tiempo efectivo de lisis y la concentración de antocianinas mediante Weibull-Page.
            </p>
          </div>
          <button style={styles.backButton} onClick={onBack}>Volver</button>
        </div>

        <div style={styles.notice}>
          <strong>Criterio de escalamiento:</strong> el molino industrial usa t_res = V_cámara / Q. Ese tiempo se toma como equivalente de lisis para evaluar el modelo Weibull-Page.
        </div>

        <div style={styles.notice}>
          <strong>{modeGuide.question}</strong> {modeGuide.description}
          <div style={{ marginTop: 8, fontFamily: '"JetBrains Mono", monospace', color: 'rgba(30,27,46,0.55)' }}>
            {modeGuide.formula}
          </div>
        </div>

        {result.ok && (
          <div style={styles.topMetricsGrid}>
            {topMetrics.map((metric) => (
              <StatCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />
            ))}
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
                  { value: 'processGoal', label: 'Volumen y tiempo objetivo' },
                  { value: 'knownFlow', label: 'Volumen de cámara y caudal' },
                  { value: 'residenceTarget', label: 'Tiempo de residencia objetivo' },
                ]}
                onChange={(value) => {
                  setInputs(getDefaultInputsForMode(value))
                  setActiveChartTab(chartTabsByMode[value][0].id)
                }}
              />
            )}

            {activeMode === 'processGoal' && (
              <>
                <div style={styles.inputSection}>
                  <h3 style={styles.groupTitle}>Meta de producción</h3>
                  <NumberInput label="Volumen total a procesar" value={inputs.processVolume} unit={inputs.processVolumeUnit} unitOptions={volumeUnits} onValueChange={(value) => updateInput(setInputs, 'processVolume', value)} onUnitChange={(value) => updateInput(setInputs, 'processVolumeUnit', value)} />
                  <NumberInput label="Tiempo objetivo de proceso" value={inputs.objectiveTime} unit={inputs.objectiveTimeUnit} unitOptions={timeUnits} onValueChange={(value) => updateInput(setInputs, 'objectiveTime', value)} onUnitChange={(value) => updateInput(setInputs, 'objectiveTimeUnit', value)} />
                  <NumberInput label="Caudal máximo del equipo" value={inputs.flowMax} unit={inputs.flowMaxUnit} unitOptions={flowUnits} onValueChange={(value) => updateInput(setInputs, 'flowMax', value)} onUnitChange={(value) => updateInput(setInputs, 'flowMaxUnit', value)} />
                </div>
                <div style={styles.inputSection}>
                  <h3 style={styles.groupTitle}>Molino y tratamiento</h3>
                  <NumberInput label="Volumen efectivo de cámara" value={inputs.chamberVolume} unit={inputs.chamberVolumeUnit} unitOptions={volumeUnits} onValueChange={(value) => updateInput(setInputs, 'chamberVolume', value)} onUnitChange={(value) => updateInput(setInputs, 'chamberVolumeUnit', value)} />
                  <NumberInput label="Número de pases" value={inputs.passes} onValueChange={(value) => updateInput(setInputs, 'passes', value)} />
                  <NumberInput label="Tiempo óptimo laboratorio" value={inputs.labOptimalTime} unit={inputs.labOptimalTimeUnit} unitOptions={timeUnits} onValueChange={(value) => updateInput(setInputs, 'labOptimalTime', value)} onUnitChange={(value) => updateInput(setInputs, 'labOptimalTimeUnit', value)} />
                </div>
              </>
            )}

            {activeMode === 'knownFlow' && (
              <>
                <div style={styles.inputSection}>
                  <h3 style={styles.groupTitle}>Condición de operación</h3>
                  <NumberInput label="Volumen efectivo de cámara" value={inputs.chamberVolume} unit={inputs.chamberVolumeUnit} unitOptions={volumeUnits} onValueChange={(value) => updateInput(setInputs, 'chamberVolume', value)} onUnitChange={(value) => updateInput(setInputs, 'chamberVolumeUnit', value)} />
                  <NumberInput label="Caudal de operación" value={inputs.operatingFlow} unit={inputs.operatingFlowUnit} unitOptions={flowUnits} onValueChange={(value) => updateInput(setInputs, 'operatingFlow', value)} onUnitChange={(value) => updateInput(setInputs, 'operatingFlowUnit', value)} />
                  <NumberInput label="Número de pases" value={inputs.passes} onValueChange={(value) => updateInput(setInputs, 'passes', value)} />
                </div>
                <div style={styles.inputSection}>
                  <h3 style={styles.groupTitle}>Contexto opcional</h3>
                  <NumberInput label="Volumen total a procesar" value={inputs.processVolume} unit={inputs.processVolumeUnit} unitOptions={volumeUnits} onValueChange={(value) => updateInput(setInputs, 'processVolume', value)} onUnitChange={(value) => updateInput(setInputs, 'processVolumeUnit', value)} />
                  <NumberInput label="Tiempo objetivo de proceso" value={inputs.objectiveTime} unit={inputs.objectiveTimeUnit} unitOptions={timeUnits} onValueChange={(value) => updateInput(setInputs, 'objectiveTime', value)} onUnitChange={(value) => updateInput(setInputs, 'objectiveTimeUnit', value)} />
                  <NumberInput label="Caudal máximo del equipo" value={inputs.flowMax} unit={inputs.flowMaxUnit} unitOptions={flowUnits} onValueChange={(value) => updateInput(setInputs, 'flowMax', value)} onUnitChange={(value) => updateInput(setInputs, 'flowMaxUnit', value)} />
                </div>
              </>
            )}

            {activeMode === 'residenceTarget' && (
              <>
                <div style={styles.inputSection}>
                  <h3 style={styles.groupTitle}>Diseño por residencia</h3>
                  <NumberInput label="Tiempo de residencia objetivo" value={inputs.residenceTarget} unit={inputs.residenceTargetUnit} unitOptions={timeUnits} onValueChange={(value) => updateInput(setInputs, 'residenceTarget', value)} onUnitChange={(value) => updateInput(setInputs, 'residenceTargetUnit', value)} />
                  <NumberInput label="Volumen efectivo de cámara" value={inputs.chamberVolume} unit={inputs.chamberVolumeUnit} unitOptions={volumeUnits} onValueChange={(value) => updateInput(setInputs, 'chamberVolume', value)} onUnitChange={(value) => updateInput(setInputs, 'chamberVolumeUnit', value)} />
                  <NumberInput label="Caudal de operación conocido" value={inputs.operatingFlow} unit={inputs.operatingFlowUnit} unitOptions={flowUnits} onValueChange={(value) => updateInput(setInputs, 'operatingFlow', value)} onUnitChange={(value) => updateInput(setInputs, 'operatingFlowUnit', value)} />
                </div>
                <div style={styles.inputSection}>
                  <h3 style={styles.groupTitle}>Límites y tratamiento</h3>
                  <NumberInput label="Número de pases" value={inputs.passes} onValueChange={(value) => updateInput(setInputs, 'passes', value)} />
                  <NumberInput label="Caudal máximo del equipo" value={inputs.flowMax} unit={inputs.flowMaxUnit} unitOptions={flowUnits} onValueChange={(value) => updateInput(setInputs, 'flowMax', value)} onUnitChange={(value) => updateInput(setInputs, 'flowMaxUnit', value)} />
                  <NumberInput label="Volumen máximo de cámara" value={inputs.chamberMax} unit={inputs.chamberMaxUnit} unitOptions={volumeUnits} onValueChange={(value) => updateInput(setInputs, 'chamberMax', value)} onUnitChange={(value) => updateInput(setInputs, 'chamberMaxUnit', value)} />
                  <NumberInput label="Tiempo total objetivo" value={inputs.totalTreatmentTarget} unit={inputs.totalTreatmentTargetUnit} unitOptions={timeUnits} onValueChange={(value) => updateInput(setInputs, 'totalTreatmentTarget', value)} onUnitChange={(value) => updateInput(setInputs, 'totalTreatmentTargetUnit', value)} />
                </div>
              </>
            )}

            <div style={styles.inputSection}>
              <h3 style={styles.groupTitle}>Weibull-Page</h3>
              <NumberInput label="Cmax" value={inputs.cMax} onValueChange={(value) => updateInput(setInputs, 'cMax', value)} />
              <NumberInput label="k" value={inputs.k} onValueChange={(value) => updateInput(setInputs, 'k', value)} />
              <NumberInput label="n" value={inputs.weibullN} onValueChange={(value) => updateInput(setInputs, 'weibullN', value)} />
              <SelectField label="Unidad de tiempo del ajuste" value={inputs.weibullTimeUnit} options={timeUnits} onChange={(value) => updateInput(setInputs, 'weibullTimeUnit', value)} />
              <NumberInput label="Concentración objetivo" value={inputs.concentrationTarget} onValueChange={(value) => updateInput(setInputs, 'concentrationTarget', value)} />
              <NumberInput label="Tiempo óptimo laboratorio" value={inputs.labOptimalTime} unit={inputs.labOptimalTimeUnit} unitOptions={timeUnits} onValueChange={(value) => updateInput(setInputs, 'labOptimalTime', value)} onUnitChange={(value) => updateInput(setInputs, 'labOptimalTimeUnit', value)} />
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
                    {result.viable ? 'La condición industrial cumple con los criterios definidos.' : 'La condición industrial no cumple todos los criterios definidos.'}
                  </div>
                  <div style={styles.metricsGrid}>
                    {activeMode === 'processGoal' && (
                      <>
                        <StatCard label="Tiempo total efectivo" value={`${formatNumber(result.totalEffectiveTimeS / 60, 4)} min`} detail={`${result.values.passes} pases`} />
                        <StatCard label="Tiempo real proceso" value={result.processTimeS ? `${formatNumber(result.processTimeS / 3600, 3)} h` : 'No aplica'} detail="Debe coincidir con la meta" />
                        <StatCard label="Recuperación relativa" value={`${formatNumber(result.recovery, 2)}%`} detail="Respecto a Cmax" />
                        <StatCard label="Cumplimiento objetivo" value={result.targetMet ? 'Cumple' : 'No cumple'} detail="Concentración objetivo" />
                      </>
                    )}

                    {activeMode === 'knownFlow' && (
                      <>
                        <StatCard label="Tiempo total efectivo" value={`${formatNumber(result.totalEffectiveTimeS / 60, 4)} min`} detail={`${result.values.passes} pases`} />
                        <StatCard label="Tiempo real proceso" value={result.processTimeS ? `${formatNumber(result.processTimeS / 3600, 3)} h` : 'No aplica'} detail="Para el volumen opcional" />
                        <StatCard label="Recuperación relativa" value={`${formatNumber(result.recovery, 2)}%`} detail="Respecto a Cmax" />
                        <StatCard label="Cumplimiento objetivo" value={result.targetMet ? 'Cumple' : 'No cumple'} detail="Concentración objetivo" />
                      </>
                    )}

                    {activeMode === 'residenceTarget' && (
                      <>
                        <StatCard label="Tiempo total efectivo" value={`${formatNumber(result.totalEffectiveTimeS / 60, 4)} min`} detail={`${result.values.passes} pases`} />
                        <StatCard label="Volumen cámara requerido" value={`${formatNumber(result.requiredChamberVolumeM3 * 1000, 3)} L`} detail="Con el caudal conocido" />
                        <StatCard label="Pases requeridos" value={`${result.requiredPasses}`} detail="Para el tiempo total objetivo" />
                        <StatCard label="Cumplimiento objetivo" value={result.targetMet ? 'Cumple' : 'No cumple'} detail="Concentración objetivo" />
                      </>
                    )}
                  </div>
                  <div style={styles.interpretation}>
                    <strong>Interpretación automática:</strong> {interpretation}
                    {!result.targetMet && ' No se alcanza la concentración objetivo; se recomienda disminuir el caudal, aumentar el volumen de cámara, aumentar el número de pases o revisar la extrapolación del modelo de laboratorio.'}
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

                {activeChartTab === 'concentrationTime' && (
                  <div>
                    <h3 style={styles.chartTitle}>Concentración predicha vs tiempo efectivo</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={sensitivity.concentrationVsTime} margin={{ top: 12, right: 28, left: 0, bottom: 22 }}>
                        <CartesianGrid stroke="rgba(30,27,46,0.08)" strokeDasharray="3 4" />
                        <XAxis dataKey="tMin" label={{ value: 't efectivo [min]', position: 'insideBottom', offset: -8 }} />
                        <YAxis label={{ value: 'C [mg/L]', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        {result.values.concentrationTarget !== null && <ReferenceLine y={result.values.concentrationTarget} stroke="#dc2626" strokeDasharray="4 4" />}
                        <Line type="monotone" dataKey="concentration" name="C predicha" stroke="#7c3aed" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeChartTab === 'concentrationFlow' && (
                  <div>
                    <h3 style={styles.chartTitle}>Concentración predicha vs caudal</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={sensitivity.flowData} margin={{ top: 12, right: 28, left: 0, bottom: 22 }}>
                        <CartesianGrid stroke="rgba(30,27,46,0.08)" strokeDasharray="3 4" />
                        <XAxis dataKey="flowLh" label={{ value: 'Q [L/h]', position: 'insideBottom', offset: -8 }} />
                        <YAxis label={{ value: 'C [mg/L]', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        {result.values.concentrationTarget !== null && <ReferenceLine y={result.values.concentrationTarget} stroke="#dc2626" strokeDasharray="4 4" />}
                        <Line type="monotone" dataKey="concentration" name="C predicha" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeChartTab === 'residenceFlow' && (
                  <div>
                    <h3 style={styles.chartTitle}>Tiempo de residencia vs caudal</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <LineChart data={sensitivity.flowData} margin={{ top: 12, right: 28, left: 0, bottom: 22 }}>
                        <CartesianGrid stroke="rgba(30,27,46,0.08)" strokeDasharray="3 4" />
                        <XAxis dataKey="flowLh" label={{ value: 'Q [L/h]', position: 'insideBottom', offset: -8 }} />
                        <YAxis label={{ value: 't_res [min]', angle: -90, position: 'insideLeft' }} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Line type="monotone" dataKey="residenceMin" name="t_res" stroke="#059669" strokeWidth={2.5} dot={false} />
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
                  'El molino opera en modo continuo o semicontinuo.',
                  'El tiempo de residencia promedio se usa como criterio principal de escalamiento.',
                  'La suspensión se considera homogénea y el caudal constante.',
                  'El número de pases aumenta proporcionalmente el tiempo total efectivo.',
                  'El modelo Weibull-Page de laboratorio se usa como primera aproximación industrial.',
                ]}
              />
              <InfoBlock
                title="Limitaciones"
                items={[
                  'El tiempo de residencia por sí solo no describe toda la intensidad de lisis.',
                  'No se consideran potencia, tamaño de perlas, carga de perlas, geometría ni velocidad periférica.',
                  'No se predice calentamiento, oxidación, adsorción ni degradación de antocianinas.',
                  'Se recomienda calibrar con al menos una corrida piloto o datos industriales reales.',
                  'La salida de este módulo puede conectarse al módulo de centrifugación tubular para evaluar clarificación.',
                ]}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
