---
title: "Java HttpServletRequest 详解"
date: 2026-02-06 23:46:28
category: "全栈技术栈"
tags:
- "java"
- "开发语言"
---

## Java HttpServletRequest 详解

本文详细介绍了 Java Servlet 规范中的核心接口 `HttpServletRequest` ，包括其核心概念、功能方法、高级特性以及在实际开发中的最佳实践。

### 1. HttpServletRequest 概述

`HttpServletRequest` 是 Java Servlet API 中定义的接口，它代表了客户端（如 Web 浏览器）发送到服务器的 HTTP 请求。每当一个 HTTP 请求到达服务器时，Servlet 容器（如 Tomcat、Jetty）就会创建一个实现了该接口的对象，并将请求的所有信息（如参数、头部、URL、方法等）封装其中，然后传递给对应的 Servlet 的 `service` 方法（如 `doGet` 或 `doPost` ）进行处理。

**核心作用** ：提供一个面向对象的接口，让开发者能够方便地获取 HTTP 请求的全部信息，而无需手动解析原始的 HTTP 协议报文。

### 2. 核心方法详解

`HttpServletRequest` 的方法可以按照其功能分为以下几类。

#### 2.1 获取基本请求信息

这些方法用于获取请求最基础的元素，如 URL、URI、HTTP 方法等。

| 方法 | 返回值 | 描述 | 示例 |
|:---|:---|:---|:---|
| `getMethod()` | `String` | 获取 HTTP 请求方法（GET, POST, PUT, DELETE 等）。 | `"GET"` |
| `getRequestURL()` | `StringBuffer` | 获取完整的请求 URL（包括协议、服务器名、端口号、路径，但不包含查询字符串）。 | `http://localhost:8080/myapp/login` |
| `getRequestURI()` | `String` | 获取从协议名到查询字符串之间的部分 URI（相对于服务器根路径）。 | `/myapp/login` |
| `getContextPath()` | `String` | 获取应用程序的上下文路径（通常是应用的根路径）。 | `/myapp` |
| `getQueryString()` | `String` | 获取 URL 中“?”后面的查询字符串。 | `username=john&age=25` |
| `getProtocol()` | `String` | 获取请求使用的协议名称和版本。 | `HTTP/1.1` |
| `getServletPath()` | `String` | 获取调用 Servlet 的路径部分。 | `/login` |

**示例代码** ：

```java
protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
System.out.println("Method: " + request.getMethod());
System.out.println("URL: " + request.getRequestURL().toString());
System.out.println("URI: " + request.getRequestURI());
System.out.println("Context Path: " + request.getContextPath());
System.out.println("Query String: " + request.getQueryString());
}
```

#### 2.2 获取客户端信息

用于识别发起请求的客户端。

| 方法 | 返回值 | 描述 |
|:---|:---|:---|
| `getRemoteAddr()` | `String` | 获取客户端的 IP 地址。 |
| `getRemoteHost()` | `String` | 获取客户端的主机名。 |
| `getRemotePort()` | `int` | 获取客户端使用的网络端口号。 |

#### 2.3 获取请求头（Header）信息

请求头包含了关于请求的元数据。

| 方法 | 返回值 | 描述 |
|:---|:---|:---|
| `getHeader(String name)` | `String` | 根据名称获取单个请求头的值。 |
| `getHeaders(String name)` | `Enumeration<String>` | 获取指定名称的请求头的所有值（用于多值头）。 |
| `getHeaderNames()` | `Enumeration<String>` | 获取所有请求头名称的枚举。 |

**常用请求头示例** ：

- `User-Agent` : 客户端浏览器和操作系统信息。

- `Content-Type` : 请求体的媒体类型（如 `application/json` ）。

- `Authorization` : 用于身份验证的凭证。

- `Cookie` : 客户端发送的 Cookie 信息。

**示例代码** ：

```java
String userAgent = request.getHeader("User-Agent");
String contentType = request.getHeader("Content-Type");
// 遍历所有请求头
Enumeration<String> headerNames = request.getHeaderNames();
while (headerNames.hasMoreElements()) {
String headerName = headerNames.nextElement();
System.out.println(headerName + ": " + request.getHeader(headerName));
}
```

#### 2.4 获取请求参数（Parameter）

这是最常用的功能，用于获取用户通过表单或 URL 查询字符串提交的数据。

| 方法 | 返回值 | 描述 |
|:---|:---|:---|
| `getParameter(String name)` | `String` | 根据参数名获取 **单个** 参数值。如果参数有多个值，返回第一个。 |
| `getParameterValues(String name)` | `String[]` | 根据参数名获取 **所有** 值（用于复选框等多值参数）。 |
| `getParameterMap()` | `Map<String, String[]>` | 获取所有参数名和对应值数组的 Map。 |
| `getParameterNames()` | `Enumeration<String>` | 获取所有参数名的枚举。 |

**示例代码** ：

```java
// 假设请求为 /submit?username=john&hobby=music&hobby=reading
String username = request.getParameter("username"); // 返回 "john"
String[] hobbyArr = request.getParameterValues("hobby"); // 返回 ["music", "reading"]
// 遍历所有参数
Map<String, String[]> parameterMap = request.getParameterMap();
for (Map.Entry<String, String[]> entry : parameterMap.entrySet()) {
System.out.println(entry.getKey() + ": " + Arrays.toString(entry.getValue()));
}
```

**重要提示** ： `getParameter` 系列方法对 `GET` 和 `POST` (Content-Type 为 `application/x-www-form-urlencoded` ) 请求都有效。但对于 `POST` 请求中 Content-Type 为 `multipart/form-data` （文件上传）或 `application/json` 的情况，这些方法可能无效，需要使用 `getInputStream()` 或 `getReader()` 来读取原始请求体。

#### 2.5 操作请求属性（Attribute）

请求属性用于在 **一次请求的转发（Forward）过程中** 在不同的 Servlet 或 JSP 之间传递数据。这与请求参数（来自客户端）完全不同。

| 方法 | 描述 |
|:---|:---|
| `setAttribute(String name, Object o)` | 在请求域中设置一个属性。 |
| `getAttribute(String name)` | 从请求域中获取一个属性。 |
| `removeAttribute(String name)` | 从请求域中移除一个属性。 |
| `getAttributeNames()` | 获取所有属性名的枚举。 |

**示例：请求转发中的数据传递** 

```java
// 在 Servlet1 中
request.setAttribute("message", "Hello from Servlet1");
RequestDispatcher dispatcher = request.getRequestDispatcher("/Servlet2");
dispatcher.forward(request, response);
// 在 Servlet2 中
String message = (String) request.getAttribute("message"); // 可以获取到数据
```

#### 2.6 获取输入流

用于读取请求体的原始数据，常用于处理非表单数据，如 JSON、XML 或文件上传。

| 方法 | 返回值 | 描述 |
|:---|:---|:---|
| `getInputStream()` | `ServletInputStream` | 获取一个用于读取请求体原始二进制数据的输入流。 |
| `getReader()` | `BufferedReader` | 获取一个用于读取请求体字符数据的字符流。 |

**重要** ：在同一个请求中， `getInputStream()` 和 `getReader()` 只能调用其中一个，否则会抛出 `IllegalStateException` 。

**示例：读取 JSON 请求体** 

```java
BufferedReader reader = request.getReader();
StringBuilder sb = new StringBuilder();
String line;
while ((line = reader.readLine()) != null) {
sb.append(line);
}
String jsonBody = sb.toString();
// 然后使用 JSON 库（如 Jackson、Gson）解析 jsonBody
```

### 3. 高级特性与操作

#### 3.1 请求转发（Forward）

请求转发是服务器内部的行为。一个 Servlet 将请求转发给服务器上的另一个资源（如另一个 Servlet、JSP 页面）进行处理，客户端浏览器感知不到这次转发，地址栏 URL 不会改变。

```java
RequestDispatcher dispatcher = request.getRequestDispatcher("/path/to/target");
dispatcher.forward(request, response);
```

#### 3.2 会话管理（Session）

`HttpServletRequest` 可以获取与当前请求关联的 `HttpSession` 对象，用于在多次请求间维护用户状态。

```java
// 获取 session，如果不存在则创建一个新的
HttpSession session = request.getSession();
// 获取 session，如果不存在则返回 null
HttpSession session = request.getSession(false);
// 在 session 中存储和获取数据
session.setAttribute("currentUser", userObject);
User user = (User) session.getAttribute("currentUser");
```

### 4. 常见问题与最佳实践

#### 4.1 中文乱码处理

**POST 请求** ：
在获取任何参数 **之前** ，设置请求体的字符编码。

```java
request.setCharacterEncoding("UTF-8"); // 必须放在第一行！
String name = request.getParameter("name");
```

**GET 请求（传统方式，Tomcat 8.5+ 通常无需此操作）** ：

```java
// 旧版本 Tomcat 可能需要手动转换
String name = new String(request.getParameter("name").getBytes("ISO-8859-1"), "UTF-8");
*现代 Servlet 容器（如 Tomcat 8.5+）通常默认使用 UTF-8 解码 GET 请求参数。*
```

**读取请求体并转为实体** ：

```java
    // deprecated 不建议使用，请求体只能读一次，要反复读需要包装(wrap)
    public Authorization getAuthorizationFromRequest(HttpServletRequest request) {
        Authorization authorization = null;
        try {
            // 从 HttpServletRequest 中读取请求体
            StringBuilder stringBuilder = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                stringBuilder.append(line);
            }
            String requestBodyJson = stringBuilder.toString();
            // 解析 JSON
            authorization = JSONUtil.toBean(requestBodyJson, Authorization.class);
        } catch (Exception e) {
            log.error("auth-s-解析登录体出错，请求体为空");
            return null;
        }
        return authorization;
    }
```

#### 4.2 请求参数 vs. 请求属性

| 特性 | 请求参数（Parameter） | 请求属性（Attribute） |
|:---|:---|:---|
| **来源** | 来自 **客户端** （URL 查询字符串或表单体）。 | 由 **服务器端** 程序（Servlet、Filter）设置。 |
| **类型** | 永远是 `String` 或 `String[]` 。 | 可以是任意 Java 对象（ `Object` ）。 |
| **生命周期** | 在一次请求中有效。 | 在一次请求转发链中有效。 |
| **主要用途** | 获取用户提交的数据。 | 在服务器内部组件间传递数据。 |

#### 4.3 线程安全性

`HttpServletRequest` 和 `HttpServletResponse` 对象是 **非线程安全** 的。但是，Servlet 容器会为每个请求创建 **独立的** request 和 response 对象，并在一个独立的线程中处理。因此，在你的 Servlet 方法中，可以将它们视为 **局部变量** 安全使用，但应避免尝试在多线程间共享这些对象。

### 5. 在 Spring 框架中的使用

在 Spring MVC 中，通常不需要直接操作 `HttpServletRequest` ，而是使用更高级的注解来获取数据。

```java
@RestController
public class MyController {
// 1. 直接获取参数
@GetMapping("/user")
public String getUser(@RequestParam String username) {
return "User: " + username;
}
// 2. 获取请求头
@GetMapping("/header")
public String getHeader(@RequestHeader("User-Agent") String userAgent) {
    return "User-Agent: " + userAgent;
}

// 3. 获取请求体（如 JSON）
@PostMapping("/user")
public String createUser(@RequestBody User user) {
    // 处理 user 对象
    return "User created";
}

// 4. 需要时，仍然可以注入 HttpServletRequest
@GetMapping("/ip")
public String getIp(HttpServletRequest request) {
    return "Client IP: " + request.getRemoteAddr();
}
}
```

### 总结

`HttpServletRequest` 是 Java Web 开发的基石，它提供了完整且强大的 API 来访问和处理 HTTP 请求。理解其各种方法的适用场景、生命周期以及如何正确处理字符编码等问题，是构建健壮 Web 应用的关键。在现代框架如 Spring MVC 中，虽然很多细节被封装，但其底层原理依然依赖于 `HttpServletRequest` 。
希望这份详细的文档对您有帮助！

一些关于Cookie的笔记：

```java
/**
 * UuID.randomUuID().toString().substring(0, 8) 的作用解析：
 * Universally Unique Identifier，通用唯一识别码
 * 此表达式分步执行以下操作：
 * 1. UuID.randomUuID()：生成一个随机的 UuID（版本 4），该 UuID 基于伪随机数生成，保证在空间和时间上的全局唯一性。[4,6](@ref)
 * 2. .toString()：将 UuID 对象转换为标准字符串格式（36 字符，含连字符），例如 "550e8400-e29b-11d4-a716-446655440000"。[1,5](@ref)
 * 3. .substring(0, 8)：截取字符串的前 8 个字符（例如得到 "550e8400"），生成一个较短的标识符。此举旨在减少存储空间和传输开销，但可能略微增加重复概率。[1,2](@ref)
 * --
 * 适用场景：
 * - 需要短唯一标识符的业务逻辑（如生成临时用户账号、短链编码）。
 * - 对唯一性要求不是极端严格的场景（前 8 位字符在有限范围内仍具较高唯一性）。[1](@ref)
 * --
 * UuID 常用方法及参数详解：
 * | 方法名                          | 作用描述                                                                 | 参数说明                                                                 | 返回值       |
 * |---------------------------------|--------------------------------------------------------------------------|--------------------------------------------------------------------------|--------------|
 * | `UuID.randomUuID()`             | 生成版本 4（随机数-based）的 UuID 实例                                    | 无参数                                                                   | UuID 对象    |
 * | `uuID.toString()`               | 将 UuID 转换为 36 字符字符串（含连字符）                                  | 无参数                                                                   | String       |
 * | `UuID.fromString(String name)`  | 从字符串解析 UuID（格式必须为 "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"）   | `name`：符合 UuID 格式的字符串                                          | UuID 对象    |
 * | `uuID.version()`               | 返回 UuID 的版本号（如版本 4 返回 4）                                     | 无参数                                                                   | int          |
 * | `uuID.variant()`                | 返回 UuID 的变体号（如 Leach-Salz 变体返回 2）                            | 无参数                                                                   | int          |
 * | `UuID.nameUuIDFromBytes(byte[] name)` | 基于字节数组生成版本 3（MD5-based）的 UuID                         | `name`：用于生成 UuID 的字节数组                                        | UuID 对象    |
 * --
 * 注意事项：
 * - 截取前 8 位字符会降低唯一性保障，仅适用于非关键场景。若需要更高唯一性，可考虑截取更长字串（如 16 位）或使用全 UuID。[1](@ref)
 * - 对于高安全性需求（如令牌生成），建议使用完整的 UuID 或专用安全库（如 SecureRandom）。[9](@ref)
 * <p>
 * 设置HttpOnly Cookie
 * --
 * Cookie 类详解 (javax.servlet.http.Cookie)
 * - 作用：在客户端存储小型数据片段，随每次请求自动发送至服务器，解决HTTP无状态问题
 * - 核心属性表：
 * | 属性名     | 类型    | 默认值   | 作用说明                                                                 | 示例值                      |
 * |-----------|---------|----------|-------------------------------------------------------------------------|-----------------------------|
 * | Name      | String  | 必需设置 | Cookie标识名称，需唯一                                                   | "access-token"              |
 * | Value     | String  | 必需设置 | 存储的数据值，不宜超4KB，避免敏感信息                                     | JWT令牌字符串                |
 * | Domain    | String  | 当前域名 | 指定哪些域名可访问此Cookie，以"."开头表示包含子域名                       | ".example.com"              |
 * | Path      | String  | 当前路径 | 指定Cookie的有效URL路径，"/"表示全站有效                                 | "/"                         |
 * | Max-Age   | int     | -1       | 存活时间(秒)，-1=会话级(浏览器关闭失效)，0=删除，正数=持久化时间           | 86400 (1天)                 |
 * | Secure    | boolean | false    | true=仅HTTPS传输，生产环境必须设为true                                  | true                        |
 * | HttpOnly  | boolean | false    | true=阻止JavaScript访问，防XSS攻击                                      | true                        |
 * | SameSite  | String  | 无       | 防CSRF攻击，值：Strict/Lax/None                                        | "Lax"                       |
 * --
 * HttpServletResponse 接口详解
 * - 作用：封装服务器响应信息，包含状态码、头部字段、Cookie等
 * - 常用方法分类：
 * | 方法类别          | 核心方法                                                                 | 作用说明                                     |
 * |-------------------|--------------------------------------------------------------------------|---------------------------------------------|
 * | Cookie操作        | addCookie(Cookie cookie)                                                  | 添加Cookie到响应头(本方法核心)               |
 * | 状态码设置        | setStatus(int sc), sendError(int sc)                                      | 设置HTTP响应状态码                           |
 * | 响应头设置        | setHeader(String name, String value), addHeader()                         | 设置单个/多个响应头                          |
 * | 内容类型设置      | setContentType(String type), setCharacterEncoding(String charset)         | 设置MIME类型和编码，解决中文乱码              |
 * | 输出流获取        | getOutputStream(), getWriter()                                            | 获取字节流/字符流向客户端输出数据            |
 * | 重定向控制        | sendRedirect(String location)                                             | 实现请求重定向                               |
 * --
 * 安全设置最佳实践：
 * 1. 敏感数据需加密存储，避免直接暴露用户信息
 * 2. 生产环境务必设置Secure=true（仅HTTPS传输）
 * 3. 合理设置Max-Age，避免过长的有效期增加安全风险
 * 4. 重要Cookie应同时启用HttpOnly和SameSite防护
 *
 * @param response HttpServletResponse对象，用于向客户端发送Cookie和响应信息
 * @param token    要存储的JWT令牌值，建议加密后存储
 * <p>
 * 设置HttpOnly Cookie
 * --
 * Cookie 类详解 (javax.servlet.http.Cookie)
 * - 作用：在客户端存储小型数据片段，随每次请求自动发送至服务器，解决HTTP无状态问题
 * - 核心属性表：
 * | 属性名     | 类型    | 默认值   | 作用说明                                                                 | 示例值                      |
 * |-----------|---------|----------|-------------------------------------------------------------------------|-----------------------------|
 * | Name      | String  | 必需设置 | Cookie标识名称，需唯一                                                   | "access-token"              |
 * | Value     | String  | 必需设置 | 存储的数据值，不宜超4KB，避免敏感信息                                     | JWT令牌字符串                |
 * | Domain    | String  | 当前域名 | 指定哪些域名可访问此Cookie，以"."开头表示包含子域名                       | ".example.com"              |
 * | Path      | String  | 当前路径 | 指定Cookie的有效URL路径，"/"表示全站有效                                 | "/"                         |
 * | Max-Age   | int     | -1       | 存活时间(秒)，-1=会话级(浏览器关闭失效)，0=删除，正数=持久化时间           | 86400 (1天)                 |
 * | Secure    | boolean | false    | true=仅HTTPS传输，生产环境必须设为true                                  | true                        |
 * | HttpOnly  | boolean | false    | true=阻止JavaScript访问，防XSS攻击                                      | true                        |
 * | SameSite  | String  | 无       | 防CSRF攻击，值：Strict/Lax/None                                        | "Lax"                       |
 * --
 * HttpServletResponse 接口详解
 * - 作用：封装服务器响应信息，包含状态码、头部字段、Cookie等
 * - 常用方法分类：
 * | 方法类别          | 核心方法                                                                 | 作用说明                                     |
 * |-------------------|--------------------------------------------------------------------------|---------------------------------------------|
 * | Cookie操作        | addCookie(Cookie cookie)                                                  | 添加Cookie到响应头(本方法核心)               |
 * | 状态码设置        | setStatus(int sc), sendError(int sc)                                      | 设置HTTP响应状态码                           |
 * | 响应头设置        | setHeader(String name, String value), addHeader()                         | 设置单个/多个响应头                          |
 * | 内容类型设置      | setContentType(String type), setCharacterEncoding(String charset)         | 设置MIME类型和编码，解决中文乱码              |
 * | 输出流获取        | getOutputStream(), getWriter()                                            | 获取字节流/字符流向客户端输出数据            |
 * | 重定向控制        | sendRedirect(String location)                                             | 实现请求重定向                               |
 * --
 * 安全设置最佳实践：
 * 1. 敏感数据需加密存储，避免直接暴露用户信息
 * 2. 生产环境务必设置Secure=true（仅HTTPS传输）
 * 3. 合理设置Max-Age，避免过长的有效期增加安全风险
 * 4. 重要Cookie应同时启用HttpOnly和SameSite防护
 * @param response HttpServletResponse对象，用于向客户端发送Cookie和响应信息
 * @param token    要存储的JWT令牌值，建议加密后存储
 * <p>
 * 设置HttpOnly Cookie
 * --
 * Cookie 类详解 (javax.servlet.http.Cookie)
 * - 作用：在客户端存储小型数据片段，随每次请求自动发送至服务器，解决HTTP无状态问题
 * - 核心属性表：
 * | 属性名     | 类型    | 默认值   | 作用说明                                                                 | 示例值                      |
 * |-----------|---------|----------|-------------------------------------------------------------------------|-----------------------------|
 * | Name      | String  | 必需设置 | Cookie标识名称，需唯一                                                   | "access-token"              |
 * | Value     | String  | 必需设置 | 存储的数据值，不宜超4KB，避免敏感信息                                     | JWT令牌字符串                |
 * | Domain    | String  | 当前域名 | 指定哪些域名可访问此Cookie，以"."开头表示包含子域名                       | ".example.com"              |
 * | Path      | String  | 当前路径 | 指定Cookie的有效URL路径，"/"表示全站有效                                 | "/"                         |
 * | Max-Age   | int     | -1       | 存活时间(秒)，-1=会话级(浏览器关闭失效)，0=删除，正数=持久化时间           | 86400 (1天)                 |
 * | Secure    | boolean | false    | true=仅HTTPS传输，生产环境必须设为true                                  | true                        |
 * | HttpOnly  | boolean | false    | true=阻止JavaScript访问，防XSS攻击                                      | true                        |
 * | SameSite  | String  | 无       | 防CSRF攻击，值：Strict/Lax/None                                        | "Lax"                       |
 * --
 * HttpServletResponse 接口详解
 * - 作用：封装服务器响应信息，包含状态码、头部字段、Cookie等
 * - 常用方法分类：
 * | 方法类别          | 核心方法                                                                 | 作用说明                                     |
 * |-------------------|--------------------------------------------------------------------------|---------------------------------------------|
 * | Cookie操作        | addCookie(Cookie cookie)                                                  | 添加Cookie到响应头(本方法核心)               |
 * | 状态码设置        | setStatus(int sc), sendError(int sc)                                      | 设置HTTP响应状态码                           |
 * | 响应头设置        | setHeader(String name, String value), addHeader()                         | 设置单个/多个响应头                          |
 * | 内容类型设置      | setContentType(String type), setCharacterEncoding(String charset)         | 设置MIME类型和编码，解决中文乱码              |
 * | 输出流获取        | getOutputStream(), getWriter()                                            | 获取字节流/字符流向客户端输出数据            |
 * | 重定向控制        | sendRedirect(String location)                                             | 实现请求重定向                               |
 * --
 * 安全设置最佳实践：
 * 1. 敏感数据需加密存储，避免直接暴露用户信息
 * 2. 生产环境务必设置Secure=true（仅HTTPS传输）
 * 3. 合理设置Max-Age，避免过长的有效期增加安全风险
 * 4. 重要Cookie应同时启用HttpOnly和SameSite防护
 * @param response HttpServletResponse对象，用于向客户端发送Cookie和响应信息
 * @param token    要存储的JWT令牌值，建议加密后存储
 * <p>
 * 设置HttpOnly Cookie
 * --
 * Cookie 类详解 (javax.servlet.http.Cookie)
 * - 作用：在客户端存储小型数据片段，随每次请求自动发送至服务器，解决HTTP无状态问题
 * - 核心属性表：
 * | 属性名     | 类型    | 默认值   | 作用说明                                                                 | 示例值                      |
 * |-----------|---------|----------|-------------------------------------------------------------------------|-----------------------------|
 * | Name      | String  | 必需设置 | Cookie标识名称，需唯一                                                   | "access-token"              |
 * | Value     | String  | 必需设置 | 存储的数据值，不宜超4KB，避免敏感信息                                     | JWT令牌字符串                |
 * | Domain    | String  | 当前域名 | 指定哪些域名可访问此Cookie，以"."开头表示包含子域名                       | ".example.com"              |
 * | Path      | String  | 当前路径 | 指定Cookie的有效URL路径，"/"表示全站有效                                 | "/"                         |
 * | Max-Age   | int     | -1       | 存活时间(秒)，-1=会话级(浏览器关闭失效)，0=删除，正数=持久化时间           | 86400 (1天)                 |
 * | Secure    | boolean | false    | true=仅HTTPS传输，生产环境必须设为true                                  | true                        |
 * | HttpOnly  | boolean | false    | true=阻止JavaScript访问，防XSS攻击                                      | true                        |
 * | SameSite  | String  | 无       | 防CSRF攻击，值：Strict/Lax/None                                        | "Lax"                       |
 * --
 * HttpServletResponse 接口详解
 * - 作用：封装服务器响应信息，包含状态码、头部字段、Cookie等
 * - 常用方法分类：
 * | 方法类别          | 核心方法                                                                 | 作用说明                                     |
 * |-------------------|--------------------------------------------------------------------------|---------------------------------------------|
 * | Cookie操作        | addCookie(Cookie cookie)                                                  | 添加Cookie到响应头(本方法核心)               |
 * | 状态码设置        | setStatus(int sc), sendError(int sc)                                      | 设置HTTP响应状态码                           |
 * | 响应头设置        | setHeader(String name, String value), addHeader()                         | 设置单个/多个响应头                          |
 * | 内容类型设置      | setContentType(String type), setCharacterEncoding(String charset)         | 设置MIME类型和编码，解决中文乱码              |
 * | 输出流获取        | getOutputStream(), getWriter()                                            | 获取字节流/字符流向客户端输出数据            |
 * | 重定向控制        | sendRedirect(String location)                                             | 实现请求重定向                               |
 * --
 * 安全设置最佳实践：
 * 1. 敏感数据需加密存储，避免直接暴露用户信息
 * 2. 生产环境务必设置Secure=true（仅HTTPS传输）
 * 3. 合理设置Max-Age，避免过长的有效期增加安全风险
 * 4. 重要Cookie应同时启用HttpOnly和SameSite防护
 * @param response HttpServletResponse对象，用于向客户端发送Cookie和响应信息
 * @param token    要存储的JWT令牌值，建议加密后存储
 * <p>
 * 设置HttpOnly Cookie
 * --
 * Cookie 类详解 (javax.servlet.http.Cookie)
 * - 作用：在客户端存储小型数据片段，随每次请求自动发送至服务器，解决HTTP无状态问题
 * - 核心属性表：
 * | 属性名     | 类型    | 默认值   | 作用说明                                                                 | 示例值                      |
 * |-----------|---------|----------|-------------------------------------------------------------------------|-----------------------------|
 * | Name      | String  | 必需设置 | Cookie标识名称，需唯一                                                   | "access-token"              |
 * | Value     | String  | 必需设置 | 存储的数据值，不宜超4KB，避免敏感信息                                     | JWT令牌字符串                |
 * | Domain    | String  | 当前域名 | 指定哪些域名可访问此Cookie，以"."开头表示包含子域名                       | ".example.com"              |
 * | Path      | String  | 当前路径 | 指定Cookie的有效URL路径，"/"表示全站有效                                 | "/"                         |
 * | Max-Age   | int     | -1       | 存活时间(秒)，-1=会话级(浏览器关闭失效)，0=删除，正数=持久化时间           | 86400 (1天)                 |
 * | Secure    | boolean | false    | true=仅HTTPS传输，生产环境必须设为true                                  | true                        |
 * | HttpOnly  | boolean | false    | true=阻止JavaScript访问，防XSS攻击                                      | true                        |
 * | SameSite  | String  | 无       | 防CSRF攻击，值：Strict/Lax/None                                        | "Lax"                       |
 * --
 * HttpServletResponse 接口详解
 * - 作用：封装服务器响应信息，包含状态码、头部字段、Cookie等
 * - 常用方法分类：
 * | 方法类别          | 核心方法                                                                 | 作用说明                                     |
 * |-------------------|--------------------------------------------------------------------------|---------------------------------------------|
 * | Cookie操作        | addCookie(Cookie cookie)                                                  | 添加Cookie到响应头(本方法核心)               |
 * | 状态码设置        | setStatus(int sc), sendError(int sc)                                      | 设置HTTP响应状态码                           |
 * | 响应头设置        | setHeader(String name, String value), addHeader()                         | 设置单个/多个响应头                          |
 * | 内容类型设置      | setContentType(String type), setCharacterEncoding(String charset)         | 设置MIME类型和编码，解决中文乱码              |
 * | 输出流获取        | getOutputStream(), getWriter()                                            | 获取字节流/字符流向客户端输出数据            |
 * | 重定向控制        | sendRedirect(String location)                                             | 实现请求重定向                               |
 * --
 * 安全设置最佳实践：
 * 1. 敏感数据需加密存储，避免直接暴露用户信息
 * 2. 生产环境务必设置Secure=true（仅HTTPS传输）
 * 3. 合理设置Max-Age，避免过长的有效期增加安全风险
 * 4. 重要Cookie应同时启用HttpOnly和SameSite防护
 * @param response HttpServletResponse对象，用于向客户端发送Cookie和响应信息
 * @param token    要存储的JWT令牌值，建议加密后存储
 * <p>
 * 设置HttpOnly Cookie
 * --
 * Cookie 类详解 (javax.servlet.http.Cookie)
 * - 作用：在客户端存储小型数据片段，随每次请求自动发送至服务器，解决HTTP无状态问题
 * - 核心属性表：
 * | 属性名     | 类型    | 默认值   | 作用说明                                                                 | 示例值                      |
 * |-----------|---------|----------|-------------------------------------------------------------------------|-----------------------------|
 * | Name      | String  | 必需设置 | Cookie标识名称，需唯一                                                   | "access-token"              |
 * | Value     | String  | 必需设置 | 存储的数据值，不宜超4KB，避免敏感信息                                     | JWT令牌字符串                |
 * | Domain    | String  | 当前域名 | 指定哪些域名可访问此Cookie，以"."开头表示包含子域名                       | ".example.com"              |
 * | Path      | String  | 当前路径 | 指定Cookie的有效URL路径，"/"表示全站有效                                 | "/"                         |
 * | Max-Age   | int     | -1       | 存活时间(秒)，-1=会话级(浏览器关闭失效)，0=删除，正数=持久化时间           | 86400 (1天)                 |
 * | Secure    | boolean | false    | true=仅HTTPS传输，生产环境必须设为true                                  | true                        |
 * | HttpOnly  | boolean | false    | true=阻止JavaScript访问，防XSS攻击                                      | true                        |
 * | SameSite  | String  | 无       | 防CSRF攻击，值：Strict/Lax/None                                        | "Lax"                       |
 * --
 * HttpServletResponse 接口详解
 * - 作用：封装服务器响应信息，包含状态码、头部字段、Cookie等
 * - 常用方法分类：
 * | 方法类别          | 核心方法                                                                 | 作用说明                                     |
 * |-------------------|--------------------------------------------------------------------------|---------------------------------------------|
 * | Cookie操作        | addCookie(Cookie cookie)                                                  | 添加Cookie到响应头(本方法核心)               |
 * | 状态码设置        | setStatus(int sc), sendError(int sc)                                      | 设置HTTP响应状态码                           |
 * | 响应头设置        | setHeader(String name, String value), addHeader()                         | 设置单个/多个响应头                          |
 * | 内容类型设置      | setContentType(String type), setCharacterEncoding(String charset)         | 设置MIME类型和编码，解决中文乱码              |
 * | 输出流获取        | getOutputStream(), getWriter()                                            | 获取字节流/字符流向客户端输出数据            |
 * | 重定向控制        | sendRedirect(String location)                                             | 实现请求重定向                               |
 * --
 * 安全设置最佳实践：
 * 1. 敏感数据需加密存储，避免直接暴露用户信息
 * 2. 生产环境务必设置Secure=true（仅HTTPS传输）
 * 3. 合理设置Max-Age，避免过长的有效期增加安全风险
 * 4. 重要Cookie应同时启用HttpOnly和SameSite防护
 * @param response HttpServletResponse对象，用于向客户端发送Cookie和响应信息
 * @param token    要存储的JWT令牌值，建议加密后存储
 * <p>
 * 设置HttpOnly Cookie
 * --
 * Cookie 类详解 (javax.servlet.http.Cookie)
 * - 作用：在客户端存储小型数据片段，随每次请求自动发送至服务器，解决HTTP无状态问题
 * - 核心属性表：
 * | 属性名     | 类型    | 默认值   | 作用说明                                                                 | 示例值                      |
 * |-----------|---------|----------|-------------------------------------------------------------------------|-----------------------------|
 * | Name      | String  | 必需设置 | Cookie标识名称，需唯一                                                   | "access-token"              |
 * | Value     | String  | 必需设置 | 存储的数据值，不宜超4KB，避免敏感信息                                     | JWT令牌字符串                |
 * | Domain    | String  | 当前域名 | 指定哪些域名可访问此Cookie，以"."开头表示包含子域名                       | ".example.com"              |
 * | Path      | String  | 当前路径 | 指定Cookie的有效URL路径，"/"表示全站有效                                 | "/"                         |
 * | Max-Age   | int     | -1       | 存活时间(秒)，-1=会话级(浏览器关闭失效)，0=删除，正数=持久化时间           | 86400 (1天)                 |
 * | Secure    | boolean | false    | true=仅HTTPS传输，生产环境必须设为true                                  | true                        |
 * | HttpOnly  | boolean | false    | true=阻止JavaScript访问，防XSS攻击                                      | true                        |
 * | SameSite  | String  | 无       | 防CSRF攻击，值：Strict/Lax/None                                        | "Lax"                       |
 * --
 * HttpServletResponse 接口详解
 * - 作用：封装服务器响应信息，包含状态码、头部字段、Cookie等
 * - 常用方法分类：
 * | 方法类别          | 核心方法                                                                 | 作用说明                                     |
 * |-------------------|--------------------------------------------------------------------------|---------------------------------------------|
 * | Cookie操作        | addCookie(Cookie cookie)                                                  | 添加Cookie到响应头(本方法核心)               |
 * | 状态码设置        | setStatus(int sc), sendError(int sc)                                      | 设置HTTP响应状态码                           |
 * | 响应头设置        | setHeader(String name, String value), addHeader()                         | 设置单个/多个响应头                          |
 * | 内容类型设置      | setContentType(String type), setCharacterEncoding(String charset)         | 设置MIME类型和编码，解决中文乱码              |
 * | 输出流获取        | getOutputStream(), getWriter()                                            | 获取字节流/字符流向客户端输出数据            |
 * | 重定向控制        | sendRedirect(String location)                                             | 实现请求重定向                               |
 * --
 * 安全设置最佳实践：
 * 1. 敏感数据需加密存储，避免直接暴露用户信息
 * 2. 生产环境务必设置Secure=true（仅HTTPS传输）
 * 3. 合理设置Max-Age，避免过长的有效期增加安全风险
 * 4. 重要Cookie应同时启用HttpOnly和SameSite防护
 * @param response HttpServletResponse对象，用于向客户端发送Cookie和响应信息
 * @param token    要存储的JWT令牌值，建议加密后存储
 * <p>
 * 设置HttpOnly Cookie
 * --
 * Cookie 类详解 (javax.servlet.http.Cookie)
 * - 作用：在客户端存储小型数据片段，随每次请求自动发送至服务器，解决HTTP无状态问题
 * - 核心属性表：
 * | 属性名     | 类型    | 默认值   | 作用说明                                                                 | 示例值                      |
 * |-----------|---------|----------|-------------------------------------------------------------------------|-----------------------------|
 * | Name      | String  | 必需设置 | Cookie标识名称，需唯一                                                   | "access-token"              |
 * | Value     | String  | 必需设置 | 存储的数据值，不宜超4KB，避免敏感信息                                     | JWT令牌字符串                |
 * | Domain    | String  | 当前域名 | 指定哪些域名可访问此Cookie，以"."开头表示包含子域名                       | ".example.com"              |
 * | Path      | String  | 当前路径 | 指定Cookie的有效URL路径，"/"表示全站有效                                 | "/"                         |
 * | Max-Age   | int     | -1       | 存活时间(秒)，-1=会话级(浏览器关闭失效)，0=删除，正数=持久化时间           | 86400 (1天)                 |
 * | Secure    | boolean | false    | true=仅HTTPS传输，生产环境必须设为true                                  | true                        |
 * | HttpOnly  | boolean | false    | true=阻止JavaScript访问，防XSS攻击                                      | true                        |
 * | SameSite  | String  | 无       | 防CSRF攻击，值：Strict/Lax/None                                        | "Lax"                       |
 * --
 * HttpServletResponse 接口详解
 * - 作用：封装服务器响应信息，包含状态码、头部字段、Cookie等
 * - 常用方法分类：
 * | 方法类别          | 核心方法                                                                 | 作用说明                                     |
 * |-------------------|--------------------------------------------------------------------------|---------------------------------------------|
 * | Cookie操作        | addCookie(Cookie cookie)                                                  | 添加Cookie到响应头(本方法核心)               |
 * | 状态码设置        | setStatus(int sc), sendError(int sc)                                      | 设置HTTP响应状态码                           |
 * | 响应头设置        | setHeader(String name, String value), addHeader()                         | 设置单个/多个响应头                          |
 * | 内容类型设置      | setContentType(String type), setCharacterEncoding(String charset)         | 设置MIME类型和编码，解决中文乱码              |
 * | 输出流获取        | getOutputStream(), getWriter()                                            | 获取字节流/字符流向客户端输出数据            |
 * | 重定向控制        | sendRedirect(String location)                                             | 实现请求重定向                               |
 * --
 * 安全设置最佳实践：
 * 1. 敏感数据需加密存储，避免直接暴露用户信息
 * 2. 生产环境务必设置Secure=true（仅HTTPS传输）
 * 3. 合理设置Max-Age，避免过长的有效期增加安全风险
 * 4. 重要Cookie应同时启用HttpOnly和SameSite防护
 * @param response HttpServletResponse对象，用于向客户端发送Cookie和响应信息
 * @param token    要存储的JWT令牌值，建议加密后存储
 * <p>
 * 设置HttpOnly Cookie
 * --
 * Cookie 类详解 (javax.servlet.http.Cookie)
 * - 作用：在客户端存储小型数据片段，随每次请求自动发送至服务器，解决HTTP无状态问题
 * - 核心属性表：
 * | 属性名     | 类型    | 默认值   | 作用说明                                                                 | 示例值                      |
 * |-----------|---------|----------|-------------------------------------------------------------------------|-----------------------------|
 * | Name      | String  | 必需设置 | Cookie标识名称，需唯一                                                   | "access-token"              |
 * | Value     | String  | 必需设置 | 存储的数据值，不宜超4KB，避免敏感信息                                     | JWT令牌字符串                |
 * | Domain    | String  | 当前域名 | 指定哪些域名可访问此Cookie，以"."开头表示包含子域名                       | ".example.com"              |
 * | Path      | String  | 当前路径 | 指定Cookie的有效URL路径，"/"表示全站有效                                 | "/"                         |
 * | Max-Age   | int     | -1       | 存活时间(秒)，-1=会话级(浏览器关闭失效)，0=删除，正数=持久化时间           | 86400 (1天)                 |
 * | Secure    | boolean | false    | true=仅HTTPS传输，生产环境必须设为true                                  | true                        |
 * | HttpOnly  | boolean | false    | true=阻止JavaScript访问，防XSS攻击                                      | true                        |
 * | SameSite  | String  | 无       | 防CSRF攻击，值：Strict/Lax/None                                        | "Lax"                       |
 * --
 * HttpServletResponse 接口详解
 * - 作用：封装服务器响应信息，包含状态码、头部字段、Cookie等
 * - 常用方法分类：
 * | 方法类别          | 核心方法                                                                 | 作用说明                                     |
 * |-------------------|--------------------------------------------------------------------------|---------------------------------------------|
 * | Cookie操作        | addCookie(Cookie cookie)                                                  | 添加Cookie到响应头(本方法核心)               |
 * | 状态码设置        | setStatus(int sc), sendError(int sc)                                      | 设置HTTP响应状态码                           |
 * | 响应头设置        | setHeader(String name, String value), addHeader()                         | 设置单个/多个响应头                          |
 * | 内容类型设置      | setContentType(String type), setCharacterEncoding(String charset)         | 设置MIME类型和编码，解决中文乱码              |
 * | 输出流获取        | getOutputStream(), getWriter()                                            | 获取字节流/字符流向客户端输出数据            |
 * | 重定向控制        | sendRedirect(String location)                                             | 实现请求重定向                               |
 * --
 * 安全设置最佳实践：
 * 1. 敏感数据需加密存储，避免直接暴露用户信息
 * 2. 生产环境务必设置Secure=true（仅HTTPS传输）
 * 3. 合理设置Max-Age，避免过长的有效期增加安全风险
 * 4. 重要Cookie应同时启用HttpOnly和SameSite防护
 * @param response HttpServletResponse对象，用于向客户端发送Cookie和响应信息
 * @param token    要存储的JWT令牌值，建议加密后存储
 */

/**
 * 设置HttpOnly Cookie
 * --
 * Cookie 类详解 (javax.servlet.http.Cookie)
 * - 作用：在客户端存储小型数据片段，随每次请求自动发送至服务器，解决HTTP无状态问题
 * - 核心属性表：
 * | 属性名     | 类型    | 默认值   | 作用说明                                                                 | 示例值                      |
 * |-----------|---------|----------|-------------------------------------------------------------------------|-----------------------------|
 * | Name      | String  | 必需设置 | Cookie标识名称，需唯一                                                   | "access-token"              |
 * | Value     | String  | 必需设置 | 存储的数据值，不宜超4KB，避免敏感信息                                     | JWT令牌字符串                |
 * | Domain    | String  | 当前域名 | 指定哪些域名可访问此Cookie，以"."开头表示包含子域名                       | ".example.com"              |
 * | Path      | String  | 当前路径 | 指定Cookie的有效URL路径，"/"表示全站有效                                 | "/"                         |
 * | Max-Age   | int     | -1       | 存活时间(秒)，-1=会话级(浏览器关闭失效)，0=删除，正数=持久化时间           | 86400 (1天)                 |
 * | Secure    | boolean | false    | true=仅HTTPS传输，生产环境必须设为true                                  | true                        |
 * | HttpOnly  | boolean | false    | true=阻止JavaScript访问，防XSS攻击                                      | true                        |
 * | SameSite  | String  | 无       | 防CSRF攻击，值：Strict/Lax/None                                        | "Lax"                       |
 * --
 * HttpServletResponse 接口详解
 * - 作用：封装服务器响应信息，包含状态码、头部字段、Cookie等
 * - 常用方法分类：
 * | 方法类别          | 核心方法                                                                 | 作用说明                                     |
 * |-------------------|--------------------------------------------------------------------------|---------------------------------------------|
 * | Cookie操作        | addCookie(Cookie cookie)                                                  | 添加Cookie到响应头(本方法核心)               |
 * | 状态码设置        | setStatus(int sc), sendError(int sc)                                      | 设置HTTP响应状态码                           |
 * | 响应头设置        | setHeader(String name, String value), addHeader()                         | 设置单个/多个响应头                          |
 * | 内容类型设置      | setContentType(String type), setCharacterEncoding(String charset)         | 设置MIME类型和编码，解决中文乱码              |
 * | 输出流获取        | getOutputStream(), getWriter()                                            | 获取字节流/字符流向客户端输出数据            |
 * | 重定向控制        | sendRedirect(String location)                                             | 实现请求重定向                               |
 * --
 * 安全设置最佳实践：
 * 1. 敏感数据需加密存储，避免直接暴露用户信息
 * 2. 生产环境务必设置Secure=true（仅HTTPS传输）
 * 3. 合理设置Max-Age，避免过长的有效期增加安全风险
 * 4. 重要Cookie应同时启用HttpOnly和SameSite防护
 *
 * @param response HttpServletResponse对象，用于向客户端发送Cookie和响应信息
 * @param token    要存储的JWT令牌值，建议加密后存储
 */
```