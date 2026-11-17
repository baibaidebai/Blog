<script setup>
import { ref, computed } from 'vue'
import BlogSidebar from '@/components/BlogSidebar.vue'
import ArticleCard from '@/components/ArticleCard.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import { SearchXIcon } from 'lucide-vue-next'
import { getAllPosts, getCategories, getPopularTags } from '@/utils/posts.js'

const allPosts = getAllPosts()
const categories = getCategories()
const popularTags = getPopularTags()

const searchQuery = ref('')
const activeCategory = ref('全部')
const activeTags = ref([])

const toggleTag = (tag) => {
  const i = activeTags.value.indexOf(tag)
  if (i === -1) activeTags.value.push(tag)
  else activeTags.value.splice(i, 1)
}

const filteredPosts = computed(() => {
  return allPosts.filter((post) => {
    if (activeCategory.value !== '全部' && post.category !== activeCategory.value) return false
    if (activeTags.value.length > 0 && !activeTags.value.every((t) => post.tags.includes(t)))
      return false
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase()
      return post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)
    }
    return true
  })
})

const featuredPost = computed(() => {
  return filteredPosts.value.find((p) => p.featured) || filteredPosts.value[0] || null
})

const regularPosts = computed(() => {
  return filteredPosts.value.filter((p) => p.id !== featuredPost.value?.id)
})
</script>

<template>
  <div class="pb-20">
    <div class="mx-auto grid max-w-[1500px] grid-cols-1 items-start gap-7 px-5 py-7 sm:px-7 md:grid-cols-[260px_minmax(0,1fr)] md:gap-8 lg:px-9 lg:py-9 xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-10">
      <BlogSidebar
        v-model:searchQuery="searchQuery"
        :categories="categories"
        :popular-tags="popularTags"
        :active-category="activeCategory"
        :active-tags="activeTags"
        @select-category="activeCategory = $event"
        @toggle-tag="toggleTag"
      />

      <main class="min-w-0">
        <header class="mb-8 border-b border-border pb-7 md:mb-9 md:pb-8">
          <div class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p class="mb-2 text-xs font-semibold tracking-[0.2em] text-accent">KNOWLEDGE BASE</p>
              <h1 class="mb-2 font-serif text-[2.35rem] font-bold tracking-tight text-foreground md:text-5xl">
                技术博客
              </h1>
              <p class="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                学习笔记、实践总结与思考沉淀，记录从代码到机器人系统的持续积累。
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
              <span class="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]"></span>
              {{ allPosts.length }} 篇文章持续更新
            </div>
          </div>
        </header>

        <section v-if="featuredPost" class="mb-9">
          <div class="mb-4 flex items-center justify-between gap-4">
            <h2 class="font-serif text-xl font-semibold tracking-tight text-foreground">精选文章</h2>
            <span class="text-xs tracking-[0.12em] text-muted-foreground">EDITOR'S PICK</span>
          </div>
          <div class="group">
            <ArticleCard :post="featuredPost" featured />
          </div>
        </section>

        <section>
          <div class="mb-4 flex items-center justify-between border-b border-border pb-3">
            <h2 class="font-serif text-xl font-semibold tracking-tight text-foreground">
              {{ activeCategory === '全部' ? '全部文章' : activeCategory }}
            </h2>
            <span class="text-xs text-muted-foreground">{{ filteredPosts.length }} 篇</span>
          </div>

          <div v-if="regularPosts.length > 0" class="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div v-for="post in regularPosts" :key="post.id" class="group">
              <ArticleCard :post="post" />
            </div>
          </div>

          <GlassCard v-else class="px-5 py-16 text-center" radius="rounded-2xl">
            <SearchXIcon class="mx-auto mb-4 size-10 text-muted-foreground opacity-40" />
            <h3 class="mb-1.5 font-serif text-lg font-semibold text-foreground">没有找到匹配的文章</h3>
            <p class="text-sm text-muted-foreground">试试调整搜索关键词或切换分类</p>
          </GlassCard>
        </section>
      </main>
    </div>
  </div>
</template>
