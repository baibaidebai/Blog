---
title: Rust 所有权机制：从入门到顿悟
date: 2026-06-25
category: 系统编程
tags: [Rust, 内存管理, 系统]
readTime: 18 min
cover: https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&h=450&fit=crop
---

# Rust 所有权机制：从入门到顿悟

Rust 最独特的设计就是它的**所有权系统**。它让 Rust 能够在没有垃圾回收（GC）的情况下保证内存安全，同时不牺牲性能。

## 三条核心规则

1. Rust 中的每一个值都有一个**所有者**（owner）
2. 同一时刻只能有一个所有者
3. 当所有者离开作用域时，值会被**自动丢弃**

```rust
{
    let s = String::from("hello"); // s 是这个 String 的所有者
    // 使用 s...
}  // 作用域结束，s 离开，内存被自动释放
```

## 移动（Move）

与其他语言不同，Rust 中的赋值操作不是简单的复制，而是**移动**：

```rust
let s1 = String::from("hello");
let s2 = s1;  // s1 的所有权移动到 s2，s1 失效

// println!("{}", s1);  // ❌ 编译错误：s1 已经无效
println!("{}", s2);     // ✅ 正确
```

如果你确实需要复制堆上的数据，可以使用 `clone()`：

```rust
let s1 = String::from("hello");
let s2 = s1.clone();  // 深拷贝

println!("{} {}", s1, s2);  // 两者都有效
```

## 借用（Borrow）

有时候你只是想读取数据，而不是获取所有权。这时可以使用**引用**：

```rust
fn calculate_length(s: &String) -> usize {
    s.len()
}  // s 离开作用域，但因为它只是引用，所以不会丢弃原始数据

let s = String::from("hello");
let len = calculate_length(&s);  // 传递引用
```

## 可变引用

```rust
fn append_world(s: &mut String) {
    s.push_str(", world");
}

let mut s = String::from("hello");
append_world(&mut s);
println!("{}", s);  // "hello, world"
```

> **关键限制**：在同一作用域内，对同一个数据只能有一个可变引用，或者多个不可变引用，**不能同时存在**。

这条规则防止了**数据竞争**（data race），由编译器在编译期静态保证。

## 切片（Slice）

切片是对集合中一段连续元素的引用：

```rust
let s = String::from("hello world");
let hello = &s[0..5];   // "hello"
let world = &s[6..11];  // "world"
```

## 为什么这是伟大的设计

所有权机制让 Rust 摆脱了 GC 的运行时开销，又避开了手动内存管理的陷阱——你不再会：

- 忘记释放内存（内存泄漏）
- 释放了仍在使用的内存（悬垂指针）
- 重复释放同一块内存（双重释放）
- 多个指针同时修改数据（数据竞争）

**这些错误全部在编译期被发现**，不需要等到运行时崩溃。

## 总结

Rust 的所有权机制可能一开始会让人感到束缚，但一旦理解并习惯了它，你会发现代码变得更加**安全、可预测**——这种"被编译器保护"的感觉，正是 Rust 的魅力所在。