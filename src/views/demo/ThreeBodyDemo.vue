<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeftIcon } from 'lucide-vue-next'
import ThreeBodyCanvas from '@/components/threebody/ThreeBodyCanvas.vue'

const route = useRoute()

const preset = route.query.preset || 'chaos'
const presetName =
  { chaos: '混沌轨道', figure8: '8 字周期解', lagrange: '拉格朗日三角' }[preset] || '混沌轨道'

const universeCount = ref(1)
</script>

<template>
  <div class="relative min-h-screen bg-background">
    <div class="container-blog flex items-center justify-between py-5">
      <router-link
        to="/demo"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeftIcon class="size-3.5" />
        返回演示列表
      </router-link>
      <span class="text-sm font-medium text-accent">
        三体运动原型 · {{ presetName }}
        <span v-if="preset === 'chaos' && universeCount > 1" class="ml-1 text-muted-foreground">
          （第 {{ universeCount }} 个宇宙）
        </span>
      </span>
    </div>

    <div class="container-blog px-6">
      <ThreeBodyCanvas
        :preset="preset"
        class="h-[calc(100vh-190px)] min-h-[420px] w-full"
        @universe="universeCount = $event"
      />
    </div>

    <div class="container-blog pb-6 text-center text-xs text-muted-foreground">
      拖拽星体改写整个系统的命运 —— 混沌系统对初值极度敏感
    </div>
  </div>
</template>
