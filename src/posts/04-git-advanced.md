---
title: Git 高级技巧：让版本控制更优雅
date: 2026-06-18
category: 工程效率
tags: [Git, 工具, 协作]
readTime: 10 min
cover: https://images.unsplash.com/photo-1556075798-4825dfaafb6f?w=800&h=450&fit=crop
---

# Git 高级技巧：让版本控制更优雅

Git 远比大多数人使用的要强大。本文整理一些让你事半功倍的高级技巧。

## 1. 交互式 rebase：美化提交历史

`git rebase -i HEAD~n` 可以让你重新组织最近 n 个提交：

- `pick`：保留提交
- `reword`：修改提交信息
- `edit`：修改提交内容
- `squash`：合并到上一个提交
- `drop`：丢弃提交

```bash
git rebase -i HEAD~3
```

## 2. cherry-pick：跨分支移植提交

只需要某一个分支上的某个提交？

```bash
git cherry-pick <commit-hash>
```

可以一次选择多个提交，也可以指定范围。

## 3. worktree：同时处理多个分支

不再需要 `git stash` 来切换分支：

```bash
git worktree add ../project-feature feature/new-thing
```

每个 worktree 是一个独立的工作目录，共享同一个 `.git` 仓库。

## 4. bisect：二分查找 Bug 源头

当你不确定哪个提交引入了 bug 时：

```bash
git bisect start
git bisect bad                  # 当前是有问题的
git bisect good v1.0.0          # 这个版本是好的
# Git 会自动 checkout 中间提交，你告诉它是 good 还是 bad
git bisect reset                # 完成后退出
```

## 5. reflog：你的"后悔药"

任何"丢失"的提交都能通过 reflog 找回：

```bash
git reflog
# 找到 reset 之前的 commit hash
git reset --hard <commit-hash>
```

## 6. 实用的 alias 配置

把这些加到 `~/.gitconfig`：

```ini
[alias]
  st = status
  co = checkout
  br = branch
  unstage = reset HEAD --
  last = log -1 HEAD
  lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset'
```

> Git 是一个分布式的、去中心化的内容寻址文件系统。当你真正理解这一点，许多"神奇"的命令都会变得自然而然。