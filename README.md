# yisiblog

一个基于 Nuxt 4 的个人博客与内容管理项目。项目把博客文章、杂谈、动态、相册、音乐、友链、项目展示等内容统一组织在前端应用内，并提供本地管理页面维护元数据、Markdown 正文、歌词和本地媒体文件。

## 技术栈

- Nuxt 4 / Vue 3 / TypeScript
- Nuxt Content 3
- Pinia
- Tailwind CSS 4
- Nitro Server API
- Gitalk 评论代理
- OpenAI 兼容格式的 AI 聊天接口

## 功能总览

- 首页信息流、搜索入口和个人资料展示
- 博文列表与详情页：`/posts`、`/posts/{id}`
- 杂谈列表与详情页：`/chatter`、`/chatter/{id}`
- 动态页面：`/moments`
- 关于页面：`/about`
- 项目、友链、相册、音乐页面：`/projects`、`/friends`、`/albums`、`/music`
- 全局音乐播放组件与歌词读取
- 文章、杂谈、动态评论组件
- 本地内容管理页面：`/admin/data`
- Nitro 接口：
  - `/api/chat`：AI 聊天
  - `/api/github`：GitHub OAuth 代理
  - `/api/github-rest/**`：GitHub REST 代理
  - `/api/admin/**`：本地数据管理接口

## 目录结构

```text
app/
  assets/css/          页面与组件样式
  components/          业务组件与通用 UI 组件
  composables/         前端复用状态和交互逻辑
  data/                静态数据读取、归一化与内容合并逻辑
  layouts/             页面布局
  pages/               Nuxt 路由页面
  stores/              Pinia 状态
  utils/               通用工具函数与历史迁移辅助脚本
content/
  about/               关于页 Markdown
  chatters/            杂谈 Markdown
  moments/             动态 Markdown
  posts/               博文 Markdown
  lyrics/              音乐歌词 LRC
docs/                  项目文档
public/
  images/              本地图片资源
  music/               本地音乐资源
  CNAME                GitHub Pages 自定义域名配置
  .nojekyll            GitHub Pages 静态资源保留配置
  orange-cat-sprite.png 页面橘猫精灵图资源
server/
  api/                 Nitro API
  services/            服务端业务逻辑
shared/                前后端共享类型与配置
```

## 数据与内容

项目采用“统一元数据 JSON + 按需 Markdown / LRC 文件”的内容组织方式。

- 元数据入口：`app/data/source/records.json`
- 内容读取入口：`app/data/records.ts`、`app/data/content.ts`
- Nuxt Content 集合配置：`content.config.ts`
- 内容维护说明：[`docs/data-guide.md`](docs/data-guide.md)

Markdown 正文不需要写 frontmatter。标题、日期、封面、标签等元数据统一放在 `records.json` 中，再由页面和内容读取逻辑合并使用。

## 本地开发

建议使用 Node.js 20 或更高版本。

```powershell
npm install
copy .env.example .env
npm run dev
```

启动后打开 Nuxt 输出的本地地址，通常是 `http://localhost:3000`。

常用脚本：

```powershell
npm run dev       # 本地开发
npm run build     # 构建服务端部署产物
npm run generate  # 生成静态站点
npm run preview   # 预览构建产物
npm run lint      # 代码检查
```

## 环境变量

复制 `.env.example` 为 `.env` 后按需填写。`.env` 不应提交到 Git。

```text
AI_PROVIDER=deepseek
AI_API_KEY=
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash
AI_MAX_OUTPUT_TOKENS=150
AI_TEMPERATURE=0.85
AI_THINKING=disabled
AI_THINKING_LEVEL=high

NUXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_TOKEN=

NUXT_PUBLIC_GITALK_CLIENT_ID=
GITALK_CLIENT_SECRET=
NUXT_PUBLIC_GITALK_REPO=
NUXT_PUBLIC_GITALK_OWNER=
NUXT_PUBLIC_GITALK_ADMIN=
```

说明：

- `AI_API_KEY`、`GITALK_CLIENT_SECRET`、`ADMIN_TOKEN` 是服务端变量，不要暴露到浏览器或公开仓库。
- `AI_PROVIDER` 当前支持 `deepseek` 和 `openai`，请求格式使用 OpenAI 兼容的 `/chat/completions`。
- `NUXT_PUBLIC_*` 会进入浏览器运行时，只能放可公开配置。
- `ADMIN_TOKEN` 配置后，本地管理页面 `/admin/data` 才能登录并写入文件。

## 部署

服务端部署推荐使用 `npm run build`，产物位于 `.output/`，通过 Node 运行 `.output/server/index.mjs`。

纯静态平台可以使用 `npm run generate`，产物位于 `.output/public/`。但纯静态部署无法在线写入 `records.json`、Markdown、LRC 或本地媒体文件，管理页面应在本地或自部署 Node 环境中使用。

快速部署步骤见 [`docs/quick-deploy.md`](docs/quick-deploy.md)。

## 维护注意

- 不要提交 `.env`、本地日志、构建产物和真实密钥。
- `node_modules/`、`.nuxt/`、`.output/`、`.data/`、`.idea/` 是依赖、生成缓存或本地 IDE 配置，已加入 Git 忽略。
- `.data/content/contents.sqlite` 是 Nuxt Content 的本地索引缓存，不是业务源数据。
- 修改已有记录的 `id` 会影响页面路径和关联 Markdown / LRC 文件名。
- 管理页面删除记录时需要谨慎处理关联文件，避免误删正文或歌词。
