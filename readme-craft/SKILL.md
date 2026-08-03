---
name: readme-craft
description: 帮助开发者编写结构清晰、风格专业、视觉美观的 README 文档，并自动生成配套 SVG 图形资源，支持多语言本地化。
---

## 核心设计理念
- **视觉优先**：严格遵循深色优雅主题（#1E1E1E 背景，#8A9E8B 强调色），确保所有 README 具有一致的品牌辨识度。
- **结构标准**：采用开源社区广泛认可的 README 结构，确保信息易于查找。
- **内容实用**：根据项目类型（Web应用、CLI工具、代码库等）自动调整章节重点，避免模板化空洞。
- **个人品牌**：自动注入专属的「支持作者」赞助区块，保持个人风格。

## 工作流程
当用户请求生成 README 时，按以下步骤执行：

### 第一步：信息收集 (Context Gathering)
通过交互式提问或分析现有项目文件，收集以下信息：
- **项目名称** (`project_name`)
- **项目简介** (`project_description`)：一句话核心价值。
- **技术栈** (`tech_stack`)：如 AutoHotkey v2, React, Go 等。
- **核心功能列表** (`features`)：至少 3 个主要功能点。
- **安装步骤** (`installation`)
- **使用示例** (`usage`)
- **作者信息** (`author`)：姓名、邮箱、微信号（可选）。
- **项目类型** (`project_type`)：WebApp, CLI, Library, API, 或其他。
- **是否生成项目结构**：如果用户提供了项目根目录路径或目录树，则生成 `📁 Project Structure` 章节。
- **忽略规则**（可选）：询问用户是否需要忽略某些文件或文件夹（支持通配符，如 `*.tmp`, `node_modules/`, `dist/` 等），生成结构时会自动过滤掉这些条目。

### 第二步：内容结构生成 (Structure Drafting)
根据收集的信息和项目类型，生成符合以下规范的内容结构：

#### 必选章节
1.  **Hero 区域** (深色中心对齐，含 Logo、标题、描述、Badges、导航)
2.  **📖 Overview** (项目概述与核心价值说明)
3.  **✨ Core Features** (使用功能卡片展示，每个卡片含 Emoji 和列表)
4.  **🚀 Installation & Setup** (分步骤，含代码块)
5.  **⚙️ Configuration & Parameters** (可选，有配置时添加)
6.  **📄 License** (明确许可证)
7.  **💰 Support the Author** (赞助区块，必须包含指定内容)

#### 推荐章节 (根据项目类型选择)
8.  **🎹 Shortcut Quick Reference** (快捷键/命令速查表，CLI/工具类项目必选)
9.  **📚 Usage / API Documentation** (使用示例/API 文档，库/API 项目必选)
10. **🧠 Implementation Highlights** (技术实现亮点，复杂项目推荐)
11. **🔐 Security Notes** (涉及加密/数据时必选)
12. **🤝 Contributing & Feedback**
13. **📁 Project Structure** (中大型项目推荐，必须用树状结构 + Emoji 标注)

### 第三步：视觉与风格渲染 (Styling)
严格遵循以下视觉规范：

#### 配色方案
| 用途 | 色值 |
|------|------|
| 页面主背景 | `#1E1E1E` |
| 卡片/区块背景 | `#2A2A2A` |
| 主标题文字 | `#E6DED6` |
| 正文文字 | `#BEB8AE` |
| 强调色（链接、高亮） | `#8A9E8B` |
| 次要强调 | `#7A8E8E`、`#9E8F7E` |
| 虚线/分隔线 | `#5A6B6B` |
| 卡片内小标题 | `#D6D2CC` |

#### Hero 区域 HTML 模板
```html
<div align="center" style="background-color: #1E1E1E; padding: 40px 20px; border-radius: 28px;">
<div style="background: #2A2A2A; border-radius: 36px; padding: 42px 18px; margin-bottom: 28px;">
<img src="assets/logo.png" alt="Project Logo" width="80">
<h1 style="color: #E6DED6; font-weight: 350; letter-spacing: 2px; margin: 18px 0 8px;">{项目名称}</h1>
<p style="color: #BEB8AE; font-size: 1.2em; max-width: 600px; margin: 0 auto;">{项目简介}</p>
<p style="color: #8A9E8B; font-size: 0.95em; margin-top: 12px;">{技术栈副标题}</p>
</div>
<!-- Badges 和导航链接 -->
</div>
```

#### 功能卡片 HTML 模板
```html
<div style="background: #2A2A2A; border-radius: 20px; padding: 16px; margin: 16px 0;">
<h3 style="margin-top: 0; color: #D6D2CC;">🚀 功能名称</h3>
<ul style="color: #BEB8AE;">
<li><code>快捷键/命令</code> 功能描述</li>
</ul>
</div>
```

#### 项目结构生成规范
- 使用 ```tree 代码块，以根目录名开始。
- 每一层用缩进 (空格或 `│` `├──` `└──`) 展示层级关系。
- 文件夹用 📁 前缀，普通文件用 📄 前缀，图片资源用 🖼️，音频用 🎵，配置文件按类型加对应 Emoji（如 ⚙️ 或 🔧）。
- 如果用户提供了忽略规则，生成时自动跳过匹配的文件/文件夹（路径匹配支持通配符，不区分大小写）。
- 示例（参考 CapsLock Extended README）：
```tree
CapsLock-
├── 📁 assets
│   ├── 🎵 AlwaysOnTopOn.wav
│   ├── 🖼️ CapsLock-.ico
│   └── 📄 dots.svg
├── 📁 Config
│   ├── 📄 ConfigManager.ahk
│   └── 📄 Globals.ahk
└── 📄 README.md
```

#### SVG 生成规范 (Assets Generation)
- 所有生成的 .svg 文件（如 assets/dots.svg, assets/bar.svg 等）的内容末尾必须包含一个换行符 \n，以符合 POSIX 标准并避免版本控制中的警告。
- 生成时使用统一的深色主题样式，配合 #8A9E8B 等强调色。

#### 赞助区块 (必须包含)
```markdown
## 💰 Support the Author
如果这个项目提升了你的工作效率，不妨请作者喝杯咖啡 ☕
<div align="center">
<a href="https://cyojkoy.github.io/Payment/">
<img src="https://img.shields.io/badge/👉_请我喝咖啡-9E8F7E?style=for-the-badge&logo=buy-me-a-coffee&logoColor=BEB8AE" alt="Support Me">
</a>
</div>
```

### 第四步：生成与输出
1. 将以上所有部分组合成一个完整的 Markdown 文档。
2. 确保所有 HTML 标签正确闭合，Markdown 语法正确。
3. 检查是否包含赞助区块。
4. 最终输出完整的 README.md 内容，并告知用户已生成。

## 风格指南 (写作规范)
- **语言**：默认使用英文撰写（除非用户明确指定中文）。
- **语气**：专业且友好，略带极客风格，避免过于僵硬或随意。
- **Emoji**：**每个章节标题必须加一个合适的 Emoji**（如 📖、✨、🚀、⚙️、📄、💰、🎹、📚、🧠、🔐、🤝、📁 等），增强可读性和视觉吸引力。
- **代码高亮**：所有代码块、命令、快捷键均使用 `<code>` 或 Markdown 代码块标注语言。
- **重要提示**：使用 `> **Note**` 或 `> ⚠️` 引出，确保醒目。
- **表格**：保持对齐，必要列可加粗（如功能名称）。
- **简洁**：优先使用列表和表格，避免长段落。

## 项目类型适配 (Project Type Adaptation)
根据识别的 `project_type`，自动调整章节侧重：
- **CLI 工具**：强化 `🎹 Shortcut Quick Reference`，包含所有命令行参数。
- **代码库/框架**：强化 `📚 Usage / API Documentation`，提供清晰的示例代码。
- **Web 应用**：增加 **在线演示** 或 **部署说明** 章节。
- **API 服务**：增加 **API 端点** 和 **认证方式** 说明。

## 个人偏好注入
- 始终保持深色主题，除非用户明确要求浅色。
- 始终在文档末尾包含指定的「支持作者」赞助区块。
- 导航链接使用 `•` 分隔，样式为 `color: #8A9E8B; border-bottom: 1px dotted #5A6B6B`。
- 若生成项目结构，必须使用树状格式 + Emoji 标注，并询问用户是否需要忽略特定文件/文件夹。

## 示例输出片段
<div align="center" style="background-color: #1E1E1E; padding: 40px 20px; border-radius: 28px;">

  <div style="background: #2A2A2A; border-radius: 36px; padding: 42px 18px; margin-bottom: 28px;">
    <img src="assets/CapsLock-.ico" alt="CapsLock Extended Logo" width="80">
    <h1 style="color: #E6DED6; font-weight: 350; letter-spacing: 2px; margin: 18px 0 8px;">CapsLock Extended</h1>
    <p style="color: #BEB8AE; font-size: 1.2em; max-width: 600px; margin: 0 auto;">Turn the most underrated key on your keyboard into your productivity command center</p>
    <p style="color: #8A9E8B; font-size: 0.95em; margin-top: 12px;">A high-performance, Vim-style system enhancement tool based on AutoHotkey v2</p>
  </div>

  <p>
    <a href="https://www.autohotkey.com/"><img src="https://img.shields.io/badge/AutoHotkey-v2.0-8A9E8B?logo=autohotkey&logoColor=BEB8AE&style=flat-square" alt="AutoHotkey v2"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-GPL--3.0-7A8E8E?style=flat-square" alt="License"></a>
    <img src="https://img.shields.io/badge/Platform-Windows-9E8F7E?style=flat-square" alt="Platform">
    <a href="https://cyojkoy.github.io/Payment/"><img src="https://img.shields.io/badge/Support_Me-9E8F7E?logo=buy-me-a-coffee&logoColor=BEB8AE&style=flat-square" alt="Support Me"></a>
  </p>

  <p style="word-spacing: 6px; margin-top: 20px;">
    <a href="#-shortcut-quick-reference" style="color: #8A9E8B; text-decoration: none; border-bottom: 1px dotted #5A6B6B;">Shortcut Quick Reference</a> &nbsp;•&nbsp;
    <a href="#-installation--setup" style="color: #8A9E8B; text-decoration: none; border-bottom: 1px dotted #5A6B6B;">Installation & Setup</a> &nbsp;•&nbsp;
    <a href="#️-configuration--parameters" style="color: #8A9E8B; text-decoration: none; border-bottom: 1px dotted #5A6B6B;">Configuration & Parameters</a> &nbsp;•&nbsp;
    <a href="#-support-the-author" style="color: #8A9E8B; text-decoration: none; border-bottom: 1px dotted #5A6B6B;">Support the Author</a>
  </p>
</div>

<div align="center">
  <img src="assets/dots.svg" alt="separator" width="160" height="12">
</div>

## 📖 Overview

**CapsLock Extended** redefines the purpose of the `CapsLock` key, turning it into a "super modifier key".  
By holding `CapsLock` and combining it with other keys, you can perform Vim-style home row cursor movement, advanced clipboard management (including encrypted history), window transparency adjustment, tab switching, and other workflow automations—all without leaving the keyboard's home row.

> **Note**  
> This script supports **AutoHotkey v2 only** and is not backward compatible with v1.

---

## ✨ Core Features

<div style="background: #2A2A2A; border-radius: 20px; padding: 16px; margin: 16px 0;">
  <h3 style="margin-top: 0; color: #D6D2CC;">⌨️ Vim‑Style Navigation</h3>
  <ul style="color: #BEB8AE;">
    <li><code>←</code>/<code>→</code> move cursor by word</li>
    <li><code>↑</code>/<code>↓</code> jump to beginning / end of line</li>
    <li><code>Shift</code> + arrows for smart text selection</li>
    <li><code>Space</code> selects whole word under cursor</li>
    <li><code>A</code>/<code>D</code> delete char, <code>Shift+A/D</code> delete word</li>
  </ul>
</div>

<div style="background: #2A2A2A; border-radius: 20px; padding: 16px; margin: 16px 0;">
  <h3 style="margin-top: 0; color: #D6D2CC;">📋 Advanced Clipboard</h3>
  <ul style="color: #BEB8AE;">
    <li><code>C</code> copy as plain text</li>
    <li><code>V</code> smart paste (multi‑file merging, image→PDF, path content merge, etc.)</li>
    <li><code>Shift+V</code> encrypted history quick menu with preview, single/batch paste, delete</li>
    <li><code>F</code> instant case swap of clipboard text</li>
    <li>Custom ignore rules to exclude sensitive or temporary files during paste</li>
  </ul>
</div>

<div style="background: #2A2A2A; border-radius: 20px; padding: 16px; margin: 16px 0;">
  <h3 style="margin-top: 0; color: #D6D2CC;">🪟 Window & Tabs</h3>
  <ul style="color: #BEB8AE;">
    <li>Hold CapsLock + Left/Right mouse button to adjust window opacity</li>
    <li>Middle mouse button toggles "ghost mode" (10% ↔ 100%)</li>
    <li><code>T</code> toggle always on top (with sound and OSD feedback)</li>
    <li><code>W</code>/<code>8</code>/<code>Num8</code> maximize/restore, <code>S</code>/<code>2</code>/<code>Num2</code> minimize</li>
    <li><code>Q</code>/<code>E</code> previous / next tab</li>
  </ul>
</div>

<div style="background: #2A2A2A; border-radius: 20px; padding: 16px; margin: 16px 0;">
  <h3 style="margin-top: 0; color: #D6D2CC;">📂 Full History Browser</h3>
  <ul style="color: #BEB8AE;">
    <li>Open full clipboard history window via bottom entry of the history menu</li>
    <li>Supports search, multi‑select, batch paste as file or text</li>
    <li>Delete entries directly from the window with real‑time updates</li>
  </ul>
</div>

---

## 🎹 Shortcut Quick Reference

_All shortcuts below require **holding `CapsLock`** while pressing the corresponding key (except double‑click `CapsLock`)._

| Category       | Shortcut                    | Description                                                                |
| :------------- | :-------------------------- | :------------------------------------------------------------------------- |
| **System**     | `CapsLock` (double‑click)   | Toggle native CapsLock state (50~300ms double‑click window)                |
| **Clipboard**  | `C`                         | Copy selection as **plain text** (auto strip formatting)                   |
|                | `V`                         | **Smart paste** (image paths→PDF / multi‑file content merge / mixed paths) |
|                | `Shift+V`                   | Open **clipboard history** quick menu                                      |
|                | `F`                         | **Swap case** of clipboard text and paste (original retained)              |
| **Navigation** | `←` / `→`                   | Move cursor left/right **by one word**                                     |
|                | `↑` / `↓`                   | Jump to **beginning** / **end of line**                                    |
|                | `Space`                     | Select the **entire word** under the cursor                                |
| **Selection**  | `Shift+←` / `→`             | Extend selection left/right **by word**                                    |
|                | `Shift+↑` / `↓`             | Extend selection from cursor to start/end of line                          |
| **Editing**    | `A` / `D`                   | `Backspace` / `Delete` (delete single character)                           |
|                | `Shift+A` / `D`             | Delete left/right **entire word**                                          |
|                | `Backspace` / `Delete`      | Delete **entire line**                                                     |
| **Window**     | `T`                         | Toggle current window **always on top**                                    |
|                | `W` / `8` / `Num8`          | **Maximize / Restore** current window                                      |
|                | `S` / `2` / `Num2`          | **Minimize** current window                                                |
| **Mouse**      | `Left Button` (click/hold)  | **Increase** window transparency (click +20, hold +100 per second)         |
|                | `Right Button` (click/hold) | **Decrease** window transparency (click -20, hold -100 per second)         |
|                | `Middle Button`             | **Toggle** transparency: 10% (ghost mode) ↔ 100% (normal)                  |
| **Tabs**       | `Q` / `E`                   | Switch to **previous** / **next** tab (`Ctrl+PgUp` / `Ctrl+PgDn`)          |

---

## 🚀 Installation & Setup

### Prerequisites

1. **AutoHotkey v2** – Download and install from [autohotkey.com](https://www.autohotkey.com/)
2. **ImageMagick** (optional) – Required for image‑to‑PDF feature; install from [imagemagick.org](https://imagemagick.org/) (check "Install legacy utilities" during setup)

### Quick Start

1. **Download the project** and place `CapsLock-.ahk` along with all subdirectories (`Config/`, `Core/`, `History/`, etc.) in the same folder.
2. **Run the script**: double‑click `CapsLock-.ahk`; an icon will appear in the system tray.
3. **(Optional) Auto‑start with Windows**: right‑click the tray icon → check **"Load on start up"** (writes to `HKCU\Run`).

### Configure ImageMagick (only needed for image‑to‑PDF)

1. Right‑click the tray icon → click **"ImageMagick: Not Set"**.
2. Browse to your ImageMagick installation directory and select `magick.exe` (e.g., `C:\Program Files\ImageMagick-7.x.x-Q16\magick.exe`).
3. The path is saved automatically to `configs/Config.ini` and the menu entry changes to **"ImageMagick: Valid"**.

---

## ⚙️ Configuration & Parameters

### Tray Menu Settings

| Menu Item                      | Description                                                                            |
| :----------------------------- | :------------------------------------------------------------------------------------- |
| `ImageMagick: Not Set / Valid` | Set or change the ImageMagick executable path                                          |
| `Open Temp Folder`             | Open the temporary folder (`%TEMP%`, where temporary paste files are stored)           |
| `Delete Mode`                  | Temp file cleanup strategy: 1=delayed delete, 2=batch cleanup, 3=never delete          |
| `Set Delay...`                 | Delay in seconds for Mode 1 (default 10 seconds)                                       |
| `Set Cleanup Interval...`      | Cleanup interval in seconds for Mode 2 (default 30 seconds)                            |
| `Set Max History...`           | Maximum clipboard history entries (0 disables history, default 10000)                  |
| `Auto Clean History`           | Periodically trims history down to `maxHistoryItems` (off by default)                 |
| `Paste Mode`                   | Paste mode: 1=paste as temp file, 2=paste as plain text with source markers            |
| `Ignore Rules`                 | Edit a list of regex patterns; matched files/paths are skipped during paste operations |
| `Language`                     | Switch UI language (based on `lang.csv`; 13 languages supported)                       |
| `Load on start up`             | Toggle auto‑start with Windows (registry `HKCU\Run`)                                   |
| `Reload`                       | Reload the script                                                                      |
| `Exit`                         | Exit the script                                                                        |

### Configuration File `configs/Config.ini`

📁 configs/Config.ini

```ini
[Cleanup]
deleteMode=1          ; 1=delayed 2=batch 3=never
deleteDelay=10        ; delay in seconds
cleanupInterval=30    ; batch cleanup interval in seconds

[History]
maxHistory=10000      ; max history entries

[General]
pasteMode=1           ; 1=paste as file 2=paste as text with source
autoClean=0           ; 1=enable periodic auto-trim of history (runs every 60s)
maxHistoryItems=500   ; when autoClean is on, history is trimmed to this size

[ImageMagick]
Path=C:\Program Files\ImageMagick-7.1.1-Q16\magick.exe

[Ignore]
Rules=                ; multiple regexes separated by |
; Examples (in the UI editor each pattern is on its own line):
; ^C:\\Windows\\.*    # ignore all files under Windows folder
; \\.tmp$             # ignore .tmp files
```

### Advanced Global Variables (modifiable in `Config/Globals.ahk`)

| Variable           | Default               | Description                                      |
| :----------------- | :-------------------- | :----------------------------------------------- |
| `ENCRYPT_KEY`      | `0x5A`                | XOR encryption key (0 = plaintext history)       |
| `MAX_VISIBLE_MENU` | `5`                   | Maximum entries shown in the history quick menu  |
| `MAX_FULL_HISTORY_DISPLAY` | `50`          | Initial rows shown in the full history window    |
| `TextFormats`      | 50+ common extensions | List of extensions treated as "text files"       |
| `ImageFormats`     | png, jpg, bmp…        | Image formats supported for PDF conversion       |
| `IgnorePatterns`   | (empty)               | Default ignore rules (overridable via Tray menu) |

---

## 🧱 Project Structure

```tree
CapsLock-
├── 📁 assets
│   ├── 🎵 AlwaysOnTopOn.wav
│   ├── 🎵 AlwaysOnTopOff.wav
│   ├── 🖼️ bar.svg
│   ├── 🖼️ CapsLock-.ico
│   ├── 🖼️ Config.ico
│   ├── 🖼️ Core.ico
│   ├── 🖼️ dots.svg
│   ├── 🖼️ History.ico
│   ├── 🖼️ Hotkeys.ico
│   ├── 🖼️ Tray.ico
│   ├── 🖼️ UI.ico
│   └── 🖼️ Utils.ico
├── 📁 Config
│   ├── 📄 ConfigManager.ahk
│   ├── 📄 Encryption.ahk
│   └── 📄 Globals.ahk
├── 📁 Core
│   ├── 📄 Cleanup.ahk
│   ├── 📄 Clipboard.ahk
│   ├── 📄 ClipboardPaste.ahk
│   ├── 📄 FileOperations.ahk
│   ├── 📄 FileValidation.ahk
│   ├── 📄 ImageToPdf.ahk
│   └── 📄 WindowUtils.ahk
├── 📁 History
│   ├── 📄 FullHistoryGui.ahk
│   ├── 📄 FullHistoryHandlers.ahk
│   ├── 📄 HistoryDelete.ahk
│   ├── 📄 HistoryMenu.ahk
│   ├── 📄 HistoryPaste.ahk
│   └── 📄 HistoryStorage.ahk
├── 📁 Hotkeys
│   ├── 📄 HotkeyActions.ahk
│   ├── 📄 HotkeyBindings.ahk
│   └── 📄 PasteHandler.ahk
├── 📁 Tray
│   ├── 📄 TrayMenu.ahk
│   └── 📄 TraySettings.ahk
├── 📁 UI
│   ├── 📄 OSD.ahk
│   └── 📄 PreviewGui.ahk
├── 📁 Utils
│   ├── 📄 Language.ahk
│   ├── 📄 MethodsUtils.ahk
│   └── 📄 ResourceSound.ahk
├── 📄 CapsLock-.ahk
├── ⚖️ LICENSE
├── 📖 README.md
└── 🌐 lang.csv
```

---

## 🧠 Implementation Highlights

- **In‑memory file paste** – Constructs a `DROPFILES` structure directly in memory to write multiple file paths to the clipboard.
- **Smart loop prevention** – Uses the `ignoreNextClipChange` flag to prevent temporary files (`ClipTemp_*.txt`) from triggering infinite `OnClipboardChange` loops.
- **Encrypted history storage** – Employs simple XOR stream encryption to obfuscate the history file; for high‑security needs, combine with Windows EFS or BitLocker.
- **Delayed / batch / off cleanup** – Three strategies (`DeleteMode` 1–3) for temporary file cleanup to control I/O pressure and disk usage.
- **Modular design** – Each functional domain is separated into its own `.ahk` file for easy maintenance and extension.
- **Multi‑language support** – CSV‑based translation system; 13 languages switchable on the fly from the tray menu.
- **Ignore rules** – Regex‑based filtering (gitignore syntax) to safely exclude unwanted files or paths from paste operations.
- **Custom dark‑themed menu** – `CustomMenu` builds a lightweight, hover‑aware popup GUI, replacing the native `Menu` control for history and context menus.
- **OSD notification system** – `OSD` class provides a single‑line, auto‑dismissing notification banner used throughout the app for status feedback.

---

## 🔐 Security Notes

> ⚠️ The history file `configs/ClipHistory.bin` is encrypted using a **fixed XOR key** (default `0x5A`). This is **only intended to prevent casual viewing and offers no cryptographic strength**.

If you handle highly sensitive data, it is recommended to:

1. Set `ENCRYPT_KEY` to `0` (disable encryption)
2. Use Windows built‑in **EFS** or **BitLocker** to encrypt the entire configuration folder

---

## 🤝 Contributing & Feedback

Issues and Pull Requests are welcome.  
Please ensure your code conforms to AHK v2 syntax and follows the existing modular style.

---

## 📄 License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)**.  
See the [LICENSE](LICENSE) file for details.

---

## 💰 Support the Author

If this project has boosted your productivity, consider buying me a coffee! ☕

<div align="center">
  <a href="https://cyojkoy.github.io/Payment/">
    <img src="https://img.shields.io/badge/👉_Click_Here_to_Support_Me-9E8F7E?style=for-the-badge&logo=buy-me-a-coffee&logoColor=BEB8AE" alt="Support Me Button">
  </a>
</div>

<div align="center">
  <br>
  <i style="color: #8A9E8B;">Made with ❤️ and AutoHotkey v2</i>
</div>

<div align="center">
  <img src="assets/bar.svg" alt="footer bar" width="240" height="8">
</div>
