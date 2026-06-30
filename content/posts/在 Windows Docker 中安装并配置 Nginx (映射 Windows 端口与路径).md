---
title: "在 Windows Docker 中安装并配置 Nginx (映射 Windows 端口与路径)"
date: 2026-02-25 05:49:54
category: "全栈技术栈"
tags:
- "windows"
- "docker"
- "nginx"
---

## 在 Windows Docker 中安装并配置 Nginx (映射 Windows 端口与路径)

本指南将详细介绍如何在 Windows 系统的 Docker 环境中运行 Nginx 容器，并将 Windows 本地路径和端口映射到容器内。

### 步骤概览

1. **确保 Docker 运行** ：确认 Docker Desktop for Windows 已启动并运行在 Linux 容器模式。

2. **准备目录结构** ：在 Windows 上创建或确认项目目录和配置文件存在。

3. **拉取 Nginx 镜像** ：从 Docker Hub 获取官方 Nginx 镜像。

4. **运行 Nginx 容器** ：使用 `docker run` 命令，正确映射端口、配置文件和日志等路径。

5. **验证与访问** ：测试 Nginx 服务是否正常运行。

### 详细操作步骤

#### 1. 准备本地目录与配置文件

根据您提供的配置，项目结构假设如下：
项目
├── niginx配置日志
│ ├── nginx.conf # 配置文件
│ └── nginx_logs\ # 日志目录 (error.log, access.log, nginx.pid 将生成于此)
└── (其他项目文件)
`nginx.conf` 配置文件中的关键路径使用 Windows 风格（ `如D:/项目/...` ），这 **在容器内是无效的** 。通过 Docker 的卷挂载（ `-v` 参数）将 Windows 的真实目录映射为容器内的路径，使配置生效。

#### 2. 拉取 Nginx 镜像

打开 PowerShell 或命令提示符，执行以下命令拉取最新的官方 Nginx 镜像：

```bash
docker pull nginx:latest
```

查看nginx版本

```bash
docker run --rm nginx nginx -v
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/7532867d72ec4fe1ae8cd59accdf6410.png)

#### 3. 运行 Nginx 容器 (核心步骤)

执行以下 `docker run` 命令来启动容器。此命令完成了以下关键映射：

- **端口映射** ：将容器内的 `80` 端口映射到 Windows 主机的 `8080` 端口。

- **配置文件映射** ：将本地的 `nginx.conf` 文件覆盖容器内的默认配置。

- **日志目录映射** ：将本地的日志目录挂载到容器内，使日志文件持久化保存在 Windows 上。

- **网站资源目录映射** ：挂载“动漫库”目录，使其可通过 Nginx 访问。

- **MIME 类型文件** ：挂载容器内默认的 `mime.types` 文件，确保配置中的 `include mime.types;` 指令有效。

```bash
docker run -d `
--name my-nginx `
-p 8080:80 `
-v D:\项目\HanHan\niginx配置日志\nginx.conf:/etc/nginx/nginx.conf:ro `
-v D:\项目\HanHan\niginx配置日志\nginx_logs:/var/log/nginx `
-v D:\动漫库:/usr/share/nginx/html/动漫库 `
-v /etc/nginx/mime.types:/etc/nginx/mime.types:ro `
nginx
```

**命令参数解释：** 

- `-d` ：后台运行容器。

- `--name my-nginx` ：为容器指定一个名称（例如 `my-nginx` ），便于管理。

- `-p 8080:80` ：端口映射，格式为 `主机端口:容器端口` 。访问 `http://localhost:8080` 即访问容器 Nginx 的 80 端口。

- `-v ...:ro` ： `ro` 表示“只读”（read-only），防止容器修改宿主机的配置文件或关键系统文件。

- `-v D:\动漫库:/usr/share/nginx/html/动漫库` ：将 Windows 动漫库映射到容器内 Nginx 的默认网页根目录下的 `动漫库` 子目录。

- **重要提示** ： `nginx.conf` 中 `proxy_pass` 指向了 `http://:8080` 或 `http://` 。在容器内， `localhost` 或 `指的是容器自身，而非宿主机(Windows)。若后端服务运行在**宿主机Windows**上，应使用宿主机的特殊DNS名称 `host.docker.internal` 替代` 。例如：

```bash
location /api {
proxy_pass http://host.docker.internal:8080;
# ... 其他 proxy_set_header 指令
}
```

#### 4. 验证服务

1. **检查容器状态** ：

```bash
docker ps
应能看到名为 `my-nginx` 的容器处于 `Up` 状态。
```

1. **查看容器日志** ：

```bash
docker logs my-nginx
```

检查是否有启动错误。特别是检查配置文件语法。

1. **访问测试** ：

- 打开浏览器，访问 `http://localhost:8080` 。

- 访问 `http://localhost:8080/动漫库/` 来测试静态资源服务。

- 根据配置访问相应的 API 路径（如 `/api` ）。

#### 5. 常用管理命令

- **停止容器** ：

```bash
docker stop my-nginx
```

- **启动已停止的容器** ：

```bash
docker start my-nginx
```

- **重启容器** ：

```bash
docker restart my-nginx
```

- **进入容器终端** （用于调试）：

```bash
docker exec -it my-nginx /bin/bash
```

- **删除容器** （如需重新配置）：

```bash
docker rm -f my-nginx
```

### 注意事项

1. **路径大小写与空格** ：Windows 路径包含空格（ `项目` ），在 PowerShell 中使用反引号 ``` 续行是有效的。在普通 CMD 中，请移除反引号并将命令写在一行，或用 `^` 续行。

2. **防火墙** ：确保 Windows 防火墙允许对 `8080` 端口的入站连接（如果需要在局域网内访问）。

3. **配置热重载** ：修改本地的 `nginx.conf` 后，需在容器内执行 `nginx -s reload` 使配置生效，或直接重启容器。

```bash
docker exec my-nginx nginx -s reload
```

1. **后端服务访问** ：再次强调，容器内访问宿主机服务，请使用 `host.docker.internal` 这个主机名。

通过以上步骤，您即可在 Windows Docker 中成功运行一个使用自定义配置、且所有重要数据都持久化在 Windows 宿主机的 Nginx 服务。