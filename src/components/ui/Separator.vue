<script setup>
import { computed } from 'vue'
import { Separator } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  orientation: {
    type: String,
    default: 'horizontal',
  },
  decorative: { type: Boolean, default: true },
  class: { type: null, default: '' },
})

const classes = computed(() =>
  cn(
    'shrink-0 bg-border',
    props.orientation === 'vertical' ? 'w-px self-stretch' : 'h-px w-full',
    props.class,
  ),
)
</script>

<template>
  <Separator
    :orientation="orientation"
    :decorative="decorative"
    :class="classes"
  />
</template>
