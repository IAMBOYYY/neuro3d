import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import './styles/global.css'

function SpinningBox() {
  const ref = useRef()
  
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta
      ref.current.rotation.y += delta
    }
  })

  return (
    <mesh ref={ref}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="red" />
    </mesh>
  )
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={1} />
        <directionalLight position={[5, 5, 5]} intensity={2} />
        <SpinningBox />
      </Canvas>
    </div>
  )
}
