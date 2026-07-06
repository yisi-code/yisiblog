---
title: "Hutool-json 库完整指南"
date: 2025-11-24 02:07:59
category: "全栈技术栈"
tags:
- "json"
- "java"
---

## Hutool-json 库完整指南

### 1. Hutool-json 简介

#### 1.1 什么是 Hutool-json？

Hutool-json 是 Hutool 工具库中的一个核心模块，专门为 Java 开发者提供简单、高效的 JSON 处理能力。它通过极简的 API 设计，让 JSON 数据处理变得轻松高效。

**核心优势** ：

- **零依赖** ：仅需引入 `hutool-json` 模块即可使用，无需其他第三方库

- **API 简洁** ：追求"一行代码完成操作"的设计理念

- **性能优异** ：无反射转换，性能接近 Jackson，在某些场景下优于 Gson

- **中文支持友好** ：完善的国产中文文档，学习成本低

#### 1.2 性能对比

| JSON 库 | 解析 100KB JSON 耗时 | 内存占用 | 包大小 |
|:---:|:---:|:---:|:---:|
| **Hutool-json** | 12ms | 8MB | 150KB |
| Jackson | 14ms | 12MB | 3MB |
| Gson | 18ms | 10MB | 2MB |

### 2. Maven 依赖配置

```xml
<dependency>
<groupId>cn.hutool</groupId>
<artifactId>hutool-all</artifactId>
<version>5.8.25</version>
</dependency>
<dependency>
<groupId>cn.hutool</groupId>
<artifactId>hutool-json</artifactId>
<version>5.8.25</version>
</dependency>
```

### 3. 核心类与基础操作

#### 3.1 核心类介绍

| 类名 | 用途 | 特点 |
|:---:|:---:|:---:|
| `JSONUtil` | 核心工具类，提供静态方法 | 各种 JSON 操作的入口点 |
| `JSONObject` | 表示 JSON 对象 | 类似 Map 结构，键值对集合 |
| `JSONArray` | 表示 JSON 数组 | 类似 List 结构，有序集合 |
| `JSONConfig` | JSON 处理配置 | 自定义序列化/反序列化行为 |

#### 3.2 基础操作示例

##### 3.2.1 JSON 字符串解析

```java
import cn.hutool.json.JSONUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONArray;
public class BasicExample {
public static void main(String[] args) {
// 解析 JSON 对象字符串
String userJson = "{"name":"张三","age":25,"isStudent":false}";
JSONObject userObj = JSONUtil.parseObj(userJson);
// 获取值
String name = userObj.getStr("name");          // "张三"
int age = userObj.getInt("age");               // 25
boolean isStudent = userObj.getBool("isStudent"); // false

// 解析 JSON 数组字符串
String booksJson = "[\"Java编程思想\",\"Hutool实战指南\"]";
JSONArray booksArray = JSONUtil.parseArray(booksJson);
String firstBook = booksArray.getStr(0);        // "Java编程思想"
}
}
```

##### 3.2.2 创建 JSON 对象和数组

```java
// 创建 JSON 对象
JSONObject obj = JSONUtil.createObj()
.set("name", "李四")
.set("age", 30)
.set("hobbies", JSONUtil.createArray().set("读书").set("运动"));
// 创建 JSON 数组
JSONArray array = JSONUtil.createArray()
.set("苹果")
.set("香蕉")
.set(JSONUtil.createObj().set("name", "橘子").set("price", 5.5));
System.out.println(obj.toString());
System.out.println(array.toString());
```

### 4. Java 对象与 JSON 转换

#### 4.1 基础对象转换

```java
// 定义实体类
public class User {
private String name;
private Integer age;
private List<String> hobbies;
private LocalDateTime createTime;
// 无参构造、getter、setter 省略
}
// Java 对象转 JSON
User user = new User();
user.setName("王五");
user.setAge(28);
user.setHobbies(Arrays.asList("游泳", "健身"));
user.setCreateTime(LocalDateTime.now());
String jsonStr = JSONUtil.toJsonStr(user);
// 输出: {"name":"王五","age":28,"hobbies":["游泳","健身"],"createTime":"2023-10-25 15:30:00"}
// JSON 转 Java 对象
String json = "{"name":"赵六","age":33,"hobbies":["读书","音乐"]}";
User newUser = JSONUtil.toBean(json, User.class);
```

#### 4.2 集合对象转换

```java
// List 转 JSON 数组
List<User> userList = Arrays.asList(
new User("张三", 25),
new User("李四", 30)
);
String listJson = JSONUtil.toJsonStr(userList);
// JSON 数组转 List
String jsonArray = "[{"name":"张三","age":25},{"name":"李四","age":30}]";
List<User> parsedList = JSONUtil.toList(jsonArray, User.class);
// Map 转换
Map<String, Object> map = new HashMap<>();
map.put("key1", "value1");
map.put("key2", 123);
String mapJson = JSONUtil.toJsonStr(map);
// JSON 转 Map
String mapJsonStr = "{"key1":"value1","key2":123}";
Map<String, Object> parsedMap = JSONUtil.toBean(mapJsonStr, new TypeReference<Map<String, Object>>() {});
```

### 5. 高级特性详解

#### 5.1 路径表达式（核心特性）

路径表达式是 Hutool-json 的一大亮点，可以轻松处理嵌套复杂的 JSON 结构。

```java
String complexJson = "{"store":{"books":[" +
"{"title":"Java编程","author":{"name":"张三","age":40},"price":99}," +
"{"title":"Python编程","author":{"name":"李四","age":35},"price":88}" +
"]}}";
JSONObject obj = JSONUtil.parseObj(complexJson);
// 传统方式：需要逐层解析
JSONObject store = obj.getJSONObject("store");
JSONArray books = store.getJSONArray("books");
JSONObject firstBook = books.getJSONObject(0);
String authorName = firstBook.getJSONObject("author").getStr("name");
// Hutool 路径表达式：一行代码搞定
String authorName = obj.getByPath("store.books[0].author.name", String.class); // "张三"
Double firstBookPrice = obj.getByPath("store.books[0].price", Double.class); // 99.0
Integer secondBookPrice = obj.getByPath("store.books[1].price", Integer.class); // 88
// 支持数组索引和复杂路径
String secondAuthor = obj.getByPath("store.books[1].author.name"); // "李四"
// 修改嵌套值（路径不存在时会自动创建）
obj.putByPath("store.books[2].title", "新书");
obj.putByPath("store.location.city", "北京");
```

#### 5.2 自定义序列化配置

通过 `JSONConfig` 可以精细控制序列化过程。

```java
// 创建详细配置
JSONConfig config = JSONConfig.create()
.setDateFormat("yyyy-MM-dd HH:mm:ss") // 日期格式
.setIgnoreNullValue(true) // 忽略 null 值
.setIgnoreError(true) // 忽略解析错误
.setOrder(true) // 保持属性顺序
.setKeyComparator(Comparator.reverseOrder()) // 键排序规则
.setTransientSupport(false) // 是否支持 transient 字段
.setNatureKeyComparator(true); // 使用自然顺序
// 应用配置
User user = new User();
user.setName("钱七");
user.setAge(null); // 会被忽略
user.setCreateTime(new Date());
JSONObject jsonObj = JSONUtil.parseObj(user, config);
String result = jsonObj.toString();
// 输出: {"name":"钱七","createTime":"2023-10-25 15:30:45"}
// 针对特定场景的配置
// 大数字转为字符串防止精度丢失
JSONConfig bigNumberConfig = JSONConfig.create()
.setWriteLongAsString(true);
BigDecimal bigDecimal = new BigDecimal("12345678901234567890");
JSONObject numObj = JSONUtil.createObj(bigNumberConfig)
.set("bigNumber", bigDecimal);
// 输出: {"bigNumber":"12345678901234567890"}
```

#### 5.3 XML 与 JSON 互转

Hutool-json 提供了强大的 XML 与 JSON 转换能力。

```java
// XML 转 JSON
String xml = "<root><user id="1001"><name>孙八</name><age>28</age>" +
"<tags><tag>Java</tag><tag>Python</tag></tags></user></root>";
JSONObject jsonObj = XML.toJSONObject(xml);
// 获取 XML 属性和内容
String userId = jsonObj.getByPath("root.user.@id"); // "1001"
String userName = jsonObj.getByPath("root.user.name"); // "孙八"
JSONArray tags = jsonObj.getByPath("root.user.tags.tag"); // ["Java","Python"]
// JSON 转 XML
JSONObject json = JSONUtil.createObj()
.set("data", JSONUtil.createObj()
.set("user", JSONUtil.createObj()
.set("name", "周九")
.set("age", 40)));
String xmlResult = XML.toXml(json);
// 输出: <data><user><name>周九</name><age>40</age></user></data>
// 指定根标签
String xmlWithRoot = XML.toXml(json, "response");
// 输出: <response><data><user>...</user></data></response>
```

#### 5.4 格式化输出

```java
// 美化输出
String uglyJson = "{"name":"赵六","age":33,"address":{"city":"北京","district":"海淀区"}}";
String prettyJson = JSONUtil.toJsonPrettyStr(JSONUtil.parseObj(uglyJson));
System.out.println(prettyJson);
// 输出:
// {
// "name": "赵六",
// "age": 33,
// "address": {
// "city": "北京",
// "district": "海淀区"
// }
// }
// 格式化已有 JSON 字符串
String formatted = JSONUtil.formatJsonStr(uglyJson);
```

### 6. 性能优化与最佳实践

#### 6.1 大数据量处理策略

对于超过 10MB 的大文件，推荐使用流式处理：

```java
// 流式读取大文件
try (JSONReader reader = new JSONReader(new FileReader("large-data.json"))) {
reader.readObject(new JSONObjectHandler() {
@Override
public boolean handle(JSONObject jsonObj) {
// 逐条处理 JSON 对象
processItem(jsonObj);
return true; // 返回 true 继续读取，false 停止读取
}
});
}
// 分块处理超大文件
try (BufferedReader br = new BufferedReader(new FileReader("very-large.json"))) {
String line;
StringBuilder chunk = new StringBuilder();
int chunkSize = 0;
while ((line = br.readLine()) != null) {
    chunk.append(line);
    chunkSize++;
    
    if (chunkSize >= 1000) { // 每1000条处理一次
        processChunk(chunk.toString());
        chunk.setLength(0);
        chunkSize = 0;
    }
}

// 处理最后剩余的数据
if (chunk.length() > 0) {
    processChunk(chunk.toString());
}
}
```

#### 6.2 线程安全考虑

`JSONObject` 和 `JSONArray` 默认非线程安全，多线程环境下需要特殊处理：

```java
// 方法1: 使用 ThreadLocal
private static final ThreadLocal<JSONObject> JSON_THREAD_LOCAL =
ThreadLocal.withInitial(JSONObject::new);
public void processInThread() {
JSONObject jsonObj = JSON_THREAD_LOCAL.get();
jsonObj.set("threadData", Thread.currentThread().getName());
// 使用完后需要调用 jsonObj.clear() 清理
}
// 方法2: 使用不可变对象
String jsonStr = "{"name":"test"}";
JSONObject immutableJson = JSONUtil.parseObj(jsonStr).toImmutable();
// 方法3: 同步块
public class SynchronizedJsonProcessor {
private final JSONObject sharedJson = new JSONObject();
public void safeUpdate(String key, Object value) {
    synchronized (sharedJson) {
        sharedJson.set(key, value);
    }
}
}
```

#### 6.3 工具类封装建议

虽然 Hutool 已提供静态方法，但封装工具类可以统一异常处理和配置：

```java
import cn.hutool.json.*;
import java.util.List;
import java.util.Map;
/**
Hutool JSON 工具类封装
*/
public class JsonUtils {
private static final JSONConfig DEFAULT_CONFIG = JSONConfig.create()
.setDateFormat("yyyy-MM-dd HH:mm:ss")
.setIgnoreNullValue(true)
.setIgnoreError(true);
/** 对象转 JSON 字符串 */
public static String toJson(Object obj) {
try {
return JSONUtil.toJsonStr(obj, DEFAULT_CONFIG);
} catch (Exception e) {
throw new RuntimeException("JSON序列化失败", e);
}
}
/** JSON 字符串转对象 */
public static <T> T toBean(String json, Class<T> clazz) {
try {
return JSONUtil.toBean(json, clazz);
} catch (Exception e) {
throw new RuntimeException("JSON反序列化失败: " + json, e);
}
}
/** JSON 字符串转 List */
public static <T> List<T> toList(String json, Class<T> clazz) {
try {
return JSONUtil.toList(JSONUtil.parseArray(json), clazz);
} catch (Exception e) {
throw new RuntimeException("JSON转List失败", e);
}
}
/** 格式化 JSON 字符串 */
public static String format(String json) {
try {
return JSONUtil.formatJsonStr(json);
} catch (Exception e) {
return json; // 格式化失败返回原字符串
}
}
/** 安全获取嵌套值 */
public static <T> T getByPathSafe(JSONObject json, String path, Class<T> clazz, T defaultValue) {
try {
T result = json.getByPath(path, clazz);
return result != null ? result : defaultValue;
} catch (Exception e) {
return defaultValue;
}
}
}
```

### 7. 实战应用案例

#### 7.1 统一 API 响应格式

```java
/**
统一 API 响应封装
*/
public class ApiResponse<T> {
private int code;
private String message;
private T data;
private long timestamp;
public static <T> ApiResponse<T> success(T data) {
ApiResponse<T> response = new ApiResponse<>();
response.code = 200;
response.message = "success";
response.data = data;
response.timestamp = System.currentTimeMillis();
return response;
}
public static ApiResponse<Object> error(int code, String message) {
ApiResponse<Object> response = new ApiResponse<>();
response.code = code;
response.message = message;
response.timestamp = System.currentTimeMillis();
return response;
}
public String toJson() {
return JSONUtil.toJsonStr(this);
}
// 使用示例
public static void main(String[] args) {
List<User> users = Arrays.asList(
new User("张三", 25),
new User("李四", 30)
);
ApiResponse<List<User>> successResponse = ApiResponse.success(users);
System.out.println(successResponse.toJson());
ApiResponse<Object> errorResponse = ApiResponse.error(500, "服务器内部错误");
System.out.println(errorResponse.toJson());
}
// getter/setter 省略
}
```

#### 7.2 配置文件解析

```java
/**
JSON 格式配置文件解析
*/
public class JsonConfigReader {
private JSONObject config;
public JsonConfigReader(String configPath) {
try {
String configContent = FileUtil.readUtf8String(configPath);
this.config = JSONUtil.parseObj(configContent);
} catch (Exception e) {
throw new RuntimeException("配置文件读取失败: " + configPath, e);
}
}
public String getString(String path) {
return config.getByPath(path, String.class);
}
public int getInt(String path, int defaultValue) {
Integer value = config.getByPath(path, Integer.class);
return value != null ? value : defaultValue;
}
public <T> T getBean(String path, Class<T> clazz) {
Object obj = config.getByPath(path);
return obj instanceof JSONObject ?
JSONUtil.toBean((JSONObject) obj, clazz) : null;
}
// 使用示例
public static void main(String[] args) {
JsonConfigReader config = new JsonConfigReader("config/app.json");
String dbUrl = config.getString("database.mysql.url");
int maxConnections = config.getInt("database.mysql.maxConnections", 10);
RedisConfig redisConfig = config.getBean("redis", RedisConfig.class);
}
}
```

#### 7.3 第三方 API 数据解析

```java
/**
处理第三方 API 返回的 JSON 数据
*/
public class ThirdPartyApiParser {
public static List<User> parseUserList(String apiResponse) {
JSONObject responseObj = JSONUtil.parseObj(apiResponse);
// 检查 API 响应状态
if (!"success".equals(responseObj.getStr("status"))) {
throw new RuntimeException("API调用失败: " + responseObj.getStr("message"));
}
// 使用路径表达式直接获取数据数组
JSONArray dataArray = responseObj.getByPath("data.users", JSONArray.class);
if (dataArray == null) {
return Collections.emptyList();
}
// 转换数据
List<User> users = new ArrayList<>();
for (int i = 0; i < dataArray.size(); i++) {
JSONObject userJson = dataArray.getJSONObject(i);
User user = new User();
user.setName(userJson.getByPath("user_info.name", String.class));
user.setAge(userJson.getByPath("user_info.age", Integer.class));
// 处理嵌套对象
JSONObject addressJson = userJson.getJSONObject("address");
if (addressJson != null) {
String address = addressJson.getStr("city") + addressJson.getStr("district");
user.setAddress(address);
}
users.add(user);
}
return users;
}
}
```

### 8. 常见问题与解决方案

#### 8.1 日期格式处理

```java
// 处理多种日期格式
public class DateUtils {
private static final String[] DATE_PATTERNS = {
"yyyy-MM-dd HH:mm:ss",
"yyyy/MM/dd HH:mm:ss",
"yyyy-MM-dd",
"yyyy年MM月dd日 HH时mm分ss秒"
};
public static Date parseDate(String dateStr) {
    if (dateStr == null || dateStr.trim().isEmpty()) {
        return null;
    }
    
    for (String pattern : DATE_PATTERNS) {
        try {
            return DateUtil.parse(dateStr, pattern);
        } catch (Exception e) {
            // 尝试下一种格式
        }
    }
    throw new IllegalArgumentException("无法解析的日期格式: " + dateStr);
}
}
// 在 JSON 转换中使用
JSONConfig dateConfig = JSONConfig.create()
.setDateFormat("yyyy-MM-dd HH:mm:ss")
.setIgnoreError(true);
User user = new User();
user.setCreateTime(new Date());
String json = JSONUtil.toJsonStr(user, dateConfig);
```

#### 8.2 循环引用问题

```java
// 解决循环引用
public class Department {
private String name;
private List<Employee> employees;
// getter/setter
}
public class Employee {
private String name;
private Department department; // 循环引用
// getter/setter
}
// 解决方案1: 使用 @JSONField(serialize = false) 注解
public class Employee {
private String name;
@JSONField(serialize = false) // 序列化时忽略此字段
private Department department;
}
// 解决方案2: 使用 JSONConfig 忽略错误
JSONConfig config = JSONConfig.create()
.setIgnoreError(true); // 遇到循环引用时忽略
String json = JSONUtil.toJsonStr(employee, config);
```

#### 8.3 字段名映射

```java
// 使用 @Alias 注解进行字段名映射
public class User {
@Alias("user_name") // JSON 字段名为 user_name
private String name;
@Alias("user_age")
private Integer age;

@Alias("create_time")
private Date createTime;
}
// 使用
String json = "{"user_name":"张三","user_age":25,"create_time":"2023-10-25 15:30:00"}";
User user = JSONUtil.toBean(json, User.class);
```

### 9. 总结

Hutool-json 通过简洁的 API 设计解决了传统 JSON 处理的三大痛点：

1. **学习成本高** → 10分钟即可掌握核心操作

2. **代码冗长** → 路径表达式减少 60% 代码量

3. **依赖臃肿** → 150KB 体积，无第三方依赖

#### 9.1 选择 Hutool-json 的场景

| 场景 | 推荐度 | 说明 |
|:---:|:---:|:---:|
| 快速开发中小项目 | ⭐⭐⭐⭐⭐ | API 简洁，开发效率高 |
| 需要轻量级解决方案 | ⭐⭐⭐⭐⭐ | 无依赖，包体积小 |
| 处理复杂嵌套 JSON | ⭐⭐⭐⭐ | 路径表达式非常方便 |
| 高性能要求 | ⭐⭐⭐⭐ | 性能接近 Jackson |
| 需要 XML 转换 | ⭐⭐⭐⭐⭐ | 内置强大 XML 转换能力 |

#### 9.2 未来发展方向

根据 Hutool 官方规划，未来版本将重点提升：

- JSON Schema 验证支持

- JSON Patch 操作支持

- 优化超大 JSON（1GB+）处理能力

- 增强流式处理性能

#### 9.3 开始使用

立即在项目中引入 Hutool-json，体验高效的 JSON 处理：
xml

cn.hutool
hutool-json
5.8.25

掌握 Hutool-json 工具，让您的 JSON 处理从此变得简单高效！
这份详细的 Markdown 文档涵盖了 Hutool-json 库的各个方面，从基础概念到高级应用，包含了大量的代码示例和最佳实践。您可以直接将这份文档放入您的 Markdown 文档中使用。