import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind 类名：clsx 处理条件类，tailwind-merge 解决冲突。
 * shadcn-vue 惯例工具。
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
