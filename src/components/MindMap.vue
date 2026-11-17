<template>
  <div class="mindmap-wrapper">
    <div class="mindmap-toolbar">
      <span class="toolbar-label">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <circle cx="5" cy="5" r="2"/>
          <circle cx="19" cy="5" r="2"/>
          <circle cx="5" cy="19" r="2"/>
          <circle cx="19" cy="19" r="2"/>
          <line x1="7" y1="6.5" x2="10" y2="10"/>
          <line x1="14" y1="10" x2="17" y2="6.5"/>
          <line x1="7" y1="17.5" x2="10" y2="14"/>
          <line x1="14" y1="14" x2="17" y2="17.5"/>
        </svg>
        思维导图
      </span>
      <div class="toolbar-actions">
        <button class="tool-btn" @click="zoomIn" aria-label="放大">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button class="tool-btn" @click="zoomOut" aria-label="缩小">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button class="tool-btn" @click="reset" aria-label="重置">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
      </div>
    </div>
    <svg ref="svgRef" class="mindmap-svg" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Markmap } from 'markmap-view'
import { Transformer, builtInPlugins } from 'markmap-lib'

const props = defineProps({
  markdown: { type: String, required: true },
})

const svgRef = ref(null)
let mm = null
let transformer = null

const colorScheme = ['#d4a574', '#c4946a', '#a8845f', '#8d6f50', '#725942']

function render() {
  if (!svgRef.value) return
  while (svgRef.value.firstChild) svgRef.value.removeChild(svgRef.value.firstChild)

  if (!transformer) transformer = new Transformer(builtInPlugins)
  const { root } = transformer.transform(props.markdown)

  mm = Markmap.create(svgRef.value, {
    color: colorScheme,
    duration: 400,
    spacingHorizontal: 90,
    spacingVertical: 14,
    paddingX: 12,
    autoFit: true,
    fitRatio: 0.95,
    maxWidth: 220,
    nodeMinHeight: 24,
    style: (id) => `
      .markmap-node-${id} circle { fill: ${colorScheme[id % colorScheme.length]}; }
      .markmap-node-${id} text { fill: #1a1817; font-family: var(--font-sans); font-size: 13px; }
      .markmap-link { stroke: rgba(212, 165, 116, 0.5); stroke-width: 1.5; fill: none; }
    `,
  }, root)
}

function zoomIn() {
  if (!mm) return
  mm.rescale(Math.min(mm.scale * 1.25, 4))
}

function zoomOut() {
  if (!mm) return
  mm.rescale(Math.max(mm.scale / 1.25, 0.25))
}

function reset() {
  if (!mm) return
  mm.fit()
}

onMounted(() => {
  render()
})

watch(() => props.markdown, render)

onBeforeUnmount(() => {
  if (mm) mm.destroy()
})
</script>

<style scoped>
.mindmap-wrapper {
  position: relative;
  width: 100%;
  height: 70vh;
  min-height: 480px;
  background: rgba(255, 253, 249, 0.5);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.85),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12),
    0 1px 2px rgba(26, 24, 23, 0.04),
    0 12px 36px rgba(26, 24, 23, 0.08);
  isolation: isolate;
}

.mindmap-toolbar {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
  pointer-events: none;
}

.toolbar-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 253, 249, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
  pointer-events: auto;
}

.toolbar-actions {
  display: flex;
  gap: 4px;
  pointer-events: auto;
}

.tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 253, 249, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.tool-btn:hover {
  background: rgba(255, 253, 249, 0.9);
  color: var(--accent);
  border-color: rgba(212, 165, 116, 0.4);
}

.mindmap-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>