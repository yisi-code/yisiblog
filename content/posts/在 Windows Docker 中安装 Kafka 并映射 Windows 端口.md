---
title: "在 Windows Docker 中安装 Kafka 并映射 Windows 端口"
date: 2026-02-25 06:44:15
category: "全栈技术栈"
tags:
- "docker"
- "kafka"
---

## 在 Windows Docker 中安装 Kafka 并映射 Windows 端口

本指南将详细介绍如何在 Windows 系统的 Docker 环境中运行 Kafka 容器（使用 KRaft 模式），并将端口和配置文件正确映射到 Windows 主机。

### 环境说明

- **Docker 平台** : Docker Desktop for Windows

- **Kafka 镜像** : 使用 Apache Kafka 官方镜像（支持 KRaft 模式）

- **模式** : KRaft 模式（无需 ZooKeeper）

- **Windows 配置文件路径** : `D:\项目\kafka配置\`

- **数据目录路径** : `D:\项目\kafka配置\data-logs`

### 准备工作

#### 1. 创建数据目录

在 PowerShell 中运行以下命令创建一个名为 kafka_data的 Docker 卷轴：

```bash
docker volume create kafka_data
```

查看 Volume 信息

```bash
docker volume ls
docker volume inspect kafka_data
```

#### 2. 配置文件

创建新的 `server-docker.properties` 文件，内容如下：

```properties

process.roles=broker,controller
node.id=1
controller.quorum.voters=1@localhost:9093
cluster.id=fT-3ObG3RFinasxQNI9cmQ

log.dirs=/kafka/data-logs

num.partitions=1
num.recovery.threads.per.data.dir=1

listeners=PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
inter.broker.listener.name=PLAINTEXT

advertised.listeners=PLAINTEXT://localhost:9092
controller.listener.names=CONTROLLER
listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT,SSL:SSL,SASL_PLAINTEXT:SASL_PLAINTEXT,SASL_SSL:SASL_SSL

num.network.threads=3
num.io.threads=8
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

offsets.topic.replication.factor=1
transaction.state.log.replication.factor=1
transaction.state.log.min.isr=1

log.retention.hours=168
log.segment.bytes=10240000
log.retention.check.interval.ms=300000
```

### 安装与运行

#### 方式一：直接使用 Docker Run 命令

```bash
拉取 Kafka 镜像（包含 KRaft 模式支持）
docker pull apache/kafka:latest
查看版本
docker run --rm apache/kafka:latest /opt/kafka/bin/kafka-topics.sh --version
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f396f009dce94ebc90fa5e28702d0cd7.png)

```bash
运行 Kafka 容器
docker run -d `
--name kafka-broker `
--hostname kafka-broker `
-p 9092:9092 `
-p 9093:9093 `
-v D:\项目\kafka配置\server.properties:/kafka/config/server.properties `
-v kafka_data:/kafka/data-logs `
-e KAFKA_NODE_ID=1 `
-e KAFKA_PROCESS_ROLES="broker,controller" `
-e KAFKA_CONTROLLER_QUORUM_VOTERS="1@localhost:9093" `
-e KAFKA_LISTENERS="PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093" `
-e KAFKA_ADVERTISED_LISTENERS="PLAINTEXT://localhost:9092" `
apache/kafka:latest
```

#### 方式二：使用 Docker Compose（推荐）

创建 `docker-compose-kafka.yml` 文件：

```yaml
version: '3.8'

services:
  kafka:
    image: apache/kafka:latest
    container_name: kafka-broker
    hostname: kafka-broker
    restart: unless-stopped
    ports:
      - "9092:9092"  # Kafka 客户端连接端口
      - "9093:9093"  # Controller 端口（KRaft 内部通信）
    volumes:
      # 挂载自定义配置文件
      - D:/项目/HanHan/kafka配置/server.properties:/kafka/config/server.properties
      # 挂载数据目录，实现持久化
      - kafka_data:/kafka/data-logs


volumes:
  kafka_data:
```

启动服务：

```bash
docker-compose -f docker-compose-kafka.yml up -d
```

### 验证与测试

#### 1. 检查容器状态

```bash
docker ps
或
docker-compose ps
```

#### 2. 查看容器日志

```bash
docker logs kafka-broker
```

#### 3. 进入容器执行管理命令

```bash
进入容器
docker exec -it kafka-broker /bin/bash
创建测试主题
kafka-topics --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic test-topic
查看主题列表
kafka-topics --bootstrap-server localhost:9092 --list
生产测试消息
echo "Hello, Kafka!" | kafka-console-producer --bootstrap-server localhost:9092 --topic test-topic
消费测试消息
kafka-console-consumer --bootstrap-server localhost:9092 --topic test-topic --from-beginning
```

#### 4. 从 Windows 主机测试（使用 Docker 网络）

由于 `advertised.listeners` 设置为 `PLAINTEXT://localhost:9092` ，您可以通过以下方式测试：

```bash
在 Windows PowerShell 中，使用 host.docker.internal 访问容器
首先，拉取 Kafka 客户端工具（如果本地没有）
docker run --rm -it confluentinc/cp-kafka:latest bash
在新的容器中测试连接
kafka-topics --bootstrap-server host.docker.internal:9092 --list
```

### 配置说明

#### 1. 网络访问模式选择

根据您的使用场景，可以调整 `advertised.listeners` ：

- **本地开发** ： `PLAINTEXT://localhost:9092`

- **局域网访问** ： `PLAINTEXT://<宿主机IP>:9092`

- **Docker 网络内访问** ： `PLAINTEXT://kafka-broker:9092`

#### 2. 重要端口说明

| 端口 | 用途 | 是否必须映射 |
|:---:|:---:|:---:|
| 9092 | Kafka 客户端连接端口 | 是 |
| 9093 | KRaft Controller 内部通信端口 | 是（用于 KRaft 模式） |

#### 3. 持久化配置

通过卷挂载 ( `volumes` ) 实现：

- **配置文件持久化** ：Windows 文件修改后，容器内自动更新

- **数据持久化** ：Kafka 日志数据保存在 Windows 目录，容器重启不丢失

### 常见问题解决

#### 1. 端口冲突

如果 9092 或 9093 端口已被占用，修改映射端口：

```yaml
ports:
"19092:9092" # 改为其他端口
"19093:9093"
```

#### 2. KRaft 模式启动失败

检查环境变量是否正确设置，特别是：

- `KAFKA_PROCESS_ROLES` 必须包含 `broker,controller`

- `KAFKA_CONTROLLER_QUORUM_VOTERS` 格式正确

- `KAFKA_CLUSTER_ID` 必须设置且唯一

### 停止与清理

```bash
停止服务
docker-compose -f docker-compose-kafka.yml down
删除数据（谨慎操作）

完全删除容器和镜像
docker-compose -f docker-compose-kafka.yml down -v --rmi all
通过以上步骤，您可以在 Windows Docker 环境中成功运行 Kafka（KRaft 模式），并正确映射端口和配置文件。
```