---
title: "从零开始搭建 Vue 3 + Vite 项目：一份极速上手指南"
date: 2025-11-10 01:54:37
category: "全栈技术栈"
tags:
- "vue.js"
- "前端"
- "javascript"
---

## 从零开始搭建 Vue 3 + Vite 项目：一份极速上手指南

Vue 3 以其出色的性能和新颖的 Composition API，配合 Vite 这一革命性的前端构建工具，已成为现代 Web 开发的热门选择。Vite 凭借其闪电般的冷启动和高效的热更新，能极大提升开发体验。本文将手把手带你完成一个 Vue 3 + Vite 项目的搭建。

### 环境准备

#### 安装 Node.js

确保你的开发环境中已安装 **Node.js 16.0** 或更高版本（推荐使用 18+ 的 LTS 版本）。你可以通过以下命令验证：

```javascript
node -v
npm -v
```

如果尚未安装，请前往 [Node.js 官网](https://nodejs.org/) 下载并安装。

**提速小贴士** ：如果在linux等服务器上依赖包下载速度慢，可以配置国内镜像源：

```javascript
npm config set registry https://registry.npmmirror.com
```

### 项目创建与初始化

#### 使用 Vite 脚手架创建项目

Vite 提供了便捷的命令行工具，可以快速搭建项目骨架。运行以下命令：

```javascript
npm create vite@latest my-vue3-app -- --template vue
```

- `my-vue3-app` 是你的项目名称，可以根据需要修改。

- `--template vue` 指定使用 Vue 模板。如需使用 TypeScript，可替换为 `vue-ts` 。

#### 安装依赖并启动

命令执行成功后，进入项目目录并安装依赖（新版会自动安装并启动）：

```javascript
cd my-vue3-app
npm install
```

依赖安装完成后，即可启动开发服务器（没有新的依赖要安装，需要启动vite服务只需运行下面命令）：

```javascript
npm run dev
```

Vite 的开发服务器通常会在 `http://localhost:5173` 启动。在浏览器中打开此地址，你就能看到你的 Vue 应用正在运行了！

### 项目结构概览

一个新创建的 Vue 3 + Vite 项目通常包含以下核心文件和目录：
my-vue3-app/
├── node_modules/ # 项目依赖包
├── src/ # 源代码目录
│ ├── assets/ # 静态资源（如图片、样式）
│ ├── components/ # Vue 组件
│ ├── App.vue # 应用的根组件
│ └── main.js # 应用的入口 JS 文件
├── index.html # 页面入口模板
├── vite.config.js # Vite 配置文件
└── package.json # 项目依赖和脚本配置
**关键文件说明** ：

- `src/main.js` ：这是应用的入口文件，负责使用 `createApp` 创建 Vue 应用实例并挂载到 DOM。

- `index.html` ：Vite 服务的入口点，其中包含一个 `<div id="app"></div>` 作为应用的挂载容器，并通过 `<script type="module" src="/src/main.js"></script>` 加载入口文件。

### 核心配置文件：vite.config.js

Vite 的配置集中在 `vite.config.js` 文件中。一个基础的配置如下：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// 使用路径解析（path）时可能需要导入
import path from 'path'
export default defineConfig({
plugins: [vue()], // 启用 Vue 插件
resolve: {
alias: {
// 配置路径别名，@ 指向 src 目录，方便文件引入
'@': path.resolve(__dirname, './src')
}
},
server: {
port: 3000, // 自定义开发服务器端口
// 配置代理，解决跨域问题
proxy: {
'/api': {
target: 'http://localhost:4000',
changeOrigin: true
}
}
}
})
```

### 探索 Vue 3 与项目优化

成功搭建项目只是第一步，接下来你可以：

1. **学习 Vue 3 基础** ：重点理解 **Composition API** （如 `ref` , `reactive` , `computed` , 生命周期钩子等）以及与 Options API 的区别。

2. **集成官方库** ：根据需求引入 `vue-router` 进行路由管理。

3. **构建与部署** ：当项目开发完成，运行 `npm run build` 命令来构建生产版本。构建产物会生成在 `dist` 目录中，你可以将这些文件部署到任何静态文件服务器或云平台。

#### 向项目中添加Vue Router

命令行中进入项目根目录运行命名：

```javascript
npm install vue-router@4
```

即可在项目中使用如下命令：

```javascript
import { useRouter, useRoute } from 'vue-router'
```

### 总结

通过 Vite 搭建 Vue 3 项目是一个非常简洁高效的过程。Vite 提供了超快的开发服务器启动和模块热更新，而 Vue 3 则带来了更现代、更灵活的代码组织方式。这套组合为前端开发带来了极佳的体验。

希望这篇指南能帮助你顺利开启 Vue 3 开发之旅！如有任何问题，欢迎随时查阅 [Vite 官方文档](https://vitejs.dev/) 和 [Vue 3 官方文档](https://vuejs.org/) 。