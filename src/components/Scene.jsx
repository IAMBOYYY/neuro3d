import React, { useRef, useMemo } from 'react'
import { useScroll } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import BrainModel from './BrainModel'
import InternalStructures from './InternalStructures'
import CameraRig from './CameraRig'
import PostFX from './PostFX'
import Particles from './Particles'
import { SECTIONS } from '../data/brainSections'

function createSectionState() {
  return {
    activeIndex: 0,
    cerebrumOpacity: 1.0,
    activeRegion: null,
    activeCenter: new THREE.Vector3(0, 0, 0),
    activeRadius: 1.0,
    activeIntensity: 0.0,
  }
}

export default function Scene({ sectionCount }) {
  const scroll = useScroll()
  const state = useRef(createSectionState())

  const cameraTargets = useMemo(
    () =>
      SECTIONS.map((s) => ({
        position: new THREE.Vector3(...s.cameraPos),
        lookAt: new THREE.Vector3(...s.lookAt),
      })),
    [],
  )

  const smoothstep = (t) => t * t * (3 - 2 * t)

  useFrame(() => {
    if (!scroll) return

    const raw = scroll.offset * (SECTIONS.length - 1)
    const idx = Math.floor(raw)
    const frac = smoothstep(Math.min(raw - idx, 1))

    const cur = SECTIONS[Math.min(idx, SECTIONS.length - 1)]
    const nxt = SECTIONS[Math.min(idx + 1, SECTIONS.length - 1)]

    state.current.cerebrumOpacity = THREE.MathUtils.lerp(
      cur.cerebrumOpacity,
      nxt.cerebrumOpacity,
      frac,
    )

    const curRegion = cur.activeRegion
    const nxtRegion = nxt.activeRegion
    state.current.activeRegion = frac > 0.5 ? nxtRegion : curRegion
    state.current.activeIndex = Math.round(raw)

    // Update progress bar
    const progressBar = document.getElementById('progress-indicator')
    if (progressBar) {
      progressBar.style.width = `${scroll.offset * 100}%`
    }

    // Update section counter
    const counter = document.getElementById('section-counter')
    if (counter) {
      const display = Math.min(idx + 1, SECTIONS.length)
      counter.innerHTML = `<span>${String(display).padStart(2, '0')}</span> / ${String(SECTIONS.length).padStart(2, '0')}`
    }

    // Update overlay visibility
    const sections = document.querySelectorAll('.section-content')
    sections.forEach((el, i) => {
      const dist = Math.abs(raw - i)
      if (dist < 0.45) {
        el.classList.add('is-visible')
      } else {
        el.classList.remove('is-visible')
      }
    })
  })

  return (
    <>
      <CameraRig scroll={scroll} targets={cameraTargets} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 6]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 3, -4]} intensity={0.6} color="#6ee7d7" />
      <pointLight position={[0, -3, 3]} intensity={0.8} color="#c38d9e" />
      <spotLight
        position={[0, 5, 5]}
        angle={0.5}
        penumbra={1}
        intensity={1.0}
        color="#ffffff"
      />

      <Particles count={600} />

      <BrainModel state={state} />
      <InternalStructures state={state} regionData={{}} />

      <PostFX />
    </>
  )
}
