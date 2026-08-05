import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollControls } from '@react-three/drei'
import Scene from './components/Scene'
import Overlay from './components/Overlay'
import Loader from './components/Loader'
import { SECTIONS } from './data/brainSections'

export default function App() {
  return (
    <div className="app">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 8] }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <ScrollControls
            pages={SECTIONS.length}
            distance={1}
            damping={0.25}
            horizontal={false}
            infinite={false}
          >
            <Scene sectionCount={SECTIONS.length} />
            <Overlay sections={SECTIONS} />
          </ScrollControls>
        </Suspense>
      </Canvas>

      {/* CSS Vignette overlay */}
      <div className="vignette-overlay" />

      <Loader />
      <div className="progress-indicator" id="progress-indicator" />
    </div>
  )
}
