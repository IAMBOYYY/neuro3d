import React, { useState, useEffect } from 'react'

// ─── Loading Screen ─────────────────────────────────────────
// Shows during initial shader compilation and asset prep.
// Monitors R3F's loading state via a simple timer fallback.

export default function Loader() {
  const [progress, setProgress] = useState(0)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let mounted = true

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            if (mounted) setHidden(true)
          }, 400)
          return 100
        }
        // Accelerating progress for perceived speed
        const increment = prev < 60 ? 3 : prev < 85 ? 2 : 1
        return Math.min(prev + increment, 100)
      })
    }, 40)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className={`loader ${hidden ? 'is-hidden' : ''}`}>
      <div className="loader-text">Initializing Neural Pathways</div>
      <div className="loader-bar">
        <div
          className="loader-bar-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="loader-percent">{progress}%</div>
    </div>
  )
}
