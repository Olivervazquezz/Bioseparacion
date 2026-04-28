import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import DigitalTwin from '../digital_twin.jsx'
import CentrifugationTwin from './CentrifugationTwin.jsx'
import IndustrialBeadMillTwin from './IndustrialBeadMillTwin.jsx'
import IndustrialTubularCentrifugeTwin from './IndustrialTubularCentrifugeTwin.jsx'

const processOptions = {
  laboratorio: {
    title: 'Escala Laboratorio',
    subtitle: 'Selecciona el proceso que quieres simular a escala de laboratorio.',
    options: [
      {
        id: 'lab-bead-mill',
        title: 'Ruptura Celular por Bead Mill',
        description: 'Gemelo digital actual para extracción de antocianinas.',
        available: true,
      },
      {
        id: 'lab-centrifugacion',
        title: 'Clarificación por Centrifugación',
        description: 'Módulo de clarificación para datos de laboratorio.',
        available: true,
      },
    ],
  },
  industrial: {
    title: 'Escala Industrial',
    subtitle: 'Selecciona el proceso que quieres simular a escala industrial.',
    options: [
      {
        id: 'industrial-bead-mill',
        title: 'Ruptura Celular por Bead Mill (Escalado)',
        description: 'Modelo de ruptura celular con criterios de escalamiento.',
        available: true,
      },
      {
        id: 'industrial-centrifugacion',
        title: 'Clarificación por Centrifugación (Escalado)',
        description: 'Modelo de clarificación con parámetros industriales.',
        available: true,
      },
    ],
  },
}

const beadMillModeOptions = [
  {
    id: 'processGoal',
    title: 'Volumen y tiempo objetivo',
    description: 'Calcula el caudal requerido a partir del volumen total a procesar y el tiempo disponible.',
  },
  {
    id: 'knownFlow',
    title: 'Volumen de cámara y caudal',
    description: 'Evalúa una condición operativa conocida para estimar residencia, tratamiento y concentración.',
  },
  {
    id: 'residenceTarget',
    title: 'Tiempo de residencia objetivo',
    description: 'Diseña el caudal o volumen de cámara necesario para conservar un tiempo de contacto deseado.',
  },
]

const centrifugeModeOptions = [
  {
    id: 'processGoal',
    title: 'Diseño por volumen y tiempo',
    description: 'Calcula el caudal requerido, sigma requerido y capacidad necesaria para procesar un volumen en un tiempo objetivo.',
  },
  {
    id: 'directFlow',
    title: 'Evaluación por caudal directo',
    description: 'Evalúa si una centrífuga tubular propuesta puede operar al caudal definido por el usuario.',
  },
]

function SelectionShell({ children }) {
  return (
    <div style={styles.shell}>
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />
      <div style={styles.panel}>
        <div style={styles.kicker}>Gemelo Digital de Bioseparación</div>
        {children}
      </div>
    </div>
  )
}

function CentrifugeModeSelection({ onBack, onSelectMode }) {
  return (
    <SelectionShell>
      <button style={styles.backButton} onClick={onBack}>Volver</button>
      <h1 style={styles.title}>Modo de simulación Centrifugación</h1>
      <p style={styles.subtitle}>
        Selecciona cómo quieres plantear el escalamiento de la centrífuga tubular continua.
      </p>
      <div style={styles.optionGrid}>
        {centrifugeModeOptions.map((option) => (
          <button
            key={option.id}
            style={styles.optionCard}
            onClick={() => onSelectMode(option.id)}
          >
            <span style={styles.optionLabel}>{option.title}</span>
            <span style={styles.optionText}>{option.description}</span>
          </button>
        ))}
      </div>
    </SelectionShell>
  )
}

function BeadMillModeSelection({ onBack, onSelectMode }) {
  return (
    <SelectionShell>
      <button style={styles.backButton} onClick={onBack}>Volver</button>
      <h1 style={styles.title}>Modo de simulación Bead Mill</h1>
      <p style={styles.subtitle}>
        Selecciona cómo quieres plantear el escalamiento industrial del molino de perlas.
      </p>
      <div style={styles.optionGrid}>
        {beadMillModeOptions.map((option) => (
          <button
            key={option.id}
            style={styles.optionCard}
            onClick={() => onSelectMode(option.id)}
          >
            <span style={styles.optionLabel}>{option.title}</span>
            <span style={styles.optionText}>{option.description}</span>
          </button>
        ))}
      </div>
    </SelectionShell>
  )
}

function ScaleSelection({ onSelectScale }) {
  return (
    <SelectionShell>
      <h1 style={styles.title}>Selecciona la escala de operación</h1>
      <p style={styles.subtitle}>
        Elige el nivel de proceso para cargar las opciones disponibles.
      </p>
      <div style={styles.optionGrid}>
        <button style={styles.optionCard} onClick={() => onSelectScale('laboratorio')}>
          <span style={styles.optionLabel}>Escala Laboratorio</span>
          <span style={styles.optionText}>Ajuste de parámetros y simulación experimental.</span>
        </button>
        <button style={styles.optionCard} onClick={() => onSelectScale('industrial')}>
          <span style={styles.optionLabel}>Escala Industrial</span>
          <span style={styles.optionText}>Procesos escalados y operación industrial.</span>
        </button>
      </div>
    </SelectionShell>
  )
}

function ProcessSelection({ scale, onBack, onSelectProcess }) {
  const config = processOptions[scale]

  return (
    <SelectionShell>
      <button style={styles.backButton} onClick={onBack}>Volver</button>
      <h1 style={styles.title}>{config.title}</h1>
      <p style={styles.subtitle}>{config.subtitle}</p>
      <div style={styles.optionGrid}>
        {config.options.map((option) => (
          <button
            key={option.id}
            style={styles.optionCard}
            onClick={() => onSelectProcess(option.id)}
          >
            <span style={styles.optionLabel}>{option.title}</span>
            <span style={styles.optionText}>{option.description}</span>
            {!option.available && <span style={styles.pendingBadge}>Pendiente</span>}
          </button>
        ))}
      </div>
    </SelectionShell>
  )
}

function PlaceholderProcess({ scale, processId, onBack }) {
  const option = processOptions[scale].options.find((item) => item.id === processId)

  return (
    <SelectionShell>
      <button style={styles.backButton} onClick={onBack}>Volver</button>
      <h1 style={styles.title}>{option.title}</h1>
      <p style={styles.subtitle}>
        Esta sección ya quedó conectada al flujo de navegación. Falta integrar su simulador específico.
      </p>
    </SelectionShell>
  )
}

function App() {
  const [scale, setScale] = useState(null)
  const [processId, setProcessId] = useState(null)
  const [beadMillMode, setBeadMillMode] = useState(null)
  const [centrifugeMode, setCentrifugeMode] = useState(null)

  if (!scale) {
    return <ScaleSelection onSelectScale={(nextScale) => {
      setScale(nextScale)
      setProcessId(null)
      setBeadMillMode(null)
      setCentrifugeMode(null)
    }} />
  }

  if (!processId) {
    return (
      <ProcessSelection
        scale={scale}
        onBack={() => {
          setScale(null)
          setBeadMillMode(null)
          setCentrifugeMode(null)
        }}
        onSelectProcess={(nextProcessId) => {
          setProcessId(nextProcessId)
          setBeadMillMode(null)
          setCentrifugeMode(null)
        }}
      />
    )
  }

  if (scale === 'laboratorio' && processId === 'lab-bead-mill') {
    return (
      <>
        <button style={styles.floatingBackButton} onClick={() => setProcessId(null)}>
          Volver
        </button>
        <DigitalTwin />
      </>
    )
  }

  if (scale === 'laboratorio' && processId === 'lab-centrifugacion') {
    return <CentrifugationTwin onBack={() => setProcessId(null)} />
  }

  if (scale === 'industrial' && processId === 'industrial-bead-mill') {
    if (!beadMillMode) {
      return (
        <BeadMillModeSelection
          onBack={() => setProcessId(null)}
          onSelectMode={setBeadMillMode}
        />
      )
    }

    return <IndustrialBeadMillTwin fixedMode={beadMillMode} onBack={() => setBeadMillMode(null)} />
  }

  if (scale === 'industrial' && processId === 'industrial-centrifugacion') {
    if (!centrifugeMode) {
      return (
        <CentrifugeModeSelection
          onBack={() => setProcessId(null)}
          onSelectMode={setCentrifugeMode}
        />
      )
    }

    return <IndustrialTubularCentrifugeTwin fixedMode={centrifugeMode} onBack={() => setCentrifugeMode(null)} />
  }

  return (
    <PlaceholderProcess
      scale={scale}
      processId={processId}
      onBack={() => setProcessId(null)}
    />
  )
}

const styles = {
  shell: {
    minHeight: '100vh',
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #e8e0f0 0%, #f0e6f6 20%, #fce4ec 45%, #e3f2fd 70%, #ede7f6 100%)',
    color: '#1e1b2e',
    fontFamily: 'Inter, sans-serif',
  },
  orb1: { position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 70%)', top: '-10%', left: '-5%', filter: 'blur(80px)', animation: 'float-orb 20s ease-in-out infinite', pointerEvents: 'none', zIndex: 0 },
  orb2: { position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.12) 0%,transparent 70%)', bottom: '-15%', right: '-8%', filter: 'blur(90px)', animation: 'float-orb 25s ease-in-out infinite reverse', pointerEvents: 'none', zIndex: 0 },
  orb3: { position: 'fixed', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(59,130,246,0.10) 0%,transparent 70%)', top: '50%', left: '40%', filter: 'blur(60px)', animation: 'float-orb 18s ease-in-out infinite 5s', pointerEvents: 'none', zIndex: 0 },
  panel: {
    width: 'min(960px, 100%)',
    position: 'relative',
    zIndex: 1,
    padding: '40px clamp(20px, 5vw, 56px)',
    border: '1px solid rgba(255,255,255,0.70)',
    borderRadius: 18,
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 24px 80px rgba(30,27,46,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
  },
  kicker: {
    marginBottom: 12,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0,
    textTransform: 'uppercase',
    color: '#7c3aed',
  },
  title: {
    maxWidth: 680,
    fontSize: 'clamp(32px, 5vw, 56px)',
    lineHeight: 1.02,
    letterSpacing: 0,
    marginBottom: 14,
  },
  subtitle: {
    maxWidth: 620,
    fontSize: 17,
    lineHeight: 1.55,
    color: 'rgba(30,27,46,0.68)',
    marginBottom: 32,
  },
  optionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 16,
  },
  optionCard: {
    minHeight: 170,
    padding: 22,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 18,
    border: '1px solid rgba(255,255,255,0.70)',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(16px)',
    color: '#1e1b2e',
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    borderLeft: '3px solid #7c3aed',
  },
  optionLabel: {
    fontSize: 22,
    lineHeight: 1.15,
    fontWeight: 800,
  },
  optionText: {
    fontSize: 14,
    lineHeight: 1.45,
    color: 'rgba(30,27,46,0.62)',
  },
  backButton: {
    marginBottom: 24,
    padding: '8px 16px',
    border: '1px solid rgba(124,58,237,0.25)',
    borderRadius: 8,
    background: 'rgba(124,58,237,0.12)',
    backdropFilter: 'blur(12px)',
    color: '#7c3aed',
    fontFamily: '"JetBrains Mono", "Courier New", monospace',
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 600,
    cursor: 'pointer',
  },
  pendingBadge: {
    padding: '6px 9px',
    borderRadius: 999,
    background: 'rgba(124,58,237,0.1)',
    color: '#6d28d9',
    fontSize: 12,
    fontWeight: 800,
  },
  floatingBackButton: {
    position: 'fixed',
    top: 18,
    left: 18,
    zIndex: 50,
    padding: '10px 14px',
    border: '1px solid rgba(30,27,46,0.12)',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.9)',
    color: '#1e1b2e',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 12px 28px rgba(30,27,46,0.12)',
    backdropFilter: 'blur(14px)',
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
