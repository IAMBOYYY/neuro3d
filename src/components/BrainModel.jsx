import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ═══════════════════════════════════════════════════════════
// PROCEDURAL HUMAN BRAIN GEOMETRY
// Generates a realistic brain with longitudinal fissure,
// central sulcus, curved gyri, and proper brain proportions.
// ═══════════════════════════════════════════════════════════

function createCerebrumGeometry() {
  const geo = new THREE.IcosahedronGeometry(1.5, 20)
  const pos = geo.attributes.position
  const orig = pos.array.slice()

  for (let i = 0; i < pos.count; i++) {
    const ox = orig[i * 3]
    const oy = orig[i * 3 + 1]
    const oz = orig[i * 3 + 2]

    // Normalize to unit sphere
    const len = Math.sqrt(ox * ox + oy * oy + oz * oz)
    const nx = ox / len
    const ny = oy / len
    const nz = oz / len

    // Spherical coordinates
    const theta = Math.atan2(nz, nx)
    const phi = Math.acos(Math.min(1, Math.max(-1, ny)))

    // ─── 1. LONGITUDINAL FISSURE ───
    // Deep groove splitting the two hemispheres
    const fissureSharpness = 11.0
    const fissureDepth = 0.16
    const fissureMask = Math.max(0, (ny + 0.4) / 1.4)
    const fissure = Math.exp(-(nx * nx) * fissureSharpness) * fissureMask * fissureDepth

    // ─── 2. CENTRAL SULCUS (of Rolando) ───
    // Runs across the top, about 40% from front
    const csPos = 0.45
    const csWidth = 0.05
    const csMask = Math.max(0, ny - 0.05)
    const centralSulcus = Math.exp(-((nz - csPos) * (nz - csPos)) / (csWidth * csWidth)) * csMask * 0.07

    // ─── 3. LATERAL SULCUS (Sylvian Fissure) ───
    // Separates temporal lobe on the sides
    const lsY = -0.05
    const lsMask = Math.exp(-((ny - lsY) * (ny - lsY)) / 0.04) *
                   Math.exp(-(nx * nx) / 0.35)
    const lateralSulcus = lsMask * 0.05

    // ─── 4. GYRI (Brain Wrinkles) ───
    // Multi-octave directional noise creating curved ridge patterns
    let gyri = 0

    // Primary folds — large curved arcs wrapping around
    gyri += Math.sin(phi * 5.0 + Math.sin(theta * 2.5) * 2.0) *
            Math.cos(theta * 3.0 + Math.sin(phi * 2.0) * 1.5) * 0.045

    // Secondary folds — medium detail
    gyri += Math.sin(theta * 6.5 + phi * 4.0 + Math.sin(theta * 1.5) * 1.8) *
            Math.cos(phi * 5.5 + theta * 2.5) * 0.025

    // Tertiary folds — fine detail
    gyri += Math.sin(theta * 12.0 + phi * 7.0 + Math.sin(phi * 3.0) * 1.2) * 0.013

    // Quaternary folds — ultra fine texture
    gyri += Math.sin(theta * 20.0 + phi * 13.0) * 0.007

    // Sharpen ridges — gyri peaks are sharp, sulci valleys are round
    gyri = Math.sign(gyri) * Math.pow(Math.abs(gyri), 0.6)

    // ─── 5. BRAIN SHAPE ───
    // Elongate front-to-back (Z axis)
    const zStretch = 1.30
    // Flatten top slightly
    const topFlatten = ny > 0 ? 0.88 : 0.96
    // Taper the front (frontal lobe is narrower)
    const frontalTaper = nz > 0.35 ? 1.0 - (nz - 0.35) * 0.22 : 1.0
    // Wider middle (parietal/temporal regions)
    const sideWidth = 1.0 + Math.max(0, 1 - Math.abs(ny) * 1.2) * 0.07

    // ─── COMBINE ALL ───
    const totalDisp = -fissure - centralSulcus - lateralSulcus + gyri
    const scale = 1.0 + totalDisp

    const fx = nx * scale * frontalTaper * sideWidth
    const fy = ny * scale * topFlatten
    const fz = nz * scale * zStretch * frontalTaper

    pos.setXYZ(i, fx, fy, fz)
  }

  geo.computeVertexNormals()
  return geo
}

// ─── Cerebellum ─────────────────────────────────────────────
function createCerebellumGeometry() {
  const geo = new THREE.IcosahedronGeometry(0.5, 14)
  const pos = geo.attributes.position
  const orig = pos.array.slice()

  for (let i = 0; i < pos.count; i++) {
    const ox = orig[i * 3]
    const oy = orig[i * 3 + 1]
    const oz = orig[i * 3 + 2]

    const len = Math.sqrt(ox * ox + oy * oy + oz * oz)
    const nx = ox / len
    const ny = oy / len
    const nz = oz / len

    // Cerebellum has very fine parallel folia
    let folia = 0
    folia += Math.sin(ny * 38.0) * 0.020
    folia += Math.sin(nx * 22.0 + nz * 18.0) * 0.010
    folia += Math.sin(nz * 45.0) * 0.005
    folia += Math.sin(nx * 60.0 + ny * 50.0) * 0.003

    // Sharpen
    folia = Math.sign(folia) * Math.pow(Math.abs(folia), 0.7)

    // Central vermis fissure
    const vermis = Math.exp(-Math.pow(nx * 10.0, 2)) * 0.025

    // Flatten and elongate
    const yScale = 0.62
    const zScale = 1.35

    const scale = 1.0 + folia - vermis
    pos.setXYZ(i, nx * scale, ny * scale * yScale, nz * scale * zScale)
  }

  geo.computeVertexNormals()
  return geo
}

// ─── Brainstem ──────────────────────────────────────────────
function createBrainstemGeometry() {
  const geo = new THREE.CylinderGeometry(0.22, 0.15, 1.3, 32, 16)
  const pos = geo.attributes.position

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)

    // Slight backward curve
    const newZ = z + Math.sin(y * 0.5) * 0.07

    // Surface texture
    const angle = Math.atan2(x, z)
    const texture = Math.sin(angle * 12.0 + y * 4.0) * 0.006 +
                    Math.sin(angle * 24.0) * 0.003

    const r = Math.sqrt(x * x + z * z)
    const newR = r + texture
    pos.setX(i, Math.sin(angle) * newR)
    pos.setZ(i, Math.cos(angle) * newZ + Math.sin(angle) * texture)
  }

  geo.computeVertexNormals()
  return geo
}

// ═══════════════════════════════════════════════════════════
// BRAIN COMPONENTS
// ═══════════════════════════════════════════════════════════

function Cerebrum({ state }) {
  const meshRef = useRef()
  const geometry = useMemo(() => createCerebrumGeometry(), [])
  const matRef = useRef()

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.05

    if (matRef.current) {
      const target = state.current.cerebrumOpacity
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, target, 0.05)
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        ref={matRef}
        color="#c9a0a0"
        roughness={0.55}
        metalness={0.05}
        emissive="#3a2222"
        emissiveIntensity={0.15}
        transparent
        opacity={1.0}
      />
    </mesh>
  )
}

function Cerebellum({ state }) {
  const meshRef = useRef()
  const geometry = useMemo(() => createCerebellumGeometry(), [])
  const matRef = useRef()

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += delta * 0.03

    if (matRef.current) {
      const target = state.current.cerebrumOpacity * 0.95
      matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, target, 0.05)
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={[0, -1.5, -0.5]}>
      <meshStandardMaterial
        ref={matRef}
        color="#b08e8e"
        roughness={0.5}
        metalness={0.05}
        emissive="#2a1818"
        emissiveIntensity={0.1}
        transparent
        opacity={0.95}
      />
    </mesh>
  )
}

function Brainstem({ state }) {
  const meshRef = useRef()
  const geometry = useMemo(() => createBrainstemGeometry(), [])
  const matRef = useRef()

  useFrame(() => {
    if (!matRef.current) return
    const isActive = state.current.activeRegion === 'brainstem'
    const targetGlow = isActive ? 0.8 : 0.1
    matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      matRef.current.emissiveIntensity, targetGlow, 0.06
    )
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, -2.1, -0.2]}
      rotation={[0.18, 0, 0]}
    >
      <meshStandardMaterial
        ref={matRef}
        color="#a08080"
        roughness={0.5}
        metalness={0.05}
        emissive="#6ee7d7"
        emissiveIntensity={0.1}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

function CorpusCallosum({ state }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.9, 0.15, 0),
      new THREE.Vector3(-0.4, 0.3, 0),
      new THREE.Vector3(0, 0.32, 0),
      new THREE.Vector3(0.4, 0.3, 0),
      new THREE.Vector3(0.9, 0.15, 0),
    ])
    return new THREE.TubeGeometry(curve, 64, 0.11, 16, false)
  }, [])

  const matRef = useRef()

  useFrame(() => {
    if (!matRef.current) return
    const isActive = state.current.activeRegion === 'corpus'
    const cerebrumTransparent = state.current.cerebrumOpacity < 0.4

    const targetOp = isActive ? 0.9 : cerebrumTransparent ? 0.5 : 0.15
    matRef.current.opacity = THREE.MathUtils.lerp(matRef.current.opacity, targetOp, 0.05)

    const targetGlow = isActive ? 1.2 : 0.05
    matRef.current.emissiveIntensity = THREE.MathUtils.lerp(
      matRef.current.emissiveIntensity, targetGlow, 0.06
    )
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial
        ref={matRef}
        color="#a78bfa"
        roughness={0.3}
        metalness={0.1}
        emissive="#a78bfa"
        emissiveIntensity={0.05}
        transparent
        opacity={0.15}
      />
    </mesh>
  )
}

// ─── Region Glow Spheres ────────────────────────────────────
function RegionGlow({ position, color, regionName, state, radius = 0.5 }) {
  const meshRef = useRef()

  useFrame(() => {
    if (!meshRef.current) return
    const isActive = state.current.activeRegion === regionName
    const mat = meshRef.current.material
    const target = isActive ? 0.6 : 0.0
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, target, 0.06)

    const scaleTarget = isActive ? 1.0 : 0.5
    const s = THREE.MathUtils.lerp(meshRef.current.scale.x, scaleTarget, 0.06)
    meshRef.current.scale.setScalar(s)
  })

  return (
    <mesh ref={meshRef} position={position} scale={0.5}>
      <sphereGeometry args={[radius, 24, 24]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  )
}

// ─── Internal Structures ────────────────────────────────────
function HippocampusMesh({ position, state }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.22, 24, 24)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      pos.setX(i, x * 1.8)
      pos.setY(i, pos.getY(i) + Math.sin(x * 2) * 0.08)
      pos.setZ(i, pos.getZ(i) * 0.6)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material
    const isActive = state.current.activeRegion === 'hippocampus'
    const showInternal = state.current.cerebrumOpacity < 0.3

    const targetOp = isActive ? 1.0 : showInternal ? 0.7 : 0.0
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOp, 0.05)

    const targetGlow = isActive ? 2.0 : showInternal ? 0.3 : 0.0
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow, 0.05)

    meshRef.current.rotation.y += delta * 0.2
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={position}>
      <meshStandardMaterial
        color="#c38d9e"
        emissive="#e8a87c"
        emissiveIntensity={0}
        roughness={0.3}
        metalness={0.1}
        transparent
        opacity={0}
      />
    </mesh>
  )
}

function AmygdalaMesh({ position, state }) {
  const meshRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(0.16, 20, 20)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) * 1.5)
      pos.setY(i, pos.getY(i) * 0.8)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const mat = meshRef.current.material
    const isActive = state.current.activeRegion === 'amygdala'
    const showInternal = state.current.cerebrumOpacity < 0.3

    const targetOp = isActive ? 1.0 : showInternal ? 0.7 : 0.0
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOp, 0.05)

    const targetGlow = isActive ? 2.0 : showInternal ? 0.3 : 0.0
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetGlow, 0.05)

    meshRef.current.rotation.y += delta * 0.15
  })

  return (
    <mesh ref={meshRef} geometry={geometry} position={position}>
      <meshStandardMaterial
        color="#e8a87c"
        emissive="#ff9466"
        emissiveIntensity={0}
        roughness={0.3}
        metalness={0.1}
        transparent
        opacity={0}
      />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN BRAIN MODEL
// ═══════════════════════════════════════════════════════════

export default function BrainModel({ state }) {
  return (
    <group>
      <Cerebrum state={state} />
      <Cerebellum state={state} />
      <Brainstem state={state} />
      <CorpusCallosum state={state} />

      {/* Internal structures — visible when cerebrum is transparent */}
      <HippocampusMesh position={[-0.55, -0.35, 0.15]} state={state} />
      <HippocampusMesh position={[0.55, -0.35, 0.15]} state={state} />
      <AmygdalaMesh position={[-0.6, -0.45, 0.45]} state={state} />
      <AmygdalaMesh position={[0.6, -0.45, 0.45]} state={state} />

      {/* Region glow markers */}
      <RegionGlow
        position={[0.85, 0.3, 0.6]}
        color="#7dd3fc"
        radius={0.6}
        regionName="prefrontal"
        state={state}
      />
      <RegionGlow
        position={[0, 0, 0]}
        color="#6ee7d7"
        radius={1.0}
        regionName="cerebrum"
        state={state}
      />
      <RegionGlow
        position={[-0.55, -0.35, 0.15]}
        color="#e8a87c"
        radius={0.4}
        regionName="hippocampus"
        state={state}
      />
      <RegionGlow
        position={[0.6, -0.45, 0.45]}
        color="#ff9466"
        radius={0.35}
        regionName="amygdala"
        state={state}
      />
      <RegionGlow
        position={[0, 0.2, 0]}
        color="#a78bfa"
        radius={0.5}
        regionName="corpus"
        state={state}
      />
      <RegionGlow
        position={[0, -1.8, 0]}
        color="#6ee7d7"
        radius={0.5}
        regionName="brainstem"
        state={state}
      />
    </group>
  )
}
