import React from 'react'
import { Scroll } from '@react-three/drei'

// ─── HTML Overlay ───────────────────────────────────────────
// Renders text content that scrolls in sync with 3D scene.
// Each section corresponds to one scroll page.

export default function Overlay({ sections }) {
  return (
    <>
      {/* Fixed nav bar */}
      <div className="nav-bar">
        <div className="brand">
          <span className="brand-dot" />
          Neuro3D
        </div>
        <div className="section-counter" id="section-counter">
          <span>01</span> / {String(sections.length).padStart(2, '0')}
        </div>
      </div>

      {/* Scrolling content */}
      <Scroll html style={{ width: '100%' }}>
        <div className="scroll-overlay">
          {sections.map((section, i) => {
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
      </Scroll>
    </>
  )
}
