import React, { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Scene from './components/Scene'
import { SECTIONS } from './data/brainSections'
import './styles/global.css'

// ─── Loader ─────────────────────────────────────────────────
function Loader() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setHidden(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`loader ${hidden ? 'is-hidden' : ''}`}>
      <div className="loader-text">Initializing Neural Pathways</div>
      <div className="loader-spinner" />
    </div>
  )
}

// ─── Main App ───────────────────────────────────────────────
export default function App() {
  const scrollRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? window.scrollY / max : 0
      scrollRef.current = progress

      // Progress bar
      const progressBar = document.getElementById('progress-indicator')
      if (progressBar) {
        progressBar.style.width = `${progress * 100}%`
      }

      // Section counter
      const counter = document.getElementById('section-counter')
      if (counter) {
        const raw = progress * (SECTIONS.length - 1)
        const display = Math.min(Math.floor(raw) + 1, SECTIONS.length)
        counter.innerHTML = `<span>${String(display).padStart(2, '0')}</span> / ${String(SECTIONS.length).padStart(2, '0')}`
      }

      // Section visibility
      const raw = progress * (SECTIONS.length - 1)
      const sections = document.querySelectorAll('.section-content')
      sections.forEach((el, i) => {
        if (Math.abs(raw - i) < 0.4) {
          el.classList.add('is-visible')
        } else {
          el.classList.remove('is-visible')
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="app">
      {/* Fixed 3D Canvas */}
      <div className="canvas-fixed">
        <Canvas
          camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0.5, 7] }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene scrollRef={scrollRef} />
          </Suspense>
        </Canvas>
      </div>

      {/* Vignette overlay */}
      <div className="vignette-overlay" />

      {/* Nav bar */}
      <div className="nav-bar">
        <div className="brand">
          <span className="brand-dot" />
          Neuro3D
        </div>
        <div className="section-counter" id="section-counter">
          <span>01</span> / {String(SECTIONS.length).padStart(2, '0')}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="content-scroll">
        {SECTIONS.map((section, i) => {
          if (section.isHero) {
            return (
              <section
                key={section.id}
                className="scroll-section scroll-section--center hero-section"
              >
                <div className="section-content">
                  <h1 className="hero-title">
                    {section.title.main}
                    <span>{section.title.accent}</span>
                  </h1>
                  <p className="hero-subtitle">{section.subtitle}</p>
                </div>
                <div className="scroll-hint">Scroll to explore</div>
              </section>
            )
          }

          return (
            <section
              key={section.id}
              className={`scroll-section scroll-section--${section.layout}`}
            >
              <div className="section-content">
                <div className="section-index">
                  {String(i).padStart(2, '0')} — {section.label}
                </div>
                <h2 className="section-title">
                  {section.title.main} <em>{section.title.accent}</em>
                </h2>
                <p className="section-subtitle">{section.subtitle}</p>
                <p className="section-body">{section.body}</p>
                {section.facts.length > 0 && (
                  <div className="section-facts">
                    {section.facts.map((fact, j) => (
                      <div key={j} className="fact">{fact}</div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="progress-indicator" id="progress-indicator" />

      {/* Loader */}
      <Loader />
    </div>
  )
}
