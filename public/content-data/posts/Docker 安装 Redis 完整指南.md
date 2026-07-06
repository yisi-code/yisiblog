---
title: "Docker 安装 Redis 完整指南"
date: 2026-02-26 22:43:26
category: "全栈技术栈"
tags:
- "docker"
- "redis"
- "容器"
---

## Docker 安装 Redis 完整指南

### 一、快速开始

#### 1.1 基础安装

```bash
拉取 Redis 镜像
docker pull redis:latest
最简单运行方式
docker run -d --name redis-test -p 6379:6379 redis
```

#### 1.2 带密码安装

```bash
docker run -d \
--name redis-with-auth \
-p 6379:6379 \
redis redis-server --requirepass yourpassword123
```

### 二、数据持久化详解

#### 2.1 Docker 数据存储原理

#####  **存储位置对比** 

| 存储方式 | 数据位置 | 容器删除后 | 性能 | 适用场景 |
|:---:|:---:|:---:|:---:|:---:|
| **容器内存储** | 容器文件系统 | ❌ 数据丢失 | 高 | 临时测试 |
| **Bind Mount** | 宿主机目录 | ✅ 数据保留 | 中 | 开发环境 |
| **Docker Volume** | Docker管理卷 | ✅ 数据保留 | 高 | 生产环境 |

#####  **Windows/WSL2 架构说明** 

Windows 系统
├── Docker Desktop
│ ├── WSL2 (Linux 内核)
│ │ └── Docker 守护进程
│ └── Hyper-V 虚拟机

#### 2.2 Windows/WSL2 存储路径映射

#####  **三种挂载方式的实际路径** 

| 挂载方式 | Windows 路径 | WSL2 内部路径 | Docker 容器路径 |
|:---:|:---:|:---:|:---:|
| **Bind Mount (Windows)** | `C:\docker\redis\data` | `/mnt/c/docker/redis/data` | `/data` |
| **Bind Mount (WSL2)** | 不直接可见 | `/home/user/redis/data` | `/data` |
| **Docker Volume** | 不直接可见 | `/var/lib/docker/volumes/redis_data/_data` | `/data` |

#### 2.3 数据持久化配置示例

#####  **示例 1：Bind Mount (Windows目录)** 

Windows PowerShell（命令行CMD中）：

```bash
mkdir C:\docker\redis\data
mkdir C:\docker\redis\conf
docker run -d `
--name redis-bind-win `
-p 6379:6379 `
-v C:\docker\redis\conf:/usr/local/etc/redis `
-v C:\docker\redis\data:/data `
redis redis-server /usr/local/etc/redis/redis.conf
```

#####  **示例 2：Bind Mount (WSL2目录)** 

WSL2 终端：

```bash
mkdir -p ~/docker/redis/{data,conf,logs}
docker run -d \
--name redis-bind-wsl \
-p 6379:6379 \
-v ~/docker/redis/conf:/usr/local/etc/redis \
-v ~/docker/redis/data:/data \
-v ~/docker/redis/logs:/var/log/redis \
redis redis-server /usr/local/etc/redis/redis.conf
```

#####  **示例 3：Docker Volume** 

```bash
创建 Docker 卷
docker volume create redis_data
docker volume create redis_conf
docker volume create redis_logs
使用卷运行容器
docker run -d \
--name redis-volume \
-p 6379:6379 \
-v redis_conf:/usr/local/etc/redis \
-v redis_data:/data \
-v redis_logs:/var/log/redis \
redis redis-server /usr/local/etc/redis/redis.conf
查看卷实际位置
docker volume inspect redis_data | grep Mountpoint
输出示例: /var/lib/docker/volumes/redis_data/_data
```

### 三、配置文件管理

#### 3.1 Redis 配置文件示例

创建 `redis.conf` ：

```bash
# 基础配置
bind 0.0.0.0
port 6379
requirepass yourpassword123
# 数据持久化
save 900 1
save 300 10
save 60 10000
dir /data
dbfilename dump.rdb
# AOF 持久化（可选）
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
# 日志配置
loglevel notice
logfile "/var/log/redis/redis-server.log"
# 内存管理
maxmemory 1gb
maxmemory-policy allkeys-lru
```

#### 3.2 Docker Compose 配置

##### Docker Compose 是什么？

Docker Compose 是 Docker 官方提供的一个用于定义和运行多容器 Docker 应用程序的工具。它通过一个单独的配置文件（docker-compose.yml）来管理一组相关联的、作为完整服务堆栈的应用容器。
核心作用与优势：

1. 简化多容器管理：在开发和测试环境中，一个应用通常由多个服务组成（例如：一个 Web 应用需要 Web 服务器、应用服务器和数据库）。Docker Compose 允许您用一个命令（docker-compose up）来启动所有这些服务。

2. 声明式配置：所有服务的配置（包括镜像、端口映射、数据卷、环境变量、依赖关系等）都定义在一个清晰的 YAML 文件中，便于版本控制和共享。

3. 一键式操作：提供了一系列简化的命令来管理整个应用的生命周期，包括启动、停止、重建服务和查看日志等。

##### Docker Compose 的核心是一个名为 docker-compose.yml的 YAML 格式配置文件。其基本结构如下：

```bash
# 1. 文件版本 (可选但推荐指定)：文件通常以版本声明开头。
# 目前常用的版本是 3.x，它提供了最广泛的功能集。
# 注意：新版本的 Docker Compose（V2 及以上）
# 逐渐淡化了对 version键的强制要求，但为兼容性，通常仍会指定。
version: '3.8'
# 2. 服务定义
# services部分是文件的核心，用于定义构成应用程序的各个容器（服务）。
services:
	redis:
		image: redis:7.2-alpine
		container_name: redis-server
		restart: unless-stopped
		ports:
		# 端口映射必须是列表格式
			- "6379:6379"
		volumes:
			# 挂载映射必须是列表格式
    		# 方式1: 绑定挂载 (Bind Mount)，用于宿主机文件/目录挂载
    		# 注意: 冒号前后不能有空格
    		# 配置文件挂载，ro表示容器内只读
    		- ./conf/redis.conf:/usr/local/etc/redis/redis.conf:ro
    		 # 将日志目录挂载出来
    		- ./logs:/var/log/redis
    		- ./data:/data
			# 方式2: Docker Volume (命名卷方式，生产推荐)
			# 注意：冒号前后不能有空格，且前缀无./
			# - redis_data:/data
			# - redis_conf:/usr/local/etc/redis
			# - redis_logs:/var/log/redis
		# 启动命令：指定使用我们挂载的配置文件
		command: redis-server /usr/local/etc/redis/redis.conf
		environment:
			- TZ=Asia/Shanghai
		healthcheck:
			test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
			interval: 30s
			timeout: 10s
			retries: 3
			start_period: 20s
		# 注意：这里增加web只作为示范
		# redis通常不依赖web服务启动
		depends_on:
			- web
		networks:
			- app_network

  web:
    image: nginx:alpine
    container_name: web-server # 可选，为web服务也指定一个名称
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    # 使用自定义网络app_network
    networks:
      - app_network

# 3. 顶级 volumes 键：在此处声明在 services 部分使用的命名数据卷
# 服务中直接使用宿主机路径的绑定挂载
#（如 ./conf/redis.conf）则无需在顶级声明。
volumes:
  redis_data:
    # 这里可以配置驱动选项，默认是local，生产环境可以考虑使用外部驱动
    # driver: local
  redis_conf:
  redis_logs:

# 4. 网络定义 (顶级 networks键，可选)
# 用于自定义容器网络，默认情况下,
# Compose 会为应用栈创建一个专用网络，所有服务
# 都加入其中。也可以自定义。
networks:
	# 在此处声明自定义网络app_network
  app_network:
    driver: bridge
    # 可以配置子网、网关等（可选）
    # ipam:
    #   config:
    #     - subnet: "172.28.0.0/16"
```

- web, db：这是您为每个服务定义的自定义名称。

- image：指定该服务所使用的 Docker 镜像。

- ports：定义宿主机与容器之间的端口映射。

- volumes：定义数据卷或目录挂载，用于数据持久化或配置注入。

- environment：设置容器内的环境变量。

- depends_on：声明服务之间的依赖关系（例如，web服务依赖于 db服务启动）。仅控制启动顺序（先启动依赖的服务），不等待服务“就绪”。如果需要等待服务健康，需结合健康检查 (healthcheck) 和脚本（如 wait-for-it.sh）实现。

- networks：显式定义网络可以实现更好的服务隔离和网络策略控制。默认情况下，Compose 项目中的所有服务会加入一个默认网络，相互可通过服务名直接通信。

project/
├── docker-compose.yml
├── conf/
│   └── redis.conf
├── logs/
├── data/
└── html/
└── index.html

常用 Docker Compose 命令：

1. 启动所有服务（后台运行）：
   docker-compose up -d

2. 停止并移除所有容器、网络，保留数据卷）：
   docker-compose down

3. 查看运行状态：
   docker-compose ps

4. 查看服务日志：
   docker-compose logs [服务名]

5. 重建并启动服务：
   docker-compose up --build -d

6. 在运行中的服务上执行命令：
   docker-compose exec [服务名] [命令]
   (例如：docker-compose exec db psql -U postgres)

7. 停止并清理（包括数据卷）（警告：这会删除所有数据！）：
   docker-compose down -v

**小结:** Docker Compose 通过一个结构化的 docker-compose.yml文件，将多容器的定义、配置和依赖关系代码化，极大地简化了复杂 Docker 应用栈的部署和管理工作流。

### 四、数据管理操作

#### 4.1 访问数据文件

```bash
1. 容器内查看数据
docker exec redis-server ls -la /data/
输出: dump.rdb appendonly.aof
2. 宿主机查看数据 (Bind Mount 方式)
Windows: 资源管理器打开 C:\docker\redis\data\
WSL2: ls -la ~/docker/redis/data/
3. Docker Volume 方式查看
先找到卷位置
docker volume inspect redis_data
然后进入 WSL2 查看
wsl
sudo ls -la /var/lib/docker/volumes/redis_data/_data/
```

#### 4.2 数据备份与恢复

```bash
1. 手动备份
触发 RDB 快照
docker exec redis-server redis-cli -a yourpassword123 SAVE
备份文件
Bind Mount: 文件已在宿主机
Volume: 复制到宿主机↓
docker cp redis-server:/data/dump.rdb ./redis-backup/
2. 数据恢复
docker stop redis-server
替换数据文件
Bind Mount: 直接覆盖宿主机文件
Volume: 复制回容器↓
docker cp ./redis-backup/dump.rdb redis-server:/data/
启动容器
docker start redis-server
```

#### 4.3 日志管理

```bash
1. 查看实时日志
docker logs -f redis-server
2. 查看日志文件
Bind Mount: 直接查看宿主机文件
Windows: type C:\docker\redis\logs\redis-server.log
WSL2: tail -f ~/docker/redis/logs/redis-server.log
Volume: 从容器查看↓
docker exec redis-server tail -f /var/log/redis/redis-server.log
```

### 五、性能优化配置

#### 5.1 存储方案选择指南

| 场景 | 推荐方案 | 理由 | 性能影响 |
|:---:|:---:|:---:|:---:|
| 开发测试 | Bind Mount (Windows) | 便于文件操作 | ⭐⭐⭐ (较慢) |
| 本地开发 | Bind Mount (WSL2) | 性能较好，易访问 | ⭐⭐⭐⭐ (良好) |
| 生产环境 | Docker Volume | Docker 管理，性能优 | ⭐⭐⭐⭐⭐ (最佳) |
| 高性能需求 | WSL2目录 + 性能调优 | 极致性能 | ⭐⭐⭐⭐⭐+ |

#### 5.2 WSL2 性能优化

```bash
1. 优化 WSL2 配置 (~/.wslconfig)
[wsl2]
memory=4GB # 限制内存使用
processors=4 # 限制 CPU 核心数
localhostForwarding=true
2. 避免使用 /mnt/c/ 目录（性能较差）
使用 WSL2 的 Linux 原生目录：~/docker/ 而不是 /mnt/c/Users/...
3. 定期清理 WSL2 磁盘
Windows PowerShell (管理员)
wsl --shutdown
optimize-vhd -Path "C:\Users\YourName\AppData\Local\Packages...\ext4.vhdx" -Mode full
```

#### 5.3 Redis 性能优化配置

```bash
redis.conf 性能优化部分
关闭 RDB，仅使用 AOF
save ""
AOF 配置优化
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-use-rdb-preamble yes
内存优化
maxmemory 2gb
maxmemory-policy allkeys-lru
maxmemory-samples 5
网络优化
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

### 六、故障排查

#### 6.1 常见问题解决

#####  **问题 1: 权限错误** 

Error: Permission denied
**解决方案:** 

```bash
Windows Docker Desktop
1. Settings → Resources → File Sharing
2. 添加项目目录到共享列表
或使用 WSL2 目录
mkdir -p ~/docker/redis/data
sudo chmod 777 ~/docker/redis/data
```

#####  **问题 2: 连接失败** 

```bash
1. 检查容器状态
docker ps | grep redis
2. 检查端口映射
docker port redis-server
3. 检查防火墙
Windows: 确保 6379 端口开放
WSL2: sudo ufw allow 6379
4. 测试连接
docker exec redis-server redis-cli -a yourpassword123 ping
```

#####  **问题 3: 数据损坏** 

```bash
检查 RDB 文件
docker exec redis-server redis-check-rdb /data/dump.rdb
修复 AOF 文件
docker exec redis-server redis-check-aof --fix /data/appendonly.aof
启动修复模式
docker run -it --rm \
-v ./data:/data \
redis redis-check-rdb /data/dump.rdb
```

#### 6.2 监控与调试

```bash
1. 实时监控
docker stats redis-server
2. Redis 信息统计
docker exec redis-server redis-cli -a yourpassword123 INFO
3. 查看慢查询
docker exec redis-server redis-cli -a yourpassword123 SLOWLOG GET 10
4. 内存分析
docker exec redis-server redis-cli -a yourpassword123 INFO memory
5. 客户端连接
docker exec redis-server redis-cli -a yourpassword123 CLIENT LIST
```

### 七、维护与清理

#### 7.1 日常维护

```bash
1. 更新 Redis 版本
docker stop redis-server
docker rm redis-server
docker pull redis:latest
重新运行（数据卷保持不变）
2. 清理旧镜像
docker image prune -a
3. 清理停止的容器
docker container prune
4. 清理未使用的卷
docker volume prune
5. 完整系统清理
docker system prune -a --volumes
```

#### 7.2 迁移指南

```bash
1. 备份源服务器数据
docker exec source-redis redis-cli -a password SAVE
docker cp source-redis:/data/dump.rdb ./
2. 准备目标服务器
docker run -d --name target-redis -p 6380:6379 redis
3. 恢复数据
docker cp dump.rdb target-redis:/data/
docker restart target-redis
4. 验证迁移
docker exec target-redis redis-cli ping
```

### 八、安全建议

#### 8.1 基础安全配置

redis.conf 安全部分

```bash
修改默认端口
port 6380
绑定特定 IP
bind 127.0.0.1
设置强密码
requirepass "Strong@Passw0rd!2024"
禁用危险命令
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command CONFIG ""
rename-command SHUTDOWN ""
rename-command DEBUG ""
限制内存
maxmemory 2gb
maxmemory-policy volatile-lru
```

#### 8.2 网络隔离

docker-compose.yml 网络配置

```bash
networks:
	redis-internal:
		internal: true # 内部网络，不对外暴露
services:
	redis:
		networks:
			redis-internal
		# 不映射端口到宿主机
		# ports: 
			# 注释掉这行
			# - "6379:6379"
	app:
		depends_on:
			redis
		networks:
			redis-internal
```

#### 8.3 定期安全审计

```bash
1. 检查未授权访问
netstat -tlnp | grep 6379
2. 查看 Redis 配置
docker exec redis-server redis-cli -a password CONFIG GET *
3. 检查客户端连接
docker exec redis-server redis-cli -a password CLIENT LIST
4. 监控异常命令
docker exec redis-server redis-cli -a password MONITOR | grep -E "(FLUSH|CONFIG|SHUTDOWN)"
```

### 最佳实践总结

#### 存储选择建议

1. **开发环境** ：使用 Bind Mount (WSL2 内部目录)

   - 路径： `~/docker/redis/data/`

   - 优点：性能好，易访问

2. **生产环境** ：使用 Docker Volume

   - 优点：Docker 管理，便于备份迁移

   - 命令： `docker volume create redis_data`

3. **避免使用** ：容器内存储或 Windows 目录 Bind Mount

   - 容器内：数据易丢失

   - Windows 目录：IO 性能较差

#### 配置文件管理

1. **版本控制** ：将 `redis.conf` 纳入 Git 管理

2. **环境分离** ：开发、测试、生产使用不同配置

3. **敏感信息** ：密码等使用环境变量

```bash
environment:
	REDIS_PASSWORD=${REDIS_PASSWORD}
```

#### 10.3 灾难恢复

1. **定期备份** ：RDB + AOF 双备份

2. **异地备份** ：重要数据多地点存储

3. **恢复演练** ：定期测试恢复流程

4. **监控指标** ：内存使用、连接数、持久化状态

---

**最后更新** : 2025年2月
**适用版本** : Docker 20.10+, Redis 7.2+
**测试环境** : Windows 11 + WSL2 + Docker Desktop 4.15+

> **提示** : 生产环境部署前，请务必根据实际需求调整配置参数，并进行充分的测试。

