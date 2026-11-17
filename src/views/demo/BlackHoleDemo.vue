<script setup>
import { ArrowLeftIcon } from 'lucide-vue-next'
import BlackHoleCanvas from '@/components/blackhole/BlackHoleCanvas.vue'
</script>

<template>
  <div class="relative min-h-screen bg-background">
    <div class="container-blog flex items-center justify-between py-5">
      <router-link to="/demo" class="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-accent">
        <ArrowLeftIcon class="size-3.5" />
        返回演示列表
      </router-link>
      <span class="text-sm font-medium text-accent">黑洞原型</span>
    </div>

    <BlackHoleCanvas class="h-[calc(100vh-120px)] w-full" />

    <div class="container-blog pb-6 text-center text-xs text-muted-foreground">
      拖拽旋转视角 · 滚轮缩放
    </div>
  </div>
</template>
