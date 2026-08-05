import React from 'react'
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'

export default function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.9}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.8}
      />
      <Vignette
        offset={0.25}
        darkness={0.9}
        blendFunction={BlendFunction.NORMAL}
        eskil={false}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.SCREEN}
        opacity={0.04}
      />
    </EffectComposer>
  )
}
