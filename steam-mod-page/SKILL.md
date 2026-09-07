---
name: steam-mod-page
description: 为 Steam 创意工坊 / Steam Workshop Mod 页面生成可直接粘贴的高质量介绍文案。严格区分 Steam BBCode 与 Markdown，支持中文文件与英文文件完全分离，并优先将实际使用文档放在页面最显眼位置；根据 Mod 的真实功能、依赖、版本、安装方式和项目链接生成内容，禁止虚构信息。
---

# Steam Mod Page

## 1. Skill 定位

本 Skill 用于为游戏 Mod，尤其是 Steam 创意工坊 / Steam Workshop Mod，生成可以直接粘贴到 Workshop Description 的正式介绍文案。

目标不是生成普通 GitHub README，也不是生成一篇营销文章，而是生成符合 Steam Workshop 阅读习惯、视觉节奏和 BBCode 约束的 Mod 页面。

核心要求：

- 内容必须建立在 Mod 的真实功能、真实仓库、真实文档和真实版本信息上。
- 输出必须使用 Steam Workshop 支持的 BBCode 风格，而不是 Markdown。
- 中文与英文必须视为两个独立的最终文案文件。
- 当用户要求双语时，默认生成两个独立版本：一个完整中文版本，一个完整英文版本。
- 使用文档、安装文档或开发手册是开发者型 Mod 的首要信息时，必须放在页面最顶部、最显眼的位置。
- 文案应该首先帮助用户“正确使用 Mod”，其次才解释 Mod“是什么”。
- 不得把不存在的功能、兼容性、性能提升、Bug 修复、版本号、联系方式或链接写进去。

---

## 2. 首要原则：先研究 Mod，再写页面

不要直接套用模板。

在生成页面前，应优先收集以下信息：

1. Mod 的官方仓库或项目主页。
2. README / 文档 / Usage / Installation 页面。
3. manifest、project metadata、release 信息或其他可验证的版本信息。
4. Mod 的真实功能列表。
5. Mod 的依赖与兼容性要求。
6. 实际安装方式。
7. 用户需要特别注意的限制、迁移说明或兼容性警告。
8. 作者明确提供的联系方式与赞助链接。

如果用户给出了 GitHub、GitLab、Steam Workshop、Wiki 等项目链接，应优先以这些一手资料为准。

如果某一信息无法确认：

- 不要猜测。
- 不要沿用模板中的示例值。
- 可以删除该内容。
- 或使用明确占位符，例如 `[你的链接]`、`[你的邮箱]`。

---

## 3. 最重要的输出约束：中文和英文必须分文件

### 3.1 默认双语输出方式

当用户要求“中英双语”“中英文介绍”“双语页面”等内容时，不得把两个语言混在一个最终文案中。

必须生成：

```text
Steam Workshop Description — 中文
Steam Workshop Description — English
```

可以在聊天回复中分别展示，也可以分别保存为：

```text
Steam-Workshop-CN.txt
Steam-Workshop-EN.txt
```

每个文件都必须是完整、独立、可以单独粘贴到 Steam Workshop 的最终版本。

### 3.2 每个语言文件内部禁止混用语言

中文文件：

- 标题使用中文。
- 正文使用中文。
- 联系方式说明使用中文。
- 赞助说明使用中文。
- 不得为了所谓“双语一致”在每行后追加英文翻译。

英文文件：

- 标题使用英文。
- 正文使用英文。
- 联系方式说明使用英文。
- 赞助说明使用英文。
- 不得在英文正文中插入中文解释。

代码、文件名、API 名称、游戏内专有名词以及官方项目名可以保留原文，因为它们属于技术标识而不是第二语言正文。

---

## 4. Steam BBCode 与 Markdown 必须严格分离

### 4.1 根本规则

Steam Workshop Description 不是 GitHub Markdown。

生成最终文案时：

[b]禁止输出 Markdown 语法作为排版控制符。[/b]

特别禁止：

- `# 标题`
- `## 标题`
- `### 标题`
- `**粗体**`
- `*斜体*`
- `` `inline code` ``
- ` ``` ` 代码块
- `> 引用`
- Markdown 表格
- `---` / `***` / `___` 作为水平线
- Markdown 图片语法 `![alt](url)`
- Markdown 链接 `[text](url)`
- Markdown 无序列表 `- item`
- Markdown 有序列表 `1. item`

这些语法可以出现在 Skill 的说明或内部示例中，但绝不能出现在最终 Steam 文案里。

### 4.2 默认允许使用的 Steam BBCode

优先使用简单、稳定的 BBCode：

```text
[h1]...[/h1]
[h2]...[/h2]
[h3]...[/h3]
[b]...[/b]
[i]...[/i]
[list]
[*]...
[/list]
[hr][/hr]
[url=URL]文本[/url]
[img]URL[/img]
```

不要为了视觉效果大量嵌套标签。

### 4.3 代码与技术内容

Steam 页面中如果需要展示路径、函数名、JSON、目录结构或代码：

不要使用 Markdown 三反引号代码块。

优先选择：

```text
[b]manifest.json[/b]

[list]
[*] dependencies
[*] NewContentData.tres
[/list]
```

对于必须展示的短代码，可直接使用普通文本 + `[b]` 强调关键字；不要依赖 Markdown code fence。

如果一段原始代码必须完整展示，而 Steam 页面无法可靠提供代码块样式，则应优先提供 GitHub 文档链接，而不是在 Workshop 页面塞入大段源码。

---

## 5. 页面结构：使用文档必须最显眼

对于工具型、框架型、库型、开发基础设施型 Mod，推荐使用以下顺序：

### 中文文件

1. 使用文档 / 开发文档入口
2. Mod 名称与一句话定位
3. Mod 解决的问题
4. 核心功能
5. 快速开始 / 安装
6. 依赖与兼容性
7. 特殊限制 / 迁移 / 注意事项
8. 更新日志
9. 联系与反馈
10. 赞助支持

### 英文文件

完全使用对应的英文结构。

不要把“使用文档”埋在页面底部。

推荐顶部视觉结构：

```text
[h1]📖 使用文档[/h1]

[b]⚠️ 开始使用前，请先阅读完整文档。[/b]

[url=DOCUMENTATION_URL][b]👉 中文使用与开发手册 👈[/b][/url]
```

英文版本对应为：

```text
[h1]📖 Documentation[/h1]

[b]⚠️ Please read the complete documentation before getting started.[/b]

[url=DOCUMENTATION_URL][b]👉 English Usage & Developer Guide 👈[/b][/url]
```

链接文本必须明确告诉用户“这是使用文档”，不要只放一个裸 URL。

---

## 6. 开发者型 Mod 的内容优先级

如果目标 Mod 是框架、库、内容加载器、API、开发工具或基础设施，不要写成普通玩家 Mod 的宣传页。

推荐重点解释：

- 它是什么。
- 它不是什么。
- 它解决什么问题。
- 它如何与目标游戏原有系统协作。
- 新 Mod 如何接入。
- 支持哪些内容或功能。
- 依赖什么。
- 与其他加载框架有什么区别。
- 从哪里开始阅读开发文档。

例如一个内容基础设施型 Mod，可以使用：

```text
Godot Resource
    ↓
Content Data
    ↓
Loader / Registration Layer
    ↓
Game Runtime
```

但这类架构图只能使用普通文本字符，不得使用 Markdown 代码块包裹。

---

## 7. 快速开始与安装

如果 Mod 有明确安装步骤，必须让用户在页面中快速找到。

推荐：

```text
[h1]⚡ 快速开始[/h1]
```

或英文：

```text
[h1]⚡ Quick Start[/h1]
```

安装部分应该回答：

1. 需要什么版本。
2. 从哪里下载。
3. 文件放到哪里。
4. 是否需要额外 Mod / Loader。
5. 是否需要手动配置。
6. 启动后如何判断安装成功。

不要把 GitHub README 中的所有开发细节复制到 Steam 页面。

Workshop 页面负责“快速正确使用”，完整开发细节交给文档。

---

## 8. 兼容性和依赖必须显式说明

如果 Mod 依赖：

- 特定游戏版本。
- 特定 Mod Loader。
- 其他基础 Mod。
- DLC。
- 特定运行环境。

应该单独建立：

```text
[h1]⚠️ 兼容性与依赖[/h1]
```

或英文：

```text
[h1]⚠️ Compatibility & Dependencies[/h1]
```

使用简洁列表：

```text
[list]
[*] [b]游戏：[/b] 实际版本
[*] [b]Mod Loader：[/b] 实际版本
[*] [b]依赖：[/b] 实际依赖
[/list]
```

只能写已经确认的信息。

如果存在“两个加载框架体系不同”之类的重要限制，应使用独立的警告小节，而不是埋在普通段落里。

---

## 9. 功能介绍的写法

功能介绍不是功能名称堆砌。

每一项应该回答：

“这个功能做了什么，以及用户因此得到了什么。”

推荐结构：

```text
[h3]📦 内容注册[/h3]

[list]
[*] [b]角色：[/b] 将角色内容接入游戏已有的角色系统。
[*] [b]武器：[/b] 将武器内容接入游戏已有的武器系统。
[/list]
```

不要写：

```text
角色
武器
道具
Effect
Zone
```

因为这只是分类名称，没有说明实际能力。

---

## 10. 更新日志规则

更新日志是可选模块，不是页面的唯一主体。

它应该说明“改了什么”，而不是重新介绍 Mod。

推荐：

```text
[h1]🛠️ 更新日志[/h1]

[h3]🚀 基础设施与兼容性[/h3]
[list]
[*] [b]内容加载：[/b] 简短说明实际变更。
[*] [b]兼容性：[/b] 简短说明实际变更。
[/list]
```

英文版本保持语义对应：

```text
[h1]🛠️ Change Log[/h1]

[h3]🚀 Infrastructure & Compatibility[/h3]
[list]
[*] [b]Content Loading:[/b] Brief description of the actual change.
[*] [b]Compatibility:[/b] Brief description of the actual change.
[/list]
```

禁止虚构：

- 性能提升百分比。
- Bug 修复数量。
- “全面优化”等没有事实基础的描述。
- 未发布版本中的功能。

---

## 11. 联系方式与赞助

只有用户提供或项目资料中明确存在的联系方式才可以使用。

例如：

```text
[h1]🔗 联系与反馈[/h1]

[i]如果你遇到 Bug、兼容性问题或开发问题，欢迎通过以下渠道联系作者。[/i]

[list]
[*] [b]GitHub：[/b] [url=https://github.com/OWNER/REPO]OWNER/REPO[/url]
[*] [b]E-mail：[/b] example@example.com
[/list]
```

英文版本独立翻译，不要做中英文句子混排。

没有邮箱就不要捏造邮箱。

没有 Discord 就不要添加 Discord。

没有赞助地址就使用明确占位符，或干脆删除赞助区；绝不能编造链接。

---

## 12. 双语一致性不是“混写”，而是“结构对应”

中文和英文两个文件应该在以下方面保持对应：

- 页面结构。
- 章节顺序。
- 核心功能覆盖范围。
- 警告与限制。
- 链接目标。
- 更新日志项目。
- BBCode 层级。

但语言本身必须完全分离。

也就是说：

```text
正确：
CN.txt → 全中文
EN.txt → 全英文

错误：
CN.txt → 中文 + 英文对照
EN.txt → 英文 + 中文对照
```

翻译应该自然地适应 Steam / 游戏 Mod 语境，而不是机械逐字翻译。

---

## 13. Steam BBCode 结构检查

在交付最终内容前，必须检查：

### 必须检查

1. 所有打开的 BBCode 标签都有对应关闭标签。
2. `[list]` 与 `[/list]` 成对出现。
3. `[url=...]...[/url]` 具有有效 URL 和可读的链接文本。
4. `[b]`、`[i]`、`[h1]`、`[h2]`、`[h3]` 没有遗漏闭合。
5. `[hr][/hr]` 用于模块之间的明确分隔。
6. 没有 Markdown 代码块。
7. 没有 Markdown 标题。
8. 没有 Markdown 粗体 / 斜体。
9. 没有 Markdown 链接。
10. 没有 Markdown 表格。
11. 没有裸的 Markdown horizontal rule。
12. 没有因为“技术感”而加入不必要的 HTML。

### 强烈建议检查

- 不要嵌套过深的 BBCode。
- 不要把整段正文都加粗。
- 不要让每一句话都使用 Emoji。
- 不要连续创建大量 `[h1]`。
- 不要用巨型列表替代正常说明。
- 不要在 Steam 页面复制几十行源码。

---

## 14. 内容真实性检查

最终输出前逐项检查：

### 功能真实性

每一个功能都必须能在 Mod 当前版本、README、文档、源码或用户提供的信息中找到依据。

### 版本真实性

版本号必须有明确来源。

### 兼容性真实性

不能因为“看起来应该兼容”就写兼容。

### 链接真实性

所有 `[url=...]` 都必须来自用户、项目仓库或已验证的官方页面。

### 联系信息真实性

不得根据作者用户名推断邮箱或社交账号。

### 更新日志真实性

不要把“当前已有功能”伪装成“本次更新内容”。如果没有真实 changelog，可以使用“当前版本特性”模块，不要虚构更新历史。

---

## 15. 推荐页面骨架

以下只是结构骨架，不是要求每个 Mod 原样套用。

### 中文文件

```text
[h1]📖 使用文档[/h1]

[b]⚠️ 开始使用前，请先阅读完整文档。[/b]

[url=DOCUMENTATION_URL][b]👉 中文使用与开发手册 👈[/b][/url]

[hr][/hr]

[h1]🛠️ MOD 名称[/h1]

[b]一句话定位[/b]

Mod 简介。

[h3]🎯 它解决什么问题？[/h3]

实际问题说明。

[h3]📦 核心功能[/h3]

[list]
[*] [b]功能一：[/b] 实际功能与用户价值。
[*] [b]功能二：[/b] 实际功能与用户价值。
[/list]

[hr][/hr]

[h1]⚡ 快速开始[/h1]

实际安装与使用步骤。

[hr][/hr]

[h1]⚠️ 兼容性与依赖[/h1]

实际兼容性说明。

[hr][/hr]

[h1]🛠️ 更新日志[/h1]

实际版本变更。

[hr][/hr]

[h1]🔗 联系与反馈[/h1]

实际联系方式。

[hr][/hr]

[h1]☕ 赞助支持[/h1]

实际赞助信息。
```

### English 文件

```text
[h1]📖 Documentation[/h1]

[b]⚠️ Please read the complete documentation before getting started.[/b]

[url=DOCUMENTATION_URL][b]👉 English Usage & Developer Guide 👈[/b][/url]

[hr][/hr]

[h1]🛠️ MOD NAME[/h1]

[b]One-line positioning statement[/b]

Mod overview.

[h3]🎯 What Problem Does It Solve?[/h3]

Actual problem statement.

[h3]📦 Core Features[/h3]

[list]
[*] [b]Feature One:[/b] Actual behavior and user value.
[*] [b]Feature Two:[/b] Actual behavior and user value.
[/list]

[hr][/hr]

[h1]⚡ Quick Start[/h1]

Actual installation and usage steps.

[hr][/hr]

[h1]⚠️ Compatibility & Dependencies[/h1]

Actual compatibility information.

[hr][/hr]

[h1]🛠️ Change Log[/h1]

Actual version changes.

[hr][/hr]

[h1]🔗 Contact & Feedback[/h1]

Actual contact information.

[hr][/hr]

[h1]☕ Support[/h1]

Actual support information.
```

注意：上述代码块只存在于 Skill 内部作为结构说明。最终生成的 Steam 文案绝不能包含这些三反引号。

---

## 16. 输出方式

当用户要求“直接给我 Steam 文案”时：

- 不要输出长篇解释。
- 直接给出最终可粘贴内容。
- 双语任务使用两个明确分开的最终版本。
- 如果同时生成文件，应输出两个独立文本文件。

推荐文件命名：

```text
<Mod>-Steam-Workshop-CN.txt
<Mod>-Steam-Workshop-EN.txt
```

不要创建一个 `Bilingual.txt` 把两种语言混在一起。

---

## 17. 最终交付前检查清单

### 数据

- [ ] 所有功能都有真实依据。
- [ ] 版本号经过确认。
- [ ] 依赖经过确认。
- [ ] 安装方式经过确认。
- [ ] 所有链接真实有效或明确来自项目资料。
- [ ] 联系方式没有猜测。

### 结构

- [ ] 使用文档位于最顶部。
- [ ] 中文与英文分别存在于独立文件。
- [ ] 两个文件结构对应。
- [ ] 页面具有清晰的分隔区。
- [ ] 更新日志没有喧宾夺主。

### BBCode

- [ ] 没有 Markdown 标题。
- [ ] 没有 Markdown 粗体 / 斜体。
- [ ] 没有反引号代码格式。
- [ ] 没有 Markdown 三反引号。
- [ ] 没有 Markdown 表格。
- [ ] 没有 Markdown 链接。
- [ ] 没有 Markdown 分隔线。
- [ ] 所有 BBCode 标签正确闭合。
- [ ] 所有 URL 使用 `[url=...]...[/url]`。

### 双语

- [ ] CN 文件完全使用中文。
- [ ] EN 文件完全使用英文。
- [ ] 没有逐句中英混排。
- [ ] 功能和警告语义一一对应。
- [ ] 英文不是机械直译。

---

## 18. 禁止事项

禁止：

- 把 Steam Workshop 页面当成 GitHub README 写。
- 把 Markdown 当 Steam BBCode 使用。
- 在最终 Steam 文案里输出 ``` 代码围栏。
- 在正文中大量使用反引号代码格式。
- 把中英文混在一个最终语言文件中。
- 虚构功能、兼容性、性能提升或版本信息。
- 根据作者用户名猜邮箱、Discord、Twitter/X 等联系方式。
- 凭空生成赞助链接。
- 复制与目标 Mod 无关的示例机制。
- 为了凑模板而强行加入“性能优化”“视觉自定义”等不存在的栏目。
- 用大量营销术语替代真实的功能说明。
- 在没有真实 changelog 时伪造更新历史。

最终目标是：

[b]用户复制生成的文案后，可以直接粘贴到 Steam Workshop，而不需要再次手动删除 Markdown、拆分语言、修复 BBCode 或清理虚假信息。[/b]
