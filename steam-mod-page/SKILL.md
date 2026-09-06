---
name: steam-mod-page
description: 为游戏 Mod 作者生成 Steam 商店风格的介绍与更新日志页面，严格遵循指定的 Markdown/BBCode 结构，支持中英文双语，并根据 Mod 实际功能替换示例化内容。
---

# Steam Mod Page

## 核心目标

扮演一位 Mod 作者，为指定 Mod 撰写一份适合 Steam 创意工坊 / Mod 商店页面使用的介绍内容。输出必须具有 Steam 商店页面的视觉节奏，并严格遵守用户给出的 BBCode 结构、顺序和排版约束。

内容应以 Mod 的实际功能为依据，不得照抄与目标 Mod 无关的示例机制。用户没有提供某项功能时，应删除该项或替换为与 Mod 实际功能相关的内容，而不是虚构功能。

## 输出结构

必须按照以下顺序输出四个大板块，并在相邻大板块之间使用 `[hr][/hr]`：

1. 中文更新日志
2. 英文更新日志
3. 联系与反馈
4. 赞助支持

### 1. 更新日志（中文）

主标题必须为：

`[h1] 🛠️ 更新日志 (中文) [/h1]`

默认包含：

`[h3] 🚀 性能与体验优化 [/h3]`

使用 `[list]` 与 `[*]` 列出 2~4 项改进。每项必须以 `[b]关键词：[/b]` 开头，再接简短、明确的说明。

随后默认包含：

`[h3] 🎨 视觉与自定义 [/h3]`

同样使用 `[list]` / `[*]`。在确实有必要时，可以在 `[list]` 中嵌套 `[list]`，描述设置、显示、主题、颜色、分页、自定义选项等实际功能。

根据 Mod 实际内容，可增加其它 `[h3]` 子标题，但不得为了凑结构虚构功能。

### 2. 英文版更新日志

主标题必须为：

`[h1] 🛠️ CHANGE LOG (English) [/h1]`

英文版必须与中文版在内容、项目数量、Emoji、BBCode 层级和列表结构上对应一致。翻译应自然、符合 Steam / 游戏 Mod 语境，避免逐字直译和中式英语。

### 3. 联系与反馈

主标题必须为：

`[h1] 🔗 联系与反馈 / CONTACT & FEEDBACK [/h1]`

紧随其后使用指定斜体提示语：

`[i]如果您遇到任何 Bug 或有平衡性建议，欢迎通过以下渠道联系我：If you encounter any bugs or have feedback on balance, feel free to reach out via:[/i]`

联系方式使用列表：

`[list]`

`[*] [b]GitHub :[/b] [url=你的GitHub链接]你的仓库名[/url]`

`[*] [b]E-mail :[/b] 你的邮箱`

`[/list]`

可以根据实际信息增加 Discord、Twitter/X 等渠道，但不得捏造用户未提供的账号、地址或链接。没有真实信息时，使用清晰的占位符，例如 `[你的链接]`、`[你的邮箱]`。

### 4. 赞助支持

主标题必须为：

`[h1]☕ 赞助支持 / SUPPORT ME[/h1]`

使用指定斜体感谢语：

`[i]如果这个 Mod 为您带来了便利或乐趣，欢迎自愿打赏。您的支持是我持续更新和维护的最大动力！If this mod made your life easier or just brought you some fun, voluntary tips are always appreciated. Your support is what keeps me going and updating![/i]`

随后提供突出显示的支持链接：

`[url=你的赞助页面链接][b]👉 点击进入赞助页面 / Click to Support Page 👈[/b][/url]`

如果用户没有提供赞助链接，保留明确占位符 `[你的赞助页面链接]`，不得自行编造地址。

## 格式规则

必须使用 Steam BBCode / Markdown 风格标签，不要把 BBCode 转义成代码文本，也不要替换为纯 HTML。

常用标签包括：

- `[h1]...[/h1]`
- `[h3]...[/h3]`
- `[list]...[/list]`
- `[*]`
- `[b]...[/b]`
- `[i]...[/i]`
- `[url=链接]文本[/url]`
- `[hr][/hr]`

每个大板块之间必须有 `[hr][/hr]`。中文与英文更新日志之间也必须分隔；英文更新日志与联系区之间、联系区与赞助区之间同样必须分隔。

## 内容生成规则

优先使用用户提供的 Mod 信息、功能列表、版本变更和项目链接。对于未提供的数据，只写不依赖具体数值的描述，或使用占位符。

可以保留与 Mod 特点有关的数值和单位，例如 K、M、B；但不得强行塞入示例中的数值。若 Mod 不存在“彩色材料”“诅咒强度”等示例功能，应替换为实际存在的机制，例如：分页、快捷操作、统计信息、兼容性、性能、视觉选项、配置项等。

更新日志要像真正的版本更新说明，而不是产品广告。使用短句，强调“改了什么”和“用户获得什么改善”。

## 双语一致性检查

输出前逐项检查：

1. 中文、英文大标题完全符合规定。
2. 中文和英文的子标题数量一致，除非用户明确要求例外。
3. 中文、英文的列表项数量一致。
4. 每个列表项的实际含义一一对应。
5. Emoji、`[b]`、`[list]`、`[*]` 等结构保持一致。
6. `[hr][/hr]` 出现位置一致。
7. 英文语句自然，没有明显中式英语。
8. 联系方式和赞助链接只使用用户提供的信息或明确占位符。

## 推荐输出模板

```text
[h1] 🛠️ 更新日志 (中文) [/h1]

[h3] 🚀 性能与体验优化 [/h3]
[list]
[*] [b]关键词：[/b] 简短说明
[*] [b]关键词：[/b] 简短说明
[*] [b]关键词：[/b] 简短说明
[/list]

[h3] 🎨 视觉与自定义 [/h3]
[list]
[*] [b]关键词：[/b] 简短说明
[*] [b]关键词：[/b] 简短说明
[/list]

[hr][/hr]

[h1] 🛠️ CHANGE LOG (English) [/h1]

[h3] 🚀 Performance & Experience [/h3]
[list]
[*] [b]Keyword:[/b] Brief explanation
[*] [b]Keyword:[/b] Brief explanation
[*] [b]Keyword:[/b] Brief explanation
[/list]

[h3] 🎨 Visuals & Customization [/h3]
[list]
[*] [b]Keyword:[/b] Brief explanation
[*] [b]Keyword:[/b] Brief explanation
[/list]

[hr][/hr]

[h1] 🔗 联系与反馈 / CONTACT & FEEDBACK [/h1]

[i]如果您遇到任何 Bug 或有平衡性建议，欢迎通过以下渠道联系我：If you encounter any bugs or have feedback on balance, feel free to reach out via:[/i]

[list]
[*] [b]GitHub :[/b] [url=你的GitHub链接]你的仓库名[/url]
[*] [b]E-mail :[/b] 你的邮箱
[/list]

[hr][/hr]

[h1]☕ 赞助支持 / SUPPORT ME[/h1]

[i]如果这个 Mod 为您带来了便利或乐趣，欢迎自愿打赏。您的支持是我持续更新和维护的最大动力！If this mod made your life easier or just brought you some fun, voluntary tips are always appreciated. Your support is what keeps me going and updating![/i]

[url=你的赞助页面链接][b]👉 点击进入赞助页面 / Click to Support Page 👈[/b][/url]
```

## 禁止事项

不得虚构 Mod 功能、性能提升、兼容性、Bug 修复数量、具体数值或联系方式。

不得遗漏英文版，也不得只翻译正文而丢失 BBCode。

不得改变用户指定的大标题、板块顺序和分隔线要求，除非用户明确要求改版。

不得输出与 Steam 页面无关的解释性长文。默认直接输出可粘贴到 Steam 的完整 BBCode 内容。
