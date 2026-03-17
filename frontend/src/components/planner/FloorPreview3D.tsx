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

/** Gap between planks in meters - simulates joint/expansion gap */
const PLANK_GAP = 0.004

function Plank({
  data,
  scale,
  roomWidth,
  roomHeight,
}: {
  data: PlankData
  scale: number
  roomWidth: number
  roomHeight: number
}) {
  const plankThickness = 0.008 * scale

  // Shrink plank by gap so joints are visible between planks
  const w = Math.max(0.001, data.length * scale - PLANK_GAP)
  const d = Math.max(0.001, data.width * scale - PLANK_GAP)
  const L = data.length * scale
  const W = data.width * scale

  const { boxGeo, edgesGeo, wasteBoxes } = useMemo(() => {
    const box = new THREE.BoxGeometry(w, plankThickness, d)
    const edges = new THREE.EdgesGeometry(box)

    // For cut planks: red boxes only for the waste (cut) sections
    // All coords in scaled units (data.x/roomWidth are meters; multiply by scale for 3D).
    // straight-h: length along local X, width along local Z. Room X=local X, room Y=local Z.
    // straight-v: length along local X (room Y), width along local Z (room X). Plank rotated 90°.
    const wasteBoxes: { size: [number, number, number]; pos: [number, number, number] }[] = []
    if (data.isCut && data.cutSides) {
      const hL = L / 2
      const hW = W / 2
      const yOff = plankThickness * 0.6
      const isVertical = Math.abs(data.rotation - Math.PI / 2) < 0.01
      const sx = data.x * scale
      const sy = data.y * scale
      const rW = roomWidth * scale
      const rH = roomHeight * scale

      if (isVertical) {
        // straight-v: room X = local Z, room Y = local X. cutSides left/right = room X, top/bottom = room Y
        if (data.cutSides.left) {
          const overlap = Math.max(0, hW - sx)
          if (overlap > 0.001) {
            wasteBoxes.push({
              size: [w, plankThickness * 0.5, overlap - PLANK_GAP],
              pos: [0, yOff, -hW + overlap / 2],
            })
          }
        }
        if (data.cutSides.right) {
          const overlap = Math.max(0, sx + hW - rW)
          if (overlap > 0.001) {
            wasteBoxes.push({
              size: [w, plankThickness * 0.5, overlap - PLANK_GAP],
              pos: [0, yOff, hW - overlap / 2],
            })
          }
        }
        if (data.cutSides.bottom) {
          const overlap = Math.max(0, hL - sy)
          if (overlap > 0.001) {
            wasteBoxes.push({
              size: [overlap - PLANK_GAP, plankThickness * 0.5, d],
              pos: [hL - overlap / 2, yOff, 0],
            })
          }
        }
        if (data.cutSides.top) {
          const overlap = Math.max(0, sy + hL - rH)
          if (overlap > 0.001) {
            wasteBoxes.push({
              size: [overlap - PLANK_GAP, plankThickness * 0.5, d],
              pos: [-hL + overlap / 2, yOff, 0],
            })
          }
        }
      } else {
        // straight-h: room X = local X, room Y = local Z
        if (data.cutSides.left) {
          const overlap = Math.max(0, hL - sx)
          if (overlap > 0.001) {
            wasteBoxes.push({
              size: [overlap - PLANK_GAP, plankThickness * 0.5, d],
              pos: [-hL + overlap / 2, yOff, 0],
            })
          }
        }
        if (data.cutSides.right) {
          const overlap = Math.max(0, sx + hL - rW)
          if (overlap > 0.001) {
            wasteBoxes.push({
              size: [overlap - PLANK_GAP, plankThickness * 0.5, d],
              pos: [hL - overlap / 2, yOff, 0],
            })
          }
        }
        if (data.cutSides.bottom) {
          const overlap = Math.max(0, hW - sy)
          if (overlap > 0.001) {
            wasteBoxes.push({
              size: [w, plankThickness * 0.5, overlap - PLANK_GAP],
              pos: [0, yOff, -hW + overlap / 2],
            })
          }
        }
        if (data.cutSides.top) {
          const overlap = Math.max(0, sy + hW - rH)
          if (overlap > 0.001) {
            wasteBoxes.push({
              size: [w, plankThickness * 0.5, overlap - PLANK_GAP],
              pos: [0, yOff, hW - overlap / 2],
            })
          }
        }
      }
    }

    return { boxGeo: box, edgesGeo: edges, wasteBoxes }
  }, [data, roomWidth, roomHeight, scale, plankThickness])

  const position: [number, number, number] = [
    data.x * scale - (roomWidth * scale) / 2,
    0,
    data.y * scale - (roomHeight * scale) / 2,
  ]

  const rotation: [number, number, number] = [0, data.rotation, 0]

  return (
    <group position={position} rotation={rotation}>
      {/* Main plank - always wood */}
      <mesh geometry={boxGeo} castShadow receiveShadow>
        <meshStandardMaterial
          color="#a08060"
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>
      {/* Red waste sections - raised to avoid z-fighting */}
      {data.isCut &&
        wasteBoxes.map((wb, i) => (
          <mesh
            key={i}
            position={wb.pos}
            renderOrder={1}
          >
            <boxGeometry
              args={[
                Math.max(0.001, wb.size[0]),
                Math.max(0.001, wb.size[1]),
                Math.max(0.001, wb.size[2]),
              ]}
            />
            <meshBasicMaterial color="#c44242" depthTest depthWrite />
          </mesh>
        ))}
      {/* Dark outline between planks - joint line */}
      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial color="#5a4a3a" />
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
  const scale = 1

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
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[roomWidth * scale, roomHeight * scale]} />
        <meshStandardMaterial
          color="#e8e4dc"
          roughness={0.9}
          metalness={0}
        />
      </mesh>


      {planks.map((p, i) => (
        <Plank
          key={i}
          data={p}
          scale={scale}
          roomWidth={roomWidth}
          roomHeight={roomHeight}
        />
      ))}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        screenSpacePanning
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
    () =>
      generatePlankLayout(
        roomWidth,
        roomHeight,
        m2PerBox,
        piecesPerBox,
        pattern
      ),
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
        gl={{ antialias: true, alpha: false }}
      >
        <Suspense
          fallback={
            <mesh>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#333" />
            </mesh>
          }
        >
          <FloorScene
            roomWidth={roomWidth}
            roomHeight={roomHeight}
            planks={planks}
          />
        </Suspense>
      </Canvas>

      {/* Legend overlay - pointer-events-none so it doesn't block 3D controls */}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex flex-wrap gap-3 rounded-lg bg-black/60 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded bg-[#a08060]" />
          Full planks: {fullCount}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded bg-[#c44242]" />
          Cut (waste): {cutCount}
        </span>
        <span className="text-white/60">• Drag to rotate • Right-drag to pan • Scroll to zoom</span>
      </div>
    </div>
  )
}
