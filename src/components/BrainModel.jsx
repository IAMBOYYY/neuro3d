import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Cerebrum ───────────────────────────────────────────────
function CerebrumMesh({ state }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.4, 8)
    return geo
  }, [])

  // Store original positions for noise displacement
  const originalPositions = useMemo(() => {
    return geometry.attributes.position.array.slice()
  }, [geometry])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.04

    // Manual gyri/sulci displacement — no shader, just vertex manipulation
    const time = performance.now() * 0.0003
    const pos = meshRef.current.geometry.attributes.position
    const orig = originalPositions

    for (let i = 0; i < pos.count; i++) {
      const ox = orig[i * 3]
      const oy = orig[i * 3 + 1]
      const oz = orig[i * 3 + 2]

      // Layered noise approximation using sin waves
      const n1 = Math.sin(ox * 4 + time) * Math.cos(oy * 4 + time * 1.3) * 0.06
      const n2 = Math.sin(oy * 8 + time * 0.7) * Math.cos(oz * 8) * 0.03
      const n3 = Math.sin(oz * 12 + time * 0.5) * 0.015

      const displacement = n1 + n2 + n3
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz)

      pos.setXYZ(
        i,
        ox + (ox / len) * displacement,
        oy + (oy / len) * displacement,
        oz + (oz / len) * displacement,
      )
    }
    pos.needsUpdate = true
    meshRef.current.geometry.computeVertexNormals()
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#d4a5a0"
        roughness={0.35}
        metalness={0.05}
        emissive="#6ee7d7"
        emissiveIntensity={0.08}
        flatShading={false}
      />
    </mesh>
  )
}

// ─── Cerebellum ─────────────────────────────────────────────
function CerebellumMesh({ state }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.55, 6)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, pos.getY(i) * 0.7)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.03
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -1.6, -0.3]}>
      <meshStandardMaterial
        color="#b08e8e"
        roughness={0.4}
        metalness={0.05}
        emissive="#c38d9e"
        emissiveIntensity={0.05}
      />
    </mesh>
  )
}

// ─── Brainstem ──────────────────────────────────────────────
function BrainstemMesh({ state }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.2, 0.14, 1.2, 32, 16)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      pos.setZ(i, pos.getZ(i) + Math.sin(y * 0.8) * 0.08)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material
    const isGlowing = state.current.activeRegion === 'brainstem'
    const target = isGlowing ? 0.6 : 0.05
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      target,
      0.06,
    )
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, -2.2, -0.1]}
      rotation={[0.15, 0, 0]}
    >
      <meshStandardMaterial
        color="#a08080"
        roughness={0.5}
        metalness={0.05}
        emissive="#6ee7d7"
        emissiveIntensity={0.05}
      />
    </mesh>
  )
}

// ─── Corpus Callosum ────────────────────────────────────────
function CorpusCallosumMesh({ state }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.9, 0.15, 0),
      new THREE.Vector3(-0.4, 0.3, 0),
      new THREE.Vector3(0, 0.32, 0),
      new THREE.Vector3(0.4, 0.3, 0),
      new THREE.Vector3(0.9, 0.15, 0),
    ])
    return new THREE.TubeGeometry(curve, 64, 0.12, 16, false)
  }, [])

  useFrame(() => {
    if (!meshRef.current) return
    const mat = meshRef.current.material
    const isCorpusActive = state.current.activeRegion === 'corpus'
    const target = isCorpusActive ? 1.5 : 0.1
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      target,
      0.06,
    )
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        color="#a78bfa"
        roughness={0.3}
        metalness={0.1}
        emissive="#a78bfa"
        emissiveIntensity={0.1}
      />
    </mesh>
  )
}

// ─── Region Glow Spheres ────────────────────────────────────
function RegionGlow({ position, color, regionName, state, radius = 0.5 }) {
  const meshRef = useRef()

  useFrame(() => {
    if (!meshRef.current) return
    const isActive = state.current.activeRegion === regionName
    const target = isActive ? 0.7 : 0.0
    meshRef.current.scale.setScalar(
      THREE.MathUtils.lerp(meshRef.current.scale.x, isActive ? 1.0 : 0.5, 0.06),
    )
    const mat = meshRef.current.material
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, target, 0.06)
  })

  return (
    <mesh ref={meshRef} position={position} scale={0.5}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  )
}

// ─── Main Brain Model ───────────────────────────────────────
export default function BrainModel({ state }) {
  return (
    <group>
      <CerebrumMesh state={state} />
      <CerebellumMesh state={state} />
      <BrainstemMesh state={state} />
      <CorpusCallosumMesh state={state} />

      {/* Region glow markers */}
      <RegionGlow
        position={[0.85, 0.3, 0.6]}
        color="#7dd3fc"
        radius={0.6}
        regionName="prefrontal"
        state={state}
      />
      <RegionGlow
        position={[0, 0, 0]}
        color="#6ee7d7"
        radius={1.0}
        regionName="cerebrum"
        state={state}
      />
    </group>
  )
}
