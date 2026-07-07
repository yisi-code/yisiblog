# yisiblog

一个基于 Nuxt 4 的个人博客与内容管理项目。公开页面以仓库中的 `public/content-data` 作为唯一内容源，管理页负责编辑草稿、暂存到数据胶囊，并在确认同步时把内容提交到 GitHub 数据目录。

## 技术栈

- Nuxt 4 / Vue 3 / TypeScript
- Nitro Server API
- Pinia
- Tailwind CSS 4
- @nuxtjs/mdc / KaTeX
- GitHub Contents / Git Data API 内容同步
- 中国科技云数据胶囊草稿暂存与上传中转

## 功能

- 首页、搜索入口、个人资料与全局音乐播放器
- 博文、杂谈、动态、相册、音乐、友链、项目与关于页面
- Markdown 详情页渲染和文章/杂谈评论
- 管理页 `/admin/data`
  - 云端草稿保存到数据胶囊
  - 本地草稿与待同步区
  - Markdown、音乐、歌词同步到 GitHub 数据目录
  - 图片按链接维护

## 目录

```text
app/                    Nuxt 页面、组件、状态、样式和数据读取逻辑
server/                 Nitro API 与服务端同步逻辑
shared/                 前后端共享类型与路径规则
public/content-data/    运行时公开内容数据
docs/                   项目文档
```

## 内容数据

公开页面读取以下静态资源：

- `public/content-data/records.json`
- `public/content-data/posts/{id}.md`
- `public/content-data/chatter/{id}.md`
- `public/content-data/moments/{id}.md`
- `public/content-data/about/about.md`
- `public/content-data/music/{id}.{ext}`
- `public/content-data/music/{id}.lrc`

首页和列表页只读取 `records.json` 元数据；详情页才读取并解析对应 Markdown。音乐播放器在客户端加载，音乐数据仍来自 `records.json`。

`post`、`chatter` 的 `description` 为可编辑摘要。`moment` 的 `description` 在同步时由正文第一段自动生成。

## 管理与同步

管理页的数据流程：

1. 首次进入管理页时读取 `public/content-data/records.json` 和对应内容文件。
2. 编辑内容后，保存会进入本地待同步区。
3. 点击“保存云端草稿”会把草稿和待同步数据保存到数据胶囊。
4. 上传音乐或歌词时，文件先上传到数据胶囊作为同步中转。
5. 点击“同步 GitHub”后，服务端把 `records.json`、Markdown、音乐和歌词写入配置的 GitHub 数据目录。
6. 同步成功后清空数据胶囊中的云端草稿。
7. 重新部署后，公开页面读取新的静态内容。

图片不上传，管理页只保存手动输入的图片链接。

## 环境变量

复制 `.env.example` 为 `.env`，按需填写：

```text
NUXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_TOKEN=

DATA_CAPSULE_ENDPOINT=https://s3.cstcloud.cn
DATA_CAPSULE_BUCKET=
DATA_CAPSULE_ACCESS_KEY_ID=
DATA_CAPSULE_SECRET_ACCESS_KEY=

GITHUB_DATA_OWNER=
GITHUB_DATA_REPO=
GITHUB_DATA_BRANCH=main
GITHUB_DATA_TOKEN=
GITHUB_DATA_BASE_PATH=public/content-data

AI_PROVIDER=deepseek
AI_API_KEY=
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash
AI_MAX_OUTPUT_TOKENS=150
AI_TEMPERATURE=0.85

NUXT_PUBLIC_GITALK_CLIENT_ID=
NUXT_PUBLIC_GITALK_REPO=
NUXT_PUBLIC_GITALK_OWNER=
NUXT_PUBLIC_GITALK_ADMIN=
GITALK_CLIENT_SECRET=
```

说明：

- `ADMIN_TOKEN` 用于管理页登录。
- `DATA_CAPSULE_*` 用于云端草稿和音乐/歌词上传中转。
- `GITHUB_DATA_*` 用于把待同步内容提交到 GitHub 仓库。
- `GITHUB_DATA_BASE_PATH` 默认是 `public/content-data`。
- `NUXT_PUBLIC_SITE_URL` 线上应配置为站点地址；SSR 会优先使用当前请求地址读取静态内容，缺少请求上下文时才使用该配置。

## 本地开发

```powershell
npm install
copy .env.example .env
npm run dev
```

常用命令：

```powershell
npm run dev
npm run build
npm run generate
npm run preview
npm run lint
```

## 部署

推荐部署到支持 Nitro 服务端的环境，例如 Vercel 或 Node 服务。公开页面需要 `public/content-data` 静态资源随项目一起部署；管理页同步 GitHub 需要服务端环境变量。

纯静态部署可以展示当前构建时包含的 `public/content-data` 内容，但不能在线使用管理页同步、AI 接口或 Gitalk 服务端代理。

## 维护注意

- 不要提交 `.env`、真实密钥、构建产物和本地缓存。
- 修改记录 `id` 会改变页面路径和对应内容文件名。
- 管理页只有在内容与原始数据不同的时候才会进入待同步区。
- 同步 GitHub 后需要触发部署，公开页面才会读取新的静态内容。
