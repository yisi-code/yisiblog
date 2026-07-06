---
title: "Ubuntu22.04版本左右，开机自动启动脚本"
date: 2025-10-18 15:11:16
category: "全栈技术栈"
tags:
- "linux"
- "ubuntu"
---

### Ubuntu22.04版本左右，开机自动启动脚本

**1. 新增/lib/systemd/system/rc-local.service中[Install]内容** 
vim /lib/systemd/system/rc-local.service
按 i 进入插入模式后，新增内容如下：

```cpp
[Install]
WantedBy=multi-user.target
Alias=rc-local.service
```

添加完成后按exc退出插入模式，按 : 输入wq 保存并退出
最终整个文档如下：
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/835c077e7f2c49cbad6dd81bf03b6b43.png)

**2. 新建/etc/rc.local文件** 
输入 vi /etc/rc.local 新建文件，在文件中输入想要自动执行的命令
注：第一行加上注释 #!/bin/bash 选择bash解释器
若需要sudo权限，则带上密码，例子：

```cpp
#!/bin/bash
PASSWORD="root密码字符串"
echo $PASSWORD | sudo 需要执行的命令
echo $PASSWORD | sudo 需要执行的命令
echo “带日期的txt文件创建” > /path/"$(date +%Y-%m-%d_%H:%M:%S_autoRemoteInit.txt)"
exit
```

与步骤1一样保存并退出
**3. 给予执行权限** 
sudo chmod a+x /etc/rc.local
**4. 设置开机自动运行** 
systemctl enable rc-local.service
得到输出： ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/6a5f5dca0c974a15b3a00e02c73624e5.png)

表示成功创建连接，至此开机自动运行脚本设置成功
**5. 手动启动服务** 
sudo systemctl start rc-local.service
**6. 手动停止服务** 
sudo systemctl stop rc-local.service
**7. 手动重启服务** 
sudo systemctl restart rc-local.service
**8. 查看服务状态** 
sudo systemctl status rc-local.service
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/3ce7928eb83e429b8e39876138686970.png)

