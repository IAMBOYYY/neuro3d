import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ScrollControls, useScroll, Scroll } from '@react-three/drei'
import * as THREE from 'three'
import { SECTIONS } from './data/brainSections'
import './styles/global.css'

// ─── The Brain Mesh (Inline) ───────────────────────────────
function Brain({ state }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.5, 12)
    const pos = geo.attributes.position
    const orig = pos.array.slice()
    
    // Create gyri/sulci folds
    for (let i = 0; i < pos.count; i++) {
      const ox = orig[i * 3]
      const oy = orig[i * 3 + 1]
      const oz = orig[i * 3 + 2]
      const n = Math.sin(ox * 5) * Math.cos(oy * 5) * 0.08 + Math.sin(oz * 10) * 0.03
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz)
      pos.setXYZ(i, ox + (ox/len)*n, oy + (oy/len)*n, oz + (oz/len)*n)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.1
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial 
        color="#ff4488" 
        emissive="#ff4488" 
        emissiveIntensity={0.4}
        roughness={0.3} 
      />
    </mesh>
  )
}

// ─── Camera Rig (Inline) ───────────────────────────────────
function CameraRig({ scroll }) {
  const { camera } = useThree()
  const lookAt = useRef(new THREE.Vector3(0, 0, 0))

  useFrame(() => {
    if (!scroll) return
    const raw = scroll.offset * (SECTIONS.length - 1)
    const idx = Math.floor(raw)
    const frac = Math.min(raw - idx, 1)
    
    const cur = SECTIONS[Math.min(idx, SECTIONS.length - 1)]
    const nxt = SECTIONS[Math.min(idx + 1, SECTIONS.length - 1)]
    
    camera.position.x = THREE.MathUtils.lerp(cur.cameraPos[0], nxt.cameraPos[0], frac)
    camera.position.y = THREE.MathUtils.lerp(cur.cameraPos[1], nxt.cameraPos[1], frac)
    camera.position.z = THREE.MathUtils.lerp(cur.cameraPos[2], nxt.cameraPos[2], frac)
    
    lookAt.current.lerp(new THREE.Vector3(...cur.lookAt), 0.1)
    camera.lookAt(lookAt.current)
  })

  return null
}

// ─── Scene (Inline) ────────────────────────────────────────
function Scene() {
  const scroll = useScroll()
  const state = useRef({ activeRegion: null })
  
  useFrame(() => {
    if (!scroll) return
    const raw = scroll.offset * (SECTIONS.length - 1)
    
    const progressBar = document.getElementById('progress-indicator')
    if (progressBar) progressBar.style.width = `${scroll.offset * 100}%`
    
    const counter = document.getElementById('section-counter')
    if (counter) {
      const display = Math.min(Math.floor(raw) + 1, SECTIONS.length)
      counter.innerHTML = `<span>${String(display).padStart(2, '0')}</span> / ${String(SECTIONS.length).padStart(2, '0')}`
    }

    const sections = document.querySelectorAll('.section-content')
    sections.forEach((el, i) => {
      if (Math.abs(raw - i) < 0.45) el.classList.add('is-visible')
      else el.classList.remove('is-visible')
    })
  })

  return (
    <>
      <CameraRig scroll={scroll} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={2.0} color="#ffffff" />
      <pointLight position={[-5, -5, 5]} intensity={2.0} color="#6ee7d7" />
      <Brain state={state} />
    </>
  )
}

// ─── Overlay (Inline) ──────────────────────────────────────
function Overlay({ sections }) {
  return (
    <>
      <div className="nav-bar">
        <div className="brand"><span className="brand-dot" />Neuro3D</div>
        <div className="section-counter" id="section-counter">
          <span>01</span> / {String(sections.length).padStart(2, '0')}
        </div>
      </div>

      <Scroll html style={{ width: '100%' }}>
        <div className="scroll-overlay">
          {sections.map((section, i) => (
            <section
              key={section.id}
              className={`scroll-section scroll-section--${section.layout}`}
            >
              <div className="section-content">
                <div className="section-index">
                  {String(i).padStart(2, '0')} — {section.label}
                </div>
                <h2 className="section-title">
                  {section.title.main} <em>{section.title.accent}</em>
                </h2>
                <p className="section-subtitle">{section.subtitle}</p>
                <p className="section-body">{section.body}</p>
              </div>
            </section>
          ))}
        </div>
      </Scroll>
    </>
  )
}

// ─── Main App ──────────────────────────────────────────────
export default function App() {
  return (
    <div className="app">
      <Canvas
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 8] }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#0a0a0a' }}
      >
        <color attach="background" args={['#0a0a0a']} />
        <Suspense fallback={null}>
          <ScrollControls pages={SECTIONS.length} damping={0.25}>
            <Scene />
            <Overlay sections={SECTIONS} />
          </ScrollControls>
        </Suspense>
      </Canvas>

      <div className="vignette-overlay" />
      <div className="progress-indicator" id="progress-indicator" />
    </div>
  )
}
