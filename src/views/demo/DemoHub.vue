<script setup>
import GlassCard from '@/components/ui/GlassCard.vue'
import Badge from '@/components/ui/Badge.vue'
import { ArrowRightIcon } from 'lucide-vue-next'

/**
 * 视觉方案对比演示中心。
 * 两个 hero 原型挂在独立路由，对比后择优集成进首页。
 */
const demos = [
  {
    to: '/demo/three-body',
    title: '方案 1 · 三体运动',
    desc: '牛顿引力 + RK4 实时积分。三条发光轨迹在混沌中缠绕演化；拖拽任意星体，整个系统走向完全不同的命运。内置混沌 / 8 字周期解 / 拉格朗日三角三种预设。',
    tags: ['three.js', '实时物理', '可拖拽', '双模式'],
  },
  {
    to: '/demo/black-hole',
    title: '方案 2 · 3D 黑洞',
    desc: 'WebGL2 全屏着色器：光子测地线弯曲 + 吸积盘多普勒增亮 + 程序化星空（Motrix 风格）。拖拽改变视角，滚轮缩放。暗色模式为主场。',
    tags: ['WebGL2', 'GLSL', '光线弯曲', '拖拽视角'],
  },
]
</script>

<template>
  <div class="container-blog pb-16">
    <header class="py-12 text-center md:py-16">
      <h1 class="mb-3 font-serif text-[2.2rem] font-bold tracking-tight text-foreground md:text-4xl">
        Hero 视觉方案对比
      </h1>
      <p class="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
        两个可交互原型，都支持拖拽。亲自玩过后告诉我感受，我们择优集成进首页。
      </p>
    </header>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
      <router-link v-for="d in demos" :key="d.to" :to="d.to" class="block">
        <GlassCard interactive class="group h-full p-7">
          <h2 class="mb-2.5 font-serif text-xl font-semibold tracking-tight text-foreground">
            {{ d.title }}
          </h2>
          <p class="mb-5 text-sm leading-relaxed text-muted-foreground">{{ d.desc }}</p>
          <div class="mb-5 flex flex-wrap gap-1.5">
            <Badge v-for="t in d.tags" :key="t" variant="secondary">{{ t }}</Badge>
          </div>
          <span
            class="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-all duration-300 group-hover:gap-2.5"
          >
            进入演示
            <ArrowRightIcon class="size-3.5" />
          </span>
        </GlassCard>
      </router-link>
    </div>

    <!-- 三体预设快捷入口 -->
    <div class="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm">
      <span class="text-muted-foreground">三体预设：</span>
      <router-link
        v-for="p in [
          { id: 'chaos', name: '混沌轨道' },
          { id: 'figure8', name: '8 字周期解' },
          { id: 'lagrange', name: '拉格朗日三角' },
        ]"
        :key="p.id"
        :to="`/demo/three-body?preset=${p.id}`"
        class="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-accent/40 hover:text-accent"
      >
        {{ p.name }}
      </router-link>
    </div>
  </div>
</template>
