<script setup>
import { computed } from 'vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import Badge from '@/components/ui/Badge.vue'
import { cn } from '@/lib/utils'
import { ArrowRightIcon, NetworkIcon } from 'lucide-vue-next'

const props = defineProps({
  post: { type: Object, required: true },
  featured: { type: Boolean, default: false },
})

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`
}
</script>

<template>
  <router-link :to="`/blog/${post.id}`" class="block text-inherit no-underline">
    <GlassCard
      :interactive="true"
      :radius="featured ? 'rounded-2xl' : 'rounded-xl'"
      :class="cn('h-full', featured && 'md:flex', !featured && 'md:flex-row-reverse')"
    >
      <!-- 非featured：封面在上 -->
      <div v-if="post.cover && !featured" class="aspect-[16/8] w-full shrink-0 overflow-hidden bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] md:aspect-auto md:w-[220px]">
        <img :src="post.cover" :alt="post.title" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
      </div>

      <div :class="cn('flex min-w-0 flex-1 flex-col', featured ? 'p-7 md:p-9' : 'p-5 md:p-6')">
        <div class="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="accent">{{ post.category }}</Badge>
          <span v-if="post.layout === 'mindmap'" class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.72rem] font-medium text-accent" style="border-color: color-mix(in srgb, var(--color-accent) 20%, transparent)">
            <NetworkIcon class="size-3" />
            思维导图
          </span>
          <span class="opacity-50">·</span>
          <time>{{ formatDate(post.date) }}</time>
          <span class="opacity-50">·</span>
          <span>{{ post.readTime }}</span>
        </div>

        <h3
          :class="
            cn(
              'font-serif font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-accent',
              featured ? 'text-[1.6rem] md:text-[1.8rem]' : 'text-[1.15rem] md:text-[1.25rem]',
            )
          "
        >
          {{ post.title }}
        </h3>

        <p
          :class="
            cn(
              'mt-2.5 mb-4 flex-1 text-sm leading-relaxed text-muted-foreground',
              featured && 'max-w-xl text-[0.95rem]',
              !featured && 'line-clamp-2',
            )
          "
        >
          {{ post.excerpt }}
        </p>

        <div class="mb-4 flex flex-wrap gap-1.5">
          <span
            v-for="tag in post.tags"
            :key="tag"
            class="rounded-md border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
            style="
              border-color: color-mix(in srgb, var(--color-accent) 12%, transparent);
              background: color-mix(in srgb, var(--color-accent) 7%, transparent);
            "
          >
            {{ tag }}
          </span>
        </div>

        <span class="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-all duration-300 group-hover:gap-2.5">
          {{ post.layout === 'mindmap' ? '查看导图' : '阅读全文' }}
          <ArrowRightIcon class="size-3.5" />
        </span>
      </div>

      <!-- featured：侧边封面 -->
      <div
        v-if="featured && post.cover"
        class="w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] md:w-[45%] md:min-w-[240px]"
      >
        <img :src="post.cover" :alt="post.title" class="h-full w-full object-cover transition-transform duration-500" />
      </div>
    </GlassCard>
  </router-link>
</template>
