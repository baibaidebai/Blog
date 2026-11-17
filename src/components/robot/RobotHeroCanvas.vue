<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'

const props = defineProps({
  urdf: { type: String, default: '/models/cod-balance/COD_2026_Balance_2_0.urdf' },
})

const hostRef = ref(null)
let renderer, scene, camera, raf = 0, resizeObserver, robot, pointerMove
let yaw = -0.62
let pitch = -Math.PI / 2 + 0.08
let distance = 1.9
let targetYaw = yaw
let targetPitch = pitch

function parseTuple(value = '') {
  return value.trim().split(/\s+/).map(Number)
}

function originOf(node) {
  const el = node?.querySelector(':scope > origin')
  const xyz = parseTuple(el?.getAttribute('xyz') || '0 0 0')
  const rpy = parseTuple(el?.getAttribute('rpy') || '0 0 0')
  return { xyz, rpy }
}

function applyOrigin(object, origin) {
  object.position.set(...origin.xyz)
  object.rotation.set(origin.rpy[0] || 0, origin.rpy[1] || 0, origin.rpy[2] || 0)
}

async function loadRobot() {
  const xml = await fetch(props.urdf).then((r) => r.text())
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const links = new Map([...doc.querySelectorAll('link')].map((link) => [link.getAttribute('name'), link]))
  const joints = [...doc.querySelectorAll('joint')]
  const children = new Map()
  const childNames = new Set()
  joints.forEach((joint) => {
    const parent = joint.querySelector(':scope > parent')?.getAttribute('link')
    const child = joint.querySelector(':scope > child')?.getAttribute('link')
    if (!parent || !child) return
    children.set(parent, [...(children.get(parent) || []), { joint, child }])
    childNames.add(child)
  })

  const rootName = [...links.keys()].find((name) => !childNames.has(name)) || 'base_link'
  const loader = new STLLoader()
  const cache = new Map()
  const loadMesh = (file) => {
    if (!cache.has(file)) cache.set(file, new Promise((resolve, reject) => loader.load(`/models/cod-balance/${file}`, resolve, undefined, reject)))
    return cache.get(file)
  }
  const armorMaterial = new THREE.MeshStandardMaterial({ color: 0xc4d0da, metalness: 0.64, roughness: 0.3 })
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x526675, metalness: 0.72, roughness: 0.28 })
  const jointMaterial = new THREE.MeshStandardMaterial({ color: 0xf09a62, metalness: 0.5, roughness: 0.32 })
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x3f4c56, metalness: 0.44, roughness: 0.42 })

  async function buildLink(name) {
    const link = links.get(name)
    const group = new THREE.Group()
    const visual = link?.querySelector(':scope > visual')
    const file = visual?.querySelector('mesh')?.getAttribute('filename')
    if (file) {
      const geometry = await loadMesh(file)
      geometry.computeVertexNormals()
      const lowerName = name.toLowerCase()
      const meshMaterial = lowerName.includes('wheel')
        ? wheelMaterial
        : lowerName.includes('child2') || lowerName.includes('child3')
          ? jointMaterial
          : lowerName.includes('base') || lowerName.includes('rear')
            ? frameMaterial
            : armorMaterial
      const mesh = new THREE.Mesh(geometry, meshMaterial)
      applyOrigin(mesh, originOf(visual))
      group.add(mesh)
    }
    for (const item of children.get(name) || []) {
      const childGroup = await buildLink(item.child)
      applyOrigin(childGroup, originOf(item.joint))
      group.add(childGroup)
    }
    return group
  }

  return buildLink(rootName)
}

function init() {
  const host = hostRef.value
  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2(0x0b1116, 0.12)
  camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100)
  camera.position.set(1.45, 0.72, 1.9)
  camera.lookAt(0, 0.05, 0)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.45
  host.appendChild(renderer.domElement)

  scene.add(new THREE.HemisphereLight(0xdcecff, 0x26313a, 2.25))
  const key = new THREE.DirectionalLight(0xffe2c2, 4.2)
  key.position.set(2, 3, 2)
  scene.add(key)
  const rim = new THREE.PointLight(0x65b9ff, 10, 5)
  rim.position.set(-1.5, 0.6, -1.3)
  scene.add(rim)

  const grid = new THREE.GridHelper(4, 24, 0x234052, 0x152630)
  grid.position.y = -0.32
  grid.material.transparent = true
  grid.material.opacity = 0.38
  scene.add(grid)

  loadRobot().then((loaded) => {
    robot = loaded
    // URDF / SolidWorks 使用 Z-up，Three.js 场景使用 Y-up
    robot.rotation.set(-Math.PI / 2 + 0.08, -0.62, 0.02)
    robot.position.set(0.1, 0.14, 0)
    robot.scale.setScalar(1.3)
    scene.add(robot)
  }).catch((error) => console.error('Robot model failed to load', error))

  pointerMove = (event) => {
    const x = event.clientX / window.innerWidth - 0.5
    const y = event.clientY / window.innerHeight - 0.5
    targetYaw = -0.62 + x * 0.34
    targetPitch = -Math.PI / 2 + 0.08 + y * 0.16
  }
  window.addEventListener('pointermove', pointerMove, { passive: true })
  resizeObserver = new ResizeObserver(() => {
    const w = host.clientWidth, h = host.clientHeight
    if (w < 2 || h < 2) return
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  })
  resizeObserver.observe(host)

  const start = performance.now()
  const tick = (now) => {
    raf = requestAnimationFrame(tick)
    const t = (now - start) * 0.001
    const px = Number(host.style.getPropertyValue('--robot-x')) || 0
    const py = Number(host.style.getPropertyValue('--robot-y')) || 0
    if (robot) {
      yaw += (targetYaw - yaw) * 0.045
      pitch += (targetPitch - pitch) * 0.045
      // 当前模型导入后的局部轴向中，Z 轴对应水平转向，X 轴对应俯仰
      robot.rotation.z = yaw
      robot.rotation.x = pitch
      robot.rotation.y = 0
      robot.position.y = 0.14 + Math.sin(t * 0.8) * 0.008
      camera.position.z += (distance - camera.position.z) * 0.08
      camera.lookAt(0, 0.05, 0)
    }
    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(tick)
}

onMounted(init)
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  resizeObserver?.disconnect()
  if (pointerMove) window.removeEventListener('pointermove', pointerMove)
  renderer?.dispose()
  renderer?.domElement?.remove()
})
</script>

<template>
  <div ref="hostRef" class="robot-hero-host" aria-hidden="true" />
</template>

<style scoped>
.robot-hero-host { width: 100%; height: 100%; min-height: 420px; pointer-events: none; user-select: none; }
.robot-hero-host :deep(canvas) { display: block; width: 100%; height: 100%; }
</style>
