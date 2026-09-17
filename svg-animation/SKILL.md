---
name: svg-animation
description: "用于生成、优化和审查 SVG 动画的专用技能。适用于图标动画、加载动画、Logo 动效、插画微交互；支持 CSS、SMIL 和最小化 JS，输出单文件、可访问、可复用、可降级的 SVG。"
---

# SVG Animation Skill

Version: 1.0.0  
License: MIT  
Format: SKILL.md

## 1. 适用场景

当用户请求以下任务时，应激活本技能：

- 制作 SVG 动画
- 为 SVG 图标添加动效
- 制作 loading / spinner 动画
- 制作 Logo 入场动画
- 制作描边动画、路径绘制动画
- 制作 SVG 插画动画
- 优化已有 SVG 动画
- 审查 SVG 动画的性能、兼容性与无障碍性
- 将动画需求转换为单文件 SVG、内联 SVG 或 React JSX SVG 组件

本技能默认输出 SVG 原生动画，不依赖外部资源。除非用户明确要求，否则不引入外部 JS 库、字体、图片或 Lottie JSON。

---

## 2. 核心原则

生成 SVG 动画时，必须遵循以下原则：

1. **单文件优先**  
   默认输出可直接嵌入网页或保存为 `.svg` 文件的单文件 SVG。

2. **矢量优先**  
   保持 SVG 可缩放、清晰、无位图依赖。

3. **CSS 优先，SMIL 备选，JS 谨慎使用**  
   - 简单循环、透明度、位移、旋转、缩放、描边动画：优先使用 CSS Animation。
   - 路径 `d` 变形、属性动画、纯 SVG 文件中无 CSS 支持的特殊场景：可使用 SMIL。
   - 复杂交互、物理动画、时间轴控制、动态数据驱动：仅在用户明确要求时使用 JS。

4. **性能优先**  
   优先动画以下属性：

   - `transform`
   - `opacity`
   - `stroke-dashoffset`
   - `stroke-dasharray`
   - `fill-opacity`
   - `stroke-opacity`

   谨慎动画以下属性：

   - `width`
   - `height`
   - `x`
   - `y`
   - `filter`
   - `clip-path`
   - 大量路径点的 `d`

5. **无障碍优先**  
   必须考虑 `prefers-reduced-motion`，并为装饰性或信息性 SVG 提供正确的 ARIA 语义。

6. **可降级**  
   如果动画不可用或用户系统开启减少动态效果，应保留可读、可见的静态结果。

7. **可复用**  
   默认使用 `currentColor`，便于通过 CSS 控制颜色。除非用户指定，否则避免硬编码过多颜色。

---

## 3. 需求澄清策略

如果用户未提供完整信息，最多提出 3 个关键问题。若用户希望直接生成，则使用合理默认值。

可询问：

1. 目标类型：图标、加载动画、Logo、插画、按钮微交互？
2. 使用环境：内联 HTML、独立 `.svg` 文件、React JSX、`<img>` 引入？
3. 动画风格：轻盈、弹性、机械、流畅、科技感、手绘感？
4. 循环方式：单次播放、无限循环、悬停触发、点击触发？
5. 尺寸与颜色：是否需要响应式、是否继承 `currentColor`？

默认值：

- 图标：`viewBox="0 0 24 24"`
- 插画：`viewBox="0 0 120 120"`
- 动画时长：`600ms` 到 `1600ms`
- 缓动：`cubic-bezier(0.4, 0, 0.2, 1)` 或 `ease-in-out`
- 加载动画：无限循环
- Logo 入场动画：单次播放
- 颜色：`currentColor`
- 不依赖外部资源
- 不包含 `<script>`

---

## 4. 技术选型规则

### 4.1 优先使用 CSS Animation

适用场景：

- 旋转
- 缩放
- 平移
- 淡入淡出
- 描边绘制
- 简单状态切换
- loading 动画
- 图标微交互

要求：

- 将 `<style>` 放在 SVG 内部。
- 为 class 添加语义化前缀，避免全局污染。
- 对 SVG 元素使用 transform 时，应显式声明：

```css
transform-box: fill-box;
transform-origin: center;
```

### 4.2 可使用 SMIL

适用场景：

- 路径 `d` 变形
- `points` 动画
- 渐变 stop 动画
- 不依赖 CSS 的纯 SVG 文件动画
- 需要 `repeatCount="indefinite"` 的简单属性动画

常用标签：

```xml
<animate />
<animateTransform />
<animateMotion />
<set />
```

注意：

- 路径变形时，`values` 中的多个路径必须保持相同数量和类型的路径命令。
- 如果目标环境对 SMIL 支持不确定，应提供静态回退或改用 CSS。

### 4.3 谨慎使用 JavaScript

仅在以下情况使用 JS：

- 用户明确要求交互逻辑
- 需要时间轴控制
- 需要根据数据动态生成路径
- 需要物理弹簧、拖拽、滚动驱动等复杂行为

默认禁止：

- 内联 `onclick`
- `onload`
- 外部脚本
- `eval`
- 任意不安全脚本行为

---

## 5. 强制输出规范

除非用户另有要求，输出 SVG 时必须满足：

1. 包含 SVG 命名空间：

```xml
xmlns="http://www.w3.org/2000/svg"
```

2. 包含 `viewBox`。

3. 根据用途设置尺寸：

```xml
width="24" height="24"
```

或响应式：

```xml
width="100%"
```

若用户未指定，可省略固定宽高，仅保留 `viewBox`。

4. 信息性 SVG 必须包含 `<title>`，必要时包含 `<desc>`：

```xml
<svg role="img" aria-labelledby="svg-title">
  <title id="svg-title">动画标题</title>
</svg>
```

5. 装饰性 SVG 应设置：

```xml
aria-hidden="true"
focusable="false"
```

6. CSS 放在 SVG 内部：

```xml
<style>
  /* animation css */
</style>
```

如果 CSS 中包含 `<`、`&` 或其他可能破坏 XML 解析的字符，应使用 CDATA：

```xml
<style><![CDATA[
  /* animation css */
]]></style>
```

7. 优先使用 `currentColor`：

```xml
stroke="currentColor"
fill="currentColor"
```

8. 所有动画元素必须可静态降级。  
   当动画关闭时，最终图形仍应完整可见。

9. 如果用户要求 React JSX，应转换为 JSX 语法：

- `class` 改为 `className`
- `stroke-width` 改为 `strokeWidth`
- `stroke-linecap` 改为 `strokeLinecap`
- `stroke-linejoin` 改为 `strokeLinejoin`
- `stroke-dasharray` 改为 `strokeDasharray`
- `stroke-dashoffset` 改为 `strokeDashoffset`
- `xmlns:xlink` 改为 `xmlnsXlink`
- 保留 SVG 标签结构

---

## 6. 动画设计规范

### 6.1 时长建议

- 微交互：`120ms` 到 `240ms`
- 图标状态切换：`200ms` 到 `400ms`
- Logo 入场：`600ms` 到 `1500ms`
- loading 循环：`800ms` 到 `1600ms`
- 插画氛围循环：`2s` 到 `6s`

### 6.2 缓动建议

- 入场：`cubic-bezier(0.16, 1, 0.3, 1)`
- 出场：`cubic-bezier(0.7, 0, 0.84, 0)`
- 常规移动：`cubic-bezier(0.4, 0, 0.2, 1)`
- 弹性：`cubic-bezier(0.34, 1.56, 0.64, 1)`
- 循环旋转：`linear`
- 呼吸效果：`ease-in-out`

### 6.3 循环动画要求

- 首尾状态必须自然衔接。
- 若使用 `@keyframes`，确保 `0%` 与 `100%` 状态一致，或使用合理 `animation-direction: alternate`。
- 若使用 SMIL，设置：

```xml
repeatCount="indefinite"
```

### 6.4 描边动画要求

优先使用 `pathLength="1"` 简化计算：

```xml
<path pathLength="1" class="draw" d="..." />
```

对应 CSS：

```css
.draw {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: draw 900ms ease-out forwards;
}

@keyframes draw {
  to {
    stroke-dashoffset: 0;
  }
}
```

---

## 7. 无障碍规范

必须遵循：

1. 如果 SVG 是装饰性内容：

```xml
<svg aria-hidden="true" focusable="false">
```

2. 如果 SVG 传达信息：

```xml
<svg role="img" aria-labelledby="title-id">
  <title id="title-id">描述文本</title>
</svg>
```

3. 必须支持减少动态效果：

```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none !important;
    transition: none !important;
  }
}
```

4. 动画关闭后，内容不应消失。  
   应将元素恢复或保持在最终可读状态。

5. 避免高频闪烁。  
   不应出现每秒超过 3 次的强烈闪烁动画。

---

## 8. 性能规范

生成动画时必须检查：

1. 优先使用 `transform`，避免频繁改变布局属性。
2. 避免同时动画过多节点。
3. 避免对大型复杂路径做高频变形。
4. 避免无节制使用 `filter`、`blur`、`drop-shadow`。
5. 对重复元素使用 `<defs>`、`<symbol>`、`<use>`。
6. 保持路径简洁。
7. 不要引入不必要的外部字体或图片。
8. 若作为 `<img>` 使用，不得使用 JS 和外部资源。

---

## 9. 兼容性规范

### 9.1 内联 HTML

- CSS Animation 通常可用。
- SMIL 通常可用，但建议 CSS 优先。
- 可使用 `currentColor`。
- 注意页面全局 CSS 可能影响 SVG 内部选择器。

### 9.2 独立 `.svg` 文件

- CSS 放在 `<style>` 内。
- 可使用 `@media (prefers-reduced-motion: reduce)`。
- 不使用外部资源。
- 若包含特殊字符，使用 CDATA。

### 9.3 通过 `<img src="xxx.svg">` 引入

- 不支持脚本。
- 不支持交互事件。
- CSS 动画通常可用。
- SMIL 通常可用，但建议提供静态降级。
- 不使用外部字体。

### 9.4 React / JSX

- 将 SVG 属性转换为 JSX 驼峰命名。
- `<style>` 内容可保留为字符串。
- 若使用组件，应允许通过 `className`、`style`、`width`、`height`、`color` 控制外观。

---

## 10. 常见 SVG 动画模式

### 10.1 旋转加载动画

适用：

- loading
- spinner
- 请求状态
- 按钮加载中

标准实现：

```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width="24"
  height="24"
  role="img"
  aria-labelledby="spinner-title"
>
  <title id="spinner-title">加载中</title>
  <style><![CDATA[
    .spinner-ring {
      transform-box: fill-box;
      transform-origin: center;
      animation: spinner-rotate 1s linear infinite;
    }

    .spinner-arc {
      fill: none;
      stroke: currentColor;
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-dasharray: 42 18;
    }

    @keyframes spinner-rotate {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .spinner-ring {
        animation: none;
      }
    }
  ]]></style>
  <g class="spinner-ring">
    <circle class="spinner-arc" cx="12" cy="12" r="9" />
  </g>
</svg>
```

### 10.2 描边绘制动画

适用：

- 图标绘制
- 手绘风格
- Logo 入场
- 路径强调

标准实现：

```svg
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width="24"
  height="24"
  role="img"
  aria-labelledby="draw-title"
>
  <title id="draw-title">描边动画</title>
  <style><![CDATA[
    .draw-path {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: draw-path 900ms ease-out forwards;
    }

    @keyframes draw-path {
      to {
        stroke-dashoffset: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .draw-path {
        animation: none;
        stroke-dashoffset: 0;
      }
    }
  ]]></style>
  <path
    class="draw-path"
    pathLength="1"
    d="M4 12c2.5-4.5 6-6.5 8-6.5s5.5 2 8 6.5c-2.5 4.5-6 6.5-8 6.5s-5.5-2-8-6.5z"
  />
  <circle class="draw-path" pathLength="1" cx="12" cy="12" r="2.5" />
</svg>
```

### 10.3 图标状态切换

适用：

- 播放 / 暂停
- 菜单 / 关闭
- 收藏 / 取消收藏
- 成功状态出现

规则：

- 使用两个或多个图层。
- 通过 `opacity` 和 `transform` 切换。
- 保持动画时长短于 `300ms`。
- 使用 `transform-box: fill-box`。

### 10.4 路径变形

适用：

- 图标形状变化
- 简单 morph 动画
- 液态形状变化

优先顺序：

1. 如果目标浏览器支持 CSS `d: path()`，可用 CSS。
2. 否则使用 SMIL：

```xml
<animate
  attributeName="d"
  dur="1s"
  repeatCount="indefinite"
  values="M...; M...; M..."
/>
```

要求：

- 所有路径命令数量一致。
- 所有路径命令类型一致。
- 避免过多锚点。
- 若用于生产环境，应测试兼容性。

---

## 11. 禁止事项

除非用户明确要求，否则不得：

1. 引入外部 CDN 脚本。
2. 引入外部字体。
3. 引入位图资源。
4. 添加 `onclick`、`onload` 等事件处理器。
5. 使用 `eval` 或动态脚本执行。
6. 输出不完整的 SVG 标签。
7. 输出未闭合的 `<style>` 或 `<defs>`。
8. 在无必要时使用 JavaScript。
9. 使用不可降级的动画导致静态状态下内容不可见。
10. 使用过多滤镜导致性能明显下降。

---

## 12. 质量检查清单

每次输出前必须自检：

- [ ] 是否包含 `xmlns="http://www.w3.org/2000/svg"`
- [ ] 是否包含 `viewBox`
- [ ] 是否为合法、可解析的 SVG
- [ ] 是否没有未闭合标签
- [ ] 是否所有 ID 唯一
- [ ] 是否优先使用 `transform` 和 `opacity`
- [ ] 是否支持 `prefers-reduced-motion`
- [ ] 是否在减少动态效果后仍可见
- [ ] 是否避免了外部依赖
- [ ] 是否适合目标嵌入方式：内联、独立文件、`<img>` 或 JSX
- [ ] 是否颜色默认使用 `currentColor`
- [ ] 是否没有不必要的脚本
- [ ] 是否动画循环无跳变
- [ ] 是否类名不会污染全局作用域
- [ ] 是否在信息性 SVG 中提供 `<title>`

---

## 13. 回复模板

当用户请求 SVG 动画时，按以下结构回复：

1. **方案说明**  
   简要说明采用的动画技术、动画结构和设计意图。

2. **SVG 代码**  
   提供完整可运行的 SVG 代码块。

3. **自定义方式**  
   说明如何修改颜色、速度、尺寸、缓动或循环方式。

4. **兼容性与无障碍说明**  
   说明是否支持 `<img>`、是否支持减少动态效果、是否适合 React。

---

## 14. 输出风格要求

- 代码必须完整，不允许省略关键标签。
- 优先给单文件 SVG。
- 若用户要求 React 组件，则输出 JSX。
- 若用户要求 HTML 预览，可输出包含 `<body>` 的最小 HTML。
- 若用户要求优化已有 SVG，应给出优化后的完整代码，并列出主要优化点。
- 若用户请求复杂动画，应先拆解为图层、动画组、时间轴和状态。

---

## 15. 示例任务响应

用户输入：

```text
帮我做一个加载中 SVG 动画，24px，白色背景下使用，颜色继承 currentColor，无限循环，支持减少动态效果。
```

应按以下方向输出：

- 使用 `viewBox="0 0 24 24"`
- 使用 CSS 旋转动画
- 使用 `stroke: currentColor`
- 添加 `<title>`
- 添加 `prefers-reduced-motion`
- 不使用 JS
- 输出单文件 SVG

最终代码应类似本技能第 10.1 节中的标准旋转加载动画。