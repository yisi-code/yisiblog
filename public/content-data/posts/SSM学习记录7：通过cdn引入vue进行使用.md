---
title: "SSM学习记录7：通过cdn引入vue进行使用"
date: 2024-10-27 18:22:20
category: "SSM框架"
tags:
- "vue.js"
- "javascript"
- "学习"
---

### 通过cdn引入vue进行使用

**unpkg在国内镜像↓** 

```javascript
    <!-- import Vue before Element -->
    <script src="https://unpkg.zhimg.com/vue@2/dist/vue.js"></script>
    <!-- import axios -->
    <script src="https://unpkg.zhimg.com/axios/dist/axios.min.js"></script>
    <!-- import element-ui js -->
    <script src="https://unpkg.zhimg.com/element-ui/lib/index.js"></script>
    <!-- import CSS -->
    <link rel="stylesheet" href="https://unpkg.zhimg.com/element-ui/lib/theme-chalk/index.css">
```

引入vue 和 vue-router， <mark>注：vue的版本要比router版本低一个版本，例vue2配router3</mark> 

```javascript
    <!-- import Vue before Element -->
    <script src="https://cdn.jsdelivr.net/npm/vue@2.7.14"></script>
    <!-- import vue-router -->
    <script src="https://unpkg.com/vue-router@3/dist/vue-router.js"></script>
```

引入后下载↓
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/0206718b9f64de5a6f9beebc94ccf280.png)

下载完老规矩添加项目库(不了解请见 [我前面的学习](https://blog.csdn.net/m1751250104/article/details/130022880?spm=1001.2014.3001.5502) ）

---

**实例化↓：** 

```javascript
<html>
<head>
    <!-- import Vue before Element -->
    <script src="https://unpkg.com/vue@2/dist/vue.js"></script>
    <!-- import vue-router -->
    <script src="https://unpkg.com/vue-router@3/dist/vue-router.js"></script>
    <title>"测试"</title>
</head>

<body>

<div id="取个名字">
    主页
</div>

<script>
//实例化一个Vue
var newVue = new Vue({
    el:"取个名字",
    data:{
        shu1:"值1",
        shu2:"值2",
        shu3:"值3"
    },
    methods:{
        fa1(){

        },
        fa2(){

        }
    }
})
</script>

</body>
</html>
```

---

**模块化：** 
将vue保存在js文件中，下面例子为studyVue.js↓：

```javascript
export default {//采取default导出方式，在导入的js中可以任意取名，具体见下面内容
    data(){       //data以方法形式呈现，具体原因见官方文件
        return{
            shuxing1:"属性值1",
            shuxing2:"属性值2",
            shuxing3:"属性值3"
        }
    },
    methods:{
        fangfa1(){

        },
        fangfa2(){

        }
    },//有需要的话可以继续添加其他配置
}
```

在实例化中装载studyVue.js里的vue配置↓：

```javascript
<html>
<head>
    <!-- import Vue before Element -->
    <script src="https://unpkg.com/vue@2/dist/vue.js"></script>
    <!-- import vue-router -->
    <script src="https://unpkg.com/vue-router@3/dist/vue-router.js"></script>
    
    <title>"测试"</title>
</head>

<body>

<div id="取个名字">
    主页
</div>

<script type="module">//装载模块要设置type类型为module
import name from "/js/studyVue"   //name为你想在本文件中使用的studyVue的别名，name可以为studyVue
//实例化一个Vue
var newVue = new Vue({
    el:"取个名字",
    data:name.data(),   //装载studyVue.js里面导出的vue的数据data()，
                        //只会得到data()方法中return{}里的值，例 shuxing1
    methods:name.methods //装载studyVue.js里面导出的vue的方法methods,导出的是所有方法
})
</script>

</body>
</html>
```

<mark>jsp中模块化会出现this不能指定到数据的情况，所以在下建议在js中将vue实例化导出再挂载↓</mark> 
studyVue.js里的vue配置↓：

```javascript
var studyVue = new Vue({
    data(){       //data以方法形式呈现，具体原因见官方文件
        return{
            shuxing1:"属性值1",
            shuxing2:"属性值2",
            shuxing3:"属性值3"
        }
    },
    methods:{
        fangfa1(){

        },
        fangfa2(){

        }
    },//有需要的话可以继续添加其他配置
})

export {studyVue};
```

在页面挂载↓：

```javascript
<html>
<head>
    <!-- import Vue before Element -->
    <script src="https://unpkg.com/vue@2/dist/vue.js"></script>
    <!-- import vue-router -->
    <script src="https://unpkg.com/vue-router@3/dist/vue-router.js"></script>
    
    <title>"测试"</title>
</head>

<body>

<div id="取个名字">
    主页
</div>
<script type="module">
    import {studyVue} from "./js/study.js";
    studyVue.$mount("#取个名字");
</script>

</body>
</html>
```

<mark>除了export导出，我们还可以去掉export导出代码，直接导入js文件中的实例↓</mark> 
studyVue.js里的vue配置↓：

```javascript
var studyVue = new Vue({
    data(){       //data以方法形式呈现，具体原因见官方文件
        return{
            shuxing1:"属性值1",
            shuxing2:"属性值2",
            shuxing3:"属性值3"
        }
    },
    methods:{
        fangfa1(){

        },
        fangfa2(){

        }
    },//有需要的话可以继续添加其他配置
})
//没有export导出命令
```

在页面挂载↓：

```javascript
<html>
<head>
    <!-- import Vue before Element -->
    <script src="https://unpkg.com/vue@2/dist/vue.js"></script>
    <!-- import vue-router -->
    <script src="https://unpkg.com/vue-router@3/dist/vue-router.js"></script>
    
    //直接导入js文件
    <script src="js/studyVue.js"></script>
    
    <title>"测试"</title>
</head>

<body>

<div id="取个名字">
    主页
</div>
<script>
    studyVue.$mount("#取个名字");//直接使用js里的vue实例进行挂载
</script>

</body>
</html>
```

---

配置路由（router）js文件：
Router.js↓

```javascript
// 1. 定义 (路由) 组件。
// 可以从其他文件 import 进来
/*const Foo = { template: '<div>foo</div>' }
const Bar = { template: '<div>bar</div>' }*/

// 2. 定义路由
// 每个路由应该映射一个组件。 其中"component" 可以是
// 通过 Vue.extend() 创建的组件构造器，
// 或者，只是一个组件配置对象。
// 我们晚点再讨论嵌套路由。
const routes = [
    { path: '/login.jsp', name:'login' },  //根据需要添加，可以没有，有的话可以在
    //后面调用中使用this.$router.push({name:'login'});这样的方式进行更改url
    { path: '/main.jsp', name:'main'  },
]

// 3. 创建 router 实例，然后传 `routes` 配置
// 你还可以传别的配置参数, 不过先这么简单着吧。
const router = new VueRouter({
    routes, // (缩写) 相当于 routes: routes
    mode:'history',
})
```

在对应页面导入并在的vue中使用↓
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/0eb984e77d47a4daa8f50ad0b03b6f4a.png)

 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a1dbace660b5556f98e43185f152ed8f.png)

之后在需要时调用Vue router↓

```javascript
this.$router.push({path:'/要跳转的路径'});//改变url
this.$router.go(0);//由于是cdn导入，没有Vue文件，url改变后不
                   //会自动跳转，go(0)方法相当于刷新页面，
                   //打开新的url
```

其实跳转页面使用js↓
`window.self.location = "/要跳转的地址;"` 也是可以的

---

**动态组件的使用** 
存放局部注册组件的js文件：ComponentManager.js↓

```javascript
var NewComponent = {
    props: {    //要传的参数列表
        arrName:{ //要传的参数名
            type:String,   //参数的类型
        },       //各参数以逗号隔开
    },
    data(){   //组件本身的数据
        return{
            arrName1:'参数值1',
            arrName2:'参数值2',
        }
    },
    methods:{       //组件本身的方法
        fa1(){
            
        },
        fa2(){
            
        },
    },
}
```

导入js文件↓
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/a40400d57521d55cc35acd7cc3f0172e.png)

实例中装载↓
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/5f6d4923daf40fb904c883987b0f6be3.png)

实例数据中加一个保存组件名称的变量↓
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/d5b6eda1db430459d6f30b2058e2a5a0.png)

在html文本中调用↓

```javascript
<keep-alive>
<component :arr-Name="要传的参数值，注意在html中参数名要用-连接参数名大小写" :is="currentTabComponent"></component>
</keep-alive>
```

<mark>随后在某个方法将‘component-new’赋值给currentTabComponent便能显示出组件，且组件参数arrName收到传入的值，其中 `<keep-alive></keep-alive>` 是在组件消失后，依旧保存组件的数据，若不加上则组件每次出现都会初始化</mark> 

---

数据双向绑定↓
可以向组件中传一个对象类型的参数，将需要双向绑定的属性放在对象类中，由于对象类传参是传地址，所以子组件中改变得到的对象参数的值时父组件同样改变
父组件中↓
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/36dfefc53f29793d0817d9cd5a56944b.png)

子组件中↓
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/6a64b78b85d3249cad18138edf934aa3.png)

传参↓
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/blog_migrate/12c1e098f3d088360b5d16cb537ddc0b.png)

---

Vue3版本引用↓

```javascript
const mainApp = {
      data(){
        return{
        }
      },
      methods:{
      }
    }
    Vue.createApp(mainApp).mount("#取个名");
```

---

以上内容能给新学者解决容易被忽视的困惑，详细的知识请到官方文档中进行学习。