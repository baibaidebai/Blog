<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const model = defineModel({ type: [String, Number], default: '' })

const props = defineProps({
  class: { type: null, default: '' },
})

const classes = computed(() =>
  cn(
    'flex h-10 w-full rounded-lg border border-input bg-card/60 px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
    props.class,
  ),
)
</script>

<template>
  <input v-model="model" :class="classes" />
</template>
