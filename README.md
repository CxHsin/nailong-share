# Nailong Share

公开的视频内容阅读网站，不限定主题。Home 卡片直接进入完整正文，阅读页文末可保存原始 PDF。采用 Astro 静态生成与 Pagefind 中文正文搜索，无登录、数据库和在线转换服务。

## 本地预览

使用 Node.js 22.12 或更新的受支持版本。

```powershell
npm ci
npm run build
npm run preview
```

浏览器打开命令显示的本地地址。需要修改页面时用 `npm run dev`；正文搜索索引在 `npm run build` 后生成，因此检查搜索请使用 `npm run preview`。

## 发布新内容

网站发布材料由三部分组成：`src/content/notes/<slug>.md` 中的正文和元数据、`public/media/<slug>/` 下的正文图片与封面、同一目录下的原始 `note.pdf`。每条视频对应一个阅读页。标签自由填写，不需要预先建立栏目。**仅添加 PDF 不会自动生成网页正文**，请先完成下面的本地导入。

### 导入已有视频笔记

在本地用视频转 PDF skill 完成 `.tex`、`.pdf` 与配图，再运行导入脚本。Python、Pandoc、LaTeX 仅用于本地导入；GitHub 自动部署无需安装它们。

```powershell
python -m pip install -r scripts/requirements.txt
python scripts/import_note.py --source '../outputs/常驻主动型智能体/常驻主动型智能体如何工作_notes.tex' --slug always-on-agents --date 2026-10-13 --description '从工具循环到持续协作，理解常驻智能体背后的运行架构、持久工作流与记忆机制。' --tags '智能体,系统设计'
npm run check
npm run build
npm run preview
```

`--source` 指向完整主 `.tex`，默认使用同名 PDF；可以通过 `--pdf` 指定 PDF。`--slug` 是稳定的网址路径，使用小写英文字母、数字和短横线。相同 slug 再次导入会更新原有正文和相关图片。`--date` 是整理日期。

脚本读取现有技能产物中的 `notetitle`、`videochannel`、`videourl`、`videoduration`、`videocoverpath` 元数据；保留章节、正文、图注、视频时间、列表、表格、代码、数学公式和提示框。TikZ 图会在本地通过 XeLaTeX 导出为图片，需要已有的 `xelatex`。脚本只复制引用到的图片与 PDF，不复制视频、原始字幕和中间文件。

目前已核对仓库内两份样本。未来如果技能产物使用新的 LaTeX 宏或复杂布局，请导入后检查正文和图表；不支持的原生 LaTeX 块会报错，需导出为网页可用图片或补充对应转换。

### 直接添加 Markdown

也可以直接创建 `src/content/notes/example.md`，将资源放进 `public/media/example/`。正文支持 Markdown、代码块、`$...$` 行内公式和 `$$...$$` 独立公式。章节使用 `##`、小节使用 `###`，目录自动生成。

```markdown
---
title: "内容标题"
description: "一两句话介绍值得阅读的内容。"
date: "2026-10-15"
author: "原视频作者或频道"
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

## GitHub 与部署

把 **website 目录本身作为 GitHub 仓库根目录**。生成的 Markdown、PDF 和配图都要提交；`node_modules`、`dist`、原始视频与中间产物不提交。随后将部署平台连接这个 GitHub 仓库。之后每次更新内容并 push，平台就会重新构建发布。

| 设置 | Vercel | Cloudflare Pages |
| --- | --- | --- |
| 框架 | Astro（自动识别） | Astro |
| 构建命令 | `npm run build` | `npm run build` |
| 输出目录 | `dist` | `dist` |
| Node 版本 | 22.x | `NODE_VERSION=22` |
| 生产分支 | `main` | `main` |

已提供 Vercel 配置。Cloudflare 请使用 **Pages 的 Git 集成**；站点不需要 Workers 服务或部署密钥。若把此目录放进另一个仓库，Root directory 填写它在那个仓库中的路径。

## 检查

`npm run check` 检查类型，`npm run build` 生成页面和正文搜索索引。`scripts/verify-site.cjs` 可用 Playwright 验证导航、搜索与章节跳转、主题记忆、PDF 字节、图片链接、正文结构及手机/平板布局；默认从本地 Playwright 加载，或通过 `PLAYWRIGHT_MODULE` 指定安装路径，`CHROMIUM_PATH` 指定 Chromium 路径。运行前先启动生产预览服务器。

页面默认使用深色配色，提供主题记忆、顶部居中全文搜索及键盘快捷键 `/`。首页显示居中的文章信息流，可切换最近 10 篇笔记；阅读页正文和封面统一居中，最大宽度 680px，窄屏两侧各留 24px；右侧章节目录默认显示短线，悬停或键盘聚焦时上下展开并淡入文字，支持章节跳转和滚动高亮，窄屏隐藏。作者头像和姓名链接至账号主页，文末可保存原始 PDF。全站英文使用本地 Charter，中文使用本地思源宋体（Source Han Serif SC）；代码保留等宽字体，公式使用 KaTeX 字体。
