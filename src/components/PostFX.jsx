import React from 'react'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

// ─── Post-processing stack ──────────────────────────────────
// Bloom: soft glow on bright regions (brain highlights, particles)
// Vignette: darkened edges for cinematic framing
// Noise: subtle film grain for organic texture

export default function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.8}
        luminanceThreshold={0.35}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.7}
      />
      <Vignette
        offset={0.3}
        darkness={0.85}
        blendFunction={BlendFunction.NORMAL}
        eskil={false}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.SCREEN}
        opacity={0.035}
      />
    </EffectComposer>
  )
}
