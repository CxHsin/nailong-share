# Nailong Share

**留下值得重读的内容。**

Nailong Share 是一个公开阅读网站，汇集值得学习的文章与视频整理笔记，不限定主题。我们把值得保存的内容整理成便于阅读、检索和回顾的正文，让你找到好内容，也能读懂、留存和再次翻阅。

你可以在这里：

- **在线阅读全文**：从首页进入阅读页，查看章节、配图、代码和公式。
- **搜索与回顾**：全文搜索正文，通过章节目录跳转，或浏览最近整理的笔记。
- **保存 PDF**：在阅读页文末下载 PDF，方便离线阅读。
- **发现主题**：按现有文章标签筛选内容，关注状态保存在当前浏览器中。

阅读无需登录。欢迎把你认为值得重读的内容[推荐给我们](https://github.com/CxHsin/nailong-share/issues/new)，也欢迎参与整理和改进。

## 推荐好文章或视频

发现一篇有启发的文章、一场值得整理的讲座，或一段讲得清楚的教程？可以直接[提交 Issue](https://github.com/CxHsin/nailong-share/issues/new)，无需先写好笔记或准备 PDF。

推荐时请提供：

- **标题与原始链接**：方便找到完整内容。
- **作者或频道**：保留来源信息。
- **推荐理由**：它讲了什么、哪些观点或方法值得学习、适合谁阅读。

维护者会评估推荐内容，决定是否整理发布。主题不限，欢迎分享你认为好的内容。

## 参与贡献

### 通过 Pull Request 投稿

如果你已经整理好内容，可以向 [Nailong Share 仓库](https://github.com/CxHsin/nailong-share) 提交 PR：

1. Fork 仓库，克隆自己的 Fork，并创建本次投稿的分支。
2. 按下方「内容格式与导入」准备 Markdown 正文、封面、配图和 PDF；视频笔记可以使用下方推荐的 skill 制作 PDF，已有 LaTeX 笔记可以使用导入脚本。
3. 在仓库根目录运行 `npm ci`、`npm run check` 和 `npm run build`，再用 `npm run preview` 检查正文、图片、公式和 PDF 下载。
4. 提交并推送到自己的 Fork，向本仓库的 `main` 分支发起 PR，说明内容来源、推荐理由和已完成的检查。
5. 根据维护者的反馈完善内容，审核通过并合并后发布。

投稿请注明原作者和原始链接，确认所提交的文字、图片和 PDF 可以公开分享；清楚区分原作者观点与整理者补充，引用与转述保持准确。

提交贡献即表示你同意将自己有权授权的代码按 MIT 协议、原创笔记、PDF 与原创配图按 CC BY 4.0 协议发布，详见下方「开源协议与内容授权」。第三方素材请标明来源与授权信息。

### 其他贡献

也欢迎通过 [Issue](https://github.com/CxHsin/nailong-share/issues/new) 或 PR 纠正错别字、补充资料、修正内容错误、改善阅读体验和修复网站问题。内容纠错请附上对应阅读页、章节位置和参考来源；网站问题请描述复现步骤与预期行为。

## 内容格式与导入

以下路径和命令均以网站仓库根目录为基准；在本工作区中，对应 `website/` 目录。

一篇完整投稿由三部分组成：`src/content/notes/<slug>.md` 中的正文和元数据、`public/media/<slug>/` 下的正文图片与封面、同一目录下的 `note.pdf`。每份内容对应一个阅读页。标签自由填写，不需要预先建立栏目。**仅添加 PDF 不会自动生成网页正文**，请同时提供 Markdown 或通过导入脚本生成正文。

### 直接添加 Markdown

创建 `src/content/notes/example.md`，将资源放进 `public/media/example/`。正文支持 Markdown、代码块、`$...$` 行内公式和 `$$...$$` 独立公式。章节使用 `##`、小节使用 `###`，目录自动生成。

元数据示例：

```markdown
---
title: "内容标题"
description: "一两句话介绍值得阅读的内容。"
date: "2026-10-15"
author: "原作者或频道"
source: "https://www.youtube.com/watch?v=VIDEO_ID"
duration: "30 分钟"
tags: ["任意标签"]
cover: "/media/example/cover.jpg"
pdf: "/media/example/note.pdf"
---

## 第一章

正文内容。

![图片说明](/media/example/figure.jpg)
```

`date` 是整理日期；`source` 填原始文章或视频链接；`duration` 为可选的视频时长，文章可省略。`cover` 和 `pdf` 指向随投稿提交的资源。

### 使用 skill 制作投稿 PDF

整理视频内容时，可以使用 [wdkns/wdkns-skills](https://github.com/wdkns/wdkns-skills) 中的 skill，生成结构化、配图丰富的中文 LaTeX 讲义和 PDF：

| 视频来源 | Skill |
| --- | --- |
| YouTube | [youtube-render-pdf](https://github.com/wdkns/wdkns-skills/tree/main/skills/youtube-render-pdf) |
| Bilibili | [bilibili-render-pdf](https://github.com/wdkns/wdkns-skills/tree/main/skills/bilibili-render-pdf) |

1. 下载或克隆该技能仓库，将需要的完整 skill 目录放到本机 `~/.codex/skills/` 下（Windows 通常为 `C:\Users\<用户名>\.codex\skills\`）。
2. 按该仓库的 [使用说明](https://github.com/wdkns/wdkns-skills#使用方式) 准备依赖，并查看对应 skill 的 `SKILL.md`。制作视频讲义需要 `yt-dlp`、`ffmpeg`、XeLaTeX 等本地工具，具体要求以技能说明为准。
3. 在 Codex 中提供视频链接，并指定对应 skill。例如：

```text
$youtube-render-pdf https://www.youtube.com/watch?v=VIDEO_ID
请生成结构化中文讲义，包含原始来源、章节、关键配图、完整 LaTeX 源文件和最终 PDF。
将全部资源存放在 outputs/<视频名称>/ 中。
```

Bilibili 视频使用 `$bilibili-render-pdf` 并替换为对应链接。生成后请核对内容、来源、配图和 PDF 排版，再按下一节导入网页正文并提交 PR。这些 skill 是可选工具，也欢迎使用其他方式完成符合投稿格式的材料。

### 导入已有 LaTeX 视频笔记

在本地准备好完整 `.tex`、对应 `.pdf` 与配图，再运行导入脚本；也可以使用视频转 PDF skill 生成这些材料。Python、Pandoc、LaTeX 仅用于本地导入，自动部署无需安装它们。在本工作区中，每条视频的全部原始资源和中间产物统一存放在根目录 `outputs/` 下的视频子目录中。

```powershell
python -m pip install -r scripts/requirements.txt
python scripts/import_note.py --source '../outputs/常驻主动型智能体/常驻主动型智能体如何工作_notes.tex' --slug always-on-agents --date 2026-10-13 --description '从工具循环到持续协作，理解常驻智能体背后的运行架构、持久工作流与记忆机制。' --tags '智能体,系统设计'
npm run check
npm run build
npm run preview
```

`--source` 指向完整主 `.tex`，默认使用同名 PDF；可以通过 `--pdf` 指定 PDF。独立克隆仓库时，将示例路径替换为自己的笔记路径。`--slug` 是稳定的网址路径，使用小写英文字母、数字和短横线。相同 slug 再次导入会更新原有正文和相关图片。`--date` 是整理日期。

脚本读取现有技能产物中的 `notetitle`、`videochannel`、`videourl`、`videoduration`、`videocoverpath` 元数据；保留章节、正文、图注、视频时间、列表、表格、代码、数学公式和提示框。TikZ 图会在本地通过 XeLaTeX 导出为图片，需要已有的 `xelatex`。脚本只复制引用到的图片与 PDF，不复制视频、原始字幕和中间文件。

导入后请检查正文和图表。使用新 LaTeX 宏或复杂布局时，不支持的原生 LaTeX 块会报错，需导出为网页可用图片或补充对应转换。

## 本地开发与检查

网站采用 Astro 静态生成与 Pagefind 中文正文搜索，无数据库和在线转换服务。使用 Node.js 22.12 或更新的受支持版本，在仓库根目录运行：

```powershell
npm ci
npm run check
npm run build
npm run preview
```

浏览器打开命令显示的本地地址。修改页面时使用 `npm run dev`；正文搜索索引在 `npm run build` 后生成，因此检查搜索请使用 `npm run preview`。

`npm run check` 检查类型，`npm run build` 生成页面和正文搜索索引。`scripts/verify-site.cjs` 可用 Playwright 验证导航、搜索与章节跳转、主题记忆、PDF 字节、图片链接、正文结构及手机/平板布局；默认从本地 Playwright 加载，或通过 `PLAYWRIGHT_MODULE` 指定安装路径，`CHROMIUM_PATH` 指定 Chromium 路径。运行前先启动生产预览服务器。

网站支持深浅主题切换与主题记忆，按 `/` 可聚焦搜索。桌面首页显示推荐主题，窄屏隐藏侧栏；主题关注状态保存在本地浏览器中。阅读页提供章节导航、代码高亮和数学公式排版。

## 开源协议与内容授权

- **网站代码**采用 [MIT 协议](LICENSE)，允许使用、修改和分发，包括商业用途；需保留版权声明和协议文本。
- **原创笔记、PDF 与原创配图**采用 [CC BY 4.0](LICENSE-CONTENT)，允许分享和改编，包括商业用途；使用时请注明作者与来源、附上[协议链接](https://creativecommons.org/licenses/by/4.0/)，并说明是否做过修改。
- **第三方内容**，包括原文章、原视频、引用、截图、字体和其他素材，仍遵循原权利人的授权条件，不因收录到本站而自动采用上述协议。字体授权文件保留在 [`public/fonts/`](public/fonts/) 中。

制作 PDF 的 [wdkns-skills](https://github.com/wdkns/wdkns-skills) 是独立项目，使用或修改该工具时请遵循其自身的 [LICENSE](https://github.com/wdkns/wdkns-skills/blob/main/LICENSE)。
