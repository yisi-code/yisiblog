## 引言

在 CSS 中，`z-index` 可能是最容易被误解的属性之一。许多开发者遇到元素重叠顺序错乱时，只会盲目地增大 `z-index` 值，结果往往事与愿违。

> 核心理念：`z-index` 并非简单地“数值大就压在上面”，而是受限于层叠上下文（Stacking Context）的规则。

本文将带你彻底理解层叠上下文的创建条件、层叠顺序的优先级，并通过多个代码示例演示如何优雅地管理元素层级。

## 1. 什么是层叠上下文？

层叠上下文是 HTML 元素的一个三维概念，它表示元素在 Z 轴上的“层级环境”。每个层叠上下文都包含一组元素，其层叠顺序受同一套规则控制。
简单类比：层叠上下文就像是一摞“透明的相框”，每个相框里放着若干张照片（子元素）。你可以把整摞相框放在桌子上，也可以把某个相框单独拿出来调整位置，但照片不能跨相框比较高低。

### 1.1 触发层叠上下文的常见条件

以下任意一个条件都会创建新的层叠上下文：

- 根元素 <html>
- position: relative | absolute | fixed | sticky 且 z-index 值不为 auto
- display: flex | grid 的子项，且 z-index 值不为 auto
- opacity 值小于 1
- transform、filter、perspective、clip-path 等属性值不为 none
- will-change 指定了上述任意属性
- isolation: isolate

我们来看一个直观的例子：

<div class="parent" style="position: relative; z-index: 1;">
  <div class="child" style="position: absolute; z-index: 999;">子元素</div>
</div>
<div class="sibling" style="position: relative; z-index: 2;">兄弟元素</div>

尽管 child 的 z-index 高达 999，但它依然会被 sibling 覆盖，因为 child 的层叠上下文是 parent，而 parent 的 z-index（1）小于 sibling 的 z-index（2）。子元素无法超越父级所在的上下文环境。

## 2. 层叠顺序规则（重点）

在同一个层叠上下文中，元素按照以下从低到高的顺序堆叠：

1. 背景和边框：当前层叠上下文的背景和边框
2. 负 z-index：子元素中 z-index 为负值的项（如 z-index: -1）
3. 块级盒子：普通流中的非定位块级元素（display: block）
4. 浮动盒子：普通流中的浮动元素（float）
5. 内联盒子：普通流中的内联块级元素（inline-block、inline-flex 等）
6. z-index: auto 或 0：定位元素且未设置 z-index（或为 auto）
7. 正 z-index：定位元素且 z-index 为正值（数值越大越靠上）

记忆口诀：背负块浮内，零正则压箱。

## 3. 实战技巧与常见陷阱

### 3.1 避免“魔法数字”
- 不推荐：随意使用 z-index: 99999 希望“压住一切”
- 推荐：使用具名变量或设计系统，例如：
  $z-index-dropdown: 100;
  $z-index-modal: 200;
  $z-index-tooltip: 300;

### 3.2 使用 isolation 创建隔离层
当你需要确保某个组件内部的 z-index 不影响外部时，可以给容器加上 isolation: isolate，强制创建一个新的层叠上下文，而不需要修改子元素的定位。

.modal-wrapper {
isolation: isolate; /* 创建独立层叠上下文 */
}

### 3.3 小心 transform 带来的副作用
某些动画库会给元素加上 transform，这会隐式创建层叠上下文，从而影响 z-index。如果发现层级错乱，检查是否意外触发了。

## 4. 代码示例

下面是一个实际项目中常见的“卡片堆叠”效果，利用层叠上下文实现自然的阴影和悬浮效果。

<style>
  .card {
    position: relative;
    width: 200px;
    height: 120px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    transition: transform 0.15s, z-index 0.15s;
  }
  .card:hover {
    transform: scale(1.05);
    z-index: 10;
  }
  .card-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .card-stack .card {
    margin-top: -40px;
  }
  .card-stack .card:first-child {
    margin-top: 0;
  }
</style>
<div class="card-stack">
  <div class="card">卡片 1</div>
  <div class="card">卡片 2</div>
  <div class="card">卡片 3</div>
</div>

注意：在堆叠卡片时，由于每个 .card 都创建了自己的层叠上下文（因为 position: relative 且 z-index 默认为 auto），它们的层叠顺序由 DOM 顺序决定（后面的覆盖前面的）。通过 hover 动态提升 z-index 可实现“上浮”效果。

## 5. 扩展阅读与工具

- MDN: 层叠上下文 (https://developer.mozilla.org/zh-CN/docs/Web/CSS/CSS_positioned_layout/Understanding_z-index/Stacking_context)
- CSS-Tricks: z-index 完全指南 (https://css-tricks.com/almanac/properties/z/z-index/)
- 浏览器开发者工具中的“层叠上下文”可视化面板（Edge/Chrome 支持）

## 总结表格

| 层叠上下文触发方式 | 示例代码 | 影响范围 |
|------------------|---------|---------|
| 定位 + z-index | position: relative; z-index: 1; | 子元素受其层叠环境限制 |
| 透明 < 1 | opacity: 0.99; | 会产生新上下文（小心） |
| transform | transform: translateX(0); | 常见于动画性能优化 |
| flex 子项 + z-index | display: flex; .item { z-index: 1; } | 现代布局常用 |

## 数学公式示例

在 CSS 中，层叠上下文的堆叠算法可以用以下公式概括（非官方，便于理解）：

Stacking Order = Σ(Context_i) + z-index_local

其中 Context_i 表示父级层叠上下文的基准值，z-index_local 表示当前元素在自身上下文中的偏移。

不过，CSS 规范实际上更复杂，这里仅作为直观理解。

## 结语

理解层叠上下文和 z-index 是成为高级前端工程师的必修课。不要害怕使用 z-index，而是要学会尊重它的规则。记住：

层叠上下文不是 Bug，而是 Feature。

通过合理构建 HTML 结构、善用 isolation 和具名变量，你可以轻松驾驭任何复杂的层级需求。希望本文能帮你彻底告别 z-index 噩梦！

如果你有任何疑问或补充，欢迎在评论区留言讨论。

版权声明：本文为原创技术博文，转载请注明出处。感谢阅读！
