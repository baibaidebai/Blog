---
title: Vue 3 Composition API 深入浅出
date: 2026-07-02
category: 前端开发
tags: [Vue, JavaScript, 响应式]
readTime: 12 min
cover: https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop
featured: true
---

# Vue 3 Composition API 深入浅出

Composition API 是 Vue 3 最核心的变革。它不仅仅是 API 的重组，更代表着 Vue 团队对**逻辑复用**与**代码组织**的全新思考。

## 为什么需要 Composition API

在 Vue 2 的 Options API 中，我们按照 `data`、`methods`、`computed`、`watch` 等选项来组织代码。这种方式直观，但当组件逻辑越来越复杂时，会出现一个核心问题：**一个功能的代码被分散在不同的选项中**。

想象一个用户管理组件：进入页面要拉取用户信息、要监听用户状态变化、要处理权限校验。这些逻辑在 Options API 中会跨越 data、methods、watch、computed 等多个区域。

> Composition API 让我们能够**按功能逻辑**而不是按选项类型来组织代码。

## 核心 API 一览

### ref 与 reactive

`ref` 用于包装基本类型和对象，`reactive` 用于包装对象。

```js
import { ref, reactive } from 'vue'

const count = ref(0)              // 基本类型
const user = reactive({ name: 'Alice', age: 28 })  // 对象

// 访问
console.log(count.value)
console.log(user.name)
```

### computed 与 watch

```js
import { computed, watch } from 'vue'

const doubled = computed(() => count.value * 2)

watch(count, (newVal, oldVal) => {
  console.log(`count changed: ${oldVal} -> ${newVal}`)
})
```

## 自定义 Hooks：逻辑复用的终极形态

Composition API 最大的威力在于**自定义 Hooks**。我们可以把任何可复用的逻辑封装成一个函数：

```js
// useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  const update = (e) => {
    x.value = e.clientX
    y.value = e.clientY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

任何组件都可以直接使用：

```js
const { x, y } = useMouse()
```

## 总结

| 特性 | Options API | Composition API |
| --- | --- | --- |
| 组织方式 | 按选项类型 | 按功能逻辑 |
| 逻辑复用 | mixin（易冲突） | 自定义 Hooks（清晰） |
| 类型推导 | 一般 | 优秀 |
| 学习曲线 | 平缓 | 略陡 |

选择哪种 API 不是非此即彼的——Vue 3 完全兼容 Options API。在新项目中，建议**优先使用 Composition API**，尤其是当逻辑较复杂时。