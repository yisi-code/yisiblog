---
title: "安装Anaconda与pytorch，在IDEA中配置环境进行编程"
date: 2024-11-01 21:54:16
category: "深度学习"
tags:
- "pytorch"
- "人工智能"
- "python"
---

### 1.官网下载与自己python版本匹配的Anaconda(注意，要想成功安装pytorch，python版本也要对应pytorch的相关版本)

[Anaconda官网最新版本](https://www.anaconda.com/download#downloads) 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c571670058cee8c6e7b2ccd5b15a470f.png)

与自己python版本不否请查找自己版本 [anaconda版本对应](https://blog.csdn.net/YY007H/article/details/132203112?spm=1001.2101.3001.6650.3&utm_medium=distribute.pc_relevant.none-task-blog-2%7Edefault%7EYuanLiJiHua%7EPosition-3-132203112-blog-109669400.235%5Ev38%5Epc_relevant_sort&depth_1-utm_source=distribute.pc_relevant.none-task-blog-2%7Edefault%7EYuanLiJiHua%7EPosition-3-132203112-blog-109669400.235%5Ev38%5Epc_relevant_sort&utm_relevant_index=4) 
[清华大学镜像下载](https://mirrors.tuna.tsinghua.edu.cn/anaconda/archive/) 

### 2.安装时勾选添加环境变量或者手动添加（手动添加过程请自行查询）

### 3.检查python和conda是否已经安装

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a4d27b10136d0dc6e9367b798c28070f.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/1d87d0bcb98edeae4e29a445030c252b.png)

### 4.安装pytorch

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/380503e6314fbc34d331d26623449cfa.png)

进入后输入

```java
conda create -n 虚拟环境名字 python=版本
```

创建虚拟环境
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/ba1b6bfad7b57f90a364dd74fe4d2f71.png)

在询问时输入y进行下载

```java
完成后输入 
conda info --envs 
显示环境即创建成功
```

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/8648a17c31adec4bd5001fdd0054b0c0.png)

前往 [pytorch官网](https://pytorch.org/) 获得conda下载命令

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/f953517e55de53e1a155c9e7318dace4.png)

<mark>选择与自己GPU适应的CUDA版本，没有GPU则选择CPU</mark> 
cdm中输入nvidia-smi即可查看GPU和CUDA适配版本
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/494cef8fc4704b24d5072f5c51fd3834.png)

若最新pytroch版本没有适配版本（小于或等于当前已安装CUDA版本），进入先前版本寻找，以下是适合我GPU的版本

```java
conda install pytorch==1.5.1 torchvision==0.6.1 cudatoolkit=9.2 -c pytorch
```

之后Anaconda Prompt中输入

```java
conda activate pytorch
```

进入虚拟环境
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/cd1287a06ec51919edeb95dd335d8856.png)

输入得到的conda版pytorch下载命令

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/4786ce8be901a72b0c7fdff7a4f47a53.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/390098da19f47e8ad5dd3f8583a8480a.png)

安装中有pytorch后输入y确认安装

安装完毕后在创建的虚拟环境pytorch中检验是否安装成功（注意：下面截图中使用的是cuda的pytorch版本，而上面截图中安装的pytorch截图是cpu的版本，只有cuda版本才需要检验，此处歧义由 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/9366c7cb1094f3b7ae648b76f4297986.png)

提出）
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/0c09b7f79179f8f9d1c82a9d871f1e13.png)

<mark>后续如果发现版本错误输入命令卸载pytorch重新安装</mark> 

```java
conda uninstall pytorch
```

### 5.在IDEA中进行配置

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/4d92be731192c88784564336ec4c6185.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/9ee2c7ff4c7531626ccde91e89ea0526.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/6637c7fe427eea9b7d830cca0c911e3f.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/930ce5911917d725479d0cb92e6c1c7f.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/aeabb8cec8e94d9ac4eb9d8910924751.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d871037c4cbb6b26451c68acfa2be465.png)

配置环境成功。