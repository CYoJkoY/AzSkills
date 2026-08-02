# readme-craft

帮助开发者或项目维护者编写结构清晰、风格专业、视觉美观的 README 文档，自动生成配套的矢量图形资源，并根据用户的语言偏好自动本地化文档内容，适用于各类开源工具、脚本、库或应用程序。

## 适用场景

- 你完成了一个项目，需要编写一份高质量的 README 来展示功能、用法和设计。
- 你想借鉴 CapsLock Extended 项目 README 的文档风格（包括 Hero 区块、功能卡片、表格速查、配置详解等），但内容不限定于任何特定技术。
- 你需要一份既适合技术用户快速上手，又能全面展示项目特色和深度的说明文档，且希望所有引用的图形资源（分隔线、Logo 等）能自动生成，无需手动找图。
- 你的目标读者可能使用不同语言，希望文档能自动适配用户的母语环境。

## 语言检测与本地化

使用本 Skill 时，**必须**自动检测用户的语言偏好，并按以下优先级确定生成文档的语言：

1.  **显式指定语言**：如果用户在请求中明确指定了语言（如“用中文写 README”或“generate README in Spanish”），则直接使用该语言。
2.  **用户系统语言**：如果可以从用户环境（如对话上下文、系统信息）推断出语言，则优先使用。例如，已知用户使用 Windows 11 中文版，则默认为中文。
3.  **对话语言**：如果用户最近的消息使用某种语言，则沿用该语言。
4.  **回退语言**：如果以上均无法确定，默认使用 **英文（en-US）**。

**实现要求**：
- 所有固定文本（如章节标题、描述性文字、按钮标签）均应根据检测到的语言进行翻译。
- 代码块、配置示例、快捷键等专业术语应保留原文（通常为英文），不做翻译，以确保技术准确性。
- 如果某一语言没有完整的翻译模板，应至少提供英文版本，并在文档开头用目标语言注明“本文档部分内容为英文以保持技术准确性”。

**推荐语言支持**（优先支持）：中文（简体）、英文、西班牙文、法文、德文、日文、韩文。其他语言可根据用户请求灵活处理。

当调用此 Skill 时，应在响应中明确说明生成的文档语言，并确保所有固定章节（如“概述”、“核心功能”、“安装与设置”、“贡献与反馈”、“许可证”、“支持作者”）均使用该语言。

## 文档结构要求

当使用此 Skill 编写文档时，你**必须**遵循以下结构，并确保各部分内容完整、层次分明：

1.  **Hero 区块**
    - 位于文档顶部，使用 `div align="center"` 进行居中。
    - 包含项目 Logo（使用 `<img>` 标签，尺寸建议 80x80，引用 `assets/logo-placeholder.svg` 或自定义 Logo）。
    - 包含项目名称（`<h1>`，字体加粗 350，颜色建议 `#E6DED6`，深色背景时使用）。
    - 包含一句简洁有力的项目副标题（`<p>`，字体 1.2em，颜色建议 `#BEB8AE`）。
    - 包含一句技术定位描述（`<p>`，颜色建议 `#8A9E8B`，例如“一个高性能的 Vim 风格系统增强工具”）。

2.  **Badge 行**
    - 紧随 Hero 区块，使用标准 Shields.io 标签。
    - 应包含：主要运行环境/版本、许可证、平台、支持链接（如 Sponsor 或 Buy Me a Coffee）。
    - 颜色主题应与项目整体色调（暗色、哑光绿/金）协调一致。

3.  **快速导航**
    - 使用锚点链接，提供到文档关键章节的快捷跳转。
    - 链接样式应柔和（如虚线底边框），与整体暗色主题协调。

4.  **概述 (Overview)**
    - 用 1-2 段话清晰说明项目的核心目的和解决的问题。
    - 强调项目的设计哲学（例如：“将最被低估的按键变成生产力指挥中心”）。

5.  **核心功能 (Core Features)**
    - 使用带背景色的卡片式 `div` 对功能进行分类展示。
    - 每个类别使用 `<h3>` 标题和带 Emoji 的图标（如 ⌨️, 📋, 🪟）。
    - 功能点使用 `<ul>` 列表，每个条目内嵌 `<code>` 标签高亮关键操作或命令。

6.  **快速参考表 (Quick Reference)**
    - 使用 Markdown 表格。
    - 表格列：`Category`, `Shortcut / Command`, `Description`。
    - 清晰说明操作前提（如“按住某个修饰键”）。
    - 分类明确（如系统、剪贴板、导航、窗口、标签页等）。

7.  **安装与设置 (Installation & Setup)**
    - 包含 **前置依赖**：明确列出所需软件及版本（如运行时环境、编译器、解释器等）及可选依赖。
    - 包含 **快速开始**：使用编号步骤，从下载到运行。
    - 包含 **可选配置**：针对高级功能提供具体的配置步骤。

8.  **配置与参数 (Configuration & Parameters)**
    - **菜单/UI 设置**：以表格形式列出所有可配置项及其功能描述。
    - **配置文件**：提供示例配置文件（如 `config.ini`, `settings.json`）的代码块，并逐行注释说明每个参数的作用。
    - **高级变量**：列出高级用户可以修改的环境变量或全局参数，包括默认值和说明。

9.  **项目结构 (Project Structure)**
    - 使用 `tree` 命令风格的代码块展示项目的目录和文件结构。
    - 确保 `assets/` 目录包含以下 SVG 文件（后续在 SVG 生成部分详述）：`dots.svg`, `bar.svg`, `logo-placeholder.svg`。
    - 在每个文件夹名称前加上 Emoji 图标（如 📁, 📄）以增强可读性。

10. **实现亮点 (Implementation Highlights)**
    - 列出 5-10 个技术实现上的关键点或设计决策。
    - 使用加粗标题（如 **“内存中文件粘贴”**）后跟简短描述。
    - 重点突出脚本的健壮性、性能优化和安全特性。

11. **安全说明 (Security Notes)**
    - 明确告知用户任何潜在的安全风险（如固定加密密钥、明文存储等）。
    - 提供明确的缓解或替代方案建议。

12. **固定末尾区块（必须包含）**
    - 以下三个部分必须按顺序出现在文档末尾，且内容格式需与模板一致（具体链接、许可证名称、技术栈名称可根据项目实际情况调整，但标题和描述应翻译为目标语言）：

    ---
    ## 🤝 Contributing & Feedback

    Issues and Pull Requests are welcome.  
    Please ensure your code conforms to the project's coding standards and follows the existing modular style.

    ---

    ## 📄 License

    This project is licensed under the **[License Name]** (e.g., MIT, GPL-3.0).  
    See the [LICENSE](LICENSE) file for details.

    ---

    ## 💰 Support the Author

    If this project has boosted your productivity, consider buying me a coffee! ☕

    <div align="center">
      <a href="https://your-support-link.com">
        <img src="https://img.shields.io/badge/👉_Click_Here_to_Support_Me-9E8F7E?style=for-the-badge&logo=buy-me-a-coffee&logoColor=BEB8AE" alt="Support Me Button">
      </a>
    </div>

    <div align="center">
      <br>
      <i style="color: #8A9E8B;">Made with ❤️ and [Your Tech Stack]</i>
    </div>

    ---

## SVG 资源生成

使用本 Skill 时，**必须**生成以下 SVG 文件，并将它们放置在 `assets/` 目录中，确保 README 中引用的所有图形资源完整可用。

### 必需文件

- **`assets/dots.svg`** – 用于章节间的分隔装饰（如 Overview 与 Core Features 之间）。  
  示例代码（简约三点式）：
  ```svg
  <svg xmlns="http://www.w3.org/2000/svg" width="160" height="12" viewBox="0 0 160 12">
    <circle cx="20" cy="6" r="4" fill="#8A9E8B" opacity="0.6"/>
    <circle cx="80" cy="6" r="4" fill="#8A9E8B" opacity="0.8"/>
    <circle cx="140" cy="6" r="4" fill="#8A9E8B" opacity="0.6"/>
  </svg>
  ```

- **`assets/bar.svg`** – 用于文档底部的细长分隔条。  
  示例代码（渐变细线）：
  ```svg
  <svg xmlns="http://www.w3.org/2000/svg" width="240" height="8" viewBox="0 0 240 8">
    <rect x="0" y="3" width="240" height="2" fill="url(#grad)" rx="1"/>
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#8A9E8B" stop-opacity="0"/>
        <stop offset="20%" stop-color="#8A9E8B" stop-opacity="0.6"/>
        <stop offset="50%" stop-color="#BEB8AE" stop-opacity="1"/>
        <stop offset="80%" stop-color="#8A9E8B" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#8A9E8B" stop-opacity="0"/>
      </linearGradient>
    </defs>
  </svg>
  ```

- **`assets/logo-placeholder.svg`** – 项目 Logo 占位图，Hero 区块中引用。可根据项目风格自定义颜色和形状。  
  示例代码（简约菱形）：
  ```svg
  <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" rx="16" fill="#2A2A2A" stroke="#8A9E8B" stroke-width="2"/>
    <polygon points="40,12 68,40 40,68 12,40" fill="#8A9E8B" opacity="0.8"/>
    <polygon points="40,24 56,40 40,56 24,40" fill="#E6DED6"/>
  </svg>
  ```

**生成方式**：当调用此 Skill 时，应将上述 SVG 代码以文本文件形式与 README 一同输出（例如通过 `artifact_bundle_create` 打包为 ZIP），并在项目结构中明确包含 `assets/` 目录。

## 写作风格指南

- **语气**：专业、自信、友好。技术解释要精准，但整体氛围是鼓励和赋能。
- **格式**：
    - 键名、文件名、代码和路径使用反引号 (`` ` ``) 包裹。
    - 所有代码块必须指定语言（如 `ini`, `json`, `yaml`, `bash`, `tree`, `svg` 等）。
    - 充分利用 Emoji 为标题和列表增加视觉层次感。
- **目标读者**：面向具备基本编程或脚本使用经验的中高级用户。
- **描述要积极**：聚焦于“它能做什么”，而不是“它不能做什么”。
- **清晰胜于简洁**：对于复杂的快捷键或配置项，提供详细的文字说明，不要担心篇幅。
- **本地化一致性**：所有非代码文本（标题、段落、表格内容、按钮标签）均需翻译为目标语言，且保持术语统一。

## 约束

- **不要** 使用与项目无关的占位文本（如“这里写你的项目名”）。
- **不要** 省略上述结构中的任何部分，尤其是末尾固定区块。
- **颜色方案**：如果项目本身未定义，建议采用 CapsLock Extended 的暗色方案（背景 `#1E1E1E` 和 `#2A2A2A`，文字色 `#E6DED6` 和 `#BEB8AE`，强调色 `#8A9E8B`）。对于明亮主题，可相应调整，但结构保持不变。
- **准确性**：确保所有快捷键、配置文件路径和依赖项名称与你的项目完全匹配。
- **通用性**：本 Skill 不限定于任何特定技术（如 AutoHotkey、Python 等），请根据项目实际情况填充内容。
- **SVG 完整性**：生成的 `assets/` 目录必须包含上述三个 SVG 文件，且内容有效、颜色协调。
- **语言检测**：必须按优先级规则确定语言，并输出指定语言的完整文档。若目标语言不常见，可以英文为主，并附简要翻译说明。

## 示例用法

**用户输入（中文）**：
> 为我的命令行工具 `mycli` 写一份 README，它使用 Go 编写，提供文件批量重命名功能。

**预期输出**：
一份中文（简体）的 `README.md` 文档，所有章节标题和描述均为中文，代码示例和配置保持英文，同时包含 `assets/` 目录下的三个 SVG 文件，所有文件打包为 ZIP 下载。

**用户输入（英文）**：
> Generate a README for my Go CLI tool `mycli` that does batch file renaming.

**预期输出**：
一份英文的 `README.md` 文档，所有文本为英文，结构相同，并包含相同的 SVG 资源。
