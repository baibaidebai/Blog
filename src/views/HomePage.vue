<script setup>
import { defineAsyncComponent, onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  Code2Icon,
  TrophyIcon,
  LayersIcon,
  HeartHandshakeIcon,
  ArrowRightIcon,
  GithubIcon,
  TerminalIcon,
  FileTextIcon,
  ExternalLinkIcon,
} from 'lucide-vue-next'
import { getAllPosts } from '@/utils/posts.js'

// 黑洞宇宙底层：异步加载（纯 WebGL 着色器，体积小），fixed 铺满视口不随滚动
const RobotHero = defineAsyncComponent(() =>
  import('@/components/robot/RobotHeroCanvas.vue'),
)

/* Hero 滚动渐隐：组件层上移时标题轻微视差 + 透明度衰减 */
const heroFade = ref(0)

const typingWords = ['Vue 3', 'Rust', 'TypeScript', '算法', '系统设计', '前端工程化']
const typingIndex = ref(0)
const typedText = ref('')
const isDeleting = ref(false)

/* Hero 打字机：打 110ms/字 → 停 2.5s → 删 55ms/字 → 停 0.4s → 下一个词 */
let typerTimer = null

function scheduleTyping(delay, fn) {
  clearTimeout(typerTimer)
  typerTimer = setTimeout(fn, delay)
}

function typingStep() {
  const word = typingWords[typingIndex.value]
  if (!isDeleting.value) {
    typedText.value = word.slice(0, typedText.value.length + 1)
    if (typedText.value === word) {
      // 打完整词：停 2.5s 再开始删
      scheduleTyping(2500, () => {
        isDeleting.value = true
        typingStep()
      })
      return
    }
    scheduleTyping(110, typingStep)
  } else {
    typedText.value = word.slice(0, Math.max(0, typedText.value.length - 1))
    if (typedText.value === '') {
      isDeleting.value = false
      typingIndex.value = (typingIndex.value + 1) % typingWords.length
      // 删完：停 0.4s 再打下一个词
      scheduleTyping(400, typingStep)
      return
    }
    scheduleTyping(55, typingStep)
  }
}

/* Hero 滚动渐隐 */
let onScroll = null

onMounted(() => {
  // 进页强制回顶（黑洞 hero 在顶部；防止路由切换时残留滚动位置）
  // nextTick：等 DOM 高度就绪再归零，避免被浏览器钳在旧文档高度上
  nextTick(() => window.scrollTo(0, 0))

  const update = () => {
    heroFade.value = Math.min(window.scrollY / (window.innerHeight * 0.6), 1)
  }
  update()
  onScroll = update
  window.addEventListener('scroll', onScroll, { passive: true })

  typingStep()
})

onBeforeUnmount(() => {
  clearTimeout(typerTimer)
  onScroll && window.removeEventListener('scroll', onScroll)
})

const features = [
  {
    title: '学习笔记',
    description: '记录嵌入式、控制算法与机器人系统中的学习与思考。',
    to: '/blog',
    icon: Code2Icon,
  },
  {
    title: '项目与竞赛',
    description: '展示 RoboMaster 项目、机器人模块与竞赛工程实践。',
    to: '/projects',
    icon: TrophyIcon,
  },
  {
    title: '软硬件协同',
    description: '从传感器、控制器到上位机，持续探索完整的机器人系统。',
    to: '/projects',
    icon: LayersIcon,
  },
  {
    title: '开源记录',
    description: '在 GitHub 分享代码与实验记录，沉淀可复用的工程经验。',
    href: 'https://github.com',
    icon: HeartHandshakeIcon,
  },
]

const recentPosts = getAllPosts().slice(0, 3)

const rmHighlights = [
  { value: 'RM', label: '竞赛主线' },
  { value: 'C/C++', label: '控制与通信' },
  { value: 'CV', label: '视觉感知' },
]

const skillGroups = [
  {
    title: '机器人控制',
    subtitle: 'CONTROL SYSTEMS',
    description: '从传感器反馈到执行器响应，关注稳定、实时的控制链路。',
    tags: ['C/C++', 'PID', 'CAN', '姿态估计'],
    icon: LayersIcon,
  },
  {
    title: '计算机视觉',
    subtitle: 'PERCEPTION',
    description: '围绕目标识别、跟踪与坐标解算构建机器人感知输入。',
    tags: ['OpenCV', '装甲板', '目标跟踪'],
    icon: TrophyIcon,
  },
  {
    title: '工程开发',
    subtitle: 'ENGINEERING',
    description: '用现代前端和工程工具整理实验、项目与知识输出。',
    tags: ['Vue 3', 'TypeScript', 'Git', 'Vite'],
    icon: Code2Icon,
  },
  {
    title: '未来方向',
    subtitle: 'NEXT STEP',
    description: '继续向具身智能、模仿学习与机器人系统研发深入。',
    tags: ['具身智能', '模仿学习', '机器人系统'],
    icon: HeartHandshakeIcon,
  },
]

</script>

<template>
  <div class="relative pb-16">
    <!-- ============ 黑洞宇宙底层：固定视口，不随滚动 ============ -->
    <div aria-hidden="true" class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <RobotHero class="pointer-events-none !block h-full w-full" />
      <!-- 均匀薄纱压暗：黑洞全程可见，文字对比度由各组件自行保障 -->
      <div
        class="pointer-events-none absolute inset-0"
        style="
          background:
            linear-gradient(90deg,
              color-mix(in srgb, var(--color-background) 96%, transparent) 0%,
              color-mix(in srgb, var(--color-background) 78%, transparent) 42%,
              color-mix(in srgb, var(--color-background) 25%, transparent) 100%),
            radial-gradient(circle at 75% 50%, transparent 0%, color-mix(in srgb, var(--color-background) 35%, transparent) 72%);
        "
      />
    </div>

    <!-- ============ 组件上层：随滚动整体上移 ============ -->
    <!-- Hero：全屏高度，滚动时标题渐隐上移（视差） -->
    <section
      class="pointer-events-none relative flex min-h-[calc(100svh-4rem)] items-center"
      :style="{
        opacity: 1 - heroFade,
        transform: `translateY(${heroFade * -48}px)`,
      }"
    >
      <div class="container-blog pointer-events-none w-full text-center">
        <!-- 状态徽章 -->
        <div class="mb-7 flex justify-center">
          <div class="glass-surface flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-muted-foreground">
            <span class="relative flex size-1.5">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60"
              ></span>
              <span class="relative inline-flex size-1.5 rounded-full bg-accent"></span>
            </span>
            v2026 — 持续更新中
          </div>
        </div>

        <h1
          class="mx-auto max-w-4xl font-serif text-[clamp(3.2rem,8.5vw,6.2rem)] leading-[1.05] font-bold tracking-tight text-foreground"
        >
          欢迎来到
          <span
            class="bg-gradient-to-br from-accent to-[color-mix(in_srgb,var(--color-accent)_70%,#9c7550)] bg-clip-text text-transparent"
          >
            BaiBaideBai
          </span>
        </h1>

        <p class="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          一个专注技术、记录成长、分享创造的个人空间。<br />
          探索代码与设计的无限可能。
        </p>

        <!-- 打字机 -->
        <div class="mt-8 flex justify-center">
          <div
            class="glass-surface inline-flex items-center gap-3 rounded-lg px-4 py-2 text-left"
          >
            <TerminalIcon class="size-4 text-accent" />
            <code class="font-mono text-sm text-foreground/90">
              <span class="text-muted-foreground">~/skills&gt;</span>
              {{ typedText
              }}<span class="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-accent align-middle"></span>
            </code>
          </div>
        </div>

        <div class="mt-9 flex flex-wrap items-center justify-center gap-3.5">
          <router-link
            to="/projects"
            class="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:opacity-90"
          >
            查看作品
            <ArrowRightIcon class="size-4" />
          </router-link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener"
            class="glass-surface glass-hover pointer-events-auto inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-foreground"
          >
            <GithubIcon class="size-4" />
            GitHub 仓库
          </a>
        </div>
      </div>
    </section>

    <!-- ============ 组件上层（滚动区）：黑洞透过毛玻璃可见 ============ -->
    <div class="relative">
    <!-- ============ 特性卡片 ============ -->
    <section class="py-10 md:py-14">
      <div class="container-blog">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <component
            :is="f.to ? 'router-link' : 'a'"
            v-for="f in features"
            :key="f.title"
            v-bind="f.to ? { to: f.to } : { href: f.href, target: '_blank', rel: 'noopener' }"
            class="block"
          >
            <GlassCard interactive class="group h-full p-6">
              <div
                class="mb-4 flex size-9.5 items-center justify-center rounded-lg text-accent"
                style="background: color-mix(in srgb, var(--color-accent) 13%, transparent)"
              >
                <component :is="f.icon" class="size-5" />
              </div>
              <h3 class="mb-1.5 font-serif text-[1.1rem] font-semibold tracking-tight text-foreground">
                {{ f.title }}
              </h3>
              <p class="text-sm leading-relaxed text-muted-foreground">{{ f.description }}</p>
              <span
                class="mt-4 inline-flex size-7.5 items-center justify-center rounded-full transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                style="
                  background: color-mix(in srgb, var(--color-accent) 10%, transparent);
                  color: var(--color-accent);
                "
              >
                <ArrowRightIcon class="size-3.5 -rotate-45" />
              </span>
            </GlassCard>
          </component>
        </div>
      </div>
    </section>

    <!-- ============ RM 工程展区 ============ -->
    <section class="py-12 md:py-18">
      <div class="container-blog">
        <div class="mb-7 flex items-end justify-between gap-4">
          <div>
            <p class="mb-1 text-xs font-semibold tracking-[0.2em] text-accent">RM ENGINEERING</p>
            <h2 class="font-serif text-[1.7rem] font-semibold tracking-tight text-foreground">
              从机器人出发
            </h2>
          </div>
          <router-link
            to="/projects"
            class="hidden items-center gap-1.5 text-sm font-medium text-accent transition-all hover:gap-2.5 sm:inline-flex"
          >
            查看项目与竞赛
            <ArrowRightIcon class="size-3.5" />
          </router-link>
        </div>

        <div class="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_0.9fr]">
          <GlassCard class="overflow-hidden" radius="rounded-2xl">
            <div class="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr]">
              <div class="relative min-h-56 overflow-hidden bg-[#10161b] md:min-h-full">
                <img
                  src="/images/rm-isaacsim.png"
                  alt="RoboMaster 轮腿式机器人仿真模型"
                  class="h-full w-full object-cover object-center opacity-90 transition-transform duration-700 hover:scale-[1.03]"
                  loading="lazy"
                />
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#10161b]/75 via-transparent to-transparent"></div>
                <span class="absolute bottom-4 left-4 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-[10px] font-semibold tracking-[0.14em] text-white/80 backdrop-blur-sm">
                  SIMULATION / RM2026
                </span>
              </div>
              <div class="flex flex-col justify-center p-6 md:p-7">
                <div class="mb-4 flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-accent">
                  <span class="size-1.5 rounded-full bg-accent shadow-[0_0_9px_var(--color-accent)]"></span>
                  SOFTWARE × HARDWARE
                </div>
                <h3 class="mb-3 font-serif text-xl font-semibold tracking-tight text-foreground">
                  RoboMaster 机器人系统
                </h3>
                <p class="mb-5 text-sm leading-relaxed text-muted-foreground">
                  以轮腿式平衡机器人为入口，连接机械结构、嵌入式控制、视觉感知与仿真验证，形成可以持续迭代的工程实践主线。
                </p>
                <div class="mb-6 grid grid-cols-3 gap-2 border-y border-border py-4">
                  <div v-for="item in rmHighlights" :key="item.label">
                    <div class="font-mono text-sm font-semibold text-foreground">{{ item.value }}</div>
                    <div class="mt-1 text-[11px] text-muted-foreground">{{ item.label }}</div>
                  </div>
                </div>
                <router-link
                  to="/projects"
                  class="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:opacity-90"
                >
                  查看项目详情
                  <ExternalLinkIcon class="size-3.5" />
                </router-link>
              </div>
            </div>
          </GlassCard>

          <GlassCard class="p-6 md:p-7" radius="rounded-2xl">
            <div class="mb-5 flex items-center justify-between gap-3">
              <div>
                <p class="mb-1 text-xs font-semibold tracking-[0.2em] text-accent">LATEST NOTES</p>
                <h3 class="font-serif text-xl font-semibold tracking-tight text-foreground">最近的技术记录</h3>
              </div>
              <FileTextIcon class="size-5 text-accent/70" />
            </div>
            <div class="divide-y divide-border">
              <router-link
                v-for="post in recentPosts"
                :key="post.id"
                :to="`/blog/${post.id}`"
                class="group block py-4 first:pt-0 last:pb-0"
              >
                <div class="mb-1 flex items-center justify-between gap-3">
                  <span class="text-[11px] text-muted-foreground">{{ post.category }}</span>
                  <span class="font-mono text-[10px] text-muted-foreground">{{ post.date }}</span>
                </div>
                <h4 class="line-clamp-2 text-sm font-semibold leading-relaxed text-foreground transition-colors group-hover:text-accent">
                  {{ post.title }}
                </h4>
                <p class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{{ post.excerpt }}</p>
              </router-link>
            </div>
            <router-link
              to="/blog"
              class="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-all hover:gap-2.5"
            >
              浏览全部文章
              <ArrowRightIcon class="size-3.5" />
            </router-link>
          </GlassCard>
        </div>
      </div>
    </section>

    <!-- ============ 能力地图 ============ -->
    <section class="py-12 md:py-18">
      <div class="container-blog">
        <div class="mb-7 flex items-end justify-between gap-4">
          <div>
            <p class="mb-1 text-xs font-semibold tracking-[0.2em] text-accent">CAPABILITY MAP</p>
            <h2 class="font-serif text-[1.7rem] font-semibold tracking-tight text-foreground">
              我正在积累的能力
            </h2>
          </div>
          <span class="hidden text-xs text-muted-foreground sm:block">从真实机器人问题出发</span>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard
            v-for="group in skillGroups"
            :key="group.title"
            class="group flex h-full flex-col p-5 transition-transform duration-300 hover:-translate-y-1"
            radius="rounded-2xl"
          >
            <div class="mb-5 flex items-start justify-between">
              <div class="flex size-10 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <component :is="group.icon" class="size-5" />
              </div>
              <span class="font-mono text-[9px] tracking-[0.16em] text-muted-foreground">{{ group.subtitle }}</span>
            </div>
            <h3 class="mb-2 font-serif text-lg font-semibold tracking-tight text-foreground">{{ group.title }}</h3>
            <p class="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">{{ group.description }}</p>
            <div class="flex flex-wrap gap-1.5">
              <Badge v-for="tag in group.tags" :key="tag" variant="secondary">{{ tag }}</Badge>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
    </div>
    <!-- /滚动区 -->
  </div>
</template>
