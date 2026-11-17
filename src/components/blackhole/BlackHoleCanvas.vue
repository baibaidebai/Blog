<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useTheme } from '@/composables/useTheme'

/**
 * 黑洞 —— WebGL2 全屏 fragment shader
 * - 史瓦西度规下光子测地线数值积分（简化：弯曲 + 视界判定）
 * - 吸积盘：赤道面圆盘，径向温度渐变 + 多普勒增亮（简化 beaming）
 * - 背景星空：shader 内程序化生成
 * - 两种形态：
 *   demo 模式（interactive=true）：拖拽改变相机方位/俯仰，滚轮改变距离
 *   hero 模式（interactive=false）：跟随鼠标小幅偏转（±0.12 rad，阻尼缓动），
 *     无自动旋转（避免晕眩）；分辨率更低；滚轮不拦截页面滚动
 * - 亮色模式下整体降低存在感并加暖色蒙版
 */

const props = defineProps({
  /** false = hero 背景模式：跟随鼠标小幅偏转，无自动旋转，分辨率更低 */
  interactive: { type: Boolean, default: true },
})

const hostRef = ref(null)
const { theme } = useTheme()

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCam;      // 相机轨道参数: x=方位角 y=俯仰角 z=距离
uniform vec2 uSwirl;    // 吸积盘旋转角（JS 侧已 mod 2π：防相位累积精度退化）
uniform vec3 uTint;     // 亮色模式暖色蒙版
uniform float uDim;     // 亮色模式整体压暗

out vec4 fragColor;

const float PI = 3.14159265359;

/* ---------- 程序化星空 ---------- */
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

/* ---------- 吸积盘颜色（黑体近似） ---------- */
vec3 diskColor(float r) {
  // 内缘炽白偏蓝，外侧橙红
  float t = clamp((r - 1.6) / 4.0, 0.0, 1.0);
  vec3 hot = vec3(1.0, 0.96, 0.9);
  vec3 mid = vec3(1.0, 0.72, 0.35);
  vec3 cool = vec3(0.75, 0.3, 0.1);
  return t < 0.35 ? mix(hot, mid, t / 0.35) : mix(mid, cool, (t - 0.35) / 0.65);
}

void main() {
  vec2 frag = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);

  // 相机
  float az = uCam.x, el = uCam.y, dist = uCam.z;
  vec3 ro = vec3(
    dist * cos(el) * cos(az),
    dist * sin(el),
    dist * cos(el) * sin(az)
  );
  vec3 fwd = normalize(-ro);
  vec3 right = normalize(cross(vec3(0, 1, 0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(frag.x * right + frag.y * up + fwd * 1.6);

  // 光子按伪牛顿方式弯曲（视觉近似测地线）
  vec3 p = ro;
  vec3 v = rd;
  float captured = 0.0;
  vec3 acc = vec3(0.0);   // 累积发光
  float transmittance = 1.0;

  const int STEPS = 260;
  for (int i = 0; i < STEPS; i++) {
    float r = length(p);
    if (r < 1.0) { captured = 1.0; break; }          // 落入视界
    if (r > 14.0 && dot(p, v) > 0.0) break;          // 逃离
    float dt = 0.035 + r * 0.026;

    // 引力弯曲（1/r^2 指向中心，光子速度恒定）
    vec3 g = -p / (r * r * r) * 1.55;
    v = normalize(v + g * dt);
    vec3 np = p + v * dt;

    // 吸积盘采样（穿过赤道面时）
    if (p.y * np.y < 0.0) {
      float t = -p.y / (np.y - p.y);
      vec3 hit = mix(p, np, t);
      float hr = length(hit.xz);
      if (hr > 1.45 && hr < 6.2) {
        // 旋转条纹：双谐波、双角速（内快外慢的观感）
        // 旋转角由 JS 侧 mod 2π 后传入 —— 相位永不累积，长时间运行不退化（年轮 bug 根治）
        float ang = atan(hit.z, hit.x);
        float s1 = sin(2.0 * ang + uSwirl.x + hr * 3.2);  // 快谐波（宽条纹）
        float s2 = sin(3.0 * ang + uSwirl.y + hr * 5.0);  // 慢谐波（细条纹）
        // 密度：径向衰减 + 双速旋转条纹（内外缘用 smoothstep 柔化）
        float density = smoothstep(6.2, 3.6, hr) * smoothstep(1.45, 2.3, hr);
        density *= 0.55 + 0.45 * (0.62 * s1 + 0.38 * s2);
        density = max(density, 0.0);
        // 多普勒增亮：盘转动朝向观察者一侧
        vec3 velDir = normalize(vec3(-hit.z, 0.0, hit.x));
        float doppler = 1.0 + 0.85 * dot(velDir, -v);
        vec3 dc = diskColor(hr) * density * doppler * 1.35;
        float a = clamp(density * 0.85, 0.0, 1.0) * transmittance;
        acc += dc * a;
        transmittance *= (1.0 - a * 0.7);
      }
    }
    p = np;
  }

  // 背景
  vec3 col = acc;
  if (captured < 0.5 && transmittance > 0.02) {
    col += starField(v) * transmittance;
  }

  // 光子环增亮（视界附近的强弯曲表现为细亮环，靠盘内缘发光自然形成）

  // 色调映射
  col = col / (col + vec3(1.0));
  col = pow(col, vec3(0.4545));

  // 抖动去色带（消解吸积盘渐变上的条带）
  float dither = (hash(gl_FragCoord.xy + fract(uTime) * 61.7) - 0.5) / 255.0;
  col += dither;

  // 亮色模式暖蒙版 + 压暗
  col = mix(col, col * uTint, uDim * 0.85);
  col *= (1.0 - uDim * 0.35);

  fragColor = vec4(col, 1.0);
}
`

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

let gl, program, raf = 0, uniforms = {}
let cam = { az: 0.6, el: 0.24, dist: 7.5 }
let dragging = false, lastX = 0, lastY = 0
let ro = null
let canvas = null
let startT = performance.now()
let onMouseMove = null

function compile(type, src) {
  const s = gl.createShader(type)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(s))
  }
  return s
}

function init() {
  canvas = document.createElement('canvas')
  canvas.style.cssText = props.interactive
    ? 'display:block;width:100%;height:100%;cursor:grab'
    : 'display:block;width:100%;height:100%'
  hostRef.value.appendChild(canvas)

  gl = canvas.getContext('webgl2', { antialias: false })
  if (!gl) {
    hostRef.value.innerHTML = '<p style="padding:40px;color:#888">当前浏览器不支持 WebGL2</p>'
    return
  }

  const vs = compile(gl.VERTEX_SHADER, VERT)
  const fs = compile(gl.FRAGMENT_SHADER, FRAG)
  program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program))
  }
  gl.useProgram(program)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  for (const name of ['uRes', 'uTime', 'uCam', 'uSwirl', 'uTint', 'uDim']) {
    uniforms[name] = gl.getUniformLocation(program, name)
  }

  // 内部分辨率：demo 0.85×DPR；hero 背景层 0.55×DPR（不需要锐度，省性能）
  const resScale = props.interactive ? 0.85 : 0.55
  const resize = () => {
    if (!hostRef.value || !canvas) return
    const w = hostRef.value.clientWidth
    const h = hostRef.value.clientHeight
    if (w < 2 || h < 2) return
    const dpr = Math.max(Math.min(window.devicePixelRatio, 2) * resScale, (h * 1.0) / h)
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    gl.viewport(0, 0, canvas.width, canvas.height)
  }
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(hostRef.value)

  if (props.interactive) {
    // 拖拽
    canvas.addEventListener('pointerdown', (e) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      canvas.setPointerCapture(e.pointerId)
      canvas.style.cursor = 'grabbing'
    })
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return
      cam.az += (e.clientX - lastX) * 0.005
      cam.el = Math.max(-1.35, Math.min(1.35, cam.el + (e.clientY - lastY) * 0.004))
      lastX = e.clientX
      lastY = e.clientY
    })
    const endDrag = () => {
      dragging = false
      canvas.style.cursor = 'grab'
    }
    canvas.addEventListener('pointerup', endDrag)
    canvas.addEventListener('pointercancel', endDrag)
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault()
      cam.dist = Math.max(3.2, Math.min(13, cam.dist + e.deltaY * 0.004))
    }, { passive: false })
  }

  // hero 模式：跟随鼠标小幅偏转（视差），离开窗口回正
  const HOME_AZ = 0.6
  const HOME_EL = 0.24
  let targetAz = HOME_AZ
  let targetEl = HOME_EL

  if (!props.interactive) {
    onMouseMove = (e) => {
      // 鼠标在视口内的归一化位置 → ±0.12 rad 偏转
      targetAz = HOME_AZ + (e.clientX / window.innerWidth - 0.5) * 0.24
      targetEl = HOME_EL - (e.clientY / window.innerHeight - 0.5) * 0.16
    }
    window.addEventListener('pointermove', onMouseMove, { passive: true })
  }

  const TAU = Math.PI * 2
  const loop = () => {
    raf = requestAnimationFrame(loop)
    if (!props.interactive) {
      // 阻尼缓动到目标角度（丝滑跟随，不突变）
      cam.az += (targetAz - cam.az) * 0.045
      cam.el += (targetEl - cam.el) * 0.045
    }
    const t = (performance.now() - startT) / 1000
    // 吸积盘旋转角：JS 双精度计算后 mod 2π（GPU sin 大参数精度崩坏 → 年轮 bug）
    gl.uniform2f(uniforms.uRes, canvas.width, canvas.height)
    gl.uniform1f(uniforms.uTime, t)
    gl.uniform2f(
      uniforms.uSwirl,
      (2.2 * t) % TAU,        // 快谐波相位（开普勒内圈角速）
      (2.2 * t * 0.36) % TAU, // 慢谐波相位（外圈更慢）
    )
    gl.uniform3f(uniforms.uCam, cam.az, cam.el, cam.dist)
    const dark = theme.value === 'dark'
    gl.uniform3f(uniforms.uTint, 1.05, 0.95, 0.82)
    gl.uniform1f(uniforms.uDim, dark ? 0.0 : 1.0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }
  loop()
}

onMounted(init)

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  onMouseMove && window.removeEventListener('pointermove', onMouseMove)
  gl?.getExtension('WEBGL_lose_context')?.loseContext()
  hostRef.value?.firstChild?.remove()
})
</script>

<template>
  <!-- 高度完全由外部类控制；不写 h-full，理由同 ThreeBodyCanvas -->
  <div ref="hostRef" class="block w-full" />
</template>
