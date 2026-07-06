---
title: "windows安装docker（末尾附命令大全）"
date: 2026-02-25 04:12:42
category: "全栈技术栈"
tags:
- "docker"
- "容器"
---

## Windows 环境下安装 Docker 的详细教程（超详细图文）

本文将手把手教你在 Windows 系统中安装并配置 Docker 环境，零基础也能跟着完成！支持 Windows 10/11 专业版、企业版（家庭版需额外启用 WSL2）。

### 1. 前言

Docker 是一个开源的应用容器引擎，可以让开发者将应用及其依赖打包到一个可移植的镜像中，然后在任意环境中运行。
在 Windows 下安装 Docker 的方式主要是通过 Docker Desktop，它支持 WSL2 技术，大幅提高性能。

### 2. 安装前的准备

#### 2.1 检查 Windows 版本

Docker Desktop 要求：

- Windows 10（64 位）专业版 / 企业版（Build 19041 及以上）

- Windows 11（64 位）专业版 / 企业版

- 家庭版需先开启 WSL2

#### 2.2 确认虚拟化已开启

Docker 依赖虚拟化技术，需要确保 BIOS 中已启用虚拟化。
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/9b168bf7e5c949bca460a4d43161f2c5.png)

### 3. 安装 Docker Desktop

#### 3.1 下载

前往 Docker 官方下载页面：
🔗 [Docker Desktop: The #1 Containerization Tool for Developers | Docker](https://www.docker.com/products/docker-desktop/) 
选择 Windows 版本，点击 Download for Windows。
建议下载最新版，兼容性更好。
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/c54cc2e5f6e240739cf27e44d71eea96.png)

#### 3.2 安装步骤

1. 双击下载的 `Docker Desktop Installer.exe` 。

2. 勾选：

   - `Install required Windows components for WSL 2`

   - `Add shortcut to desktop`

3. 点击 `OK` 开始安装。

4. 安装完成后会提示 **重启电脑** 。

### 4. 启用 WSL2（家庭版必看）

如果你是 **Windows 10/11 家庭版** 或者第一次安装 Docker Desktop，需要启用 WSL2。

打开 Docker Desktop，会提示你“WSL need updating”。点击“Restart”，然后按任意跳出 PowerShell（管理员模式），按任意键安装（推荐）。
<mark>若没有请自行百度</mark> 

### 5. 启动 Docker Desktop（已更新WSL，直接点restart即可）

1. 双击桌面 Docker Desktop 图标。

2. 启动时可以选择跳过登录。

3. 启动成功后，右下角任务栏会出现 🐳 小鲸鱼图标。

### 6. 验证安装

1. 打开 PowerShell 或 CMD，输入：

```shell
docker --version
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/bf80bb62a56c4dbe9388a76830c82bec.png)

如果显示版本号，说明 Docker 安装成功。

1. 再运行：

```shell
docker run hello-world
```

如果出现 `Hello from Docker!` 说明 Docker 已能正常拉取和运行镜像。

### 7. 换源

```java
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.imgdb.de",
    "https://hub-mirror.c.163.com",
    "https://docker.mirrors.ustc.edu.cn"
  ]
}
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/fd22c0b4fb394c6e86fb9f0db2b4e2d5.png)

<mark>注意点击Apply进行应用并重启生效</mark> 

### 8. 安装和删除镜像（如Redis，详细Redis使用见 [Docker 安装 Redis 完整指南](https://blog.csdn.net/m1751250104/article/details/158378229?sharetype=blogdetail&sharerId=158378229&sharerefer=PC&sharesource=m1751250104&spm=1011.2480.3001.8118) ）

关于Docker镜像和容器关系的核心概念：

1. 镜像是模板，容器是实例：redis镜像就像是一个安装了Redis软件的“模板”或“只读光盘”。您下载（pull）一次这个模板，就可以用它来创建（run）任意多个独立的容器实例。

2. 容器是独立的：每个基于 redis镜像创建的容器都是相互隔离的运行时环境，拥有自己独立的文件系统、网络、进程空间。您可以在一个容器中运行Redis 7.0，在另一个容器中用同一个镜像运行Redis 6.2（通过指定标签，如 redis:6.2），它们互不干扰。

3. 无需重复下载：创建第二个、第三个Redis容器时，只要使用的是同一个镜像（比如都是 redis:latest），Docker会直接复用已存在于本地的镜像层，而不会重新下载整个镜像。

打开docker客户端中的终端，查看已有组件

```java
docker images
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/23f0e61643054a2995eb6cbcafa566c4.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/cc511c40154a4b6eb580d37a35a0e4f6.png)

上图IMAGE：包含镜像名称和版本

##### 8.1 安装镜像

<mark>安装命令：</mark> 

```java
docker pull redis
```

安装后再次查看安装的组件
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/0b1eae6fd879494b9b40c3b0168027cf.png)

redis:latest：latest表示最新稳定版。拉取时未指定标签（如仅 docker pull redis，也可以指定如docker pull redis:4.0），Docker默认使用 latest标签。
其中，latest是一个标签，不是固定的版本号。它像一个“浮动指针”，始终指向被维护者标记为最新的那个版本。
执行以下命令，它会基于 redis:latest镜像启动一个临时容器，执行 redis-server --version命令后立即停止并删除容器。

```bash
docker run --rm redis redis-server --version
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/d9c155ff1ca14418ad0a68ef64658806.png)

如果已经有一个正在运行的Redis容器，可以进入容器内部查看。

```bash
docker exec -it <容器名称或ID> /bin/bash
```

```bash
redis-server --version
```

##### 8.2 删除镜像

删除命令：

```bash
docker rmi <镜像名称:标签 或 镜像ID>
```

<mark>如果镜像有容器依赖，会删除失败</mark> 

### 9.创建、启动和删除容器

##### 9.1创造和启动容器

要基于下载的 redis镜像创建并运行一个容器，需要使用 docker run命令。这是最常用的 <mark>创建和启动</mark> 容器的命令。
基本命令：

```bash
docker run [OPTIONS] IMAGE[:TAG|@DIGEST] [COMMAND] [ARG...]
```

如：

```bash
docker run --name some-redis -d redis
```

–name myredis：为新创建的容器指定一个名称（这里是myredis），方便后续管理。
-d：代表“detached”，让容器在后台运行。
redis：指定基于哪个镜像来创建容器。Docker会先查找本地的redis镜像，如果找不到则会自动去Docker Hub拉取。
**关键点** ：通过 `IMAGE[:TAG]` 格式指定镜像及版本，例如 `redis:7.2` 。若不指定 `:TAG` ，则默认使用 `latest` 标签。

##### 9.2 删除容器

停止正在运行的容器（如果容器已停止，可跳过此步）：

```bash
docker stop <容器名称或ID>
```

删除容器：

```bash
docker rm <容器名称或ID>
```

强制删除正在运行的容器：

```bash
docker rm -f <容器名称或ID>
```

## docker参数表

以下是按功能分类的核心参数表格：

### 容器生命周期管理

| 命令 | 主要参数/选项 | 说明 |
|:---|:---|:---|
| `docker run` | `-d` , `-it` , `--name` , `-p` , `-v` , `--rm` , `-e` , `--network` | 创建并启动一个新容器。 |
| `docker create` | 同 `docker run` 大部分参数 | 创建一个容器但不立即启动。 |
| `docker start` | `-a` , `-i` | 启动一个或多个已停止的容器。 |
| `docker stop` | `-t` | 停止一个或多个运行中的容器。 |
| `docker restart` | `-t` | 重启一个或多个容器。 |
| `docker pause` | 无 | 暂停一个或多个容器的所有进程。 |
| `docker unpause` | 无 | 恢复一个或多个容器的所有进程。 |
| `docker kill` | `-s` | 强制杀死一个或多个运行中的容器。 |
| `docker rm` | `-f` , `-v` | 删除一个或多个容器。 |
| `docker exec` | `-it` , `-d` , `-e` , `-u` , `-w` | 在正在运行的容器中执行命令。 |
| `docker wait` | 无 | 阻塞直到一个或多个容器停止，然后打印退出代码。 |
| `docker update` | `--memory` , `--cpus` | 更新一个或多个容器的配置。 |

### 容器查询与管理

| 命令 | 主要参数/选项 | 说明 |
|:---|:---|:---|
| `docker ps` | `-a` , `-q` , `-f` , `--format` , `-l` , `-n` , `-s` | 列出容器。 |
| `docker logs` | `-f` , `--tail` , `-t` , `--since` | 获取容器的日志。 |
| `docker inspect` | `--format` , `-f` | 获取容器/镜像的底层详细信息（JSON格式）。 |
| `docker top` | 无 | 显示一个容器中正在运行的进程。 |
| `docker stats` | `-a` , `--no-stream` | 动态显示容器资源使用统计。 |
| `docker diff` | 无 | 检查容器文件系统相对于其镜像的更改。 |
| `docker port` | 无 | 列出容器的端口映射。 |
| `docker rename` | 无 | 重命名一个容器。 |
| `docker commit` | `-a` , `-m` , `-p` | 从容器创建一个新镜像。 |
| `docker attach` | `--sig-proxy` | 附加本地标准输入、输出和错误流到运行中的容器。 |

### 镜像管理

| 命令 | 主要参数/选项 | 说明 |
|:---|:---|:---|
| `docker images` | `-a` , `-q` , `--digests` , `--no-trunc` | 列出镜像。 |
| `docker pull` | `-a` , `--platform` | 从仓库拉取镜像或仓库。 |
| `docker push` | 无 | 将镜像推送到仓库。 |
| `docker rmi` | `-f` | 删除一个或多个镜像。 |
| `docker tag` | 无 | 为镜像创建一个新的标签（引用）。 |
| `docker build` | `-t` , `-f` , `--build-arg` , `--no-cache` | 根据 Dockerfile 构建镜像。 |
| `docker history` | `-H` , `--no-trunc` , `-q` | 显示镜像的历史记录。 |
| `docker save` | `-o` | 将一个或多个镜像保存为 tar 归档文件。 |
| `docker load` | `-i` , `-q` | 从 tar 归档文件或标准输入加载镜像。 |
| `docker image prune` | `-a` , `-f` | 删除未被使用的镜像（悬空镜像）。 |

### 网络管理

| 命令 | 主要参数/选项 | 说明 |
|:---|:---|:---|
| `docker network ls` | 无 | 列出所有网络。 |
| `docker network create` | `-d` , `--subnet` , `--gateway` , `-o` | 创建一个网络。 |
| `docker network connect` | `--alias` , `-ip` | 将容器连接到网络。 |
| `docker network disconnect` | `-f` | 断开容器与网络的连接。 |
| `docker network inspect` | 无 | 显示一个或多个网络的详细信息。 |
| `docker network prune` | `-f` | 删除所有未被使用的网络。 |
| `docker network rm` | 无 | 删除一个或多个网络。 |

### 数据卷管理

| 命令 | 主要参数/选项 | 说明 |
|:---|:---|:---|
| `docker volume ls` | `-q` , `-f` | 列出卷。 |
| `docker volume create` | `-d` , `-o` | 创建一个卷。 |
| `docker volume inspect` | 无 | 显示一个或多个卷的详细信息。 |
| `docker volume prune` | `-f` | 删除所有未被使用的本地卷。 |
| `docker volume rm` | `-f` | 删除一个或多个卷。 |

### Docker Compose (CLI插件)

| 命令 | 主要参数/选项 | 说明 |
|:---|:---|:---|
| `docker compose up` | `-d` , `--build` , `-f` , `--force-recreate` | 创建并启动所有服务容器。 |
| `docker compose down` | `-v` , `--rmi` | 停止并移除容器、网络、卷和镜像。 |
| `docker compose ps` | `-a` | 列出项目中的所有容器。 |
| `docker compose logs` | `-f` , `-t` , `--tail` | 查看项目中的容器日志。 |
| `docker compose exec` | 无 | 在运行的服务容器中执行命令。 |
| `docker compose build` | `--no-cache` | 构建或重新构建服务镜像。 |
| `docker compose pull` | 无 | 拉取服务依赖的镜像。 |
| `docker compose restart` | 无 | 重启项目中的所有服务。 |
| `docker compose stop` | 无 | 停止运行中的容器，但不移除它们。 |
| `docker compose config` | 无 | 验证并查看 Compose 文件。 |

### 系统与信息

| 命令 | 主要参数/选项 | 说明 |
|:---|:---|:---|
| `docker version` | `-f` | 显示 Docker 版本信息。 |
| `docker info` | `-f` | 显示系统范围的 Docker 信息。 |
| `docker system df` | `-v` | 显示 Docker 磁盘使用情况。 |
| `docker system prune` | `-a` , `--volumes` , `-f` | 删除所有未被使用的数据（镜像、容器、网络、构建缓存）。 |
| `docker events` | `--filter` , `--since` , `--until` | 从服务器获取实时事件。 |
| `docker login` | `-u` , `-p` | 登录到 Docker 仓库。 |
| `docker logout` | 无 | 从 Docker 仓库登出。 |

### 常用参数速记

- `-a, --all` : 显示所有项（包括未运行的）。

- `-d, --detach` : 在后台运行容器，并打印容器ID。

- `-f, --filter` : 根据条件过滤输出。

- `-i, --interactive` : 保持 STDIN 打开，即使没有连接。

- `-it` : `-i` 和 `-t` 的组合，用于交互式会话。

- `-p, --publish` : 将容器的端口发布到主机（格式： `主机端口:容器端口` ）。

- `-q, --quiet` : 只显示 ID。

- `--rm` : 容器退出时自动移除。

- `-t, --tty` : 分配一个伪终端。

- `-v, --volume` : 绑定挂载一个卷（格式： `主机目录:容器目录[:ro]` ）。

- `-e, --env` : 设置环境变量。

- `--name` : 为容器分配一个名称。

- `-w, --workdir` : 容器内的工作目录。
  说明：

1. 此表格列出了最常用的命令和参数，并非所有参数的完整列表。
   您可以使用 docker COMMAND --help查看任何命令的完整参数列表和详细说明（例如：docker run --help）。

2. Docker Compose 是作为一个 CLI 插件存在的，命令为 docker compose(V2)。旧版的 docker-compose是一个独立的二进制文件。

附上docker run参数解释表格：

| 类别 | 参数 | 说明 | 示例 |
|:---|:---|:---|:---|
| **容器标识与信息** | `--name <名称>` | 为容器指定一个自定义名称，便于后续管理、查看日志或连接。若不指定，Docker 将分配一个随机名称。 | `docker run --name my_web redis` |
|   | `-h <主机名>` | 设置容器内的主机名，会体现在容器的 `/etc/hostname` 和 `/etc/hosts` 中。 | `docker run -h mycontainer redis` |
| **运行模式与交互** | `-d` | 在 **后台（守护进程）模式** 运行容器，并返回容器ID。这是运行服务类容器（如 Web 服务器、数据库）的常用模式。 | `docker run -d redis` |
|   | `-it` | 组合参数，用于启动一个 **交互式容器** 。 `-i` 保持标准输入打开， `-t` 分配一个伪终端。通常与 `/bin/bash` 或 `sh` 连用。 | `docker run -it ubuntu /bin/bash` |
|   | `--rm` | 容器 **退出时自动删除其文件系统** 。非常适合运行一次性任务或测试，避免产生大量停止状态的容器。 | `docker run --rm alpine echo “hello”` |
| **生命周期管理** | `--restart <策略>` | 定义容器的 **自动重启策略** ，增强服务可靠性。<br/>`no` (默认)：不自动重启。<br/>`on-failure[:max-retries]` ：非正常退出时重启，可指定最大重试次数。<br/>`always` ：总是重启（无限次）。<br/>`unless-stopped` ：总是重启，除非用户明确执行 `docker stop` 。 | `docker run -d --restart=always redis` |
| **网络配置** | `-p [<主机IP>:]<主机端口>:<容器端口>` | **端口映射** ，将容器内部的端口绑定到宿主机的指定端口上，使外部能够访问容器服务。 | `docker run -p 8080:80 redis` <br/>`docker run -p 127.0.0.1:6379:6379 redis` |
|   | `--network <网络>` | 指定容器加入的 **网络** 。<br/>`bridge` ：默认的桥接网络。<br/>`host` ：使用宿主机的网络命名空间，网络性能最佳，但端口隔离失效。<br/>`none` ：禁用所有网络。<br/>`<自定义网络名>` ：加入用户自定义的 overlay 或 bridge 网络，便于服务发现。 | `docker run --network myapp_network app` |
| **存储与数据持久化** | `-v <宿主机路径>:<容器路径>[:<选项>]` | **挂载数据卷（Volume）或目录** ，用于数据持久化、配置文件注入或共享数据。选项常用 `ro` （只读）。 | `docker run -v /宿主机/data:/容器/data redis` <br/>`docker run -v ./config.conf:/app/config.conf:ro app` |
|   | `--mount type=...,source=...,target=...` | 功能更明确、选项更丰富的挂载方式（语法更冗长），推荐用于生产环境。 | `docker run --mount type=bind,source=$(pwd)/html,target=/usr/share/redis/html redis` |
| **环境配置** | `-e <变量名>=<值>` | **设置容器内的环境变量** ，是向容器传递配置（如数据库密码、运行模式）的标准化方式。可多次使用。 | `docker run -e MYSQL_ROOT_PASSWORD=123456 -e TZ=Asia/Shanghai mysql` |
|   | `--env-file <文件路径>` | 从文件中读取环境变量并设置到容器中。文件每行格式为 `变量名=值` 。 | `docker run --env-file .env app` |
| **资源限制** | `-m <内存值>` <br/>`--memory=<内存值>` | 限制容器可使用的 **最大内存** 。单位可以是 `b` , `k` , `m` , `g` 。 | `docker run -m 512m --memory-swap=1g redis` |
|   | `--cpus=<数量>` | 限制容器可使用的 **CPU 资源** 。数量可以是小数，如 `1.5` 表示 1.5 个 CPU 核心的计算能力。 | `docker run --cpus=2 redis` |
|   | `--cpu-shares=<权重>` | 设置 CPU 份额的相对权重（默认 1024）。当主机 CPU 资源紧张时，权重高的容器会获得更多 CPU 时间。 | `docker run --cpu-shares=2048 app` |
| **镜像与命令覆盖** | `IMAGE[:TAG]` | **指定基础镜像及其版本** ，是命令的核心部分。 `TAG` 缺省时为 `latest` 。 | `docker run node:18-alpine` <br/>`docker run redis:7.2` |
|   | `[COMMAND] [ARG...]` | 覆盖镜像定义中默认的启动命令（即 `Dockerfile` 中的 `CMD` 指令）。 | `docker run -it ubuntu cat /etc/os-release` <br/>`docker run redis redis-server --appendonly yes` |