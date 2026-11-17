<script setup>
import { computed } from 'vue'
import { Primitive } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps({
  class: { type: null, default: '' },
})

const classes = computed(() =>
  cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', props.class),
)
</script>

<template>
  <Primitive :class="classes">
    <slot />
  </Primitive>
</template>
