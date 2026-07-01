# 数据新增与维护指南

## 数据来源

项目采用“统一元数据 JSON + 按需 Markdown / LRC 文件”的方式管理内容。

- 统一记录文件：`app/data/source/records.json`
- 正文目录：`content/`
- 歌词目录：`content/lyrics/`
- 本地图片目录：`public/images/`
- 本地音乐目录：`public/music/`
- 数据解析入口：`app/data/records.ts`
- 正文合并入口：`app/data/content.ts`
- 管理页面：`/admin/data`
- 历史迁移辅助脚本：`app/utils/提取md元数据.js`

`.data/content/contents.sqlite` 是 Nuxt Content 生成的本地索引缓存，不是业务源数据，不需要手动维护。

`app/utils/提取md元数据.js` 用于从旧 Markdown frontmatter 中批量提取记录，属于迁移辅助脚本，不参与站点运行流程。

## 运行时数据流

项目当前采用 GitHub-first 的管理模式：

- 公开页面：首页、列表页、详情页读取当前运行环境中的构建期内容。本地开发时读取工作区里的 `app/data/source/records.json` 和 `content/`；Vercel 线上读取本次部署打包进去的仓库内容。
- 管理页面 `/admin/data` 读取数据时优先读取 GitHub 仓库中的 `app/data/source/records.json`、`content/` 和 `content/lyrics/`；GitHub 读取失败时回退读取本地文件。
- 管理页面保存或删除时，先通过 GitHub API 提交一次 commit。GitHub 提交成功后，接口返回最新 records，管理页立即刷新当前数据。
- GitHub commit 会触发 Vercel 等平台重新部署；公开页面需要等待新部署完成后才会展示最新内容。
- 保存成功后，服务端会尽力同步写入本地文件。这个本地镜像主要服务本地开发调试，线上无写入权限或临时文件系统写入失败不会影响 GitHub 主链路。

因此，本地开发时可能出现“管理页已经看到 GitHub 最新数据，但公开首页仍显示本地旧文件”的情况。公开首页要立即同步，需要确认本地镜像写入成功，或拉取 GitHub 最新提交后重新启动/刷新开发服务。

## records.json 基础结构

每条记录都使用统一基础字段：

```json
{
  "id": "new-post",
  "type": "post",
  "title": "标题",
  "description": "摘要或说明",
  "date": "2026-07-01 10:30:00",
  "cover": "https://example.com/cover.jpg",
  "url": "https://example.com",
  "path": "/custom-path",
  "tags": ["标签"]
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `id` | 同类型下唯一标识。需要正文的类型会用它推导 Markdown 文件名 |
| `type` | 内容类型，支持 `post`、`chatter`、`moment`、`music`、`friend`、`album`、`project`、`about` |
| `title` | 标题。部分类型可为空 |
| `description` | 摘要、说明或页面描述 |
| `date` | 日期字符串，建议使用 `YYYY-MM-DD` 或 `YYYY-MM-DD HH:mm:ss` |
| `cover` | 封面图片地址，可使用远程图片或 `/images/...` |
| `url` | 外链、音乐文件地址或其他资源地址 |
| `path` | 可选自定义页面路径；不填时由类型和 `id` 自动推导 |
| `tags` | 标签数组；没有标签时使用空数组或省略 |

## 类型专属字段

| 类型 | 专属字段 | 说明 |
| --- | --- | --- |
| `chatter` | `mood` | 杂谈心情 |
| `moment` | `location`、`images` | 动态位置和图片列表 |
| `music` | `artist`、`error` | 歌手与播放异常提示 |
| `album` | `photos` | 相册图片列表 |
| `project` | `icon` | 项目图标名 |
| `about` | 固定 `id` 为 `about` | 只服务关于页 |

项目会在读取时自动补齐缺失的 `tags`，并根据 `type` 与 `id` 生成默认 `path` 和 `contentFile`。

## 自动路径规则

| type | 页面路径 | 关联文件 |
| --- | --- | --- |
| `post` | `/posts/{id}` | `content/posts/{id}.md` |
| `chatter` | `/chatter/{id}` | `content/chatters/{id}.md` |
| `moment` | `/moments` | `content/moments/{id}.md` |
| `about` | `/about` | `content/about/about.md` |
| `music` | `/music` | 可选 `content/lyrics/{音频文件名}.lrc` |
| `friend` | `/friends` | 无 |
| `album` | `/albums/{id}` | 无 |
| `project` | `/projects` | 无 |

Markdown 文件只写正文，不写 frontmatter。标题、日期、封面、标签等元数据统一放在 `records.json`。

## 管理页面

管理页面位于 `/admin/data`，用于通过服务端接口维护项目数据。当前保存链路以 GitHub 仓库为主数据源，本地文件只作为开发镜像。

启用步骤：

1. 复制 `.env.example` 为 `.env`。
2. 设置 `ADMIN_TOKEN`。
3. 设置 GitHub 同步变量：`GITHUB_TOKEN`、`GITHUB_OWNER`、`GITHUB_REPO`、`GITHUB_BRANCH`。
4. 启动 Nuxt 服务。
5. 打开 `/admin/data`。
6. 输入管理令牌后加载数据。

令牌验证通过后，浏览器会保存一个服务端签名的短期管理会话，有效期 30 分钟。真实 `ADMIN_TOKEN` 不会长期保存到浏览器；会话过期后需要重新验证。

管理页面支持：

- 查询、新增、编辑、删除全部类型记录
- 保存时提交 GitHub 仓库中的 `app/data/source/records.json`
- `post`、`chatter`、`moment`、`about` 自动提交或更新 GitHub 仓库中的 Markdown 文件
- `music` 自动提交或更新 GitHub 仓库中的 LRC 文件
- GitHub 提交成功后尽力同步写入本地 `app/data/source/records.json`、`content/` 和 `content/lyrics/`
- 类型专属字段直接写入记录根层级
- 图片文件从本地选择后写入 `public/images/`
- 音乐文件从本地选择后写入 `public/music/`
- 歌词文件从本地选择后写入 `content/lyrics/`
- 图片预览、音乐试听和歌词预览

当前不适合的场景：

- 远程图床管理
- 纯静态托管环境中直接运行管理接口
- 多人同时编辑同一个 `records.json`

删除记录时默认只删除 `records.json` 中的记录，关联 Markdown / LRC 文件建议谨慎处理，避免误删内容。

## 类型示例

### 博文

```json
{
  "id": "new-post",
  "type": "post",
  "title": "新博文标题",
  "description": "博文摘要",
  "date": "2026-07-01 10:30:00",
  "cover": "https://example.com/cover.jpg",
  "tags": ["记录"]
}
```

同时创建 `content/posts/new-post.md`。

### 杂谈

```json
{
  "id": "daily-note",
  "type": "chatter",
  "title": "一点杂谈",
  "date": "2026-07-01",
  "cover": "https://example.com/cover.jpg",
  "tags": ["生活"],
  "mood": "平静"
}
```

同时创建 `content/chatters/daily-note.md`。

### 动态

```json
{
  "id": "moment-20260701103000",
  "type": "moment",
  "date": "2026-07-01 10:30:00",
  "location": "南昌",
  "images": [
    "https://example.com/photo.jpg"
  ]
}
```

同时创建 `content/moments/moment-20260701103000.md`。

### 音乐

```json
{
  "id": "song-id",
  "type": "music",
  "title": "歌曲名",
  "description": "专辑或说明",
  "cover": "https://example.com/cover.jpg",
  "url": "/music/song.m4a",
  "artist": "歌手"
}
```

歌词文件根据音频文件名生成。例如 `/music/song.m4a` 对应 `content/lyrics/song.lrc`。

### 相册

```json
{
  "id": "album-id",
  "type": "album",
  "title": "相册标题",
  "description": "相册说明",
  "date": "2026-07-01",
  "cover": "https://example.com/cover.jpg",
  "tags": ["旅行"],
  "photos": [
    {
      "url": "https://example.com/photo.jpg",
      "caption": "照片说明"
    }
  ]
}
```

### 项目

```json
{
  "id": "project-id",
  "type": "project",
  "title": "项目名称",
  "description": "项目说明",
  "url": "https://github.com/example/project",
  "tags": ["Vue", "Nuxt"],
  "icon": "Rocket"
}
```

## 注意事项

- `records.json` 必须是合法 JSON，不能写注释。
- 不要手写 `contentFile`，项目会自动推导。
- 修改已有记录的 `id` 会影响页面路径和关联文件名；管理页面编辑已有记录时也应谨慎修改 `id`。
- `about` 类型固定使用 `id: "about"`。
- 如果使用 `npm run generate` 部署到纯静态平台，线上没有 Nitro 服务端接口，无法直接使用管理页面保存。可以在本地或 SSR 部署环境中通过管理页提交 GitHub，然后重新生成并部署静态产物。
- 新增敏感配置只写入 `.env`，不要提交真实令牌。
