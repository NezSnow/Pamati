import {
  Vector3 as a,
  MeshPhysicalMaterial as c,
  InstancedMesh as d,
  Clock as e,
  AmbientLight as f,
  SphereGeometry as g,
  ShaderChunk as h,
  Scene as i,
  Color as l,
  Object3D as m,
  SRGBColorSpace as n,
  MathUtils as o,
  PMREMGenerator as p,
  Vector2 as r,
  WebGLRenderer as s,
  PerspectiveCamera as t,
  PointLight as u,
  ACESFilmicToneMapping as v,
  Plane as w,
  Raycaster as y,
} from 'three'
import { RoomEnvironment as z } from 'three/examples/jsm/environments/RoomEnvironment.js'

// ─── Three wrapper ────────────────────────────────────────────────────────────
class ThreeApp {
  _opts: any
  canvas!: HTMLCanvasElement
  camera!: InstanceType<typeof t>
  cameraMinAspect?: number
  cameraMaxAspect?: number
  cameraFov!: number
  maxPixelRatio?: number
  minPixelRatio?: number
  scene!: InstanceType<typeof i>
  renderer!: InstanceType<typeof s>
  _pp: any
  size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 }
  render: () => void
  onBeforeRender: (t: any) => void = () => {}
  onAfterRender: (t: any) => void = () => {}
  onAfterResize: (s: any) => void = () => {}
  _visible = false
  _running = false
  isDisposed = false
  _resizeTimer: any
  _ro?: ResizeObserver
  _io?: IntersectionObserver
  _clock = new e()
  _time = { elapsed: 0, delta: 0 }
  _rafId?: number

  constructor(opts: any) {
    this._opts = { ...opts }
    this.render = this._defaultRender.bind(this)
    this._initCamera()
    this._initScene()
    this._initRenderer()
    this.resize()
    this._initObservers()
  }
  _initCamera() {
    this.camera = new t()
    this.cameraFov = this.camera.fov
  }
  _initScene() { this.scene = new i() }
  _initRenderer() {
    this.canvas = this._opts.canvas
    this.canvas.style.display = 'block'
    this.renderer = new s({ canvas: this.canvas, powerPreference: 'high-performance', antialias: true, alpha: true, ...(this._opts.rendererOptions ?? {}) })
    this.renderer.outputColorSpace = n
  }
  _initObservers() {
    window.addEventListener('resize', this._onResize.bind(this))
    if (this._opts.size === 'parent' && this.canvas.parentNode) {
      this._ro = new ResizeObserver(this._onResize.bind(this))
      this._ro.observe(this.canvas.parentNode as Element)
    }
    this._io = new IntersectionObserver((entries) => {
      this._visible = entries[0].isIntersecting
      this._visible ? this._startLoop() : this._stopLoop()
    }, { threshold: 0 })
    this._io.observe(this.canvas)
    document.addEventListener('visibilitychange', () => {
      if (this._visible) document.hidden ? this._stopLoop() : this._startLoop()
    })
  }
  _onResize() {
    clearTimeout(this._resizeTimer)
    this._resizeTimer = setTimeout(this.resize.bind(this), 100)
  }
  resize() {
    let w: number, h: number
    if (this._opts.size === 'parent' && this.canvas.parentNode) {
      w = (this.canvas.parentNode as HTMLElement).offsetWidth
      h = (this.canvas.parentNode as HTMLElement).offsetHeight
    } else {
      w = window.innerWidth; h = window.innerHeight
    }
    this.size.width = w; this.size.height = h; this.size.ratio = w / h
    this._updateCamera()
    this._updateRenderer()
    this.onAfterResize(this.size)
  }
  _updateCamera() {
    this.camera.aspect = this.size.width / this.size.height
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
        const tan = Math.tan(o.degToRad(this.cameraFov / 2)) / (this.camera.aspect / this.cameraMaxAspect)
        this.camera.fov = 2 * o.radToDeg(Math.atan(tan))
      } else {
        this.camera.fov = this.cameraFov
      }
    }
    this.camera.updateProjectionMatrix()
    const fovRad = (this.camera.fov * Math.PI) / 180
    this.size.wHeight = 2 * Math.tan(fovRad / 2) * this.camera.position.length()
    this.size.wWidth = this.size.wHeight * this.camera.aspect
  }
  _updateRenderer() {
    this.renderer.setSize(this.size.width, this.size.height)
    let dpr = window.devicePixelRatio
    if (this.maxPixelRatio && dpr > this.maxPixelRatio) dpr = this.maxPixelRatio
    this.renderer.setPixelRatio(dpr)
    this.size.pixelRatio = dpr
  }
  _startLoop() {
    if (this._running) return
    this._running = true
    this._clock.start()
    const loop = () => {
      this._rafId = requestAnimationFrame(loop)
      this._time.delta = this._clock.getDelta()
      this._time.elapsed += this._time.delta
      this.onBeforeRender(this._time)
      this.render()
      this.onAfterRender(this._time)
    }
    loop()
  }
  _stopLoop() {
    if (!this._running) return
    cancelAnimationFrame(this._rafId!)
    this._running = false
    this._clock.stop()
  }
  _defaultRender() { this.renderer.render(this.scene, this.camera) }
  clear() {
    this.scene.traverse((obj: any) => {
      if (obj.isMesh) { obj.material?.dispose?.(); obj.geometry?.dispose?.() }
    })
    this.scene.clear()
  }
  dispose() {
    window.removeEventListener('resize', this._onResize.bind(this))
    this._ro?.disconnect(); this._io?.disconnect()
    this._stopLoop(); this.clear()
    this.renderer.dispose(); this.renderer.forceContextLoss()
    this.isDisposed = true
  }
}

// ─── Pointer tracker ──────────────────────────────────────────────────────────
const _handlers = new Map<Element, any>()
const _mouse = new r()
let _listening = false

function trackPointer(opts: any) {
  const state = { position: new r(), nPosition: new r(), hover: false, touching: false, onMove() {}, onLeave() {}, dispose: () => {}, ...opts }
  _handlers.set(opts.domElement, state)
  if (!_listening) {
    document.body.addEventListener('pointermove', _onMove)
    document.body.addEventListener('pointerleave', _onLeave)
    _listening = true
  }
  state.dispose = () => {
    _handlers.delete(opts.domElement)
    if (_handlers.size === 0) {
      document.body.removeEventListener('pointermove', _onMove)
      document.body.removeEventListener('pointerleave', _onLeave)
      _listening = false
    }
  }
  return state
}
function _onMove(e: MouseEvent) {
  _mouse.x = e.clientX; _mouse.y = e.clientY
  for (const [el, st] of _handlers) {
    const rect = el.getBoundingClientRect()
    st.position.x = _mouse.x - rect.left; st.position.y = _mouse.y - rect.top
    st.nPosition.x = (st.position.x / rect.width) * 2 - 1
    st.nPosition.y = (-st.position.y / rect.height) * 2 + 1
    const inside = _mouse.x >= rect.left && _mouse.x <= rect.right && _mouse.y >= rect.top && _mouse.y <= rect.bottom
    if (inside) { if (!st.hover) { st.hover = true } st.onMove(st) }
    else if (st.hover) { st.hover = false; st.onLeave(st) }
  }
}
function _onLeave() { for (const st of _handlers.values()) { if (st.hover) { st.hover = false; st.onLeave(st) } } }

// ─── Physics ──────────────────────────────────────────────────────────────────
const { randFloat: _rf, randFloatSpread: _rfs } = o
const _vA = new a(), _vB = new a(), _vC = new a(), _vD = new a(), _vE = new a()
const _vF = new a(), _vG = new a(), _vH = new a(), _vI = new a(), _vJ = new a()

class BallPhysics {
  config: any
  positionData: Float32Array
  velocityData: Float32Array
  sizeData: Float32Array
  center: InstanceType<typeof a>

  constructor(cfg: any) {
    this.config = cfg
    this.positionData = new Float32Array(3 * cfg.count).fill(0)
    this.velocityData = new Float32Array(3 * cfg.count).fill(0)
    this.sizeData = new Float32Array(cfg.count).fill(1)
    this.center = new a()
    this._scatter()
    this.setSizes()
  }
  _scatter() {
    const { config: c, positionData: p } = this
    this.center.toArray(p, 0)
    for (let i = 1; i < c.count; i++) {
      const base = 3 * i
      p[base] = _rfs(2 * c.maxX); p[base + 1] = _rfs(2 * c.maxY); p[base + 2] = _rfs(2 * c.maxZ)
    }
  }
  setSizes() {
    const { config: c, sizeData: sz } = this
    sz[0] = c.size0
    for (let i = 1; i < c.count; i++) sz[i] = _rf(c.minSize, c.maxSize)
  }
  update(time: any) {
    const { config: c, center, positionData: p, sizeData: sz, velocityData: v } = this
    let start = 0
    if (c.controlSphere0) {
      start = 1
      _vA.fromArray(p, 0).lerp(center, 0.1).toArray(p, 0)
      _vD.set(0, 0, 0).toArray(v, 0)
    }
    for (let i = start; i < c.count; i++) {
      const b = 3 * i
      _vB.fromArray(p, b); _vE.fromArray(v, b)
      _vE.y -= time.delta * c.gravity * sz[i]
      _vE.multiplyScalar(c.friction).clampLength(0, c.maxVelocity)
      _vB.add(_vE).toArray(p, b); _vE.toArray(v, b)
    }
    for (let i = start; i < c.count; i++) {
      const b = 3 * i; const ri = sz[i]
      _vB.fromArray(p, b); _vE.fromArray(v, b)
      for (let j = i + 1; j < c.count; j++) {
        const bj = 3 * j; const rj = sz[j]
        _vC.fromArray(p, bj); _vF.fromArray(v, bj)
        _vG.copy(_vC).sub(_vB)
        const dist = _vG.length(), sum = ri + rj
        if (dist < sum) {
          const overlap = sum - dist
          _vH.copy(_vG).normalize().multiplyScalar(0.5 * overlap)
          _vI.copy(_vH).multiplyScalar(Math.max(_vE.length(), 1))
          _vJ.copy(_vH).multiplyScalar(Math.max(_vF.length(), 1))
          _vB.sub(_vH); _vE.sub(_vI); _vB.toArray(p, b); _vE.toArray(v, b)
          _vC.add(_vH); _vF.add(_vJ); _vC.toArray(p, bj); _vF.toArray(v, bj)
        }
      }
      if (c.controlSphere0) {
        _vA.fromArray(p, 0)
        _vG.copy(_vA).sub(_vB)
        const d0 = _vG.length(), s0 = ri + sz[0]
        if (d0 < s0) {
          _vH.copy(_vG.normalize()).multiplyScalar(s0 - d0)
          _vI.copy(_vH).multiplyScalar(Math.max(_vE.length(), 2))
          _vB.sub(_vH); _vE.sub(_vI)
        }
      }
      if (Math.abs(_vB.x) + ri > c.maxX) { _vB.x = Math.sign(_vB.x) * (c.maxX - ri); _vE.x = -_vE.x * c.wallBounce }
      if (c.gravity === 0) {
        if (Math.abs(_vB.y) + ri > c.maxY) { _vB.y = Math.sign(_vB.y) * (c.maxY - ri); _vE.y = -_vE.y * c.wallBounce }
      } else if (_vB.y - ri < -c.maxY) { _vB.y = -c.maxY + ri; _vE.y = -_vE.y * c.wallBounce }
      const maxZ = Math.max(c.maxZ, c.maxSize)
      if (Math.abs(_vB.z) + ri > maxZ) { _vB.z = Math.sign(_vB.z) * (c.maxZ - ri); _vE.z = -_vE.z * c.wallBounce }
      _vB.toArray(p, b); _vE.toArray(v, b)
    }
  }
}

// ─── Subsurface material ──────────────────────────────────────────────────────
class SubsurfaceMaterial extends (c as any) {
  uniforms: any
  onBeforeCompile2?: (s: any) => void

  constructor(params: any) {
    super(params)
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2 },
      thicknessScale: { value: 10 },
    }
    this.defines = this.defines || {}
    this.defines.USE_UV = ''
    this.onBeforeCompile = (shader: any) => {
      Object.assign(shader.uniforms, this.uniforms)
      shader.fragmentShader = `
        uniform float thicknessPower;
        uniform float thicknessScale;
        uniform float thicknessDistortion;
        uniform float thicknessAmbient;
        uniform float thicknessAttenuation;
      ` + shader.fragmentShader
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', `
        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));
          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
          #ifdef USE_COLOR
            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;
          #else
            vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * diffuse;
          #endif
          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;
        }
        void main() {
      `)
      const lit = h.lights_fragment_begin.replaceAll(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
        `RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
         RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);`
      )
      shader.fragmentShader = shader.fragmentShader.replace('#include <lights_fragment_begin>', lit)
      this.onBeforeCompile2?.(shader)
    }
  }
}

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULTS = {
  count: 200, colors: [0, 0, 0], ambientColor: 0xffffff, ambientIntensity: 1,
  lightIntensity: 200,
  materialParams: { metalness: 0.5, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.15 },
  minSize: 0.5, maxSize: 1, size0: 1, gravity: 0.5, friction: 0.9975,
  wallBounce: 0.95, maxVelocity: 0.15, maxX: 5, maxY: 5, maxZ: 2,
  controlSphere0: false, followCursor: true,
}

const _dummy = new m()

// ─── Spheres instanced mesh ───────────────────────────────────────────────────
class BallpitSpheres extends (d as any) {
  config: any
  physics!: BallPhysics
  ambientLight!: InstanceType<typeof f>
  light!: InstanceType<typeof u>

  constructor(renderer: InstanceType<typeof s>, opts = {}) {
    const cfg = { ...DEFAULTS, ...opts }
    const env = new (p as any)(renderer, 0.04).fromScene(new (z as any)()).texture
    const mat = new SubsurfaceMaterial({ envMap: env, ...cfg.materialParams })
    mat.envMapRotation.x = -Math.PI / 2
    super(new (g as any)(), mat, cfg.count)
    this.config = cfg
    this.physics = new BallPhysics(cfg)
    this._initLights()
    this.setColors(cfg.colors)
  }
  _initLights() {
    this.ambientLight = new (f as any)(this.config.ambientColor, this.config.ambientIntensity)
    this.add(this.ambientLight)
    this.light = new (u as any)(this.config.colors[0], this.config.lightIntensity)
    this.add(this.light)
  }
  setColors(colors: any[]) {
    if (!Array.isArray(colors) || colors.length < 2) return
    const cols = colors.map((c: any) => new l(c))
    for (let i = 0; i < this.count; i++) {
      const ratio = i / this.count
      const scaled = ratio * (cols.length - 1)
      const idx = Math.floor(scaled)
      const alpha = scaled - idx
      const start = cols[idx], end = cols[Math.min(idx + 1, cols.length - 1)]
      const mixed = new l(start.r + alpha * (end.r - start.r), start.g + alpha * (end.g - start.g), start.b + alpha * (end.b - start.b))
      this.setColorAt(i, mixed)
      if (i === 0) this.light.color.copy(mixed)
    }
    if (this.instanceColor) this.instanceColor.needsUpdate = true
  }
  update(time: any) {
    this.physics.update(time)
    for (let i = 0; i < this.count; i++) {
      _dummy.position.fromArray(this.physics.positionData, 3 * i)
      _dummy.scale.setScalar(i === 0 && !this.config.followCursor ? 0 : this.physics.sizeData[i])
      _dummy.updateMatrix()
      this.setMatrixAt(i, _dummy.matrix)
      if (i === 0) this.light.position.copy(_dummy.position)
    }
    this.instanceMatrix.needsUpdate = true
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────
function createBallpit(canvas: HTMLCanvasElement, opts: any = {}) {
  const three = new ThreeApp({ canvas, size: 'parent' })
  three.renderer.toneMapping = v
  three.camera.position.set(0, 0, 20)
  three.camera.lookAt(0, 0, 0)
  three.cameraMaxAspect = 1.5
  three.resize()

  let spheres: BallpitSpheres
  let paused = false

  function initialize(cfg: any) {
    if (spheres) { three.clear(); three.scene.remove(spheres as any) }
    spheres = new BallpitSpheres(three.renderer, cfg)
    three.scene.add(spheres as any)
  }
  initialize(opts)

  const raycaster = new (y as any)()
  const plane = new (w as any)(new a(0, 0, 1), 0)
  const hit = new a()

  canvas.style.touchAction = 'none'
  const ptr = trackPointer({
    domElement: canvas,
    onMove(st: any) {
      raycaster.setFromCamera(st.nPosition, three.camera)
      three.camera.getWorldDirection(plane.normal)
      raycaster.ray.intersectPlane(plane, hit)
      spheres.physics.center.copy(hit)
      spheres.config.controlSphere0 = true
    },
    onLeave() { spheres.config.controlSphere0 = false },
  })

  three.onBeforeRender = (time: any) => { if (!paused) spheres.update(time) }
  three.onAfterResize = (sz: any) => {
    spheres.config.maxX = sz.wWidth / 2
    spheres.config.maxY = sz.wHeight / 2
  }

  return {
    three,
    get spheres() { return spheres },
    setColors(colors: any[]) { spheres.setColors(colors) },
    setCount(count: number) { initialize({ ...spheres.config, count }) },
    togglePause() { paused = !paused },
    dispose() { ptr.dispose(); three.dispose() },
  }
}

export default createBallpit
