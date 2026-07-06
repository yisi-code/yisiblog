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
AI_PROVIDER=deepseek
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash
AI_MAX_OUTPUT_TOKENS=150
AI_TEMPERATURE=0.85
AI_API_KEY=
GITALK_CLIENT_SECRET=
DATA_CAPSULE_ENDPOINT=https://s3.cstcloud.cn
DATA_CAPSULE_BUCKET=
DATA_CAPSULE_ACCESS_KEY_ID=
DATA_CAPSULE_SECRET_ACCESS_KEY=
```

只展示给浏览器的配置使用 `NUXT_PUBLIC_*`。真实密钥只放在服务端变量中，不要提交到仓库。

管理页面点击“同步数据胶囊”时需要完整的数据胶囊 S3 访问变量。

`node_modules/`、`.nuxt/`、`.output/`、`.data/`、`.idea/` 都已加入 Git 忽略。服务器部署时通常只需要源码、配置和构建产物，不需要提交这些本地目录。

## 方式一：Node 服务端部署

适合需要 AI 接口、Gitalk 代理、数据胶囊内容读取和管理页面等服务端能力的部署方式。

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
public/        # 如果服务器运行目录需要保留 CNAME、.nojekyll 等静态托管文件
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

1. 在 `/admin/data` 修改记录并保存草稿。
2. 按需上传 Markdown、音乐、歌词和图片资源到中国科技云数据胶囊，并在记录中保存远程地址。
3. 本地运行 `npm run dev` 检查页面。
4. 服务端部署执行 `npm run build`，静态部署执行 `npm run generate`。
5. 上传新产物并重启服务或刷新静态文件。

使用 `/admin/data` 更新内容：

1. 确认已配置 `ADMIN_TOKEN` 和中国科技云数据胶囊变量。
2. 在 SSR / Node 服务端环境打开 `/admin/data`。
3. 编辑内容并点击“保存草稿”，变更会进入右侧待同步区。
4. 确认待同步内容后点击“同步数据胶囊”，服务端会写回数据胶囊根目录 `records.json`，并把最新 records 返回给管理页。
5. 公开页面后续请求会读取数据胶囊中的最新内容。

音乐音频、LRC 歌词、Markdown 正文和图片文件会上传到数据胶囊；`records.json` 保存在数据集根目录。

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

检查数据胶囊根目录 `records.json` 是否存在、JSON 是否合法，以及记录中的 `contentUrl` 是否能通过服务端接口读取。

### 管理页面提示未配置令牌

检查服务端环境变量或 `.env` 中是否设置了 `ADMIN_TOKEN`，设置后需要重启服务。

### 线上图片或音乐 404

检查资源是否能被线上环境访问。音乐记录中的 `url` 和 `lrcUrl`、封面、动态图片和相册图片都应是数据胶囊统一桶中的公开地址。如果桶没有公开读权限，页面会出现资源 404 或跨域读取失败。

### 静态部署后管理页面不能保存

这是纯静态部署的限制。管理页面同步数据胶囊需要 Nitro 服务端接口。请使用 SSR / Node 环境运行管理页。

### 管理页面已保存，但首页没有立即更新

管理页面“保存草稿”只会更新待同步区，不会触发公开页面更新。点击“同步数据胶囊”成功后，根目录 `records.json` 和相关资源对象会更新，公开页面后续请求会读取最新数据。
