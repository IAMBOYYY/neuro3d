import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import BrainModel from './BrainModel'
import { SECTIONS } from '../data/brainSections'

// ─── Particles (background dust) ────────────────────────────
function Particles() {
  const ref = useRef()

  const positions = useMemo(() => {
    const arr = new Float32Array(400 * 3)
    for (let i = 0; i < 400; i++) {
      const r = 6 + Math.random() * 12
      const t = Math.random() * Math.PI * 2
      const p = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(p) * Math.cos(t)
      arr[i * 3 + 1] = r * Math.sin(p) * Math.sin(t)
      arr[i * 3 + 2] = r * Math.cos(p)
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.008
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={400}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#6ee7d7"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ─── Scene ──────────────────────────────────────────────────
export default function Scene({ scrollRef }) {
  const { camera } = useThree()
  const state = useRef({
    cerebrumOpacity: 1.0,
    activeRegion: null,
  })
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0))
  const tempLookAt = useRef(new THREE.Vector3())

  const cameraTargets = useMemo(
    () =>
      SECTIONS.map((s) => ({
        position: new THREE.Vector3(...s.cameraPos),
        lookAt: new THREE.Vector3(...s.lookAt),
      })),
    []
  )

  const smoothstep = (t) => t * t * (3 - 2 * t)

  useFrame(() => {
    if (!scrollRef || !scrollRef.current) return

    const progress = scrollRef.current
    const raw = progress * (SECTIONS.length - 1)
    const idx = Math.floor(raw)
    const frac = smoothstep(Math.min(Math.max(raw - idx, 0), 1))

    const cur = SECTIONS[Math.min(idx, SECTIONS.length - 1)]
    const nxt = SECTIONS[Math.min(idx + 1, SECTIONS.length - 1)]

    // Lerp cerebrum opacity
    state.current.cerebrumOpacity = THREE.MathUtils.lerp(
      cur.cerebrumOpacity,
      nxt.cerebrumOpacity,
      frac
    )

    // Determine active region
    const curRegion = cur.activeRegion
    const nxtRegion = nxt.activeRegion
    state.current.activeRegion = frac > 0.5 ? nxtRegion : curRegion

    // Camera positioning
    const camTarget = cameraTargets[Math.min(idx, cameraTargets.length - 1)]
    const camNext = cameraTargets[Math.min(idx + 1, cameraTargets.length - 1)]

    if (camTarget && camNext) {
      camera.position.lerpVectors(camTarget.position, camNext.position, frac)

      // Subtle floating
      const time = performance.now() * 0.001
      camera.position.x += Math.sin(time * 0.3) * 0.06
      camera.position.y += Math.cos(time * 0.4) * 0.04

      // LookAt
      tempLookAt.current.lerpVectors(camTarget.lookAt, camNext.lookAt, frac)
      lookAtRef.current.lerp(tempLookAt.current, 0.08)
      camera.lookAt(lookAtRef.current)
    }
  })

  return (
    <>
      {/* Lighting — three-point setup */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 8, 6]} intensity={1.8} color="#ffffff" />
      <directionalLight position={[-5, 3, -4]} intensity={0.8} color="#6ee7d7" />
      <pointLight position={[0, -4, 4]} intensity={1.2} color="#c38d9e" />
      <pointLight position={[0, 5, 5]} intensity={0.8} color="#ffffff" />

      <Particles />
      <BrainModel state={state} />
    </>
  )
}
