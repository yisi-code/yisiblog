# 数据新增与维护指南

## 数据源

当前项目以 GitHub 仓库中的 `public/content-data` 作为公开页面的唯一内容源。

- 统一记录文件：`public/content-data/records.json`
- Markdown：`public/content-data/posts`、`chatter`、`moments`、`about`
- 音乐与歌词：`public/content-data/music`
- 图片：只保存外部链接，不上传到项目仓库

管理页使用数据胶囊作为草稿暂存和上传中转，不作为公开页面运行时数据源。

## 运行时读取

- 首页和列表页只读取 `records.json`。
- 详情页按 `contentUrl` 读取 Markdown 并渲染。
- 音乐组件客户端加载播放器，音乐列表数据仍来自 `records.json`。
- 静态资源路径统一使用 `/content-data/...`。

## records.json

每条记录使用统一基础字段：

```json
{
  "id": "new-post",
  "type": "post",
  "title": "标题",
  "description": "摘要或说明",
  "date": "2026-07-01 10:30:00",
  "cover": "https://example.com/cover.jpg",
  "contentUrl": "/content-data/posts/new-post.md",
  "tags": ["记录"]
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `id` | 同类型唯一标识，也是默认文件名和路由参数 |
| `type` | `post`、`chatter`、`moment`、`music`、`friend`、`album`、`project`、`about` |
| `title` | 标题，部分类型可为空 |
| `description` | 摘要或说明 |
| `date` | 日期字符串，建议 `YYYY-MM-DD` 或 `YYYY-MM-DD HH:mm:ss` |
| `cover` | 封面图片链接 |
| `contentUrl` | Markdown 静态路径，仅正文类型使用 |
| `url` | 外链或音乐文件路径 |
| `lrcUrl` | 音乐歌词路径 |
| `tags` | 标签数组 |

项目不再维护音乐 `error` 字段。播放错误由播放器根据实际异常显示。

## 类型字段

| 类型 | 字段 |
| --- | --- |
| `post` | `title`、`description`、`date`、`cover`、`tags`、`contentUrl` |
| `chatter` | `title`、`description`、`date`、`cover`、`tags`、`mood`、`contentUrl` |
| `moment` | `date`、`location`、`images`、`description`、`contentUrl` |
| `music` | `title`、`description`、`cover`、`url`、`artist`、`lrcUrl` |
| `friend` | `title`、`description`、`cover`、`url` |
| `album` | `title`、`description`、`date`、`cover`、`tags`、`photos` |
| `project` | `title`、`description`、`cover`、`url`、`tags`、`icon` |
| `about` | 固定 `id: "about"`，使用 `contentUrl` |

`post` 和 `chatter` 的 `description` 支持手动编辑。如果保存时为空，会取 Markdown 第一段生成摘要。`moment` 不在表单中手动编辑 `description`，同步时总是按正文第一段生成。

## 文件路径

| 类型 | 页面路径 | 静态文件 |
| --- | --- | --- |
| `post` | `/posts/{id}` | `/content-data/posts/{id}.md` |
| `chatter` | `/chatter/{id}` | `/content-data/chatter/{id}.md` |
| `moment` | `/moments` | `/content-data/moments/{id}.md` |
| `about` | `/about` | `/content-data/about/about.md` |
| `music` | `/music` | `/content-data/music/{id}.{ext}`、`/content-data/music/{id}.lrc` |

文件夹中只有一个文件时不再为该记录单独创建子目录。

## 管理页流程

管理页地址：`/admin/data`。

1. 使用 `ADMIN_TOKEN` 登录。
2. 页面读取当前部署中的 `public/content-data/records.json` 和必要内容文件。
3. 编辑后点击保存，变化进入待同步区。
4. 点击“保存云端草稿”，将本地草稿和待同步数据保存到数据胶囊。
5. 音乐和歌词选择后先上传到数据胶囊，作为 GitHub 同步时的源文件。
6. 点击“同步 GitHub”，服务端把待同步数据写入 `GITHUB_DATA_BASE_PATH`。
7. 同步成功后清空数据胶囊云端草稿。

未修改的数据不会进入待同步区。

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
  "tags": ["记录"],
  "contentUrl": "/content-data/posts/new-post.md"
}
```

### 杂谈

```json
{
  "id": "daily-note",
  "type": "chatter",
  "title": "一点杂谈",
  "description": "杂谈摘要",
  "date": "2026-07-01",
  "cover": "https://example.com/cover.jpg",
  "tags": ["生活"],
  "mood": "平静",
  "contentUrl": "/content-data/chatter/daily-note.md"
}
```

### 动态

```json
{
  "id": "moment-20260701103000",
  "type": "moment",
  "date": "2026-07-01 10:30:00",
  "description": "正文第一段自动生成的摘要",
  "location": "南昌",
  "images": ["https://example.com/photo.jpg"],
  "contentUrl": "/content-data/moments/moment-20260701103000.md"
}
```

### 音乐

```json
{
  "id": "song-id",
  "type": "music",
  "title": "歌曲名",
  "description": "专辑或说明",
  "cover": "https://example.com/cover.jpg",
  "url": "/content-data/music/song-id.m4a",
  "lrcUrl": "/content-data/music/song-id.lrc",
  "artist": "歌手"
}
```

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

## 注意事项

- `records.json` 必须是合法 JSON。
- Markdown 只写正文，不写 frontmatter。
- GitHub 同步需要配置 `GITHUB_DATA_OWNER`、`GITHUB_DATA_REPO`、`GITHUB_DATA_BRANCH`、`GITHUB_DATA_TOKEN`。
- 数据胶囊变量仍用于云端草稿和上传中转。
- 同步 GitHub 后，线上站点需要重新部署才能读取新的静态内容。
