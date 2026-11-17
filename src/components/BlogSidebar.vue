<script setup>
import GlassCard from '@/components/ui/GlassCard.vue'
import { SearchIcon, GithubIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps({
  categories: { type: Array, required: true },
  popularTags: { type: Array, required: true },
  activeCategory: { type: String, default: '全部' },
  activeTags: { type: Array, default: () => [] },
})

const searchQuery = defineModel('searchQuery', { type: String, default: '' })

defineEmits(['select-category', 'toggle-tag'])
</script>

<template>
  <aside class="flex flex-col gap-4 md:sticky md:top-20 md:max-h-[calc(100vh-6.5rem)] md:overflow-y-auto md:pr-1">
    <!-- Search -->
    <GlassCard class="p-4.5" radius="rounded-xl">
      <label class="mb-2.5 block text-xs font-semibold tracking-widest text-muted-foreground uppercase">搜索</label>
      <div class="relative">
        <SearchIcon class="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索文章..."
          class="h-9 w-full rounded-lg border border-input bg-[color-mix(in_srgb,var(--color-foreground)_4%,transparent)] pr-3 pl-8.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
        />
      </div>
    </GlassCard>

    <!-- Categories -->
    <GlassCard class="p-4.5" radius="rounded-xl">
      <label class="mb-2.5 block text-xs font-semibold tracking-widest text-muted-foreground uppercase">分类</label>
      <ul class="flex flex-col gap-0.5">
        <li
          v-for="cat in categories"
          :key="cat.name"
          :class="
            cn(
              'flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-all',
              activeCategory === cat.name
                ? 'bg-[color-mix(in_srgb,var(--color-foreground)_8%,transparent)] font-medium text-foreground'
                : 'text-muted-foreground hover:bg-[color-mix(in_srgb,var(--color-foreground)_4%,transparent)] hover:text-foreground',
            )
          "
          @click="$emit('select-category', cat.name)"
        >
          <span>{{ cat.name }}</span>
          <span class="text-xs opacity-60">{{ cat.count }}</span>
        </li>
      </ul>
    </GlassCard>

    <!-- Tags -->
    <GlassCard class="p-4.5" radius="rounded-xl">
      <label class="mb-2.5 block text-xs font-semibold tracking-widest text-muted-foreground uppercase">热门标签</label>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="tag in popularTags"
          :key="tag"
          :class="
            cn(
              'cursor-pointer rounded-md border px-2 py-0.5 text-xs transition-all',
              activeTags.includes(tag)
                ? 'border-accent/40 bg-accent/15 font-medium text-accent'
                : 'border-border text-muted-foreground hover:border-accent/30 hover:text-foreground',
            )
          "
          style="--tw-bg-opacity: 1"
          @click="$emit('toggle-tag', tag)"
        >
          {{ tag }}
        </span>
      </div>
    </GlassCard>

    <!-- About -->
    <GlassCard tone="accent" class="p-4.5" radius="rounded-xl">
      <label class="mb-2.5 block text-xs font-semibold tracking-widest text-muted-foreground uppercase">关于</label>
      <p class="mb-3.5 text-sm leading-relaxed text-muted-foreground">
        记录从嵌入式、机器人控制到前端工程的学习过程与实践思考。
      </p>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-opacity hover:opacity-80"
      >
        <GithubIcon class="size-3.5" />
        关注 GitHub
      </a>
    </GlassCard>
  </aside>
</template>
