---
title: "Ubuntu22.04版本左右，扩充用户可使用内存"
date: 2025-10-18 15:11:02
category: "全栈技术栈"
tags:
- "linux"
---

1 <mark> **取得root权限后** </mark> ，输入命令 `lsblk` 查看所有磁盘和分区，找到想要替换用户可使用文件夹内存的磁盘和分区。若没有进行分区，并转为所需要的分区数据类型，先进行分区与格式化，过程自行查阅。
扩充替换过程，例如： <mark>sda磁盘</mark> 下的 <mark>sda1</mark> 分区
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/561cb2efab754950b2859bad3287d27b.png)

2 确定sda1没有进行重要存储后，输入命令 `sudo umount /dev/sda1` 取消sda1分区的在对应挂载点上的挂载
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/59a21422b5104becad3a054ea9e0c460.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f415ca276b0a4adca934d4a85625a98d.png)

3 创建想要挂载的文件夹，例如，想要替换 /home 文件夹的存储内存，先在同级目录下使用命令 `mkdir newHome` 创建一个文件夹 newHome
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/9eb79824cc4940a9ad9b61e7106a0f69.png)

使用命名 `mount /dev/sda1 /newHome` 将存储内存挂载到 /newHome
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6d20a00e4ffd4d05994b41e4c00d97f7.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/57d5db1bf023446eae3122acb42654db.png)

4 输入命令 `cd /home` 进入 /home 文件夹，输入命令 `cp -a * /newHome` 将 /home 文件夹中所有文件夹和对应权限拷贝到 /newHome
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/ee34b605dd08470cb54a5fd89d98f506.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/59d774664f01484b99ccd0b63fba6df1.png)

5 等待拷贝完成后，输入命令 `blkid` 查看所有磁盘和分区对应的UUID ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/8176e75eb86144d5b53052d599324ff4.png)

输入命令 `vi /etc/fstab` 进行自动挂载的修改，输入新的信息 `UUID=e1397d12-bc23-47fc-b2ec-026edddd914b /newHome               ext4    errors=remount-ro 0       1` 后保存
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/f40c4b59a2d247639d64f078dd885ade.png)

若要对 /home 进行内存的扩容，则将 /home 文件夹名修改为其他名称作为备份（怎么做随你喜欢），将 /newHome 文件夹名修改为 /home 则完成整个扩容过程。