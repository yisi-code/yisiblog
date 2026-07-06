---
title: "SSM学习记录8：通过axios上传文件并在网页得到服务器中的图片（注解方式）"
date: 2024-10-27 18:21:02
category: "SSM框架"
tags:
- "学习"
- "servlet"
- "java"
---

之前所做的注解配置不动，只需在ServletConfig中注册MultipartConfig便可

```java
import jakarta.servlet.MultipartConfigElement;
import jakarta.servlet.ServletRegistration;
import org.springframework.web.servlet.support.AbstractAnnotationConfigDispatcherServletInitializer;

public class ServletConfig extends AbstractAnnotationConfigDispatcherServletInitializer {

    @Override
    protected Class<?>[] getRootConfigClasses() {
        return new Class[]{SpringConfig.class};
    }

    @Override
    protected Class<?>[] getServletConfigClasses() {
        return new Class[]{SpringMvcConfig.class};
    }

    @Override
    protected String[] getServletMappings() {
        return new String[]{"/"};
    }
    //在此进行注册MultipartConfig↓
    //MultipartConfigElement(String location, long maxFileSize, long maxRequestSize, int fileSizeThreshold)
    //（存储位置,最大单个文件大小,最大请求大小（在单个请求中有多个文件的情况下）,将文件上传进度刷新到存储位置的大小）
    @Override
    protected void customizeRegistration(ServletRegistration.Dynamic registration) {
        registration.setMultipartConfig(
                new MultipartConfigElement("",1024*1024*500,1024*1024*500,0)
        );
    }
}
```

---

在js中发送axios请求↓

```javascript
let formData = new FormData();//需要将文件放入表单数据类中
//使用键值对的方式将数据加入表单数据，取值时通过键名file取出文件
//fileData是通过文件选择器或其他方式得到的文件
//         "/files"是controller拦截的路径
formData.append("file", fileData, "上传文件");
axios.post("/files", formData).then(res=>{
console.log(res)//成功后返回的信息
          })
```

通过controller接收上传的文件↓

```java
import domain.Code;
import domain.Result;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;


@RestController
@RequestMapping("/files")
public class FileLoadController {

    private String prefix = "C:/Users/17512/Desktop/毕设/";
    private String infix = null;
    private String suffix = null;
    private String UPLOAD_COVER_DIRECTORY = "spCoverImage";
    private String filePath = null;
    private byte[] bytes = null;
    private int len = 0;

    @PostMapping
    public Result saveUploadFile(@RequestParam("file") MultipartFile multipartFile) throws IOException {

        //System.out.println(multipartFile.getSize());
        FileOutputStream fileOutputStream = null;
        BufferedInputStream bufferedInputStream = null;
        BufferedOutputStream bufferedOutputStream = null;
        
        // 构造绝对路径来存储上传的文件
        infix = UPLOAD_COVER_DIRECTORY;//中缀，要保存文件的文件夹名,这是我项目中需要的
        suffix = multipartFile.getOriginalFilename();//后缀，得到formData里的第三个参数即文件名

        // 如果目录不存在则创建
        File uploadDir = new File(prefix + infix);//前缀+中缀创建保存文件的文件夹
        if (!uploadDir.exists()) uploadDir.mkdir();
        
        filePath = uploadDir.getAbsolutePath() + File.separator + suffix;//最终文件名
        
        //System.out.println(filePath);
        bufferedInputStream = new BufferedInputStream(multipartFile.getInputStream());
        fileOutputStream = new FileOutputStream(filePath);
        bufferedOutputStream = new BufferedOutputStream(fileOutputStream);
        try {
            //System.out.println("开始转存");
            bytes = new byte[1024];
            len = bufferedInputStream.read(bytes, 0, bytes.length);
            while (len != -1) {
                bufferedOutputStream.write(bytes, 0, len);
                len = bufferedInputStream.read(bytes, 0, bytes.length);
            }

        } finally {
            bufferedOutputStream.close();
            fileOutputStream.close();
            bufferedInputStream.close();
        }
        //System.out.println("转存完成");
        return new Result(Code.UPLOAD_OK, "上传成功！", filePath);
    }
}
```

---

用户端显示服务器图片↓
在SpringMvcSupport中注册资源处理器，跟之前学习的给资源放行同理

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurationSupport;

@Configuration
public class SpringMvcSupprot extends WebMvcConfigurationSupport {
    @Override
    protected void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/img/**").addResourceLocations("/img/");
        registry.addResourceHandler("/js/**").addResourceLocations("/js/");
        registry.addResourceHandler("/css/**").addResourceLocations("/css/");
        //在此注册用户端访问图片路径↓  注：file:不可少，表示绝对路径
        registry.addResourceHandler("/spCoverImage/**").addResourceLocations("file:C:/Users/17512/Desktop/毕设/spCoverImage/");

    }
}
```

html中代码如下↓这里我导入了VUE，不使用vue的项目将src前面的：去掉

```html
<img id="取个名" width="100%" :src="dialogImageUrl" alt="">
```

js中代码↓

```javascript
//window.location.href将得到当前http地址，例 http://localhost:8080/
//window.location.href可以不用，img中的src请求路径为spCoverImage/景点测试_12.jpg也会被controller直接拦截后在资源路径中寻找名为景点测试_12.jpg的文件
this.dialogImageUrl = window.location.href + 'spCoverImage/景点测试_12.jpg';
```

当同一个img，其src不改变，但是文件内容却改变了，想要将img刷新显示，我们可以在给src的路径后加上一个无意义的参数，例↓,这样就能在src不变的情况下，刷新img的显示

```javascript
document.getElementById("取个名").src = spCoverImage/景点测试_12.jpg+ "?i=" + Math.random();
```