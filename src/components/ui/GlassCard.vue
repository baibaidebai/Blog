<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

/**
 * 全站统一的毛玻璃表面组件。
 * 视觉样式来自 style.css 中的 .glass-surface（基于 --glass-* token，
 * 亮/暗模式自动切换），这里只负责结构与变体：
 *
 * - interactive: 悬停时提亮 + 可点击
 * - lift:        悬停时上浮（通常与 interactive 同用）
 * - tone:        accent 时边框带强调色
 */
const props = defineProps({
  interactive: { type: Boolean, default: false },
  lift: { type: Boolean, default: true },
  tone: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'accent'].includes(v),
  },
  radius: {
    type: String,
    default: 'rounded-xl',
  },
  class: { type: null, default: '' },
})

const classes = computed(() =>
  cn(
    'glass-surface',
    props.radius,
    props.interactive && 'glass-hover glass-lift cursor-pointer',
    props.interactive && props.lift === false && 'glass-hover cursor-pointer',
    props.tone === 'accent' &&
      'border-[color-mix(in_srgb,var(--color-accent)_35%,transparent)]',
    props.class,
  ),
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
