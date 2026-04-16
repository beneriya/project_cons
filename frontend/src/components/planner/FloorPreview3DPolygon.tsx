/**
 * 3D floor preview for multi-room polygon layouts.
 * Uses stencil buffer to clip planks to room polygon boundaries.
 */

import { useMemo, Suspense, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { LayoutPattern, PlankData } from '@/lib/plannerCalculations'
import type { Point, RoomData, Obstacle } from '@/lib/polygonRoom'
import { generatePolygonPlankLayout, polygonBounds, polygonArea } from '@/lib/polygonRoom'

interface FloorPreview3DPolygonProps {
  rooms: RoomData[]
  m2PerBox: number
  piecesPerBox: number
  className?: string
}

const PLANK_GAP = 0.004
const PLANK_THICKNESS = 0.008

/** Creates a THREE.Shape from polygon vertices, centered at offset */
function makeShape(vertices: Point[], offsetX: number, offsetZ: number): THREE.Shape {
  const s = new THREE.Shape()
  if (vertices.length < 3) return s
  s.moveTo(vertices[0].x - offsetX, vertices[0].y - offsetZ)
  for (let i = 1; i < vertices.length; i++) {
    s.lineTo(vertices[i].x - offsetX, vertices[i].y - offsetZ)
  }
  s.closePath()
  return s
}

/**
 * Renders a room's planks clipped to the room polygon using stencil buffer.
 * 1) Write room shape into stencil
 * 2) Render planks only where stencil == 1
 * 3) Clear stencil for this room
 */
function ClippedRoom({
  room,
  planks,
  offsetX,
  offsetZ,
  stencilRef,
}: {
  room: RoomData
  planks: PlankData[]
  offsetX: number
  offsetZ: number
  stencilRef: number
}) {
  const shape = useMemo(
    () => makeShape(room.vertices, offsetX, offsetZ),
    [room.vertices, offsetX, offsetZ]
  )
  const shapeGeo = useMemo(() => new THREE.ShapeGeometry(shape), [shape])

  // Stencil write material: writes stencilRef into stencil buffer, renders nothing visible
  const stencilWriteMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
        stencilWrite: true,
        stencilRef: stencilRef,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilZPass: THREE.ReplaceStencilOp,
      }),
    [stencilRef]
  )

  // Stencil clear material: resets stencil to 0 after planks are drawn
  const stencilClearMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        colorWrite: false,
        depthWrite: false,
        stencilWrite: true,
        stencilRef: 0,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilZPass: THREE.ReplaceStencilOp,
      }),
    []
  )

  return (
    <group>
      {/* Step 1: Write room shape into stencil — renderOrder ensures this goes first */}
      <mesh
        geometry={shapeGeo}
        material={stencilWriteMat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.005, 0]}
        renderOrder={stencilRef * 10}
      />

      {/* Step 2: Render planks — only where stencil == stencilRef */}
      {planks.map((p, i) => {
        const w = Math.max(0.001, p.length - PLANK_GAP)
        const d = Math.max(0.001, p.width - PLANK_GAP)
        return (
          <mesh
            key={i}
            position={[p.x - offsetX, 0, p.y - offsetZ]}
            rotation={[0, p.rotation, 0]}
            castShadow
            receiveShadow
            renderOrder={stencilRef * 10 + 1}
          >
            <boxGeometry args={[w, PLANK_THICKNESS, d]} />
            <meshStandardMaterial
              color={p.isCut ? '#8b6848' : '#a08060'}
              roughness={0.7}
              metalness={0.05}
              stencilWrite={false}
              stencilRef={stencilRef}
              stencilFunc={THREE.EqualStencilFunc}
            />
          </mesh>
        )
      })}

      {/* Step 3: Clear stencil for this room region */}
      <mesh
        geometry={shapeGeo}
        material={stencilClearMat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.005, 0]}
        renderOrder={stencilRef * 10 + 2}
      />

      {/* Subfloor visible underneath */}
      <mesh
        geometry={shapeGeo}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <meshStandardMaterial color="#e8e4dc" roughness={0.9} metalness={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Obstacles as raised gray boxes */}
      {(room.obstacles ?? []).map((obs) => {
        if (obs.vertices.length < 3) return null
        const obsBounds = polygonBounds(obs.vertices)
        const obsW = obsBounds.maxX - obsBounds.minX
        const obsH = obsBounds.maxY - obsBounds.minY
        const obsCx = (obsBounds.minX + obsBounds.maxX) / 2 - offsetX
        const obsCz = (obsBounds.minY + obsBounds.maxY) / 2 - offsetZ
        const height = 0.12
        return (
          <mesh key={obs.id} position={[obsCx, height / 2, obsCz]} castShadow renderOrder={stencilRef * 10 + 3}>
            <boxGeometry args={[obsW, height, obsH]} />
            <meshStandardMaterial color="#9ca3af" roughness={0.6} metalness={0.1} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Room walls */
function RoomWalls3D({ vertices, offsetX, offsetZ, color }: {
  vertices: Point[]; offsetX: number; offsetZ: number; color: string
}) {
  const wallHeight = 0.15
  const walls = useMemo(() => {
    return vertices.map((a, i) => {
      const b = vertices[(i + 1) % vertices.length]
      return {
        start: [a.x - offsetX, a.y - offsetZ] as [number, number],
        end: [b.x - offsetX, b.y - offsetZ] as [number, number],
      }
    })
  }, [vertices, offsetX, offsetZ])

  return (
    <group>
      {walls.map((wall, i) => {
        const dx = wall.end[0] - wall.start[0]
        const dy = wall.end[1] - wall.start[1]
        const len = Math.hypot(dx, dy)
        const mx = (wall.start[0] + wall.end[0]) / 2
        const my = (wall.start[1] + wall.end[1]) / 2
        const angle = Math.atan2(dy, dx)
        return (
          <mesh key={i} position={[mx, wallHeight / 2, my]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[len, wallHeight, 0.03]} />
            <meshStandardMaterial color={color} roughness={0.8} opacity={0.6} transparent />
          </mesh>
        )
      })}
    </group>
  )
}

function MultiRoomScene({ rooms, m2PerBox, piecesPerBox }: {
  rooms: RoomData[]; m2PerBox: number; piecesPerBox: number
}) {
  const allVerts = rooms.flatMap((r) => r.vertices)
  const allBounds = useMemo(() => {
    if (allVerts.length === 0) return { minX: 0, minY: 0, maxX: 10, maxY: 8 }
    return polygonBounds(allVerts)
  }, [allVerts])

  const centerX = (allBounds.minX + allBounds.maxX) / 2
  const centerZ = (allBounds.minY + allBounds.maxY) / 2

  const roomPlanks = useMemo(() => {
    return rooms
      .filter((r) => r.vertices.length >= 3)
      .map((room) => ({
        room,
        planks: generatePolygonPlankLayout(room.vertices, m2PerBox, piecesPerBox, room.pattern, room.obstacles ?? []),
      }))
  }, [rooms, m2PerBox, piecesPerBox])

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-far={50}
        shadow-camera-left={-15} shadow-camera-right={15}
        shadow-camera-top={15} shadow-camera-bottom={-15} />
      <directionalLight position={[-3, 4, -3]} intensity={0.4} />

      {roomPlanks.map(({ room, planks }, idx) => (
        <group key={room.id}>
          <ClippedRoom
            room={room}
            planks={planks}
            offsetX={centerX}
            offsetZ={centerZ}
            stencilRef={idx + 1}
          />
          <RoomWalls3D vertices={room.vertices} offsetX={centerX} offsetZ={centerZ} color={room.color} />
        </group>
      ))}

      <OrbitControls enablePan enableZoom enableRotate screenSpacePanning
        panSpeed={1.5} minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 2.2}
        minDistance={2} maxDistance={40} target={[0, 0, 0]} />
    </>
  )
}

export function FloorPreview3DPolygon({
  rooms,
  m2PerBox,
  piecesPerBox,
  className = '',
}: FloorPreview3DPolygonProps) {
  const allVerts = rooms.flatMap((r) => r.vertices)
  const allBounds = useMemo(() => {
    if (allVerts.length === 0) return { minX: 0, minY: 0, maxX: 10, maxY: 8 }
    return polygonBounds(allVerts)
  }, [allVerts])

  const totalW = allBounds.maxX - allBounds.minX
  const totalH = allBounds.maxY - allBounds.minY
  const maxDim = Math.max(totalW, totalH, 3)

  const allPlanks = useMemo(() => {
    return rooms
      .filter((r) => r.vertices.length >= 3)
      .flatMap((room) => generatePolygonPlankLayout(room.vertices, m2PerBox, piecesPerBox, room.pattern, room.obstacles ?? []))
  }, [rooms, m2PerBox, piecesPerBox])

  const cutCount = allPlanks.filter((p) => p.isCut).length
  const fullCount = allPlanks.filter((p) => !p.isCut).length
  const hasRooms = rooms.some((r) => r.vertices.length >= 3)

  if (!hasRooms) {
    return (
      <div className={`flex min-h-[420px] items-center justify-center rounded-xl bg-[#1a1a1f] ${className}`}>
        <p className="text-sm text-white/60">Өрөөний хэлбэрийг зурна уу (3+ цэг)</p>
      </div>
    )
  }

  return (
    <div className={`relative flex min-h-[420px] w-full overflow-hidden rounded-xl bg-[#1a1a1f] ${className}`}>
      <Canvas
        camera={{
          position: [maxDim * 0.6, maxDim * 0.8, maxDim * 0.6],
          fov: 45, near: 0.1, far: 100,
        }}
        shadows
        className="!absolute !inset-0 !h-full !w-full"
        gl={{ antialias: true, alpha: false, stencil: true }}
      >
        <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#333" /></mesh>}>
          <MultiRoomScene rooms={rooms} m2PerBox={m2PerBox} piecesPerBox={piecesPerBox} />
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
        <span className="ml-2 text-white/50">
          {rooms.filter((r) => r.vertices.length >= 3).length} өрөө
        </span>
        <span className="text-white/60">• Чирж эргүүлэх • Scroll томруулах</span>
      </div>
    </div>
  )
}
