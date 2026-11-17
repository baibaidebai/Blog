import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import rust from 'highlight.js/lib/languages/rust'
import python from 'highlight.js/lib/languages/python'
import yaml from 'highlight.js/lib/languages/yaml'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('ts', typescript)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('css', css)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('python', python)
hljs.registerLanguage('py', python)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)

// Vite glob: eagerly import all .md files in src/posts/ as raw strings
const rawModules = import.meta.glob('../posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/**
 * Parse YAML-like frontmatter from the beginning of a markdown string.
 * Supports: title, date, category, tags, readTime, cover, layout, excerpt, featured
 */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) return { data: {}, content: raw }

  const data = {}
  const lines = match[1].split(/\r?\n/)
  for (const line of lines) {
    const m = line.match(/^([\w-]+):\s*(.*)$/)
    if (!m) continue
    const [, key, valueRaw] = m
    let value = valueRaw.trim()
    // Strip surrounding quotes
    if (/^["'].*["']$/.test(value)) value = value.slice(1, -1)
    // Parse inline arrays: [a, b, c]
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean)
    } else {
      data[key] = value
    }
  }

  return { data, content: raw.slice(match[0].length) }
}

/**
 * Generate an excerpt from markdown content (strips markdown syntax).
 */
function autoExcerpt(markdown, maxLen = 110) {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/!?\[.*?\]\(.*?\)/g, '') // images / links
    .replace(/[#>*_`~\-]+/g, ' ') // markdown syntax
    .replace(/\s+/g, ' ')
    .trim()
  if (plain.length <= maxLen) return plain
  return plain.slice(0, maxLen).replace(/\s\S*$/, '') + '…'
}

/**
 * Estimate reading time for Chinese + English mix.
 */
function estimateReadTime(text) {
  const cnChars = (text.match(/[一-鿿]/g) || []).length
  const enWords = (text.match(/[A-Za-z]+/g) || []).length
  const minutes = Math.ceil(cnChars / 300 + enWords / 200)
  return `${minutes} min`
}

/**
 * Derive slug from filename: "01-vue3-composition.md" -> "vue3-composition"
 */
function slugFromPath(path) {
  const name = path.split('/').pop().replace(/\.md$/, '')
  return name.replace(/^\d+-/, '')
}

function buildPost(path, raw) {
  const { data, content } = parseFrontmatter(raw)
  const title = data.title || '未命名文章'
  const excerpt = data.excerpt || autoExcerpt(content)
  const readTime = data.readTime || estimateReadTime(content)
  const date = data.date || new Date().toISOString().slice(0, 10)

  return {
    id: slugFromPath(path),
    slug: slugFromPath(path),
    title,
    excerpt,
    date,
    category: data.category || '未分类',
    tags: Array.isArray(data.tags) ? data.tags : [],
    readTime,
    cover: data.cover || null,
    layout: data.layout === 'mindmap' ? 'mindmap' : 'article',
    featured: data.featured === 'true' || data.featured === true,
    content,
  }
}

// Build & sort by date (newest first)
const allPosts = Object.entries(rawModules)
  .map(([path, raw]) => buildPost(path, raw))
  .sort((a, b) => (a.date < b.date ? 1 : -1))

export function getAllPosts() {
  return allPosts
}

export function getPostById(id) {
  return allPosts.find((p) => p.id === id) || null
}

export function getCategories() {
  const map = new Map()
  map.set('全部', allPosts.length)
  for (const p of allPosts) {
    map.set(p.category, (map.get(p.category) || 0) + 1)
  }
  return Array.from(map, ([name, count]) => ({ name, count }))
}

export function getPopularTags(limit = 12) {
  const counts = new Map()
  for (const p of allPosts) {
    for (const t of p.tags) counts.set(t, (counts.get(t) || 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag)
}

const markedInstance = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language, ignoreIllegals: true }).value
    },
  }),
)

markedInstance.setOptions({
  gfm: true,
  breaks: false,
})

/**
 * Render markdown content to HTML using marked + highlight.js.
 * Also injects a copy button into each <pre><code> block via a custom renderer.
 */
export function renderMarkdown(md) {
  const html = markedInstance.parse(md)
  return injectCopyButtons(html)
}

/**
 * Inject a copy-to-clipboard button into every <pre> block.
 * Browser then attaches the click listener via delegated event.
 */
function injectCopyButtons(html) {
  return html.replace(
    /<pre><code(?: class="hljs language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g,
    (_match, lang, code) => {
      const decoded = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
      const escaped = JSON.stringify(decoded)
      const langLabel = lang || 'text'
      return `<div class="code-block" data-code=${escaped}>
        <button class="code-copy" type="button" aria-label="复制代码">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span class="copy-text">复制</span>
        </button>
        <span class="code-lang">${langLabel}</span>
        <pre><code class="hljs language-${langLabel}">${code}</code></pre>
      </div>`
    },
  )
}