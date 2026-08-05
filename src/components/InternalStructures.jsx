import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createInternalMaterial } from '../shaders/brainShader'

// ─── Individual internal structure mesh ─────────────────────
function StructureMesh({ position, scale, color, glowColor, regionName, state, regionData }) {
  const meshRef = useRef()
  const material = useMemo(() => createInternalMaterial(), [])

  // Each internal structure uses a unique organic shape
  const geometry = useMemo(() => {
    // Seahorse-like shape for hippocampus, almond for amygdala
    if (regionName === 'hippocampus') {
      // Elongated curved shape
      const geo = new THREE.SphereGeometry(0.25, 32, 32)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const y = pos.getY(i)
        const z = pos.getZ(i)
        // Curve and elongate
        pos.setX(i, x * 1.8)
        pos.setY(i, y + Math.sin(x * 2) * 0.1)
        pos.setZ(i, z * 0.7)
      }
      geo.computeVertexNormals()
      return geo
    }

    if (regionName === 'amygdala') {
      // Almond shape
      const geo = new THREE.SphereGeometry(0.18, 24, 24)
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        pos.setX(i, x * 1.5)
        pos.setY(i, pos.getY(i) * 0.8)
      }
      geo.computeVertexNormals()
      return geo
    }

    return new THREE.SphereGeometry(0.2, 24, 24)
  }, [regionName])

  // Override material colors
  useMemo(() => {
    material.uniforms.uColor.value.set(color)
    material.uniforms.uGlowColor.value.set(glowColor)
  }, [material, color, glowColor])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material

    mat.uniforms.uTime.value += delta

    // Visibility: show when this region is active or when cerebrum is transparent
    const isActive = state.current.activeRegion === regionName
    const cerebrumTransparent = state.current.cerebrumOpacity < 0.3

    const targetOpacity = isActive ? 1.0 : cerebrumTransparent ? 0.5 : 0.0
    const targetGlow = isActive ? 1.0 : 0.1

    mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      mat.uniforms.uOpacity.value,
      targetOpacity,
      0.06,
    )
    mat.uniforms.uGlow.value = THREE.MathUtils.lerp(
      mat.uniforms.uGlow.value,
      targetGlow,
      0.06,
    )

    // Gentle float
    meshRef.current.position.y = position[1] + Math.sin(mat.uniforms.uTime.value * 0.8) * 0.02
    meshRef.current.rotation.y += delta * 0.15
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      scale={scale}
    />
  )
}

// ─── Mirrored pair (left + right hemisphere) ────────────────
function StructurePair({ leftPos, rightPos, ...props }) {
  return (
    <>
      <StructureMesh position={leftPos} {...props} />
      <StructureMesh position={rightPos} {...props} />
    </>
  )
}

// ─── All internal structures ────────────────────────────────
export default function InternalStructures({ state, regionData }) {
  return (
    <group>
      {/* Hippocampus — paired, deep in medial temporal lobe */}
      <StructurePair
        leftPos={[-0.55, -0.35, 0.2]}
        rightPos={[0.55, -0.35, 0.2]}
        scale={[1, 1, 1]}
        color="#c38d9e"
        glowColor="#e8a87c"
        regionName="hippocampus"
        state={state}
        regionData={regionData}
      />

      {/* Amygdala — paired, anterior to hippocampus */}
      <StructurePair
        leftPos={[-0.6, -0.45, 0.5]}
        rightPos={[0.6, -0.45, 0.5]}
        scale={[1, 1, 1]}
        color="#e8a87c"
        glowColor="#ff9466"
        regionName="amygdala"
        state={state}
        regionData={regionData}
      />

      {/* Prefrontal cortex marker — subtle glow sphere at front */}
      <StructureMesh
        position={[0.85, 0.3, 0.6]}
        scale={[1.2, 1, 0.8]}
        color="#7dd3fc"
        glowColor="#a5e0ff"
        regionName="prefrontal"
        state={state}
        regionData={regionData}
      />
    </group>
  )
}
