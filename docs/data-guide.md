# 数据新增与维护指南

## 数据来源

项目采用“统一元数据 JSON + 按需 Markdown + 远程媒体资源”的方式管理内容。

- 统一记录文件：数据胶囊数据集根目录 `records.json`
- 正文目录：`content/`
- 音乐音频、LRC 歌词和图片：上传到中国科技云数据胶囊统一桶，通过不同目录区分
- 数据解析入口：`app/data/records.ts`
- 正文合并入口：`app/data/content.ts`
- 管理页面：`/admin/data`
- 历史迁移辅助脚本：`app/utils/提取md元数据.js`

当前仓库已有数据主要包含 `post`、`chatter`、`moment`、`music`、`about`。代码和管理页也预留了 `friend`、`album`、`project` 类型，新增这些类型后会分别出现在 `/friends`、`/albums/{id}` 和 `/projects`。

`.data/content/contents.sqlite` 是 Nuxt Content 生成的本地索引缓存，不是业务源数据，不需要手动维护。

`app/utils/提取md元数据.js` 用于从旧 Markdown frontmatter 中批量提取记录，属于迁移辅助脚本，不参与站点运行流程。

## 运行时数据流

项目当前采用数据胶囊作为唯一运行时内容源：

- 公开页面：首页、列表页、详情页通过服务端接口读取数据胶囊根目录 `records.json`。
- Markdown 正文、音乐、歌词、封面、动态图片和相册图片都存放在数据胶囊中，记录里保存对象地址。
- 管理页面 `/admin/data` 读取同一个 `records.json`，保存或删除时先写入浏览器待同步区，并立即更新管理页当前视图。
- 点击“同步数据胶囊”后，管理页会把待同步变更一次性写回数据胶囊，并按记录类型和 id 维护相关资源目录。
- 同步完成后，公开页面不依赖 GitHub commit 或重新部署；下一次服务端读取会直接使用数据胶囊中的最新数据。

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
| `lrcUrl` | 音乐歌词 LRC 远程地址，仅 `music` 类型使用 |
| `path` | 可选自定义页面路径；不填时由类型和 `id` 自动推导 |
| `tags` | 标签数组；没有标签时使用空数组或省略 |

`path` 不在管理页表单中直接维护，通常依赖项目按 `type` 与 `id` 自动推导；如确实手写到 `records.json`，会优先生效。

## 类型专属字段

| 类型 | 专属字段 | 说明 |
| --- | --- | --- |
| `chatter` | `mood` | 杂谈心情 |
| `moment` | `location`、`images` | 动态位置和图片列表 |
| `music` | `artist`、`error`、`lrcUrl` | 歌手、播放异常提示与远程歌词地址 |
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
| `music` | `/music` | 无；音频与歌词通过远程桶 URL 读取 |
| `friend` | `/friends` | 无 |
| `album` | `/albums/{id}` | 无 |
| `project` | `/projects` | 无 |

Markdown 文件只写正文，不写 frontmatter。标题、日期、封面、标签等元数据统一放在 `records.json`。

## 管理页面

管理页面位于 `/admin/data`，用于通过服务端接口维护项目数据。当前读取链路以数据胶囊根目录 `records.json` 为主数据源，编辑链路采用“保存草稿 + 手动批量同步数据胶囊”。

启用步骤：

1. 复制 `.env.example` 为 `.env`。
2. 设置 `ADMIN_TOKEN`。
3. 设置数据胶囊变量：`DATA_CAPSULE_ENDPOINT`、`DATA_CAPSULE_BUCKET`、`DATA_CAPSULE_ACCESS_KEY_ID`、`DATA_CAPSULE_SECRET_ACCESS_KEY`。
4. 启动 Nuxt 服务。
5. 打开 `/admin/data`。
6. 输入管理令牌后加载数据。

令牌验证通过后，浏览器会保存一个服务端签名的短期管理会话，有效期 30 分钟。真实 `ADMIN_TOKEN` 不会长期保存到浏览器；会话过期后需要重新验证。

管理页面支持：

- 查询、新增、编辑、删除全部类型记录
- 保存草稿、重置、删除和同步数据胶囊分区操作，避免误把草稿保存当作发布。
- 保存草稿时更新浏览器待同步区，切换编辑对象不会丢失已保存草稿。
- 点击“同步数据胶囊”后批量写回根目录 `records.json`。
- `post`、`chatter`、`moment`、`about` 在同步时自动上传或更新数据胶囊中的 Markdown 文件。
- 音乐音频、LRC 歌词和图片选择后上传到统一桶中的指定目录，记录中保存公开资源地址。
- 同步成功后返回最新 records 给管理页，公开页面后续请求会读取数据胶囊中的最新数据。
- 类型专属字段直接写入记录根层级
- 图片通过管理页上传到统一桶中的图片目录；封面、动态图片、相册图片保存为远程公开地址。
- 相册图片按“一行一个图片链接 + 每张图一个描述输入框”的方式维护，保存为 `photos: [{ url, caption }]`。
- 音乐文件可以来自电脑任意位置；选择后上传到指定音乐目录，草稿和待同步区记录数据胶囊公开地址。
- 歌词文件可以从本地选择；选择后上传到指定歌词目录并写入 `lrcUrl`，公开播放器运行时从该地址读取歌词。
- 上传目录可在管理页手动输入；对象存储目录本质是路径前缀，不存在时上传文件会自然生成对应前缀。
- 图片预览、音乐试听、歌词预览和待同步变更查看。

当前不适合的场景：

- 远程图床管理
- 纯静态托管环境中直接运行管理接口
- 多人同时编辑同一个 `records.json`
- 超过请求体安全限制的大量文本草稿批量同步；管理页会在同步前检查并阻止过大的请求。音乐文件本体不写入草稿请求体。

删除记录时可以选择是否同时删除关联文件。默认只删除 `records.json` 中的记录；勾选关联删除后，`post`、`chatter`、`moment`、`about` 会删除对应 Markdown。数据胶囊桶中的音乐、歌词和图片对象不会被自动删除，需要人工清理。

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
  "url": "https://s3.cstcloud.cn/music-bucket/music/song.m4a",
  "lrcUrl": "https://s3.cstcloud.cn/music-bucket/lyrics/song.lrc",
  "artist": "歌手"
}
```

音频文件和歌词文件都存放在统一桶的指定目录；公开播放器通过 `url` 播放音频，通过 `lrcUrl` 读取歌词。

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
- 如果使用 `npm run generate` 部署到纯静态平台，线上没有 Nitro 服务端接口，无法直接读取私有数据胶囊资源，也无法直接使用管理页面保存。需要使用 SSR / Node 环境提供服务端接口。
- 新增敏感配置只写入 `.env`，不要提交真实令牌。
