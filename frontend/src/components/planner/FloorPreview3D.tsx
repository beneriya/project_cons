import { useMemo, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { LayoutPattern } from '@/lib/plannerCalculations'
import { generatePlankLayout, type PlankData } from '@/lib/plannerCalculations'

interface FloorPreview3DProps {
  width: number
  height: number
  m2PerBox: number
  piecesPerBox: number
  pattern: LayoutPattern
  className?: string
}

const PLANK_GAP = 0.004
const PLANK_THICKNESS = 0.008

/**
 * Single plank rendered at full size.
 * Clipping is handled by Three.js clipping planes on the material,
 * so planks at edges are visually trimmed by the GPU.
 */
function Plank({
  data,
  roomWidth,
  roomHeight,
  clippingPlanes,
}: {
  data: PlankData
  roomWidth: number
  roomHeight: number
  clippingPlanes: THREE.Plane[]
}) {
  const w = Math.max(0.001, data.length - PLANK_GAP)
  const d = Math.max(0.001, data.width - PLANK_GAP)

  const { geo, edgesGeo } = useMemo(() => {
    const box = new THREE.BoxGeometry(w, PLANK_THICKNESS, d)
    const edges = new THREE.EdgesGeometry(box)
    return { geo: box, edgesGeo: edges }
  }, [w, d])

  const position: [number, number, number] = [
    data.x - roomWidth / 2,
    0,
    data.y - roomHeight / 2,
  ]

  return (
    <group position={position} rotation={[0, data.rotation, 0]}>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial
          color={data.isCut ? '#8b6848' : '#a08060'}
          roughness={0.7}
          metalness={0.05}
          clippingPlanes={clippingPlanes}
          clipShadows
        />
      </mesh>
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial color="#5a4a3a" clippingPlanes={clippingPlanes} />
      </lineSegments>
    </group>
  )
}

function FloorScene({
  roomWidth,
  roomHeight,
  planks,
}: {
  roomWidth: number
  roomHeight: number
  planks: PlankData[]
}) {
  // 4 clipping planes: one per wall, normals pointing inward
  const clippingPlanes = useMemo(() => {
    const hw = roomWidth / 2
    const hh = roomHeight / 2
    return [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), hw),   // left wall: x >= -hw
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), hw),   // right wall: x <= hw
      new THREE.Plane(new THREE.Vector3(0, 0, 1), hh),   // bottom wall: z >= -hh
      new THREE.Plane(new THREE.Vector3(0, 0, -1), hh),   // top wall: z <= hh
    ]
  }, [roomWidth, roomHeight])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-3, 4, -3]} intensity={0.4} />

      {/* Room boundary / subfloor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[roomWidth, roomHeight]} />
        <meshStandardMaterial color="#e8e4dc" roughness={0.9} metalness={0} />
      </mesh>

      {planks.map((p, i) => (
        <Plank
          key={i}
          data={p}
          roomWidth={roomWidth}
          roomHeight={roomHeight}
          clippingPlanes={clippingPlanes}
        />
      ))}

      <OrbitControls
        enablePan enableZoom enableRotate screenSpacePanning
        panSpeed={1.5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={3}
        maxDistance={25}
        target={[0, 0, 0]}
      />
    </>
  )
}

export function FloorPreview3D({
  width: roomWidth,
  height: roomHeight,
  m2PerBox,
  piecesPerBox,
  pattern,
  className = '',
}: FloorPreview3DProps) {
  const planks = useMemo(
    () => generatePlankLayout(roomWidth, roomHeight, m2PerBox, piecesPerBox, pattern),
    [roomWidth, roomHeight, m2PerBox, piecesPerBox, pattern]
  )

  const cutCount = planks.filter((p) => p.isCut).length
  const fullCount = planks.filter((p) => !p.isCut).length

  return (
    <div className={`relative flex min-h-[420px] w-full overflow-hidden rounded-xl bg-[#1a1a1f] ${className}`}>
      <Canvas
        camera={{
          position: [roomWidth * 0.6, roomWidth * 0.8, roomHeight * 0.6],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        shadows
        className="!absolute !inset-0 !h-full !w-full"
        gl={{ antialias: true, alpha: false, localClippingEnabled: true }}
      >
        <Suspense
          fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#333" /></mesh>}
        >
          <FloorScene roomWidth={roomWidth} roomHeight={roomHeight} planks={planks} />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap gap-3 rounded-lg bg-black/60 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded bg-[#a08060]" />
          Бүтэн: {fullCount}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded bg-[#8b6848]" />
          Тайрагдсан: {cutCount}
        </span>
        <span className="text-white/60">• Чирж эргүүлэх • Scroll томруулах</span>
      </div>
    </div>
  )
}
