<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'
import { EffectComposer, RenderPass, EffectPass, BloomEffect, KernelSize } from 'postprocessing'

/**
 * 三体运动实时模拟（深空视窗版）
 * - 牛顿引力 + RK4 积分；大尺度初值（交会从容）
 * - 视觉：粒子拖尾 + 星云背景 + 双层星尘 + Bloom（pmndrs/postprocessing）
 *   （不用 three.js UnrealBloomPass：其 HalfFloat 缓冲在部分核显上整屏闪烁；
 *    postprocessing 库默认 UnsignedByteType 帧缓冲，兼容性优先）
 * - 交互：拖拽星体 = 改写命运
 * - 解散保护：飞出视域 → 淡出 → 重生（初值保证最小间距 + 动量归零）→ 淡入
 */

const props = defineProps({
  preset: { type: String, default: 'chaos' },
})

const emit = defineEmits(['universe'])

const hostRef = ref(null)

/* ---------------- 物理 ---------------- */
const G = 1
const DT = 0.00072
const SUBSTEPS = 15

function makeBodies(preset) {
  if (preset === 'figure8') {
    // 8字周期解（Chenciner-Montgomery），尺度 2.3
    const S = 2.3
    const p1 = new THREE.Vector3(0.97000436 * S, -0.24308753 * S, 0)
    const v3 = new THREE.Vector3(-0.93240737, -0.86473146, 0).multiplyScalar(1 / Math.sqrt(S))
    return [
      { m: 1, pos: p1.clone(), vel: v3.clone().multiplyScalar(0.5) },
      { m: 1, pos: p1.clone().negate(), vel: v3.clone().multiplyScalar(0.5) },
      { m: 1, pos: new THREE.Vector3(), vel: v3.clone().negate() },
    ]
  }
  if (preset === 'lagrange') {
    const r = 2.4
    const omega = Math.sqrt((G * 3) / (Math.sqrt(3) * r * r))
    const mk = (ang) => ({
      m: 1,
      pos: new THREE.Vector3(r * Math.cos(ang), r * Math.sin(ang), 0),
      vel: new THREE.Vector3(-omega * r * Math.sin(ang), omega * r * Math.cos(ang), 0),
    })
    return [mk(0), mk((2 * Math.PI) / 3), mk((4 * Math.PI) / 3)]
  }
  // 混沌：大间距开局，交会不狂暴
  return [
    { m: 1, pos: new THREE.Vector3(-2.7, 0.5, 0), vel: new THREE.Vector3(0.16, 0.06, 0) },
    { m: 1, pos: new THREE.Vector3(2.7, -0.3, 0), vel: new THREE.Vector3(-0.19, -0.1, 0) },
    { m: 1.4, pos: new THREE.Vector3(0, 1.8, 0), vel: new THREE.Vector3(0.03, -0.14, 0) },
  ]
}

/**
 * 随机重生初值：
 * - 重采样直到任意两星间距 ∈ [2.4, 5.6]（杜绝贴脸开局，也避免过散）
 * - 质心 / 总动量归零（系统不整体漂移）
 */
function randomChaosBodies() {
  const masses = [1, 1, 1 + Math.random() * 0.5]
  const MIN_D = 2.4
  const MAX_D = 5.6
  let bodies = null
  for (let tries = 0; tries < 60; tries++) {
    bodies = masses.map((m) => ({
      m,
      pos: new THREE.Vector3((Math.random() - 0.5) * 5.6, (Math.random() - 0.5) * 4.0, 0),
      vel: new THREE.Vector3((Math.random() - 0.5) * 0.24, (Math.random() - 0.5) * 0.24, 0),
    }))
    const d01 = bodies[0].pos.distanceTo(bodies[1].pos)
    const d02 = bodies[0].pos.distanceTo(bodies[2].pos)
    const d12 = bodies[1].pos.distanceTo(bodies[2].pos)
    if (d01 > MIN_D && d02 > MIN_D && d12 > MIN_D && d01 < MAX_D && d02 < MAX_D && d12 < MAX_D) {
      break
    }
  }
  const totalM = masses.reduce((a, b) => a + b, 0)
  const com = new THREE.Vector3()
  const p = new THREE.Vector3()
  bodies.forEach((b) => {
    com.addScaledVector(b.pos, b.m)
    p.addScaledVector(b.vel, b.m)
  })
  com.divideScalar(totalM)
  p.divideScalar(totalM)
  bodies.forEach((b) => {
    b.pos.sub(com)
    b.vel.sub(p)
  })
  return bodies
}

function accelOf(pos, masses) {
  const acc = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const dx = pos[j].x - pos[i].x
      const dy = pos[j].y - pos[i].y
      const r2 = Math.max(dx * dx + dy * dy, 0.04)
      const inv = G / (r2 * Math.sqrt(r2))
      acc[i].x += dx * inv * masses[j]
      acc[i].y += dy * inv * masses[j]
      acc[j].x -= dx * inv * masses[i]
      acc[j].y -= dy * inv * masses[i]
    }
  }
  return acc
}

function rk4Step(bodies, h) {
  const masses = bodies.map((b) => b.m)
  const p0 = bodies.map((b) => b.pos.clone())
  const v0 = bodies.map((b) => b.vel.clone())

  const a1 = accelOf(p0, masses)
  const p1 = p0.map((p, i) => p.clone().addScaledVector(v0[i], h / 2))
  const v1 = v0.map((v, i) => v.clone().addScaledVector(a1[i], h / 2))
  const a2 = accelOf(p1, masses)
  const p2 = p0.map((p, i) => p.clone().addScaledVector(v1[i], h / 2))
  const v2 = v0.map((v, i) => v.clone().addScaledVector(a2[i], h / 2))
  const a3 = accelOf(p2, masses)
  const p3 = p0.map((p, i) => p.clone().addScaledVector(v2[i], h))
  const v3 = v0.map((v, i) => v.clone().addScaledVector(a3[i], h))
  const a4 = accelOf(p3, masses)

  bodies.forEach((b, i) => {
    b.pos
      .copy(p0[i])
      .addScaledVector(v0[i], h / 6)
      .addScaledVector(v1[i], h / 3)
      .addScaledVector(v2[i], h / 3)
      .addScaledVector(v3[i], h / 6)
    b.vel
      .copy(v0[i])
      .addScaledVector(a1[i], h / 6)
      .addScaledVector(a2[i], h / 3)
      .addScaledVector(a3[i], h / 3)
      .addScaledVector(a4[i], h / 6)
  })
}

/* ---------------- 发光点着色器（拖尾与星尘共用） ---------------- */
const POINT_VERT = `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;
uniform float uScale;
uniform float uGlobal;
varying float vAlpha;
varying vec3 vColor;
void main() {
  // 背景/拖尾逐帧完全静止（不随 uTime 变化）：
  // 任何逐帧亮度变化经 Bloom 降采样金字塔都会被放大成全屏闪烁
  vColor = aColor;
  vAlpha = aAlpha * uGlobal;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (uScale / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`

const POINT_FRAG = `
varying float vAlpha;
varying vec3 vColor;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  // 细粒子：小亮核 + 短光晕（密集时连成光河）
  float core = smoothstep(0.22, 0.03, d);
  float glow = smoothstep(0.5, 0.1, d) * 0.28;
  float a = core + glow;
  gl_FragColor = vec4(vColor * (0.7 + 0.7 * core), a * vAlpha);
}
`

function makePointsMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: POINT_VERT,
    fragmentShader: POINT_FRAG,
    uniforms: {
      uScale: { value: 1000 },
      uGlobal: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/* ---------------- 粒子拖尾（密集细粒子流） ---------------- */
class ParticleTrail {
  constructor(colorHex, capacity = 720) {
    this.cap = capacity
    this.cursor = 0
    this.emitAcc = 0 // 每帧多次发射的累加器
    this.positions = new Float32Array(capacity * 3)
    this.sizes = new Float32Array(capacity)
    this.alphas = new Float32Array(capacity)
    this.colors = new Float32Array(capacity * 3)
    this.ages = new Float32Array(capacity).fill(1e9)
    this.lives = new Float32Array(capacity).fill(1)
    this.size0 = new Float32Array(capacity)
    this.alpha0 = new Float32Array(capacity)

    this.geom = new THREE.BufferGeometry()
    this.geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage))
    this.geom.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1).setUsage(THREE.DynamicDrawUsage))
    this.geom.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1).setUsage(THREE.DynamicDrawUsage))
    this.geom.setAttribute('aColor', new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage))

    this.mat = makePointsMaterial()
    this.points = new THREE.Points(this.geom, this.mat)
    this.points.frustumCulled = false

    this.base = new THREE.Color(colorHex)
  }

  /** 每帧发射 n 个粒子（沿上一位置→当前位置插值散布） */
  emitMany(p, prev, n) {
    for (let k = 0; k < n; k++) {
      const i = this.cursor
      this.cursor = (this.cursor + 1) % this.cap
      const t = n === 1 ? 1 : k / (n - 1)
      // 线性插值回溯 + 微小抖动（粒子流而非实线）
      this.positions[i * 3] = prev.x + (p.x - prev.x) * t + (Math.random() - 0.5) * 0.06
      this.positions[i * 3 + 1] = prev.y + (p.y - prev.y) * t + (Math.random() - 0.5) * 0.06
      this.positions[i * 3 + 2] = p.z
      this.ages[i] = 0
      this.lives[i] = 40 + Math.random() * 50
      this.size0[i] = 0.045 + Math.random() * 0.05
      this.alpha0[i] = 0.3 + Math.random() * 0.22
      // 轻微色温变化，像燃烧的余烬
      const c = 0.82 + Math.random() * 0.28
      this.colors[i * 3] = this.base.r * c
      this.colors[i * 3 + 1] = this.base.g * c
      this.colors[i * 3 + 2] = this.base.b * c
    }
  }

  update() {
    for (let i = 0; i < this.cap; i++) {
      if (this.ages[i] >= this.lives[i]) {
        this.alphas[i] = 0
        continue
      }
      this.ages[i]++
      const t = this.ages[i] / this.lives[i]
      const fade = Math.pow(1 - t, 1.6)
      this.alphas[i] = this.alpha0[i] * fade
      this.sizes[i] = this.size0[i] * (1 - 0.4 * t)
    }
    this.geom.attributes.position.needsUpdate = true
    this.geom.attributes.aSize.needsUpdate = true
    this.geom.attributes.aAlpha.needsUpdate = true
    this.geom.attributes.aColor.needsUpdate = true
  }

  clear() {
    this.ages.fill(1e9)
    this.alphas.fill(0)
    this.geom.attributes.aAlpha.needsUpdate = true
  }

  setGlobal(k) {
    this.mat.uniforms.uGlobal.value = k
  }

  dispose() {
    this.geom.dispose()
    this.mat.dispose()
  }
}

/* ---------------- 背景素材 ---------------- */

/** 质量光斑贴图（mass spot）：白热内核 + 急速衰减 + 极淡外晕 */
function makeSpotTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.05, 'rgba(255,255,255,1)') // 实心内核
  g.addColorStop(0.1, 'rgba(255,255,255,0.7)')
  g.addColorStop(0.2, 'rgba(255,255,255,0.22)')
  g.addColorStop(0.42, 'rgba(255,255,255,0.05)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(c)
}

/**
 * 程序化星图天空（与黑洞 demo 完全相同的 starField 着色器）
 * 反向大球做天空盒，逐像素按视线方向计算星点。
 */
const SKY_VERT = `
varying vec3 vWorldPos;
void main() {
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const SKY_FRAG = `
const float PI = 3.14159265359;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 starField(vec3 dir) {
  vec3 col = vec3(0.0);
  // 将方向映射到球面网格
  vec2 uv = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0)));
  for (int i = 0; i < 3; i++) {
    float scale = 90.0 * pow(1.7, float(i));
    vec2 cell = floor(uv * scale / PI);
    vec2 f = fract(uv * scale / PI) - 0.5;
    float h = hash(cell + float(i) * 17.0);
    if (h > 0.97) {
      float d = length(f);
      float star = smoothstep(0.16, 0.0, d) * (h - 0.97) / 0.03;
      // 少量彩色星
      vec3 sc = mix(vec3(1.0), vec3(1.0, 0.85, 0.7), hash(cell + 3.0));
      col += star * sc * 0.8;
    }
  }
  return col;
}

uniform vec3 uCamPos;
varying vec3 vWorldPos;
void main() {
  vec3 dir = normalize(vWorldPos - uCamPos);
  gl_FragColor = vec4(starField(dir), 1.0);
}
`

function makeStarfieldSky() {
  const mat = new THREE.ShaderMaterial({
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    uniforms: { uCamPos: { value: new THREE.Vector3(0, 0, 10) } },
    side: THREE.BackSide,
    depthWrite: false,
  })
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(45, 48, 32), mat)
  mesh.renderOrder = -1
  return mesh
}

/* ---------------- 场景生命周期 ---------------- */
let renderer, scene, camera, composer, raf = 0
let bodies, trails, starCores
let starfieldSky
let dragRaycaster, ro = null
let dragging = null
let spotTex = null

/* 配色（发光点体系：光斑星体 + 粒子流） */
const STAR_COLORS = ['#eda86e', '#7fc0dc', '#b9a0dc']
const TRAIL_COLORS = ['#e0925a', '#6cb2d2', '#ab8cd6']
const WHITE = new THREE.Color('#ffffff')
const SPACE_BG = 0x0c0a09

/* 解散保护状态机 */
const ESCAPE_R = 7.8
let phase = 'run'
let phaseT = 0
let universeSeq = 1
const FADE_FRAMES = 42
const prevPos = [] // 上一帧星体位置（拖尾插值用）

function buildScene() {
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(hostRef.value.clientWidth, hostRef.value.clientHeight)
  hostRef.value.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.background = new THREE.Color(SPACE_BG)
  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
  camera.position.set(0, 0, 10)

  spotTex = makeSpotTexture()

  // 背景：程序化星图天空（与黑洞 demo 同款 starField 着色器）
  starfieldSky = makeStarfieldSky()
  scene.add(starfieldSky)

  bodies = makeBodies(props.preset)
  prevPos.length = 0
  bodies.forEach((b) => prevPos.push(b.pos.clone()))

  trails = TRAIL_COLORS.map((hex) => {
    const t = new ParticleTrail(hex)
    scene.add(t.points)
    return t
  })

  // 星体 = 质量光斑（双层 sprite：内核 + 外晕，颜色随质量注入）
  starCores = []
  bodies.forEach((b, i) => {
    const g = new THREE.Group()

    const core = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: spotTex,
        color: new THREE.Color(STAR_COLORS[i]).lerp(WHITE, 0.55), // 内核偏白热
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 1,
      }),
    )
    core.scale.setScalar(0.5 + b.m * 0.12)
    g.add(core)

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: spotTex,
        color: STAR_COLORS[i],
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 0.34,
      }),
    )
    glow.scale.setScalar(1.5 + b.m * 0.38)
    g.add(glow)

    scene.add(g)
    starCores.push(g)
  })

  dragRaycaster = new THREE.Raycaster()
  ro = new ResizeObserver(onResize)
  ro.observe(hostRef.value)

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointercancel', onPointerUp)

  // 后期链：pmndrs/postprocessing（默认 UnsignedByteType 帧缓冲，核显安全）
  composer = new EffectComposer(renderer, { frameBufferType: THREE.UnsignedByteType })
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new BloomEffect({
    intensity: 0.9,
    luminanceThreshold: 0.32,
    luminanceSmoothing: 0.3,
    kernelSize: KernelSize.LARGE,
  })
  composer.addPass(new EffectPass(camera, bloom))

  onResize()
  raf = requestAnimationFrame(tick)
}

let lastW = 0
let lastH = 0
function onResize() {
  if (!hostRef.value || !renderer) return
  const w = hostRef.value.clientWidth
  const h = hostRef.value.clientHeight
  if (w < 2 || h < 2) return
  if (w === lastW && h === lastH) return // 防抖：尺寸未变不重设（避免循环触发）
  lastW = w
  lastH = h
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
  composer?.setSize(w, h)

  // 点大小随分辨率缩放（保持视觉尺寸一致）
  const dpr = renderer.getPixelRatio()
  const ph = Math.floor(h * dpr)
  const scale = ph / (2 * Math.tan((camera.fov * Math.PI) / 360))
  trails.forEach((t) => (t.mat.uniforms.uScale.value = scale))
  // 星图天空随相机（当前相机固定，防御性同步）
  starfieldSky?.material?.uniforms?.uCamPos?.value?.copy(camera.position)
}

function pointerToScene(e) {
  const rect = renderer.domElement.getBoundingClientRect()
  const ndc = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1,
  )
  dragRaycaster.setFromCamera(ndc, camera)
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const out = new THREE.Vector3()
  return dragRaycaster.ray.intersectPlane(plane, out) ? out : null
}

function onPointerDown(e) {
  const p = pointerToScene(e)
  if (!p) return
  let best = -1
  let bestDist = 0.45
  bodies.forEach((b, i) => {
    const d = b.pos.distanceTo(p)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  if (best >= 0) {
    dragging = best
    renderer.domElement.style.cursor = 'grabbing'
    renderer.domElement.setPointerCapture(e.pointerId)
  }
}

function onPointerMove(e) {
  if (dragging === null) return
  const p = pointerToScene(e)
  if (!p) return
  const b = bodies[dragging]
  b.pos.copy(p)
  b.vel.set(0, 0, 0)
  prevPos[dragging].copy(p) // 拖拽时不留拖尾断点
}

function onPointerUp() {
  dragging = null
  renderer.domElement.style.cursor = 'grab'
}

/** 星体光斑基准尺寸（内核/外晕，重生时按新质量重设） */
function coreScale(m) {
  return 0.5 + m * 0.12
}
function glowScale(m) {
  return 1.5 + m * 0.38
}

/** 宇宙整体淡入淡出 */
function setUniverseVisibility(k) {
  const kk = Math.max(k, 0.001)
  bodies.forEach((b, i) => {
    const g = starCores[i]
    g.children[0].scale.setScalar(coreScale(b.m) * kk)
    g.children[1].scale.setScalar(glowScale(b.m) * kk)
  })
  trails.forEach((t) => t.setGlobal(k))
}

function tick() {
  raf = requestAnimationFrame(tick)

  if (phase === 'run') {
    if (dragging === null) {
      for (let s = 0; s < SUBSTEPS; s++) rk4Step(bodies, DT)
    }
    const escaped = bodies.some((b) => b.pos.length() > ESCAPE_R)
    const blown = bodies.some((b) => b.vel.length() > 12)
    if ((escaped || blown) && dragging === null) {
      phase = 'fadeOut'
      phaseT = 0
    }
  } else if (phase === 'fadeOut') {
    phaseT++
    setUniverseVisibility(Math.max(1 - phaseT / FADE_FRAMES, 0))
    if (phaseT >= FADE_FRAMES) {
      bodies = randomChaosBodies()
      universeSeq++
      emit('universe', universeSeq)
      prevPos.forEach((p, i) => p.copy(bodies[i].pos))
      trails.forEach((tr) => tr.clear())
      bodies.forEach((b, i) => {
        // 质量变了：光斑尺寸 + 颜色按新质量/序号重设
        const g = starCores[i]
        g.children[0].scale.setScalar(coreScale(b.m))
        g.children[1].scale.setScalar(glowScale(b.m))
        g.children[0].material.color.set(STAR_COLORS[i]).lerp(WHITE, 0.55)
        g.children[1].material.color.set(STAR_COLORS[i])
      })
      phase = 'fadeIn'
      phaseT = 0
    }
  } else if (phase === 'fadeIn') {
    phaseT++
    setUniverseVisibility(Math.min(phaseT / FADE_FRAMES, 1))
    if (phaseT >= FADE_FRAMES) phase = 'run'
  }

  // 拖尾发射与更新：沿运动路径插值补粒子（密集流），快速时发更多
  if (phase !== 'fadeOut') {
    bodies.forEach((b, i) => {
      const prev = prevPos[i]
      const dist = prev.distanceTo(b.pos)
      const n = Math.max(2, Math.min(7, Math.round(dist / 0.045)))
      trails[i].emitMany(b.pos, prev, n)
      prev.copy(b.pos)
    })
  }
  trails.forEach((tr) => tr.update())

  // 星体位置
  bodies.forEach((b, i) => {
    starCores[i].position.copy(b.pos)
  })

  composer.render()
}

onMounted(buildScene)

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  trails?.forEach((t) => t.dispose())
  composer?.dispose()
  spotTex?.dispose()
  starfieldSky?.geometry?.dispose()
  starfieldSky?.material?.dispose()
  renderer?.dispose()
  renderer?.domElement?.remove()
})
</script>

<template>
  <!-- 深空视窗：高度由外部类控制 -->
  <div
    ref="hostRef"
    class="threebody-host block w-full cursor-grab overflow-hidden rounded-2xl border border-white/10 bg-[#0c0a09] shadow-[inset_0_0_90px_rgba(0,0,0,0.6)]"
  />
</template>

<style scoped>
.threebody-host :deep(canvas) {
  display: block;
}
</style>
