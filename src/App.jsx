import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import './styles/global.css'

function Brain() {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.5, 12)
    const pos = geo.attributes.position
    const orig = pos.array.slice()

    for (let i = 0; i < pos.count; i++) {
      const ox = orig[i * 3]
      const oy = orig[i * 3 + 1]
      const oz = orig[i * 3 + 2]
      const n = Math.sin(ox * 5) * Math.cos(oy * 5) * 0.08 + Math.sin(oz * 10) * 0.03
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz)
      pos.setXYZ(i, ox + (ox / len) * n, oy + (oy / len) * n, oz + (oz / len) * n)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1
    }
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

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={2.0} color="#ffffff" />
        <pointLight position={[-5, -5, 5]} intensity={2.0} color="#6ee7d7" />
        <Brain />
      </Canvas>
    </div>
  )
        }
