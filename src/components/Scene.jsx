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

// Shared state object — components read/write to sync highlight + opacity
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

  // Precompute camera targets from section data
  const cameraTargets = useMemo(
    () =>
      SECTIONS.map((s) => ({
        position: new THREE.Vector3(...s.cameraPos),
        lookAt: new THREE.Vector3(...s.lookAt),
      })),
    [],
  )

  // Region highlight data — which brain part glows per section
  const regionData = useMemo(() => {
    const regions = {
      cerebrum:   { center: new THREE.Vector3(0, 0, 0),       radius: 1.5, color: new THREE.Color('#6ee7d7') },
      prefrontal: { center: new THREE.Vector3(0.85, 0.3, 0.6),  radius: 0.8, color: new THREE.Color('#7dd3fc') },
      hippocampus:{ center: new THREE.Vector3(-0.55, -0.35, 0.2), radius: 0.5, color: new THREE.Color('#c38d9e') },
      amygdala:   { center: new THREE.Vector3(0.6, -0.45, 0.15), radius: 0.4, color: new THREE.Color('#e8a87c') },
      corpus:     { center: new THREE.Vector3(0, 0.1, 0),      radius: 0.7, color: new THREE.Color('#a78bfa') },
      brainstem:  { center: new THREE.Vector3(0, -1.5, 0),     radius: 0.6, color: new THREE.Color('#6ee7d7') },
    }
    return regions
  }, [])

  // Smoothstep easing
  const smoothstep = (t) => t * t * (3 - 2 * t)

  useFrame((delta) => {
    if (!scroll) return

    const raw = scroll.offset * (SECTIONS.length - 1) // 0 → N-1
    const idx = Math.floor(raw)
    const frac = smoothstep(raw - idx)

    const cur = SECTIONS[Math.min(idx, SECTIONS.length - 1)]
    const nxt = SECTIONS[Math.min(idx + 1, SECTIONS.length - 1)]

    // Lerp cerebrum opacity
    state.current.cerebrumOpacity = THREE.MathUtils.lerp(
      cur.cerebrumOpacity,
      nxt.cerebrumOpacity,
      frac,
    )

    // Determine active region
    const curRegion = cur.activeRegion
    const nxtRegion = nxt.activeRegion
    state.current.activeRegion = frac > 0.5 ? nxtRegion : curRegion
    state.current.activeIndex = Math.round(raw)

    // Active region center/radius/intensity
    if (curRegion && regionData[curRegion]) {
      const r = regionData[curRegion]
      state.current.activeCenter.copy(r.center)
      state.current.activeRadius = r.radius

      const targetIntensity = curRegion === state.current.activeRegion ? 1.0 : 0.0
      state.current.activeIntensity = THREE.MathUtils.lerp(
        state.current.activeIntensity,
        targetIntensity,
        0.08,
      )
    } else {
      state.current.activeIntensity = THREE.MathUtils.lerp(
        state.current.activeIntensity,
        0.0,
        0.08,
      )
    }

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
    updateOverlayVisibility(raw)
  })

  function updateOverlayVisibility(rawOffset) {
    const sections = document.querySelectorAll('.section-content')
    sections.forEach((el, i) => {
      const dist = Math.abs(rawOffset - i)
      if (dist < 0.45) {
        el.classList.add('is-visible')
      } else {
        el.classList.remove('is-visible')
      }
    })
  }

  return (
    <>
      <CameraRig scroll={scroll} targets={cameraTargets} />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 8, 6]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[-5, 3, -4]} intensity={0.4} color="#6ee7d7" />
      <pointLight position={[0, -3, 3]} intensity={0.5} color="#c38d9e" />

      <Particles count={800} />

      <BrainModel state={state} />
      <InternalStructures state={state} regionData={regionData} />

      <PostFX />
    </>
  )
}
