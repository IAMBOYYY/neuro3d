import React from 'react'
import { Sparkles } from '@react-three/drei'

// ─── Background particles using drei's Sparkles ─────────────
// Reliable, built-in, looks great with bloom.

export default function Particles({ count = 800 }) {
  return (
    <Sparkles
      count={count}
      scale={[20, 20, 20]}
      size={3}
      speed={0.3}
      opacity={0.5}
      color="#6ee7d7"
    />
  )
}
