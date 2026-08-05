import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createBrainMaterial } from '../shaders/brainShader'

// ─── Cerebrum: large displaced icosphere ────────────────────
function CerebrumMesh({ state }) {
  const meshRef = useRef()
  const material = useMemo(() => createBrainMaterial(), [])

  // High-detail icosphere for smooth gyri displacement
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.4, 64) // detail 64 = lots of verts
    // Store original positions for shader reference
    const positions = geo.attributes.position
    geo.setAttribute('originalPosition', positions.clone())
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Slow rotation for life
    meshRef.current.rotation.y += delta * 0.05

    // Update shader uniforms
    const mat = meshRef.current.material
    mat.uniforms.uTime.value += delta
    mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      mat.uniforms.uOpacity.value,
      state.current.cerebrumOpacity,
      0.06,
    )
    mat.uniforms.uActiveIntensity.value = state.current.activeIntensity
    mat.uniforms.uActiveCenter.value.copy(state.current.activeCenter)
    mat.uniforms.uActiveRadius.value = state.current.activeRadius
  })

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} />
  )
}

// ─── Cerebellum: smaller textured sphere at back-bottom ─────
function CerebellumMesh({ state }) {
  const meshRef = useRef()
  const material = useMemo(() => createBrainMaterial(), [])

  const geometry = useMemo(() => {
    // Slightly oblong for cerebellum shape
    const geo = new THREE.IcosahedronGeometry(0.55, 32)
    const positions = geo.attributes.position
    // Squash slightly
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      positions.setY(i, y * 0.7)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.03

    const mat = meshRef.current.material
    mat.uniforms.uTime.value += delta
    // Cerebellum fades with cerebrum
    mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      mat.uniforms.uOpacity.value,
      state.current.cerebrumOpacity * 0.9,
      0.06,
    )
    // Tighter gyri for cerebellum
    mat.uniforms.uGyriFrequency.value = 8.0
    mat.uniforms.uDisplacementScale.value = 0.04

    // Highlight when brainstem section is active
    mat.uniforms.uActiveIntensity.value =
      state.current.activeRegion === 'brainstem' ? state.current.activeIntensity * 0.5 : 0
  })

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} position={[0, -1.6, -0.3]} />
  )
}

// ─── Brainstem: tapered cylinder ────────────────────────────
function BrainstemMesh({ state }) {
  const meshRef = useRef()
  const material = useMemo(() => createBrainMaterial(), [])

  const geometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.18, 0.12, 1.2, 32, 16)
    // Slight curve
    const positions = geo.attributes.position
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      const z = positions.getZ(i)
      // Curve backward slightly
      positions.setZ(i, z + Math.sin(y * 0.8) * 0.08)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material
    mat.uniforms.uTime.value += delta
    mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      mat.uniforms.uOpacity.value,
      state.current.cerebrumOpacity * 0.95,
      0.06,
    )
    mat.uniforms.uGyriFrequency.value = 15.0
    mat.uniforms.uDisplacementScale.value = 0.015

    mat.uniforms.uActiveIntensity.value =
      state.current.activeRegion === 'brainstem' ? state.current.activeIntensity : 0
    mat.uniforms.uActiveCenter.value.set(0, 0, 0) // local space
    mat.uniforms.uActiveRadius.value = 2.0
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, -2.2, -0.1]}
      rotation={[0.15, 0, 0]}
    />
  )
}

// ─── Corpus Callosum: curved bridge between hemispheres ─────
function CorpusCallosumMesh({ state }) {
  const meshRef = useRef()
  const material = useMemo(() => createBrainMaterial(), [])

  const geometry = useMemo(() => {
    // Create a curved tube geometry
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.9, 0.15, 0),
      new THREE.Vector3(-0.4, 0.3, 0),
      new THREE.Vector3(0, 0.32, 0),
      new THREE.Vector3(0.4, 0.3, 0),
      new THREE.Vector3(0.9, 0.15, 0),
    ])
    const geo = new THREE.TubeGeometry(curve, 64, 0.12, 16, false)
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material
    mat.uniforms.uTime.value += delta

    // Corpus callosum visible when cerebrum is transparent
    const targetOpacity = state.current.activeRegion === 'corpus'
      ? 0.85
      : state.current.cerebrumOpacity < 0.4 ? 0.6 : 0.15

    mat.uniforms.uOpacity.value = THREE.MathUtils.lerp(
      mat.uniforms.uOpacity.value,
      targetOpacity,
      0.06,
    )
    mat.uniforms.uDisplacementScale.value = 0.01
    mat.uniforms.uGyriFrequency.value = 20.0
    mat.uniforms.uActiveIntensity.value = 0
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} />
}

// ─── Main Brain Model ───────────────────────────────────────
export default function BrainModel({ state }) {
  return (
    <group>
      <CerebrumMesh state={state} />
      <CerebellumMesh state={state} />
      <BrainstemMesh state={state} />
      <CorpusCallosumMesh state={state} />
    </group>
  )
}
