import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function StructureMesh({ position, scale, color, emissive, regionName, state }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    if (regionName === 'hippocampus') {
      const geo = new THREE.SphereGeometry(0.25, 24, 24)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        pos.setX(i, x * 1.8)
        pos.setY(i, pos.getY(i) + Math.sin(x * 2) * 0.1)
        pos.setZ(i, pos.getZ(i) * 0.7)
      }
      geo.computeVertexNormals()
      return geo
    }

    if (regionName === 'amygdala') {
      const geo = new THREE.SphereGeometry(0.18, 20, 20)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) * 1.5)
        pos.setY(i, pos.getY(i) * 0.8)
      }
      geo.computeVertexNormals()
      return geo
    }

    return new THREE.SphereGeometry(0.2, 20, 20)
  }, [regionName])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material

    const isActive = state.current.activeRegion === regionName
    const cerebrumTransparent = state.current.cerebrumOpacity < 0.3

    // Visibility via emissive intensity, not opacity
    const targetGlow = isActive ? 2.0 : cerebrumTransparent ? 0.4 : 0.0
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      targetGlow,
      0.06,
    )

    // Opacity only for fade in/out
    const targetOpacity = isActive ? 1.0 : cerebrumTransparent ? 0.7 : 0.0
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.06)

    meshRef.current.rotation.y += delta * 0.15
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} scale={scale}>
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0}
        roughness={0.3}
        metalness={0.1}
        transparent
        opacity={0}
      />
    </mesh>
  )
}

export default function InternalStructures({ state }) {
  return (
    <group>
      {/* Hippocampus — paired */}
      <StructureMesh
        position={[-0.55, -0.35, 0.2]}
        scale={[1, 1, 1]}
        color="#c38d9e"
        emissive="#e8a87c"
        regionName="hippocampus"
        state={state}
      />
      <StructureMesh
        position={[0.55, -0.35, 0.2]}
        scale={[1, 1, 1]}
        color="#c38d9e"
        emissive="#e8a87c"
        regionName="hippocampus"
        state={state}
      />

      {/* Amygdala — paired */}
      <StructureMesh
        position={[-0.6, -0.45, 0.5]}
        scale={[1, 1, 1]}
        color="#e8a87c"
        emissive="#ff9466"
        regionName="amygdala"
        state={state}
      />
      <StructureMesh
        position={[0.6, -0.45, 0.5]}
        scale={[1, 1, 1]}
        color="#e8a87c"
        emissive="#ff9466"
        regionName="amygdala"
        state={state}
      />
    </group>
  )
}
