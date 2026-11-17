<template>
  <div class="flex min-h-screen flex-col">
    <NavBar />
    <main class="flex-1 pt-16">
      <slot />
    </main>
    <footer class="mt-10 border-t border-border py-7">
      <div class="container-blog text-center">
        <p class="text-xs text-muted-foreground">
          © {{ year }} BaiBaideBai &nbsp;·&nbsp; Built with Vue 3 + Tailwind CSS
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'

const year = new Date().getFullYear()
</script>
