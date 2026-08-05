import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Background particle field ──────────────────────────────
// Floating dust motes for depth and atmosphere. Drifts slowly,
// subtle parallax against camera movement.

export default function Particles({ count = 500 }) {
  const pointsRef = useRef()

  // Generate random positions within a sphere shell
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Distribute in a shell between radius 5 and 15
      const radius = 5 + Math.random() * 10
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = radius * Math.cos(phi)
    }
    return arr
  }, [count])

  // Per-particle size variation
  const sizes = useMemo(() => {
    const arr = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      arr[i] = Math.random() * 2 + 0.5
    }
    return arr
  }, [count])

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          // Gentle drift
          pos.x += sin(uTime * 0.3 + position.y * 2.0) * 0.15;
          pos.y += cos(uTime * 0.2 + position.x * 1.5) * 0.1;
          pos.z += sin(uTime * 0.15 + position.z) * 0.08;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = size * uPixelRatio * (30.0 / -mvPosition.z);

          vAlpha = 0.4 + sin(uTime + position.x * 5.0) * 0.3;
        }
      `,
      fragmentShader: `
        varying float vAlpha;

        void main() {
          // Circular point with soft falloff
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * vAlpha;
          vec3 color = mix(vec3(0.43, 0.91, 0.84), vec3(0.77, 0.55, 0.62), vAlpha);
          gl_FragColor = vec4(color, alpha * 0.5);
        }
      `,
    })
  }, [])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    material.uniforms.uTime.value += delta
    pointsRef.current.rotation.y += delta * 0.01
  })

  return (
    <points ref={pointsRef} material={material}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
    </points>
  )
}
