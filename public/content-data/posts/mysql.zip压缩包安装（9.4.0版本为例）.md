---
title: "mysql.zip压缩包安装（9.4.0版本为例）"
date: 2025-10-18 14:58:08
tags:
- "mysql"
- "数据库"
- "linux"
- "windows"
---

## 以 [windows方式](#anchor1) 和 [linux方式](#anchor2) 为例

### 1. windows版本安装

首先给出windows版本安装完整过程：
1）见1.2解压安装包并添加bin文件夹到环境变量后，在解压文件夹中，见1.3先配置个简单my.ini文件：

```bash
[mysqld]
basedir=C:/programming/mysql-9.4.0-winx64  # MySQL 安装目录
datadir=C:/programming/mysql-9.4.0-winx64/data  # 数据存储目录
port=3306  # 监听端口号
```

2）cd 到安装文件夹的bin文件中，如

```bash
cd C:\programming\mysql-9.4.0-winx64\bin
```

3）随后安装mysql服务，设置服务名为mysql：

```bash
mysqld -install mysql
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/5be6c6b56dc341d1862182f1f8abedfc.png)

4）初始化服务：

```bash
mysqld --initialize --console
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/2ed099900c9440d59dfa2f45b6fcfa28.png)

初始化过程中会拿到随机生成的密码用于首次登录
5）在系统中开始mysql服务

```bash
net start mysql
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/788e5476a8d74f7dac6a59640fb742aa.png)

6）登录mysql数据库

```bash
mysql -u root -p
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/c6e135b586ca4813a062eb8c64416309.png)

windows版本的mysql压缩包安装流程至此完成，其中更多细节见下文。

#### 1.1. [官网下载](https://dev.mysql.com/downloads/mysql/) 

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/71f86fc011ab44dfa9570344911932a2.png)

#### 1.2. 解压在系统盘内

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/684e1610220c4ce9954c675cbb443782.png)

<mark>在环境变量的系统变量Path中加入bin路径</mark> 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/29d6ef4260b445538928ea148bb04356.png)

#### 1.3. 新建初始化文件my.ini

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/438cabf18fd24cfa91b155413645ecd5.png)

初学时如下简单配置即可：

```bash
[mysqld]
basedir=C:/programming/mysql-9.4.0-winx64  # MySQL 安装目录
datadir=C:/programming/mysql-9.4.0-winx64/data  # 数据存储目录
port=3306  # 监听端口号
```

可深入学习，my.ini是 MySQL 在 Windows 系统上的主要配置文件，它非常重要且不仅在初始化时使用。

> my.ini 的作用：
> 服务器配置：定义 MySQL 服务器的各种运行参数
> 持久化设置：每次 MySQL 启动时都会读取
> 性能调优：优化内存、连接数等参数
> 功能启用/禁用：控制各种功能的开关
> 配置文件的加载时机：

> 时机 – 作用：
> >MySQL 服务启动时 – 读取所有配置参数
> >初始化时 – 确定数据目录和基本路径
> >运行时 – 某些参数可以动态修改
> >重启服务时 – 应用所有配置更改

部分参数示例（完整可自行查阅）：

```bash
[mysqld]
# 网络配置
bind-address=127.0.0.1
port=3306

# 路径配置（Windows格式）
basedir=C:/programming/mysql-9.4.0-winx64
datadir=C:/programming/mysql-9.4.0-winx64/data

# 日志配置
log-error=C:/programming/mysql-9.4.0-winx64/data/mysql.err
log-output=FILE
general-log=0
general-log-file="mysql_general.log"
slow-query-log=1
slow-query-log-file="mysql_slow.log"
long-query-time=2

# 字符集和排序规则
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# 安全配置
symbolic-links=0
local-infile=0
secure-file-priv="C:/programming/mysql-9.4.0-winx64/upload"

# 性能配置
explicit_defaults_for_timestamp=true
innodb_buffer_pool_size=256M
max_connections=200
table_open_cache=2000

# Windows特有配置
shared-memory
shared-memory-base-name=MYSQL
enable-named-pipe
socket=MYSQL

[mysql]
# 客户端默认字符集
default-character-set=utf8mb4

[client]
# 客户端配置
default-character-set=utf8mb4
```

#### 1.4. 安装mysql服务

cd 到安装文件夹的bin文件中，如：

```bash
cd C:\programming\mysql-9.4.0-winx64\bin
```

安装服务：

```bash
mysqld --install mysql
```

其中mysql是自定义的名称，用于管理指定版本

#### 1.5. 初始化mysql

```bash
mysqld --initialize --console
```

mysqld：MySQL 服务器主程序
–initialize：初始化数据目录，创建系统数据库（前面ini文件中配置的）
–console：将日志输出到控制台（便于查看临时密码）
–user=mysql：可选，指定运行 MySQL 服务的系统用户（在 Linux 中常用）

#### 1.6. 启动mysql服务

```bash
net start mysql  # 启动服务
```

若修改了配置文件等需要重启服务可如下操作：

```bash
net stop mysql  # 停止服务
net start mysql
```

#### 1.7. 登录数据库

```bash
mysql -u root -p
```

在提示时输入密码，安装后首次进入使用生成的随机密码
需要修改密码则输入如下命令：

```bash
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
FLUSH PRIVILEGES; #刷新权限
exit  #退出重新登陆，验证密码修改成功
```

#### 1.8. 需要时可以卸载服务

例如要删库、更新版本、更新配置文件时

```bash
net stop mysql
mysqld --remove mysql
```

之后删除数据文件夹即可删库跑路 ：）
若只是需要卸载服务，不要删除数据，在之后需要时可以重新建立服务，重建服务命令如下：

```bash
# 重新初始化数据目录
mysqld --initialize --console

# 重新安装服务
mysqld --install mysql
net start mysql
```

<mark>以上是windows安装过程</mark> 


### 2. linux版本安装

#### 2.1. [官网下载](https://dev.mysql.com/downloads/mysql/) 

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/182278c1d3734ea488d5dcaf04b7620c.png)

在linux通用tar压缩包中选择需要的版本并在linux系统中进行下载，例如：

```bash
sudo wget -c -P /home/mysql https://cdn.mysql.com//Downloads/MySQL-9.4/mysql-9.4.0-linux-glibc2.28-x86_64.tar.xz
```

#### 2.2. 解压在系统盘内

解压到某一位置：

```bash
sudo tar -xvf /home/mysql-9.4.0-linux-glibc2.28-x86_64.tar.xz -C /home
```

#### 2.3. 创建mysql用户组，并添加mysql用户 ，设置权限

```bash
sudo groupadd mysql
sudo useradd -r -g mysql -s /bin/false mysql
```

> useradd：创建新用户命令 -r：创建系统用户（UID 在一定范围内，通常用于服务账户） -g
> mysql：指定用户的主要组为 “mysql” 组 -s /bin/false：设置用户的登录 shell 为
> /bin/false（禁止登录） mysql：要创建的用户名

将解压的文件夹移动到/usr/local/mysql，如：

```bash
sudo mv /home/mysql-9.4.0-linux-glibc2.28-x86_64 /usr/local/mysql
```

设置权限：

```bash
cd /usr/local/mysql
sudo mkdir -p mysql-files
sudo chown mysql:mysql mysql-files
sudo chmod 750 mysql-files
```

创建数据目录：

```bash
sudo mkdir -p /usr/local/mysql/data
sudo chown -R mysql:mysql /usr/local/mysql/data

```

#### 2.4. 初始化mysql

```bash
sudo bin/mysqld --initialize --user=mysql --basedir=/usr/local/mysql --datadir=/usr/local/mysql/data
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/5c55ee71555d479c9614143479101d7b.png)

红色框处为初始化时随机生成的密码。
<mark>如果需要SSL</mark> ，低版本中存在bin/mysql_ssl_rsa_setup需要手动安装， <mark>高版本自动集成</mark> 。
手动安装：

```bash
sudo /usr/local/mysql/bin/mysql_ssl_rsa_setup --datadir=/usr/local/mysql/data
```

#### 2.5. 新建配置文件/etc/my.cnf和开机自启服务文件/etc/systemd/system/mysql.service

<mark>配置文件</mark> ：

```bash
sudo vim /etc/my.cnf
```

按i进入插入模式

```bash
[mysqld]
basedir=/usr/local/mysql
datadir=/usr/local/mysql/data
socket=/tmp/mysql.sock
user=mysql
port=3306
bind-address=127.0.0.1
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
log-error=/usr/local/mysql/data/mysql.err
slow_query_log=1
slow_query_log_file=/usr/local/mysql/data/slow.log
long_query_time=2
pid-file=/usr/local/mysql/data/mysqld.pid
symbolic-links=0
explicit_defaults_for_timestamp=true
```

按esc输入wq保存退出。
<mark>服务文件</mark> ：

```bash
sudo vim /etc/systemd/system/mysql.service
```

按i进入插入模式

```bash
[Unit]
Description=MySQL Server
After=network.target

[Service]
Type=simple
User=mysql
Group=mysql
ExecStart=/usr/local/mysql/bin/mysqld --defaults-file=/etc/my.cnf
ExecStop=/bin/kill -TERM $MAINPID
TimeoutSec=300
Restart=on-failure
RestartSec=5
Environment="LD_LIBRARY_PATH=/usr/local/mysql/lib"
LimitNOFILE=65535
LimitNPROC=65535

[Install]
WantedBy=multi-user.target
```

按esc输入wq保存退出。

#### 2.6. 设置开机自启mysql

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 设置开机自动启动 MySQL 服务
sudo systemctl enable mysql
# 启动 MySQL 服务
sudo systemctl start mysql 
```

MySQL 已设置为系统服务，可以使用以下命令管理:

```bash
sudo systemctl start mysql    # 启动
sudo systemctl stop mysql     # 停止
sudo systemctl status mysql   # 状态
```

#### 2.7. 设置环境变量

```bash
sudo vim /etc/profile.d/mysql.sh
```

按i进入插入模式

```bash
export PATH=$PATH:/usr/local/mysql/bin
export LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/local/mysql/lib
```

按esc输入wq保存退出。
授权，刷新生效：

```bash
sudo chmod +x /etc/profile.d/mysql.sh
sudo /etc/profile.d/mysql.sh
```

#### 2.8. 登录数据库

```bash
mysql -u root -p
```

在提示时输入密码，安装后首次进入使用生成的随机密码
需要修改密码则输入如下命令：

```bash
ALTER USER 'root'@'localhost' IDENTIFIED BY '新密码';
FLUSH PRIVILEGES; #刷新权限
exit  #退出重新登陆，验证密码修改成功
```

#### 2.9. 需要时可以卸载服务

例如要删库、更新版本、更新配置文件时

```bash
sudo systemctl stop mysql
sudo pkill -9 mysqld
```

之后删除数据文件夹即可删库跑路 ：）

```bash
sudo userdel -f mysql 2>/dev/null || true
sudo groupdel -f mysql 2>/dev/null || true
# 删除 MySQL 数据目录
sudo rm -rf /usr/local/mysql
# 删除配置文件
sudo rm -f /etc/my.cnf
sudo rm -rf /etc/mysql
# 删除 systemd 服务文件
sudo rm -f /etc/systemd/system/mysql.service
# 删除环境变量配置
sudo rm -f /etc/profile.d/mysql.sh
# 重新加载 systemd
sudo systemctl daemon-reload
```

若只是需要卸载服务，不要删除数据，在之后需要时可以重新建立服务，重建服务命令如下：

```bash
sudo bin/mysqld --initialize --user=mysql --basedir=/usr/local/mysql --datadir=/usr/local/mysql/data
sudo systemctl start mysql    # 启动
```

若要停止开机自动启动服务则删除/etc/systemd/system/mysql.service：

```bash
sudo rm -f /etc/systemd/system/mysql.service
```

<mark>以上是windows安装过程</mark> 