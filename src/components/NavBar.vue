<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { cn } from '@/lib/utils'
import { SunIcon, MoonIcon, GithubIcon } from 'lucide-vue-next'

const { theme, toggleTheme } = useTheme()
const route = useRoute()
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => window.addEventListener('scroll', handleScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

const navLinks = [
  { to: '/', label: '首页', exact: true },
  { to: '/blog', label: '技术博客' },
  { to: '/projects', label: '项目与竞赛' },
  { to: '/demo', label: 'Demo' },
]

const isActive = (link) =>
  link.exact ? route.path === link.to : route.path.startsWith(link.to)
</script>

<template>
  <header
    :class="
      cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        isScrolled ? 'py-2' : 'py-3.5',
      )
    "
  >
    <div class="container-blog flex items-center justify-between gap-6">
      <!-- Brand -->
      <router-link
        to="/"
        class="glass-surface glass-hover rounded-xl flex items-center gap-2.5 px-3.5 py-1.5 text-base font-bold tracking-tight text-foreground"
      >
        <span
          class="relative size-5.5 rounded-md bg-gradient-to-br from-accent to-[color-mix(in_srgb,var(--color-accent)_72%,#8a6a45)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_2px_8px_color-mix(in_srgb,var(--color-accent)_35%,transparent)]"
        >
          <span class="absolute inset-1 rounded-[2px] bg-white/50"></span>
        </span>
        <span class="brand-name">BaiBaideBai</span>
      </router-link>

      <!-- Nav pill -->
      <nav class="glass-surface hidden items-center gap-1 rounded-xl p-1 md:flex">
        <router-link
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          :class="
            cn(
              'rounded-lg px-4 py-1.5 text-sm font-medium transition-all',
              isActive(link)
                ? 'bg-[color-mix(in_srgb,var(--color-foreground)_9%,transparent)] text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-[color-mix(in_srgb,var(--color-foreground)_5%,transparent)]',
            )
          "
        >
          {{ link.label }}
        </router-link>
      </nav>

      <!-- Right actions -->
      <div class="flex items-center gap-2.5">
        <!-- Theme toggle -->
        <button
          :aria-label="theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'"
          class="glass-surface glass-hover rounded-xl flex size-9 items-center justify-center text-foreground/80 hover:text-foreground"
          @click="toggleTheme"
        >
          <SunIcon v-if="theme === 'dark'" class="size-4" />
          <MoonIcon v-else class="size-4" />
        </button>

        <!-- GitHub -->
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener"
          aria-label="GitHub"
          class="glass-surface glass-hover rounded-xl flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-foreground"
        >
          <GithubIcon class="size-4.5" />
          <span class="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </div>
  </header>
</template>
