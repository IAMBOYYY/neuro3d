import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshDistortMaterial, Float } from '@react-three/drei'
import * as THREE from 'three'

// ─── Region Glow (replaces shader-based glow) ──────────────
function RegionGlow({ position, color, regionName, state, radius = 0.6 }) {
  const matRef = useRef()

  useFrame(() => {
    if (!matRef.current) return
    const isActive = state.current.activeRegion === regionName
    const target = isActive ? 0.8 : 0.0
    matRef.current.opacity = THREE.MathUtils.lerp(
      matRef.current.opacity,
      target,
      0.06,
    )
  })

  return (
    <mesh position={position}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={2.5}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ─── Cerebrum ───────────────────────────────────────────────
function CerebrumMesh({ state }) {
  const meshRef = useRef()
  const matRef = useRef()

  const geometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(1.4, 20)
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.04

    if (matRef.current) {
      const targetOpacity = state.current.cerebrumOpacity
      matRef.current.opacity = THREE.MathUtils.lerp(
        matRef.current.opacity,
        targetOpacity,
        0.06,
      )
      matRef.current.transparent = targetOpacity < 0.99
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <MeshDistortMaterial
        ref={matRef}
        color="#c4a0a0"
        roughness={0.35}
        metalness={0.0}
        clearcoat={0.4}
        clearcoatRoughness={0.5}
        distort={0.35}
        speed={1.2}
        transparent
        opacity={1.0}
      />
    </mesh>
  )
}

// ─── Cerebellum ─────────────────────────────────────────────
function CerebellumMesh({ state }) {
  const meshRef = useRef()
  const matRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(0.55, 16)
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

    if (matRef.current) {
      const target = state.current.cerebrumOpacity * 0.9
      matRef.current.opacity = THREE.MathUtils.lerp(
        matRef.current.opacity,
        target,
        0.06,
      )
      matRef.current.transparent = target < 0.99
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -1.6, -0.3]}>
      <MeshDistortMaterial
        ref={matRef}
        color="#b08e8e"
        roughness={0.4}
        metalness={0.0}
        distort={0.45}
        speed={2.0}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

// ─── Brainstem ──────────────────────────────────────────────
function BrainstemMesh({ state }) {
  const meshRef = useRef()
  const matRef = useRef()

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
    if (matRef.current) {
      const target = state.current.cerebrumOpacity * 0.95
      matRef.current.opacity = THREE.MathUtils.lerp(
        matRef.current.opacity,
        target,
        0.06,
      )
      matRef.current.transparent = target < 0.99

      // Glow when brainstem section is active
      const isGlowing = state.current.activeRegion === 'brainstem'
      const glowTarget = isGlowing ? 0.8 : 0.0
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity || 0,
        glowTarget,
        0.06,
      )
    }
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, -2.2, -0.1]}
      rotation={[0.15, 0, 0]}
    >
      <meshStandardMaterial
        ref={matRef}
        color="#a08080"
        roughness={0.5}
        metalness={0.0}
        emissive="#6ee7d7"
        emissiveIntensity={0}
        transparent
        opacity={0.95}
      />
    </mesh>
  )
}

// ─── Corpus Callosum ────────────────────────────────────────
function CorpusCallosumMesh({ state }) {
  const meshRef = useRef()
  const matRef = useRef()

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

  useFrame((_, delta) => {
    if (!meshRef.current) return
    if (matRef.current) {
      const isCorpusActive = state.current.activeRegion === 'corpus'
      const cerebrumTransparent = state.current.cerebrumOpacity < 0.4

      const target = isCorpusActive
        ? 0.9
        : cerebrumTransparent
          ? 0.5
          : 0.15

      matRef.current.opacity = THREE.MathUtils.lerp(
        matRef.current.opacity,
        target,
        0.06,
      )

      const glowTarget = isCorpusActive ? 1.5 : 0.0
      matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        matRef.current.emissiveIntensity || 0,
        glowTarget,
        0.06,
      )
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        ref={matRef}
        color="#a78bfa"
        roughness={0.3}
        metalness={0.1}
        emissive="#a78bfa"
        emissiveIntensity={0}
        transparent
        opacity={0.15}
      />
    </mesh>
  )
}

// ─── Main Brain Model ───────────────────────────────────────
export default function BrainModel({ state }) {
  return (
    <group>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
        <CerebrumMesh state={state} />
      </Float>

      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
        <CerebellumMesh state={state} />
      </Float>

      <BrainstemMesh state={state} />
      <CorpusCallosumMesh state={state} />

      {/* Region glow markers */}
      <RegionGlow
        position={[0.85, 0.3, 0.6]}
        color="#7dd3fc"
        radius={0.7}
        regionName="prefrontal"
        state={state}
      />
      <RegionGlow
        position={[0, 0, 0]}
        color="#6ee7d7"
        radius={1.2}
        regionName="cerebrum"
        state={state}
      />
    </group>
  )
}
