# BaiBaideBai 个人网站

技术博客 + 作品集，用于记录成长、沉淀作品、提升竞争力。

## 技术栈

- **Vue 3**（`<script setup>`）+ **Vite** + **vue-router**
- **Tailwind CSS v4** + **shadcn-vue 风格组件体系**（reka-ui / cva / cn）
- **marked + highlight.js**：Markdown 渲染、代码高亮、复制按钮
- **markmap**：思维导图文章（懒加载）

## 架构

```
src/
├── style.css          # Design tokens（亮/暗双模式）+ 玻璃表面 + 正文排版
├── lib/utils.js       # cn()（clsx + tailwind-merge）
├── composables/       # useTheme（亮/暗切换 + localStorage 持久化）
├── components/
│   ├── ui/            # 基础组件：Button / Card / Badge / Separator / Input / GlassCard
│   ├── NavBar.vue     # 导航 + 主题切换
│   ├── ArticleCard.vue / BlogSidebar.vue
│   └── MindMap.vue
├── layouts/MainLayout.vue
├── views/             # HomePage / BlogPage / BlogPostPage / ProjectsPage
├── posts/             # Markdown 文章（frontmatter 驱动）
├── utils/posts.js     # 文章解析 / 渲染管线
└── router/
```

### 视觉体系

- 所有颜色通过语义 token（`--color-background`、`--color-accent`…）驱动，
  **换视觉风格只需修改 `style.css` 顶部两块变量**（亮色 `:root` / 暗色 `.dark`）。
- 毛玻璃效果收敛为 `.glass-surface` 基础类 + `ui/GlassCard.vue` 组件，
  亮暗两态自动适配，组件内不再复制玻璃样式。
- 主题切换：导航栏太阳/月亮按钮，`localStorage('theme')` 持久化，
  首次访问跟随系统。

### 写作

文章放在 `src/posts/`，文件名 `NN-slug.md`，frontmatter 支持：
`title / date / category / tags / readTime / cover / layout(mindmap) / excerpt / featured`。

## 开发

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # 产物在 dist/
```
