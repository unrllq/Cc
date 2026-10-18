"use client"

/*
 * R3F Macro Keypad — integrated from the provided prompt.
 * Changes vs. original:
 *  - "use client" (Next.js App Router; the Canvas is browser-only)
 *  - root className is merged with cn() so callers can resize the pad
 *  - optional `activeId` prop keeps one key glowing as "selected"
 *  - camera zoom fits the pad to its container (original: fixed zoom 50,
 *    which is close to this fit at the default 42rem × 16rem size)
 */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react"
import { ContactShadows, RoundedBox } from "@react-three/drei"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  MathUtils,
  SRGBColorSpace,
  Vector3,
  type Group,
  type PointLight,
} from "three"

import { cn } from "@/lib/utils"

export type MacroKey = {
  accentColor?: string
  disabled?: boolean
  id: string
  keycapColor?: string
  label: string
  legend: string
}

export type R3FMacroKeypadProps = {
  activeId?: string | null
  className?: string
  housingTint?: string
  keys?: readonly MacroKey[]
  onKeyPress?: (id: string) => void
}

function tryCapturePointer(element: HTMLElement, pointerId: number) {
  try {
    element.setPointerCapture(pointerId)
  } catch {
    // Synthetic events and some embedded webviews do not expose pointer capture.
  }
}

const defaultKeys: readonly MacroKey[] = [
  {
    accentColor: "#fb7185",
    id: "cancel",
    keycapColor: "#fecdd3",
    label: "Cancel",
    legend: "CANCEL",
  },
  {
    accentColor: "#60a5fa",
    id: "submit",
    keycapColor: "#bfdbfe",
    label: "Submit",
    legend: "SUBMIT",
  },
  {
    accentColor: "#4ade80",
    id: "run",
    keycapColor: "#bbf7d0",
    label: "Run",
    legend: "RUN",
  },
  {
    accentColor: "#fbbf24",
    id: "action",
    keycapColor: "#fde68a",
    label: "Action",
    legend: "ACTION",
  },
]

function createKeycapGeometry() {
  const segments = 32
  const exponent = 5
  const rings = [
    { depth: 0.68, width: 0.68, y: -0.45 },
    { depth: 0.72, width: 0.72, y: -0.36 },
    { depth: 0.61, width: 0.61, y: 0.33 },
    { depth: 0.56, width: 0.56, y: 0.43 },
    { depth: 0.4, width: 0.4, y: 0.43 },
  ]
  const positions: number[] = []
  const indices: number[] = []

  rings.forEach((ring) => {
    for (let index = 0; index < segments; index += 1) {
      const angle = (index / segments) * Math.PI * 2
      const cosine = Math.cos(angle)
      const sine = Math.sin(angle)
      positions.push(
        Math.sign(cosine) *
          ring.width *
          Math.pow(Math.abs(cosine), 2 / exponent),
        ring.y,
        Math.sign(sine) * ring.depth * Math.pow(Math.abs(sine), 2 / exponent)
      )
    }
  })

  for (let ringIndex = 0; ringIndex < 3; ringIndex += 1) {
    const lowerStart = ringIndex * segments
    const upperStart = (ringIndex + 1) * segments
    for (let index = 0; index < segments; index += 1) {
      const next = (index + 1) % segments
      const lower = lowerStart + index
      const lowerNext = lowerStart + next
      const upper = upperStart + index
      const upperNext = upperStart + next
      indices.push(lower, upper, lowerNext, lowerNext, upper, upperNext)
    }
  }

  const outerStart = 3 * segments
  const dishStart = 4 * segments
  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments
    const outer = outerStart + index
    const outerNext = outerStart + next
    const inner = dishStart + index
    const innerNext = dishStart + next
    indices.push(outer, inner, outerNext, outerNext, inner, innerNext)
  }

  const dishCenter = positions.length / 3
  positions.push(0, 0.36, 0)
  for (let index = 0; index < segments; index += 1) {
    indices.push(
      dishStart + index,
      dishCenter,
      dishStart + ((index + 1) % segments)
    )
  }

  const bottomCenter = positions.length / 3
  positions.push(0, -0.45, 0)
  for (let index = 0; index < segments; index += 1) {
    indices.push(bottomCenter, index, (index + 1) % segments)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

type KeyUnitProps = {
  active: boolean
  focused: boolean
  geometry: BufferGeometry
  hovered: boolean
  item: MacroKey
  positionX: number
  reduceMotion: boolean
  selected: boolean
}

function KeyUnit({
  active,
  focused,
  geometry,
  hovered,
  item,
  positionX,
  reduceMotion,
  selected,
}: KeyUnitProps) {
  const keycap = useRef<Group>(null)
  const glow = useRef<PointLight>(null)
  const velocity = useRef(0)
  const { gl } = useThree()
  const accent = item.accentColor ?? "#67e8f9"
  const lit = hovered || focused || selected
  const keycapColor = item.disabled
    ? "#a8adb2"
    : (item.keycapColor ?? "#f1f0eb")
  const legendTexture = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 160

    const context = canvas.getContext("2d")
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.fillStyle = item.disabled ? "#4b535b" : "#111820"
      context.font =
        "800 96px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
      context.textAlign = "center"
      context.textBaseline = "middle"
      context.fillText(item.legend.toUpperCase(), canvas.width / 2, 84)
    }

    const texture = new CanvasTexture(canvas)
    texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
    texture.colorSpace = SRGBColorSpace
    return texture
  }, [gl, item.disabled, item.legend])

  useEffect(() => () => legendTexture.dispose(), [legendTexture])

  useFrame((_, frameDelta) => {
    if (!keycap.current || !glow.current) return
    const delta = Math.min(frameDelta, 0.04)
    const target = active ? 0.39 : selected ? 0.5 : hovered || focused ? 0.61 : 0.56

    if (reduceMotion || item.disabled) {
      keycap.current.position.y = target
      velocity.current = 0
    } else {
      velocity.current +=
        (target - keycap.current.position.y) * (active ? 260 : 175) * delta
      velocity.current *= Math.exp(-(active ? 24 : 15) * delta)
      keycap.current.position.y += velocity.current * delta
    }

    glow.current.intensity = MathUtils.damp(
      glow.current.intensity,
      item.disabled ? 0 : active ? 7 : selected ? 4 : lit ? 2.6 : 0.25,
      18,
      delta
    )
  })

  return (
    <group position={[positionX, 0, 0]}>
      <RoundedBox
        args={[0.58, 0.2, 0.58]}
        position={[0, -0.1, 0]}
        radius={0.08}
        smoothness={5}
      >
        <meshStandardMaterial
          color={item.disabled ? "#b7bab8" : "#e8eff0"}
          metalness={0.02}
          roughness={0.36}
        />
      </RoundedBox>

      <RoundedBox
        args={[0.24, 0.06, 0.035]}
        position={[0, -0.4, 1.035]}
        radius={0.025}
        smoothness={3}
      >
        <meshStandardMaterial
          color={item.disabled ? "#a8aaa7" : accent}
          emissive={item.disabled ? "#000000" : accent}
          emissiveIntensity={
            item.disabled ? 0 : active ? 5 : selected ? 4 : lit ? 2.6 : 1.2
          }
          toneMapped={false}
        />
      </RoundedBox>

      <pointLight
        color={accent}
        distance={2.4}
        intensity={0.25}
        position={[0, -0.3, 0.88]}
        ref={glow}
      />

      <group position={[0, 0.56, 0]} ref={keycap}>
        <mesh castShadow geometry={geometry}>
          <meshPhysicalMaterial
            clearcoat={0.18}
            clearcoatRoughness={0.58}
            color={keycapColor}
            metalness={0.02}
            roughness={0.6}
          />
        </mesh>
        <mesh position={[0, 0.442, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.02, 0.34]} />
          <meshBasicMaterial
            depthWrite={false}
            map={legendTexture}
            polygonOffset
            polygonOffsetFactor={-2}
            toneMapped={false}
            transparent
          />
        </mesh>
      </group>
    </group>
  )
}

type MacroPadSceneProps = {
  activeIds: ReadonlySet<string>
  buttonRefs: { current: Array<HTMLButtonElement | null> }
  dragRotation: { current: { x: number; y: number } }
  dragging: boolean
  focusedId: string | null
  hoveredId: string | null
  housingTint: string
  keys: readonly MacroKey[]
  pointer: { current: { x: number; y: number } }
  reduceMotion: boolean
  selectedId: string | null
}

function MacroPadScene({
  activeIds,
  buttonRefs,
  dragRotation,
  dragging,
  focusedId,
  hoveredId,
  housingTint,
  keys,
  pointer,
  reduceMotion,
  selectedId,
}: MacroPadSceneProps) {
  const geometry = useMemo(() => createKeycapGeometry(), [])
  const assembly = useRef<Group>(null)
  const { camera, size } = useThree()
  const projectionPoint = useMemo(() => new Vector3(), [])
  const spacing = 1.56
  const offset = ((keys.length - 1) * spacing) / 2
  const housingWidth = Math.max(6.65, keys.length * spacing + 0.55)

  useEffect(() => () => geometry.dispose(), [geometry])

  useEffect(() => {
    camera.zoom = Math.min(
      size.width / (housingWidth + 1.3),
      size.height / 4.3
    )
    camera.updateProjectionMatrix()
  }, [camera, housingWidth, size.height, size.width])

  useFrame((_, delta) => {
    if (!assembly.current) return
    const assemblyGroup = assembly.current
    const motion = reduceMotion ? { x: 0, y: 0 } : pointer.current
    const rotation = dragRotation.current
    const hoverX = dragging ? 0 : motion.y * 0.018
    const hoverY = dragging ? 0 : motion.x * 0.035
    assemblyGroup.rotation.x = MathUtils.damp(
      assemblyGroup.rotation.x,
      -0.08 + rotation.x + hoverX,
      10,
      delta
    )
    assemblyGroup.rotation.y = MathUtils.damp(
      assemblyGroup.rotation.y,
      rotation.y + hoverY,
      10,
      delta
    )
    assemblyGroup.rotation.z = MathUtils.damp(
      assemblyGroup.rotation.z,
      -0.018 - (dragging ? 0 : motion.x * 0.008),
      10,
      delta
    )

    assemblyGroup.updateWorldMatrix(true, false)

    keys.forEach((_, index) => {
      const button = buttonRefs.current[index]
      if (!button) return

      const centerX = index * spacing - offset
      let minX = Number.POSITIVE_INFINITY
      let minY = Number.POSITIVE_INFINITY
      let maxX = Number.NEGATIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY

      for (const x of [-0.72, 0.72]) {
        for (const y of [0.08, 1.04]) {
          for (const z of [-0.72, 0.72]) {
            projectionPoint.set(centerX + x, y, z)
            assemblyGroup.localToWorld(projectionPoint)
            projectionPoint.project(camera)

            const screenX = (projectionPoint.x * 0.5 + 0.5) * size.width
            const screenY = (-projectionPoint.y * 0.5 + 0.5) * size.height
            minX = Math.min(minX, screenX)
            minY = Math.min(minY, screenY)
            maxX = Math.max(maxX, screenX)
            maxY = Math.max(maxY, screenY)
          }
        }
      }

      const padding = 3
      button.style.transform = `translate(${minX - padding}px, ${minY - padding}px)`
      button.style.width = `${maxX - minX + padding * 2}px`
      button.style.height = `${maxY - minY + padding * 2}px`
      button.style.opacity = "1"
    })
  })

  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight intensity={2.1} position={[-4, 6, 5]} />
      <directionalLight
        color="#b7d9e6"
        intensity={0.65}
        position={[5, 2, -4]}
      />

      <group ref={assembly} rotation={[-0.08, 0, -0.018]}>
        <RoundedBox
          args={[housingWidth, 0.64, 2.08]}
          position={[0, -0.5, 0]}
          radius={0.18}
          smoothness={7}
        >
          <meshPhysicalMaterial
            clearcoat={1}
            clearcoatRoughness={0.12}
            color={housingTint}
            ior={1.45}
            metalness={0.02}
            opacity={0.72}
            roughness={0.16}
            thickness={0.42}
            transmission={0.62}
            transparent
          />
        </RoundedBox>

        {keys.map((item, index) => {
          const x = index * spacing - offset
          return (
            <KeyUnit
              active={activeIds.has(item.id)}
              focused={focusedId === item.id}
              geometry={geometry}
              hovered={hoveredId === item.id}
              item={item}
              key={item.id}
              positionX={x}
              reduceMotion={reduceMotion}
              selected={selectedId === item.id}
            />
          )
        })}
      </group>

      <ContactShadows
        color="#071016"
        far={6}
        opacity={0.42}
        position={[0, -0.98, 0]}
        resolution={256}
        scale={10}
      />
    </>
  )
}

export function R3FMacroKeypad({
  activeId = null,
  className = "",
  housingTint = "#dff4f7",
  keys = defaultKeys,
  onKeyPress,
}: R3FMacroKeypadProps) {
  const visibleKeys = keys.slice(0, 6)
  const pointer = useRef({ x: 0, y: 0 })
  const dragRotation = useRef({ x: 0, y: 0 })
  const dragGesture = useRef({
    moved: false,
    originX: 0,
    originY: 0,
    pointerId: -1,
    startX: 0,
    startY: 0,
    targetId: null as string | null,
  })
  const suppressClickId = useRef<string | null>(null)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [activeIds, setActiveIds] = useState<Set<string>>(() => new Set())
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [tabStopId, setTabStopId] = useState(visibleKeys[0]?.id ?? "")
  const [reduceMotion, setReduceMotion] = useState(false)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updatePreference = () => setReduceMotion(query.matches)
    updatePreference()
    query.addEventListener("change", updatePreference)
    return () => query.removeEventListener("change", updatePreference)
  }, [])

  const setKeyActive = (id: string, active: boolean) => {
    setActiveIds((current) => {
      const next = new Set(current)
      if (active) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const moveFocus = (index: number, direction: -1 | 1) => {
    let nextIndex = index
    for (let attempt = 0; attempt < visibleKeys.length; attempt += 1) {
      nextIndex =
        (nextIndex + direction + visibleKeys.length) % visibleKeys.length
      if (!visibleKeys[nextIndex]?.disabled) break
    }
    const nextItem = visibleKeys[nextIndex]
    if (!nextItem) return
    setTabStopId(nextItem.id)
    buttonRefs.current[nextIndex]?.focus()
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    item: MacroKey,
    index: number
  ) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      moveFocus(index, 1)
      return
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      moveFocus(index, -1)
      return
    }
    if (event.key === "Enter" || event.key === " ") setKeyActive(item.id, true)
  }

  const releasePointer = (
    event: PointerEvent<HTMLButtonElement>,
    id: string
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setKeyActive(id, false)
  }

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = dragGesture.current
    if (gesture.pointerId !== event.pointerId) return

    if (gesture.moved && gesture.targetId) {
      suppressClickId.current = gesture.targetId
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    dragGesture.current.pointerId = -1
    setDragging(false)
  }

  return (
    <div
      aria-label="Macro keypad"
      className={cn(
        "relative h-64 w-[42rem] max-w-full cursor-grab touch-none rounded-[2rem] select-none",
        dragging && "cursor-grabbing",
        className
      )}
      onPointerCancel={finishDrag}
      onPointerDownCapture={(event) => {
        if (!event.isPrimary || event.button !== 0) return

        const target = event.target as HTMLElement
        const targetId = target
          .closest<HTMLButtonElement>("[data-macro-key-id]")
          ?.getAttribute("data-macro-key-id")

        dragGesture.current = {
          moved: false,
          originX: dragRotation.current.x,
          originY: dragRotation.current.y,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          targetId: targetId ?? null,
        }
        tryCapturePointer(event.currentTarget, event.pointerId)
      }}
      onPointerLeave={() => {
        pointer.current = { x: 0, y: 0 }
        setHoveredId(null)
      }}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        const gesture = dragGesture.current

        if (gesture.pointerId === event.pointerId) {
          const deltaX = event.clientX - gesture.startX
          const deltaY = event.clientY - gesture.startY

          if (!gesture.moved && Math.hypot(deltaX, deltaY) >= 6) {
            gesture.moved = true
            setDragging(true)
            if (gesture.targetId) setKeyActive(gesture.targetId, false)
          }

          if (gesture.moved) {
            dragRotation.current = {
              x: MathUtils.clamp(
                gesture.originX + (deltaY / bounds.height) * 0.72,
                -0.31,
                0.31
              ),
              y: MathUtils.clamp(
                gesture.originY + (deltaX / bounds.width) * 1.2,
                -0.61,
                0.61
              ),
            }
          }
        }

        pointer.current = {
          x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          y: -(((event.clientY - bounds.top) / bounds.height) * 2 - 1),
        }
      }}
      onPointerUpCapture={finishDrag}
      role="toolbar"
      style={{ "--macro-focus": "#22d3ee" } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]"
      >
        <Canvas
          camera={{ position: [0, 5.4, 8], zoom: 50 }}
          dpr={[1, 1.65]}
          gl={{ alpha: true, antialias: true }}
          orthographic
          shadows
        >
          <MacroPadScene
            activeIds={activeIds}
            buttonRefs={buttonRefs}
            dragging={dragging}
            dragRotation={dragRotation}
            focusedId={focusedId}
            hoveredId={hoveredId}
            housingTint={housingTint}
            keys={visibleKeys}
            pointer={pointer}
            reduceMotion={reduceMotion}
            selectedId={activeId}
          />
        </Canvas>
      </span>

      <div className="pointer-events-none absolute inset-0">
        {visibleKeys.map((item, index) => (
          <button
            aria-label={item.label}
            aria-pressed={activeId === item.id}
            className="pointer-events-auto absolute top-0 left-0 rounded-2xl bg-transparent opacity-0 transition-[background-color,box-shadow] outline-none hover:bg-white/[0.025] focus-visible:ring-2 focus-visible:ring-[var(--macro-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:cursor-not-allowed"
            disabled={item.disabled}
            key={item.id}
            onBlur={() => {
              setFocusedId(null)
              setKeyActive(item.id, false)
            }}
            data-macro-key-id={item.id}
            onClick={(event) => {
              if (suppressClickId.current === item.id) {
                event.preventDefault()
                suppressClickId.current = null
                return
              }
              onKeyPress?.(item.id)
            }}
            onFocus={() => {
              setFocusedId(item.id)
              setTabStopId(item.id)
            }}
            onKeyDown={(event) => handleKeyDown(event, item, index)}
            onKeyUp={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                setKeyActive(item.id, false)
              }
            }}
            onPointerCancel={(event) => releasePointer(event, item.id)}
            onPointerDown={(event) => {
              tryCapturePointer(event.currentTarget, event.pointerId)
              setKeyActive(item.id, true)
            }}
            onPointerEnter={() => setHoveredId(item.id)}
            onPointerLeave={(event) => {
              setHoveredId(null)
              if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
                setKeyActive(item.id, false)
              }
            }}
            onPointerUp={(event) => releasePointer(event, item.id)}
            ref={(element) => {
              buttonRefs.current[index] = element
            }}
            tabIndex={item.id === tabStopId ? 0 : -1}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}

export default R3FMacroKeypad
