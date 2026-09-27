import {
  BloomEffect,
  BlendFunction,
  EffectComposer,
  EffectPass,
  NoiseEffect,
  RenderPass,
  VignetteEffect,
} from 'postprocessing'
import {
  ACESFilmicToneMapping,
  AmbientLight,
  CatmullRomCurve3,
  Color,
  CubeCamera,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  FogExp2,
  Group,
  HalfFloatType,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  NoToneMapping,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  RingGeometry,
  Scene,
  Shape,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  Timer,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLCubeRenderTarget,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from 'three'
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Sequence, SequenceId } from '../data/resume'

/*
 * The résumé helix, rendered with plain three.js. It used to be a
 * react-three-fiber scene; owning the render loop directly lets three.js
 * tree-shake, drops the reconciler from the bundle, and keeps React out of the
 * per-frame path entirely. React only pushes state in through `update()`.
 */

const HELIX_POINTS = 34
const HELIX_RADIUS = 1.35
const HELIX_STEP = 0.34
const HELIX_TWIST = 0.56
const MARKER_INDICES = [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30]
const CATEGORY_ORDER = ['experience', 'work', 'craft', 'contact']
const ROW_BASE_WIDTH = 100
const ROW_BASE_HEIGHT = 18
const COMPACT_WIDTH = 760
// While paused, rendering stops once nothing has moved more than this (world
// units / radians) for SETTLE_FRAMES consecutive frames.
const SETTLE_EPSILON = 0.0005
const SETTLE_FRAMES = 4

export type HelixState = {
  selected: SequenceId | null
  hovered: SequenceId | null
  paused: boolean
}

export type HelixOptions = {
  canvas: HTMLCanvasElement
  sequences: Sequence[]
  rows: Record<string, HTMLDivElement | null>
  reducedMotion: boolean
  onReady: () => void
}

export function orderSequences(sequences: Sequence[]) {
  const rounds = Math.max(
    ...CATEGORY_ORDER.map(
      (categoryId) => sequences.filter((item) => item.categoryId === categoryId).length,
    ),
  )
  return Array.from({ length: rounds }, (_, round) => round).flatMap((round) =>
    CATEGORY_ORDER.flatMap((categoryId) => {
      const sequence = sequences.filter((item) => item.categoryId === categoryId)[round]
      return sequence ? [sequence] : []
    }),
  )
}

function helixPoint(index: number, phase: number) {
  const y = (index - (HELIX_POINTS - 1) / 2) * HELIX_STEP
  const angle = index * HELIX_TWIST + phase
  return new Vector3(Math.cos(angle) * HELIX_RADIUS, y, Math.sin(angle) * HELIX_RADIUS)
}

function connectorEndpoints(index: number) {
  return { start: helixPoint(index, 0), end: helixPoint(index, Math.PI) }
}

/** The same extruded, crease-shaded rounded box drei's <RoundedBox> builds. */
function roundedBoxGeometry(width: number, height: number, depth: number, radius: number, smoothness: number) {
  const eps = 0.00001
  const inner = radius - eps
  const shape = new Shape()
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true)
  shape.absarc(eps, height - inner * 2, eps, Math.PI, Math.PI / 2, true)
  shape.absarc(width - inner * 2, height - inner * 2, eps, Math.PI / 2, 0, true)
  shape.absarc(width - inner * 2, eps, eps, 0, -Math.PI / 2, true)
  const geometry = new ExtrudeGeometry(shape, {
    depth: depth - radius * 2,
    bevelEnabled: true,
    bevelSegments: 8,
    steps: 1,
    bevelSize: radius - eps,
    bevelThickness: radius,
    curveSegments: smoothness,
  })
  geometry.center()
  const creased = toCreasedNormals(geometry, 0.4)
  geometry.dispose()
  return creased
}

/** A studio of soft light panels, baked once into a cube map for reflections. */
function bakeEnvironment(renderer: WebGLRenderer, resolution: number) {
  const studio = new Scene()
  const rig = new Group()
  rig.rotation.set(-Math.PI / 3, 0, 0.4)
  studio.add(rig)
  const panels: [BufferGeometry, string, number, [number, number, number], [number, number, number]][] = [
    [new RingGeometry(0.25, 0.5, 64), '#d9eee8', 2.2, [5, 5, 1], [0, 5, -3]],
    [new PlaneGeometry(1, 1), '#517f78', 1.4, [3, 1.2, 1], [-4, 1, 2]],
    [new PlaneGeometry(1, 1), '#b68b64', 1, [2, 3, 1], [4, -2, 1]],
  ]
  for (const [geometry, color, intensity, scale, position] of panels) {
    const material = new MeshBasicMaterial({ side: DoubleSide, toneMapped: false })
    material.color.set(color).multiplyScalar(intensity)
    const panel = new Mesh(geometry, material)
    panel.scale.set(...scale)
    panel.position.set(...position)
    rig.add(panel)
    panel.lookAt(0, 0, 0)
  }
  const target = new WebGLCubeRenderTarget(resolution)
  target.texture.type = HalfFloatType
  const cubeCamera = new CubeCamera(0.1, 1000, target)
  const autoClear = renderer.autoClear
  renderer.autoClear = true
  cubeCamera.update(renderer, studio)
  renderer.autoClear = autoClear
  studio.traverse((object) => {
    if (object instanceof Mesh) {
      object.geometry.dispose()
      ;(object.material as Material).dispose()
    }
  })
  return target
}

type Connector = {
  sequence: Sequence
  outer: Group
  inner: Group
  material: MeshPhysicalMaterial
  midpoint: Vector3
  quaternion: Quaternion
  length: number
  start: Vector3
  end: Vector3
  baseColor: Color
  highlightColor: Color
}

export class HelixRenderer {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(42, 1, 0.1, 60)
  private readonly helix = new Group()
  private readonly connectors: Connector[] = []
  private readonly disposables: { dispose: () => void }[] = []
  private readonly timer = new Timer()
  private readonly pointer = new Vector2()
  private readonly lastCamera = new Vector3()
  private lastSway = 0
  private readonly lastRowWrites: Record<string, string> = {}
  private readonly options: HelixOptions
  private environment: WebGLCubeRenderTarget | null = null
  private environmentCompact: boolean | null = null
  private composer: EffectComposer | null = null
  private state: HelixState = { selected: null, hovered: null, paused: false }
  private width = 1
  private height = 1
  private frame = 0
  private framesRendered = 0
  private settled = false
  private stillFrames = 0
  private motion = 0
  private visible = document.visibilityState === 'visible'
  private disposed = false
  private warm = false
  private warmingUp: Promise<void> = Promise.resolve()

  // Scratch objects reused every frame.
  private readonly scratch = {
    parentQuaternion: new Quaternion(),
    targetQuaternion: new Quaternion(),
    target: new Vector3(),
    parentScale: new Vector3(),
    projectedStart: new Vector3(),
    projectedEnd: new Vector3(),
    panelColor: new Color('#111521'),
  }

  constructor(options: HelixOptions) {
    this.options = options
    const compact = window.innerWidth < COMPACT_WIDTH
    // The desktop composer does its own MSAA; antialiasing the default
    // framebuffer as well would pay for it twice.
    this.renderer = new WebGLRenderer({
      canvas: options.canvas,
      antialias: compact || options.reducedMotion,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping

    this.scene.background = new Color('#0a0d15')
    this.scene.fog = new FogExp2('#0a0d15', 0.075)
    this.scene.environmentIntensity = 0.38
    this.camera.position.set(0, 0, 8.2)
    this.addLights()
    this.buildHelix()
    this.scene.add(this.helix)

    document.addEventListener('visibilitychange', this.handleVisibility)
    window.addEventListener('pointermove', this.handlePointer, { passive: true })
    this.resize()
    this.warmingUp = this.warmUp()
  }

  /**
   * Compile every shader before the first frame. With KHR_parallel_shader_compile
   * the browser compiles off the main thread, so the page stays responsive while
   * the placeholder is showing; it compiles for the composer's own render target
   * so the exact program variants the first frame needs are the ones warmed.
   */
  private async warmUp() {
    const target = this.composer?.inputBuffer ?? null
    this.renderer.setRenderTarget(target)
    try {
      await this.renderer.compileAsync(this.scene, this.camera)
    } catch {
      // Fall through: the first render compiles synchronously instead.
    } finally {
      this.renderer.setRenderTarget(null)
    }
    this.warm = true
    if (!this.disposed) this.wake()
  }

  /** React pushes selection and hover state through here. */
  update(next: HelixState) {
    const previous = this.state
    const selectionChanged = next.selected !== previous.selected || next.paused !== previous.paused
    const hoverChanged = next.hovered !== previous.hovered
    this.state = next
    if (selectionChanged) {
      // An opened connector turns matte as it becomes the panel surface.
      for (const connector of this.connectors) {
        const selected = next.selected === connector.sequence.id
        if (selected === (previous.selected === connector.sequence.id)) continue
        connector.material.roughness = selected ? 0.54 : 0.32
        connector.material.clearcoat = selected ? 0.08 : 0.35
        connector.material.emissiveIntensity = selected ? 0.025 : 0.1
      }
      this.wake()
    } else if (hoverChanged) {
      this.wake()
    }
  }

  resize() {
    const canvas = this.options.canvas
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight
    this.width = width
    this.height = height
    const compact = width < COMPACT_WIDTH
    this.renderer.setPixelRatio(compact ? Math.min(Math.max(window.devicePixelRatio, 1), 1.2) : 1)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    // Composition that depends on the viewport.
    if (compact) this.helix.position.set(-0.08, height < 720 ? -1.2 : -1.0, -1.4)
    else this.helix.position.set(-4.15, 0, 0)
    this.helix.scale.setScalar(compact ? (height < 720 ? 0.5 : 0.58) : 1)
    this.helix.rotation.x = compact ? 0.04 : 0.08
    this.helix.rotation.z = compact ? 0 : -0.1

    if (this.environmentCompact !== compact) {
      this.environment?.dispose()
      this.environment = bakeEnvironment(this.renderer, compact ? 32 : 96)
      this.scene.environment = this.environment.texture
      this.environmentCompact = compact
    }
    this.configurePostProcessing(compact)
    this.composer?.setSize(width, height)
    this.wake()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    document.removeEventListener('visibilitychange', this.handleVisibility)
    window.removeEventListener('pointermove', this.handlePointer)
    // three.js polls for async shader compilation; freeing its state while a
    // warm-up is still pending would pull programs out from under that poll.
    void this.warmingUp.then(() => {
      this.composer?.dispose()
      this.environment?.dispose()
      for (const item of this.disposables) item.dispose()
      this.renderer.dispose()
    })
  }

  private addLights() {
    const ambient = new AmbientLight('#d7d5e8', 0.38)
    const key = new DirectionalLight('#fff1dc', 3.6)
    key.position.set(5, 4, 6)
    const fill = new DirectionalLight('#8ea8ff', 2.1)
    fill.position.set(-5, -2, 2)
    const rim = new SpotLight('#ffb7a7', 4.2, 0, 0.45, 1)
    rim.position.set(0, 7, -2)
    this.scene.add(ambient, key, fill, rim)
  }

  private track<T extends { dispose: () => void }>(item: T) {
    this.disposables.push(item)
    return item
  }

  private buildHelix() {
    const strandA: Vector3[] = []
    const strandB: Vector3[] = []
    for (let index = 0; index < HELIX_POINTS; index += 1) {
      strandA.push(helixPoint(index, 0))
      strandB.push(helixPoint(index, Math.PI))
    }
    const strands: [Vector3[], string, number, number, number, number, number][] = [
      [strandA, '#aeb9b4', 0.46, 0.04, 0.28, 0.52, 0.24],
      [strandB, '#7f8e89', 0.5, 0.03, 0.22, 0.56, 0.18],
    ]
    for (const [points, color, roughness, metalness, clearcoat, clearcoatRoughness, iridescence] of strands) {
      const curve = new CatmullRomCurve3(points, false, 'catmullrom', 0.5)
      const material = this.track(
        new MeshPhysicalMaterial({
          color,
          roughness,
          metalness,
          clearcoat,
          clearcoatRoughness,
          iridescence,
          iridescenceIOR: iridescence > 0.2 ? 1.35 : 1.3,
        }),
      )
      this.helix.add(new Mesh(this.track(new TubeGeometry(curve, 180, 0.078, 12, false)), material))
    }

    const ordered = orderSequences(this.options.sequences)

    // Sockets where each connector meets the strands, one instanced draw per color.
    const socketGeometry = this.track(new SphereGeometry(0.108, 16, 16))
    const byColor = new Map<string, Vector3[]>()
    ordered.forEach((sequence, index) => {
      const { start, end } = connectorEndpoints(MARKER_INDICES[index])
      byColor.set(sequence.color, [...(byColor.get(sequence.color) ?? []), start, end])
    })
    const matrix = new Matrix4()
    for (const [color, points] of byColor) {
      const material = this.track(
        new MeshPhysicalMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.08,
          roughness: 0.36,
          metalness: 0.02,
          clearcoat: 0.25,
        }),
      )
      const sockets = new InstancedMesh(socketGeometry, material, points.length)
      points.forEach((point, index) => sockets.setMatrixAt(index, matrix.makeTranslation(point)))
      sockets.frustumCulled = false
      this.helix.add(sockets)
    }

    // The connectors — the rungs that fly out to become the panel.
    ordered.forEach((sequence, index) => {
      const { start, end } = connectorEndpoints(MARKER_INDICES[index])
      const direction = end.clone().sub(start)
      const length = direction.length()
      const midpoint = start.clone().add(end).multiplyScalar(0.5)
      const quaternion = new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), direction.normalize())
      const material = this.track(
        new MeshPhysicalMaterial({
          color: sequence.color,
          emissive: sequence.color,
          emissiveIntensity: 0.1,
          roughness: 0.32,
          metalness: 0.02,
          clearcoat: 0.35,
          clearcoatRoughness: 0.46,
          transparent: true,
        }),
      )
      const outer = new Group()
      const inner = new Group()
      outer.position.copy(midpoint)
      inner.quaternion.copy(quaternion)
      inner.add(new Mesh(this.track(roundedBoxGeometry(length, 0.18, 0.11, 0.075, 3)), material))
      outer.add(inner)
      this.helix.add(outer)
      const baseColor = new Color(sequence.color)
      this.connectors.push({
        sequence,
        outer,
        inner,
        material,
        midpoint,
        quaternion,
        length,
        start,
        end,
        baseColor,
        highlightColor: baseColor.clone().lerp(new Color('#ffffff'), 0.3),
      })
    })
  }

  private configurePostProcessing(compact: boolean) {
    const wanted = !compact && !this.options.reducedMotion
    if (wanted && !this.composer) {
      const composer = new EffectComposer(this.renderer, { multisampling: 4, frameBufferType: HalfFloatType })
      composer.addPass(new RenderPass(this.scene, this.camera))
      composer.addPass(
        new EffectPass(
          this.camera,
          new BloomEffect({
            blendFunction: BlendFunction.ADD,
            mipmapBlur: true,
            intensity: 0.64,
            luminanceThreshold: 0.58,
            luminanceSmoothing: 0.38,
          }),
          (() => {
            const noise = new NoiseEffect({ blendFunction: BlendFunction.COLOR_DODGE })
            noise.blendMode.opacity.value = 0.018
            return noise
          })(),
          new VignetteEffect({ eskil: false, offset: 0.12, darkness: 0.78 }),
        ),
      )
      this.composer = composer
      // The composer works in linear HDR and outputs directly.
      this.renderer.toneMapping = NoToneMapping
    } else if (!wanted && this.composer) {
      this.composer.dispose()
      this.composer = null
      this.renderer.toneMapping = ACESFilmicToneMapping
    }
  }

  private handleVisibility = () => {
    this.visible = document.visibilityState === 'visible'
    if (this.visible) this.start()
  }

  private handlePointer = (event: PointerEvent) => {
    const rect = this.options.canvas.getBoundingClientRect()
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )
  }

  /** Something changed: resume drawing until the scene settles again. */
  private wake() {
    this.settled = false
    this.stillFrames = 0
    this.start()
  }

  private start() {
    if (this.disposed || this.frame || !this.visible || !this.warm) return
    // Resume without a time jump: the first frame after a pause gets a normal delta.
    this.timer.reset()
    this.frame = requestAnimationFrame(this.tick)
  }

  private tick = (time: number) => {
    this.frame = 0
    if (this.disposed || !this.visible) return
    this.timer.update(time)
    // Clamp so a stalled frame (tab switch, GC) never teleports the helix.
    const delta = MathUtils.clamp(this.timer.getDelta(), 0, 1 / 20)
    this.step(delta, this.timer.getElapsed())
    if (this.composer) this.composer.render(delta)
    else this.renderer.render(this.scene, this.camera)
    this.framesRendered += 1
    // Report readiness after a few real frames, once shaders have compiled and
    // the environment has baked — the first-frame stall hides behind the placeholder.
    if (this.framesRendered === 4) this.options.onReady()
    // When nothing moves on its own (a panel is open, or reduced motion), stop
    // drawing identical frames once every damped value has converged — it
    // frees the GPU for the panel and saves battery. Any state change, hover,
    // or resize wakes the loop back up.
    const autonomous = !this.state.paused && !this.options.reducedMotion
    if (!autonomous && this.motion < SETTLE_EPSILON) this.stillFrames += 1
    else this.stillFrames = 0
    this.settled = this.stillFrames >= SETTLE_FRAMES
    if (!this.settled) this.frame = requestAnimationFrame(this.tick)
  }

  private step(delta: number, elapsed: number) {
    const { selected, hovered, paused } = this.state
    const reducedMotion = this.options.reducedMotion
    const { width, height, camera, helix } = this

    // Spin and sway.
    helix.rotation.y += delta * (paused || reducedMotion ? 0 : 0.44)
    helix.rotation.z = MathUtils.damp(
      helix.rotation.z,
      reducedMotion ? 0 : Math.sin(elapsed * 0.17) * 0.035,
      reducedMotion ? 100 : 2,
      delta,
    )

    let motion = Math.abs(helix.rotation.z - this.lastSway)
    this.lastSway = helix.rotation.z

    // Camera drifts with the pointer and eases back to its resting distance.
    const targetZ = width < 700 ? 11.5 : 10.8
    const pointerX = reducedMotion || selected ? 0 : this.pointer.x * 0.18
    const pointerY = reducedMotion || selected ? 0 : this.pointer.y * 0.12
    const cameraEase = reducedMotion ? 100 : 2.3
    camera.position.x = MathUtils.damp(camera.position.x, pointerX, cameraEase, delta)
    camera.position.y = MathUtils.damp(camera.position.y, pointerY, cameraEase, delta)
    camera.position.z = MathUtils.damp(camera.position.z, targetZ, cameraEase, delta)
    motion += this.lastCamera.distanceTo(camera.position)
    this.lastCamera.copy(camera.position)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    helix.updateWorldMatrix(true, false)

    // The panel box, in pixels and in world units at the helix's depth.
    const compact = width < COMPACT_WIDTH
    const panelWidth = compact ? width * 0.94 : Math.min(width * 0.42, 640)
    const panelHeight = compact ? height * 0.88 : height * 0.6
    const panelLeft = compact ? width * 0.03 : width - width * 0.05 - panelWidth
    const panelTop = compact ? height * 0.05 : height * 0.2
    const distance = camera.position.distanceTo(this.scratch.target.set(0, 0, 0))
    const viewHeight = 2 * Math.tan(MathUtils.degToRad(camera.fov) / 2) * distance
    const viewWidth = viewHeight * (width / height)
    const targetWidth = viewWidth * (panelWidth / width)
    const targetHeight = viewHeight * (compact ? 0.88 : 0.6)
    const targetCenterX = compact ? width * 0.5 : width * 0.95 - panelWidth * 0.5

    helix.getWorldQuaternion(this.scratch.parentQuaternion)
    helix.getWorldScale(this.scratch.parentScale)

    for (const connector of this.connectors) {
      const isSelected = selected === connector.sequence.id
      const isHovered = hovered === connector.sequence.id
      const isMuted = selected !== null && !isSelected
      const { outer, inner, material } = connector
      const damping = reducedMotion ? 100 : isSelected ? 5.2 : 7

      const destination = isSelected
        ? helix.worldToLocal(this.scratch.target.set(viewWidth * (targetCenterX / width - 0.5), 0, 0))
        : connector.midpoint
      const before = inner.scale.x + inner.scale.y + outer.position.x + outer.position.y + outer.position.z
      outer.position.x = MathUtils.damp(outer.position.x, destination.x, damping, delta)
      outer.position.y = MathUtils.damp(outer.position.y, destination.y, damping, delta)
      outer.position.z = MathUtils.damp(outer.position.z, destination.z, damping, delta)

      const targetQuaternion = this.scratch.targetQuaternion
      if (isSelected) targetQuaternion.copy(this.scratch.parentQuaternion).invert().multiply(camera.quaternion)
      else targetQuaternion.identity()
      outer.quaternion.slerp(targetQuaternion, reducedMotion ? 1 : 1 - Math.exp(-delta * 6))
      inner.quaternion.slerp(
        isSelected ? targetQuaternion.identity() : connector.quaternion,
        reducedMotion ? 1 : 1 - Math.exp(-delta * 7),
      )

      // The panel target is in world units, but the helix group is scaled down
      // on compact viewports — divide its scale back out or the box undershoots.
      const parentScale = this.scratch.parentScale
      const scaleX = isSelected ? targetWidth / (connector.length * parentScale.x) : 1
      const scaleY = isSelected ? targetHeight / (0.18 * parentScale.y) : 1
      inner.scale.x = MathUtils.damp(inner.scale.x, scaleX, damping, delta)
      inner.scale.y = MathUtils.damp(inner.scale.y, scaleY, damping, delta)
      inner.scale.z = MathUtils.damp(inner.scale.z, isSelected ? 1.8 : 1, damping, delta)

      const targetColor = isSelected ? this.scratch.panelColor : isHovered ? connector.highlightColor : connector.baseColor
      const fade = reducedMotion ? 100 : 9
      material.color.lerp(targetColor, 1 - Math.exp(-delta * fade))
      const targetEmissive = isSelected ? 0.025 : isHovered ? 0.28 : 0.1
      material.emissiveIntensity = MathUtils.damp(material.emissiveIntensity, targetEmissive, fade, delta)
      motion +=
        Math.abs(material.color.r - targetColor.r) +
        Math.abs(material.color.g - targetColor.g) +
        Math.abs(material.color.b - targetColor.b) +
        Math.abs(material.emissiveIntensity - targetEmissive)
      material.opacity = MathUtils.damp(material.opacity, isMuted ? 0.16 : 1, reducedMotion ? 100 : 7, delta)
      motion +=
        Math.abs(inner.scale.x + inner.scale.y + outer.position.x + outer.position.y + outer.position.z - before) +
        (1 - Math.abs(inner.quaternion.dot(isSelected ? targetQuaternion : connector.quaternion))) +
        Math.abs(material.opacity - (isMuted ? 0.16 : 1)) * 0.1

      this.placeRow(connector, isSelected, compact, { panelLeft, panelTop, panelWidth, panelHeight })
    }
    this.motion = motion
  }

  /**
   * Every DOM hit target is a fixed 100×18 box moved purely by transform — one
   * compositor-friendly write per row per frame, and only when it changed.
   */
  private placeRow(
    connector: Connector,
    isSelected: boolean,
    compact: boolean,
    panel: { panelLeft: number; panelTop: number; panelWidth: number; panelHeight: number },
  ) {
    const element = this.options.rows[connector.sequence.id]
    if (!element) return
    const { width, height, camera, helix } = this
    let transform: string
    let zIndex: string
    if (isSelected) {
      const { panelLeft, panelTop, panelWidth, panelHeight } = panel
      transform = `translate(${(panelLeft + panelWidth / 2).toFixed(2)}px, ${(panelTop + panelHeight / 2).toFixed(2)}px) rotate(0rad) scale(${(panelWidth / ROW_BASE_WIDTH).toFixed(4)}, ${(panelHeight / ROW_BASE_HEIGHT).toFixed(4)})`
      zIndex = '30'
    } else {
      const start = this.scratch.projectedStart.copy(connector.start).applyMatrix4(helix.matrixWorld).project(camera)
      const end = this.scratch.projectedEnd.copy(connector.end).applyMatrix4(helix.matrixWorld).project(camera)
      const startX = (start.x * 0.5 + 0.5) * width
      const startY = (-start.y * 0.5 + 0.5) * height
      const endX = (end.x * 0.5 + 0.5) * width
      const endY = (-end.y * 0.5 + 0.5) * height
      const length = Math.max(Math.hypot(endX - startX, endY - startY), 28)
      const angle = Math.atan2(endY - startY, endX - startX)
      transform = `translate(${((startX + endX) / 2).toFixed(2)}px, ${((startY + endY) / 2).toFixed(2)}px) rotate(${angle.toFixed(4)}rad) scale(${(length / ROW_BASE_WIDTH).toFixed(4)}, ${((compact ? 12 : 18) / ROW_BASE_HEIGHT).toFixed(4)})`
      zIndex = `${Math.round(12 - start.z * 4)}`
    }
    const key = transform + zIndex
    if (this.lastRowWrites[connector.sequence.id] === key) return
    this.lastRowWrites[connector.sequence.id] = key
    element.style.transform = transform
    element.style.zIndex = zIndex
  }
}
