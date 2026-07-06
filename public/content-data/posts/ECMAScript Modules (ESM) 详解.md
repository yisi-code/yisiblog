---
title: "ECMAScript Modules (ESM) 详解"
date: 2025-11-10 00:42:46
category: "全栈技术栈"
tags:
- "ecmascript"
- "前端"
- "开发语言"
---

## ECMAScript Modules (ESM) 详解

> ECMA，读音类似“艾克妈”，是欧洲计算机制造商协会（European Computer Manufacturers  Association）的简称，是一家国际性会员制度的信息和电信标准组织。1994年之后，由于组织的标准牵涉到很多其他国家，为了体现其国际性，更名为 Ecma 国际（Ecma International），因此 Ecma 就不再是首字母缩略字了。

### 概述

ECMAScript Modules（ESM）是 JavaScript 的官方模块系统，于 ECMAScript 2015 (ES6) 中正式引入。它提供了一种标准化、语言层面的模块化方案，用于替代之前的社区方案（如 CommonJS、AMD 等）。ESM 设计为静态结构，模块的依赖关系在编译时就能确定，这使得工具可以进行更好的优化和静态分析。

### 基本语法

#### 导出 (Export)

使用 `export` 关键字将模块内的变量、函数、类等暴露给外部。

##### 命名导出 (Named Exports)

一个模块可以有多个命名导出。
javascript

```javascript
// 方式一：声明时直接导出
export const name = 'Alice';
export function greet() {
console.log('Hello!');
}
export class Person {
constructor(name) {
this.name = name;
}
}
// 方式二：声明后统一导出
const age = 30;
const city = 'New York';
export { age, city }; // 推荐此方式，结构更清晰
// 方式三：导出时重命名
export { age as userAge, city as userCity };
```

##### 默认导出 (Default Export)

一个模块只能有一个默认导出，导入时可以为它指定任意名称。
javascript

```javascript
// 方式一：直接导出默认值
export default function() {
console.log('This is the default export.');
}
// 方式二：先定义后导出
const defaultGreeting = "Hi there!";
export default defaultGreeting;
```

#### 导入 (Import)

使用 `import` 关键字引入其他模块导出的内容。

##### 导入命名导出

javascript

```javascript
// 导入特定的命名导出
import { name, greet } from './module.js';
// 导入时重命名（避免冲突）
import { name as userName, greet as sayHello } from './module.js';
// 导入所有命名导出到一个命名空间对象
import * as Module from './module.js';
console.log(Module.name);
```

##### 导入默认导出

javascript

```javascript
// 导入默认导出，名称可自定义
import myFunction from './module.js'; // 对应模块中的 export default
// 混合导入：同时导入默认导出和命名导出
import defaultExport, { namedExport1, namedExport2 } from './module.js';
```

### 模块的特点与优势

#### 关键特性

- **静态结构** ：依赖关系在编译时确定，支持 Tree-shaking，优化打包体积。

- **模块作用域** ：每个模块有独立作用域，避免全局变量污染，提高封装性。

- **严格模式** ：模块自动启用严格模式，编写更安全、规范的代码。

- **异步加载** ：支持动态 `import()` ，按需加载，提升应用性能。

- **实时绑定** ：导入是导出的只读引用，支持动态更新，值变更时所有导入处同步更新。

#### 与 CommonJS 模块的区别

| 特性 | ES Modules | CommonJS |
|:---:|:---:|:---:|
| **加载方式** | 静态编译时加载 | 运行时同步加载 |
| **语法** | `import/export` | `require/module.exports` |
| **适用环境** | 浏览器和现代 Node.js | 主要用于 Node.js |
| **模块类型** | 官方标准 | 社区规范 |
| **性能优化** | 支持静态分析，Tree-shaking | 优化空间有限 |

### 高级用法

#### 动态导入 (Dynamic Import)

使用 `import()` 函数在运行时按需加载模块，返回一个 Promise。
javascript

```javascript
// 按条件动态加载模块
button.addEventListener('click', async () => {
const module = await import('./someModule.js');
module.doSomething();
});
// 使用 Promise 语法
if (userNeedsFeature) {
import('./advancedFeature.js').then(module => {
module.run();
});
}
```

#### 模块的循环依赖

ESM 支持循环依赖（模块A导入B，B也导入A），但应谨慎使用。

```javascript
javascript
// moduleA.js
import { b } from './moduleB.js';
export const a = 'A';
// moduleB.js
import { a } from './moduleA.js';
export const b = 'B';
```

#### 聚合导出 (Re-exporting)

在一个模块中集中导出其他模块的内容。
javascript

```javascript
// 重新导出其他模块的所有内容（除了默认导出）
export * from './module1.js';
// 重新导出特定内容
export { foo, bar } from './module2.js';
// 重新导出并重命名
export { default as NewName } from './module3.js';
```

### 实际应用场景

#### 在浏览器中使用

在 HTML 中通过 `<script type="module">` 标签加载 ESM。
html

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ES Modules Demo</title>
</head>
<body>
<script type="module" src="main.js"></script>
<script type="module">
import { greet } from './utils.js';
greet('World');
</script>
</body>
</html>
```

#### 在 Node.js 中使用

从 Node.js v13.2.0 开始稳定支持 ESM。

**方式一：使用 `.mjs` 扩展名** 
javascript

```javascript
// utils.mjs
export function add(a, b) {
return a + b;
}
// main.mjs
import { add } from './utils.mjs';
console.log(add(2, 3)); // 5
```

**方式二：在 `package.json` 中设置类型** 
json
{
“type”: “module”,
“name”: “my-project”,
“version”: “1.0.0”
}

#### 实用的模块组织示例

```javascript
// 📁 utils/stringUtils.js
export function capitalize(str) {
return str.charAt(0).toUpperCase() + str.slice(1);
}
export function reverseString(str) {
return str.split('').reverse().join('');
}
// 📁 utils/index.js (聚合导出)
export * from './stringUtils.js';
export * from './mathUtils.js';
// 📁 main.js
import { capitalize, reverseString } from './utils/index.js';
console.log(capitalize('hello')); // "Hello"
```

### 最佳实践建议

1. **优先使用命名导出** ：便于 Tree-shaking 优化和明确依赖关系。

2. **合理使用默认导出** ：当模块主要提供单一功能时使用。

3. **避免循环依赖** ：虽然 ESM 支持，但会使代码结构复杂化。

4. **利用动态导入优化性能** ：对非首屏必需的代码使用按需加载。

5. **保持模块单一职责** ：每个模块应专注于一个特定功能。

ESM 已成为现代 JavaScript 开发的基石，掌握其用法对于构建可维护、高性能的应用至关重要。