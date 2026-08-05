import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Scroll-driven camera animation ─────────────────────────
// Smoothly interpolates camera position and lookAt target
// between section-defined waypoints based on scroll offset.

export default function CameraRig({ scroll, targets }) {
  const { camera } = useThree()
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0))
  const tempLookAt = useRef(new THREE.Vector3())

  const smoothstep = (t) => t * t * (3 - 2 * t)

  useFrame((_, delta) => {
    if (!scroll || !targets.length) return

    const raw = scroll.offset * (targets.length - 1)
    const idx = Math.floor(raw)
    const frac = smoothstep(Math.min(raw - idx, 1))

    const cur = targets[Math.min(idx, targets.length - 1)]
    const nxt = targets[Math.min(idx + 1, targets.length - 1)]

    if (!cur || !nxt) return

    // Interpolate camera position
    camera.position.lerpVectors(cur.position, nxt.position, frac)

    // Add subtle floating motion for organic feel
    const time = performance.now() * 0.001
    camera.position.x += Math.sin(time * 0.3) * 0.08
    camera.position.y += Math.cos(time * 0.4) * 0.05

    // Interpolate lookAt target
    tempLookAt.current.lerpVectors(cur.lookAt, nxt.lookAt, frac)
    lookAtRef.current.lerp(tempLookAt.current, 0.1)

    camera.lookAt(lookAtRef.current)
  })

  return null
}
