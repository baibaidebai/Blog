<script setup>
import GlassCard from '@/components/ui/GlassCard.vue'
import Badge from '@/components/ui/Badge.vue'
import {
  ArrowRightIcon,
  BotIcon,
  CircuitBoardIcon,
  Code2Icon,
  CpuIcon,
  EyeIcon,
  RadioIcon,
  TrophyIcon,
} from 'lucide-vue-next'

const projects = [
  {
    id: 1,
    title: '轮腿式平衡机器人',
    description:
      '面向 RoboMaster 工程实践的轮腿式平衡机器人仿真与控制项目，围绕姿态估计、底盘控制和关节协同建立完整的软件与硬件验证链路。',
    tags: ['RoboMaster', '嵌入式', '运动控制'],
    status: '持续迭代',
    icon: BotIcon,
    tone: 'accent',
    highlight: true,
  },
  {
    id: 2,
    title: '机器人视觉与目标识别',
    description:
      '围绕装甲板识别、目标跟踪与坐标解算搭建视觉模块，为机器人瞄准与决策提供稳定的感知输入。',
    tags: ['OpenCV', '目标识别', '坐标解算'],
    status: '竞赛实践',
    icon: EyeIcon,
  },
  {
    id: 3,
    title: '底盘控制与通信系统',
    description:
      '实现电机驱动、姿态反馈和上位机通信，整理从传感器采集到控制指令下发的实时数据链路。',
    tags: ['C/C++', 'CAN', 'PID'],
    status: '工程实践',
    icon: CircuitBoardIcon,
  },
]

const competitions = [
  {
    id: 1,
    title: 'RoboMaster 机甲大师赛',
    type: '赛事经历',
    desc: '参与战车系统的研发与调试，围绕底盘、云台、视觉和通信模块协同完成赛前联调。',
    year: 'RM',
    icon: TrophyIcon,
  },
  {
    id: 2,
    title: 'RoboMaster 校内选拔与训练赛',
    type: '团队协作',
    desc: '在高频迭代和实战测试中完善机械结构、控制参数与故障排查流程，积累完整的工程协作经验。',
    year: 'RM',
    icon: RadioIcon,
  },
]
</script>

<template>
  <div class="pb-16">
    <header class="container-blog py-10 text-center md:py-14">
      <div class="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/8 px-3 py-1 text-xs font-medium tracking-[0.18em] text-accent">
        <span class="size-1.5 rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]"></span>
        RM ENGINEERING LOG
      </div>
      <h1 class="mb-3 font-serif text-[2.2rem] font-bold tracking-tight text-foreground md:text-4xl">
        项目与竞赛
      </h1>
      <p class="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
        以 RoboMaster 为主线，记录机器人系统中的软硬件协作、工程实践与竞赛经验。
      </p>
    </header>

    <section class="container-blog pb-10">
      <div class="mb-6 flex items-end justify-between gap-4">
        <div>
          <p class="mb-1 text-xs font-semibold tracking-[0.2em] text-accent">SYSTEM MODULES</p>
          <h2 class="font-serif text-2xl font-semibold tracking-tight text-foreground">机器人项目</h2>
        </div>
        <span class="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
          <CpuIcon class="size-3.5 text-accent" />
          SOFTWARE × HARDWARE
        </span>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <GlassCard
          v-for="p in projects"
          :key="p.id"
          interactive
          :tone="p.highlight ? 'accent' : 'default'"
          class="group relative flex flex-col overflow-hidden p-6"
        >
          <div class="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full border border-accent/10"></div>
          <div class="mb-5 flex items-start justify-between">
            <div
              class="flex size-10 items-center justify-center rounded-lg text-accent"
              style="background: color-mix(in srgb, var(--color-accent) 13%, transparent)"
            >
              <component :is="p.icon" class="size-5" />
            </div>
            <Badge variant="accent">{{ p.status }}</Badge>
          </div>

          <h3 class="mb-2 font-serif text-lg font-semibold tracking-tight text-foreground">
            {{ p.title }}
          </h3>
          <p class="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
            {{ p.description }}
          </p>

          <div class="mb-4 flex flex-wrap gap-1.5">
            <Badge v-for="tag in p.tags" :key="tag" variant="secondary">{{ tag }}</Badge>
          </div>

          <span class="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-all duration-300 group-hover:gap-2.5">
            查看模块记录
            <ArrowRightIcon class="size-3.5" />
          </span>
        </GlassCard>
      </div>
    </section>

    <section class="container-blog pt-8">
      <div class="mb-6 text-center">
        <p class="mb-1 text-xs font-semibold tracking-[0.2em] text-accent">COMPETITION RECORD</p>
        <h2 class="font-serif text-[1.6rem] font-semibold tracking-tight text-foreground">RoboMaster 竞赛经历</h2>
      </div>
      <div class="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2">
        <GlassCard v-for="c in competitions" :key="c.id" class="group relative overflow-hidden p-6" radius="rounded-xl">
          <div class="absolute right-5 top-5 text-accent/20 transition-transform duration-300 group-hover:scale-110">
            <component :is="c.icon" class="size-12" />
          </div>
          <div class="mb-4 flex items-center gap-2">
            <span class="rounded-md bg-accent/12 px-2 py-1 text-[10px] font-bold tracking-[0.15em] text-accent">{{ c.year }}</span>
            <span class="text-xs text-muted-foreground">{{ c.type }}</span>
          </div>
          <h3 class="mb-2 pr-12 font-serif text-lg font-semibold text-foreground">{{ c.title }}</h3>
          <p class="max-w-md text-sm leading-relaxed text-muted-foreground">{{ c.desc }}</p>
          <div class="mt-5 flex items-center gap-2 text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
            <span class="size-1.5 rounded-full bg-accent"></span>
            TEAM · CONTROL · VISION · MECHANICS
          </div>
        </GlassCard>
      </div>
    </section>
  </div>
</template>
