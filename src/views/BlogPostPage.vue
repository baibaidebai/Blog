<script setup>
import { computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import GlassCard from '@/components/ui/GlassCard.vue'
import Badge from '@/components/ui/Badge.vue'
import { ArrowLeftIcon, NetworkIcon } from 'lucide-vue-next'
import { getPostById, renderMarkdown } from '@/utils/posts.js'

// 思维导图组件懒加载（d3 依赖较重）
const MindMap = defineAsyncComponent(() => import('@/components/MindMap.vue'))

const route = useRoute()

const post = computed(() => getPostById(route.params.id))

const renderedHtml = computed(() => {
  if (!post.value || post.value.layout === 'mindmap') return ''
  return renderMarkdown(post.value.content)
})

const formatDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

/* 代码复制（事件委托，v-html 无法绑定事件） */
const onContentClick = async (e) => {
  const btn = e.target.closest('.code-copy')
  if (!btn) return
  const block = btn.closest('.code-block')
  if (!block) return
  const code = block.getAttribute('data-code') || ''
  try {
    await navigator.clipboard.writeText(JSON.parse(code))
    const textEl = btn.querySelector('.copy-text')
    btn.classList.add('copied')
    if (textEl) textEl.textContent = '已复制'
    setTimeout(() => {
      btn.classList.remove('copied')
      if (textEl) textEl.textContent = '复制'
    }, 1500)
  } catch (err) {
    console.error('复制失败', err)
  }
}

watch(
  () => route.params.id,
  () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  },
)

onMounted(() => document.addEventListener('click', onContentClick))
onBeforeUnmount(() => document.removeEventListener('click', onContentClick))
</script>

<template>
  <article v-if="post" class="py-8 pb-16">
    <div class="mx-auto max-w-[820px] px-6">
      <router-link
        to="/blog"
        class="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
      >
        <ArrowLeftIcon class="size-3.5" />
        返回博客列表
      </router-link>

      <header class="mb-10">
        <div class="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="accent">{{ post.category }}</Badge>
          <span class="opacity-50">·</span>
          <time>{{ formatDate(post.date) }}</time>
          <span class="opacity-50">·</span>
          <span>{{ post.readTime }}</span>
          <span
            v-if="post.layout === 'mindmap'"
            class="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium text-accent"
            style="border-color: color-mix(in srgb, var(--color-accent) 20%, transparent)"
          >
            <NetworkIcon class="size-3" />
            思维导图
          </span>
        </div>

        <h1 class="mb-3 font-serif text-[1.9rem] leading-[1.2] font-bold tracking-tight text-foreground md:text-4xl">
          {{ post.title }}
        </h1>
        <p class="mb-5 text-base leading-relaxed text-muted-foreground md:text-lg">
          {{ post.excerpt }}
        </p>

        <div class="flex flex-wrap gap-1.5">
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
      </header>

      <!-- 思维导图布局 -->
      <MindMap v-if="post.layout === 'mindmap'" :markdown="post.content" class="my-8" />

      <!-- 文章布局（排版样式在全局 .post-content） -->
      <div v-else class="post-content" v-html="renderedHtml" />

      <footer class="mt-12 border-t border-border pt-8 text-center">
        <router-link
          to="/blog"
          class="text-sm font-medium text-accent transition-opacity hover:opacity-70"
        >
          ← 浏览所有文章
        </router-link>
      </footer>
    </div>
  </article>

  <div v-else class="container-blog flex min-h-[60vh] items-center justify-center">
    <GlassCard class="w-full max-w-sm p-10 text-center" radius="rounded-2xl">
      <h2 class="mb-2 font-serif text-xl font-semibold text-foreground">文章不存在</h2>
      <p class="mb-5 text-sm text-muted-foreground">这篇文章可能已被移除或链接错误。</p>
      <router-link to="/blog" class="text-sm font-medium text-accent hover:opacity-80">
        返回博客列表
      </router-link>
    </GlassCard>
  </div>
</template>
