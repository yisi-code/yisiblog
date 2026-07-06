---
title: "SSM学习记录9：SpringBoot整合SSM（注解方式）"
date: 2024-10-27 18:20:41
category: "SSM框架"
tags:
- "spring boot"
- "学习"
- "java"
---

### SSM学习记录9：SpringBoot整合SSM（注解方式）

### 1.首先创建新项目，选择Spring Initializr，type为Maven

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/62b584555d5904ddae45932d81ea0a61.png)

### 2.接着依赖选择Spring Web

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/eeb7213deb0279bed52b5b8086c19455.png)

### 3.无需繁琐配置，即可运行编写的controller类

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/000e63fecb641d8dc27879d726d6c8dc.png)

**启动SpringBootDemoApplication↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d25e9c8cd9f8e4b5002f2416a337b338.png)

**springBoot项目内含tomcat服务器，无需手动配置↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c23445bda200560a9eb1047d940862c4.png)

**测试结果↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/035064c7e3b80b65281a692d818eb8f8.png)

### 4.配置文件

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c45dc31d24e5d03b0b2214c0f85a99e5.png)

[上下图来自黑马程序员的视频教程，点击查看教程](https://www.bilibili.com/video/BV1Fi4y1S7ix?p=95&vd_source=7704802197877a956afade15e4bb1c8b) 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d0ae172ce43687296533803ad704d989.png)

**配置文件yml与yaml语法↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/1732ec6397e96b1ac82733a7457537e3.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/c0fd8511343a548cd9a57b7252573e7d.png)

**配置文件数据读取方式（3种）↓** 
**配置文件：** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a9e1cc56ce233b5849b7b53f6ad1018c.png)

**读取方式：** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/74bd3986755b98323b2e1ba2383c8e19.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d9c36170d4d39b24198bccaf263e7db5.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/bd8a94dc5ebe3e2a14735071b0444975.png)

**若自定义方式出现警告↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/48735b0e47e45fdedbca300d4d972016.png)

### 5.Junit整合

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/21f2768e231a3992457fc96078455ccf.png)

**Test加载的是同级目录下的类，当要在其他级目录下运行某个类时，需要指定。下面图中红色为同级，蓝色为其他级↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/2a3615b6ae5566ee0f972a90dede5e81.png)

**Test测试结果↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/6e584b13c8c7d9433cfbbd0f30e1a966.png)

### 6.整合SSM

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/1f4513f897f8ee9a48d365120d4f1c33.png)

**若是新项目，则项目创建时除Web还可添加依赖↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/aa167c6fadcb361c5f16b5f963946b72.png)

**若创建项目时未勾依赖则可以手动添加↓** 

```java
        <dependency>
            <groupId>org.mybatis.spring.boot</groupId>
            <artifactId>mybatis-spring-boot-starter</artifactId>
            <version>3.0.2</version>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>8.0.33</version>
        </dependency>
```

**SpringBoot里的Dao层需要在类上添加@Mapper** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/3c8512840c415bed99981cd5df2b234e.png)

**添加durid依赖↓** 

```java
        <dependency>
            <groupId>com.alibaba</groupId>
            <artifactId>druid</artifactId>
            <version>1.2.16</version>
        </dependency>
```

**配置数据库配置↓** 

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/cb8cd47edd20b03dac00e15bed0252ea.png)

**添加所有库↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/8bd650dda6b2fc3057c0ae67b025b9fd.png)

添加页面配置↓
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/2ae981da5359f84490c20c375d2a3cba.png)

**各页面资源位置↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/5dfb59e907df9c99fc9a6fc9bd750dd0.png)

**添加资源处理器，防止静态资源被拦截↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/8fd2ff3d6aaee31797cf51f3025842f7.png)

**设置文件上传和下载的配置↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/1a24501e841be05729c2d5c59dfaf7d3.png)

### 7.页面

**html在SpringBoot中的格式↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/cdb1f35968c03301d4451d0204ba1c57.png)

**对js、css、html、element UI、Vue等的引用↓** 
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/9d31664366c866d14e84f4c584cde348.png)

**至此SpringBoot整合SSM结束。** 