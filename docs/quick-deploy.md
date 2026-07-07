# 快速部署说明

本文用于把 yisiblog 部署到 Vercel、Node 服务器或纯静态托管平台。

## 准备

```powershell
npm install
copy .env.example .env
```

至少确认以下变量：

```text
NUXT_PUBLIC_SITE_URL=https://你的域名
ADMIN_TOKEN=替换为强令牌

GITHUB_DATA_OWNER=
GITHUB_DATA_REPO=
GITHUB_DATA_BRANCH=main
GITHUB_DATA_TOKEN=
GITHUB_DATA_BASE_PATH=public/content-data

DATA_CAPSULE_ENDPOINT=https://s3.cstcloud.cn
DATA_CAPSULE_BUCKET=
DATA_CAPSULE_ACCESS_KEY_ID=
DATA_CAPSULE_SECRET_ACCESS_KEY=
```

`GITHUB_DATA_*` 用于管理页同步内容到 GitHub 数据目录。`DATA_CAPSULE_*` 用于保存云端草稿，以及音乐/歌词上传中转。

## Vercel / Node SSR 部署

适合需要管理页、AI 接口、Gitalk 代理和 GitHub 同步的部署方式。

### 构建

```powershell
npm run build
```

### Node 启动

```bash
node .output/server/index.mjs
```

生产环境常用：

```text
HOST=0.0.0.0
PORT=3000
```

Vercel 部署时，把 `.env.example` 中需要的变量配置到 Vercel 环境变量中。`NODE_ENV` 由平台设置，不需要手动配置。

## 纯静态部署

```powershell
npm run generate
```

产物位于：

```text
.output/public/
```

纯静态部署可以展示构建时包含的 `public/content-data` 内容，但不能在线使用管理页同步、AI 接口或 Gitalk 服务端代理。内容更新后需要重新生成并上传产物。

## 内容更新流程

使用管理页更新内容：

1. 打开 `/admin/data` 并使用 `ADMIN_TOKEN` 登录。
2. 编辑记录，保存后进入待同步区。
3. 需要跨设备保留时，点击“保存云端草稿”，草稿会写入数据胶囊。
4. 确认待同步内容后点击“同步 GitHub”。
5. 服务端把 `records.json`、Markdown、音乐和歌词写入 `GITHUB_DATA_BASE_PATH`。
6. 同步成功后，触发线上重新部署。
7. 公开页面读取新的 `/content-data/records.json` 和静态资源。

图片不上传，记录里只保存图片链接。

## 部署后检查

- 首页刷新后是否显示博文、杂谈、动态、相册等数据。
- `/content-data/records.json` 是否能直接访问。
- `/posts`、`/chatter`、`/moments` 是否能读取列表。
- 详情页是否能读取对应 Markdown。
- 音乐页面是否能加载音乐列表并播放。
- `/admin/data` 是否能登录、保存草稿、同步 GitHub。

## 常见问题

### 首页或列表为空

检查线上是否能访问：

```text
https://你的域名/content-data/records.json
```

如果 404，说明 `public/content-data/records.json` 没有进入部署产物，或同步 GitHub 后没有重新部署。

### 详情页 Markdown 404

检查 `records.json` 中的 `contentUrl` 是否与仓库文件一致，例如：

```text
/content-data/posts/{id}.md
/content-data/chatter/{id}.md
/content-data/moments/{id}.md
```

文件名中的空格、中文、`+` 等字符会由项目读取逻辑统一编码，但实际文件必须存在。

### 静态内容读取地址异常

SSR 读取静态内容时会优先使用当前请求地址，浏览器端读取使用相对路径 `/content-data/...`。如果地址异常，检查访问入口、代理头以及 `NUXT_PUBLIC_SITE_URL` 是否配置为正确站点地址。

### 管理页提示未配置 GitHub 数据仓库变量

检查服务端环境变量：

```text
GITHUB_DATA_OWNER
GITHUB_DATA_REPO
GITHUB_DATA_BRANCH
GITHUB_DATA_TOKEN
GITHUB_DATA_BASE_PATH
```

`GITHUB_DATA_TOKEN` 需要有目标仓库内容写入权限。

### 管理页无法保存云端草稿或上传音乐歌词

检查数据胶囊变量：

```text
DATA_CAPSULE_ENDPOINT
DATA_CAPSULE_BUCKET
DATA_CAPSULE_ACCESS_KEY_ID
DATA_CAPSULE_SECRET_ACCESS_KEY
```

### 同步成功但线上没变化

同步 GitHub 只更新数据仓库文件，不会让已经部署的静态产物自动变化。需要触发 Vercel/GitHub Pages/服务器重新部署。
