# 快速部署说明

本文用于把 yisiblog 快速部署到服务器或静态托管平台。

## 部署前准备

- Node.js 22
- npm
- 已复制并配置 `.env`
- 如果需要 Gitalk、AI 聊天或管理页面，先准备对应密钥和仓库配置

```powershell
npm install
copy .env.example .env
```

`.env` 中至少确认：

```text
NUXT_PUBLIC_SITE_URL=https://你的域名
ADMIN_TOKEN=替换为强令牌
AI_API_KEY=
GITALK_CLIENT_SECRET=
GITHUB_TOKEN=
GITHUB_OWNER=yisi-code
GITHUB_REPO=yisiblog
GITHUB_BRANCH=main
GITHUB_COMMITTER_NAME=Yisi Blog Bot
GITHUB_COMMITTER_EMAIL=yisiblogbot@example.com
```

只展示给浏览器的配置使用 `NUXT_PUBLIC_*`。真实密钥只放在服务端变量中，不要提交到仓库。

管理页面保存/删除内容需要 GitHub 同步变量。`GITHUB_TOKEN` 建议使用 Fine-grained personal access token，只授权当前仓库，并授予 `Contents: Read and write` 与 `Metadata: Read` 权限。

`node_modules/`、`.nuxt/`、`.output/`、`.data/`、`.idea/` 都已加入 Git 忽略。服务器部署时通常只需要源码、配置和构建产物，不需要提交这些本地目录。

## 方式一：Node 服务端部署

适合需要 AI 接口、Gitalk 代理、管理页面提交 GitHub 等服务端能力的部署方式。

### 1. 构建

```powershell
npm run build
```

构建完成后，部署产物位于 `.output/`。

### 2. 上传产物

把以下内容上传到服务器：

```text
.output/
.env
public/        # 如果服务器运行目录需要保留本地静态资源
content/       # 公开页面构建期读取的 Markdown / LRC
app/data/source/records.json
```

如果你直接在服务器上拉取完整仓库，可以省略手动上传这些源文件，直接在服务器构建和运行。

`public/CNAME` 和 `public/.nojekyll` 是静态托管相关文件，使用 GitHub Pages 或类似平台时建议保留。

### 3. 启动

Linux / macOS：

```bash
node .output/server/index.mjs
```

Windows PowerShell：

```powershell
node .output/server/index.mjs
```

默认监听端口由 Nuxt / Nitro 环境变量控制。常用配置：

```text
HOST=0.0.0.0
PORT=3000
```

生产环境建议使用进程管理工具守护 Node 进程，并在 Nginx 中反向代理到 `http://127.0.0.1:3000`。

### 4. Nginx 反向代理示例

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 方式二：纯静态部署

适合部署到 GitHub Pages、静态对象存储、Nginx 静态目录等平台。

```powershell
npm run generate
```

生成产物位于：

```text
.output/public/
```

把 `.output/public/` 上传到静态托管平台即可。

限制：

- 不能直接在线使用管理页面，因为管理页面依赖 Nitro 服务端 API。
- 依赖服务端 API 的功能不可用或需要单独部署 API。
- 内容更新后需要重新执行 `npm run generate` 并重新上传。

## 更新内容后的部署流程

常规内容更新：

1. 修改 `app/data/source/records.json`。
2. 按需修改 `content/`、`content/lyrics/`、`public/images/`、`public/music/`。
3. 本地运行 `npm run dev` 检查页面。
4. 服务端部署执行 `npm run build`，静态部署执行 `npm run generate`。
5. 上传新产物并重启服务或刷新静态文件。

使用 `/admin/data` 更新内容：

1. 确认已配置 `ADMIN_TOKEN` 和 GitHub 同步变量。
2. 在 SSR / Node 服务端环境打开 `/admin/data`。
3. 保存内容后，服务端会提交 GitHub commit，并把最新 records 返回给管理页。
4. GitHub commit 触发 Vercel 或其他平台重新部署。
5. 新部署完成后，公开页面读取新的构建期内容。

如果是在本地开发环境保存，服务端还会尽力同步写入本地 `app/data/source/records.json`、`content/` 和 `content/lyrics/`。本地镜像失败不影响 GitHub commit，但公开首页本地预览是否立即更新取决于本地文件是否同步成功。

## 部署后检查

- 首页是否能正常打开
- `/posts`、`/chatter`、`/moments` 是否能读取列表
- 详情页是否能打开 Markdown 正文
- 图片和音乐资源是否能访问
- 需要评论时，检查 Gitalk 登录和评论加载
- 需要 AI 聊天时，检查 `/api/chat` 是否能正常响应
- 需要管理页面时，检查 `/admin/data` 登录和保存是否正常

## 常见问题

### 页面能打开，但内容为空

检查 `app/data/source/records.json` 是否存在、JSON 是否合法，以及对应 Markdown 文件是否在 `content/` 下。

### 管理页面提示未配置令牌

检查服务端环境变量或 `.env` 中是否设置了 `ADMIN_TOKEN`，设置后需要重启服务。

### 线上图片或音乐 404

检查资源是否放在 `public/images/` 或 `public/music/` 下，记录中的路径应类似 `/images/name.jpg` 或 `/music/name.m4a`。

### 静态部署后管理页面不能保存

这是纯静态部署的限制。管理页面保存需要 Nitro 服务端接口提交 GitHub。可以在本地或 SSR 环境使用管理页提交 GitHub，然后重新生成并发布静态产物。

### 管理页面已保存，但首页没有立即更新

管理页面保存成功只代表 GitHub commit 已完成，并且管理页拿到了最新 records。公开页面读取的是当前部署的构建期内容，需要等待 Vercel 或其他平台重新部署完成后才会显示新内容。本地开发时，公开页面读取本地文件；如果本地镜像没有写入成功，需要拉取 GitHub 最新提交或手动同步文件。
