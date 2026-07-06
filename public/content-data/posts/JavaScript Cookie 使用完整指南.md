---
title: "JavaScript Cookie 使用完整指南"
date: 2025-11-24 02:49:20
category: "全栈技术栈"
tags:
- "javascript"
- "开发语言"
---

## JavaScript Cookie 使用完整指南

### 1. Cookie 基本概念与重要性

#### 1.1 什么是 Cookie

Cookie 是存储在用户浏览器中的小型文本数据（通常不超过 4KB），用于在客户端保存少量信息。当用户访问网站时，浏览器会将 Cookie 自动发送到服务器，从而实现状态管理。

**主要特点：** 

- 存储大小限制约为 **4KB**

- 会随每次 HTTP 请求发送到服务器（同域情况下）

- 有生命周期控制，可设置过期时间

- 支持路径和域名限制，保障安全性

#### 1.2 Cookie 的重要性

Cookie 在现代 Web 开发中扮演着重要角色，主要用于：

- **用户身份认证** ：存储登录状态和会话标识

- **个性化设置** ：保存用户偏好（如主题、语言）

- **行为追踪** ：记录用户交互数据用于分析

- **购物车功能** ：在电子商务网站中保持用户购物车状态

### 2. Cookie 基本操作

| 操作类别 | 方法描述 | 代码示例/语法 | 关键参数/说明 |
|:---:|:---:|:---:|:---:|
| **设置Cookie** | 创建或更新 Cookie | `document.cookie = "name=value; [attributes]"` | 基本格式： `name=value` 后接属性键值对，用分号分隔 |
| **设置过期时间** | 控制Cookie生命周期 | `expires=GMT_String` 或 `max-age=seconds` | `expires` 接受 GMT 格式时间字符串； `max-age` 设置相对当前时间的秒数 |
| **设置路径** | 控制Cookie可访问的路径 | `path=/path` | 默认为当前路径。设为 `path=/` 使 Cookie 在全站有效 |
| **设置域名** | 控制Cookie可访问的域名 | `domain=example.com` | 默认为当前域名。可设置父域实现子域共享 |
| **安全标志** | 增强安全性 | `Secure` 和 `HttpOnly` | `Secure` 仅限 HTTPS 传输； `HttpOnly` 阻止 JavaScript 访问（提升安全性，但设置后JS无法操作） |
| **SameSite属性** | 控制跨站请求发送 | `SameSite=Strict\|Lax\|None` | 防范 CSRF 攻击。设为 `None` 时需同时设置 `Secure` |
| **读取所有Cookie** | 获取当前可访问的所有Cookie | `const allCookies = document.cookie;` | 返回格式为 `"name1=value1; name2=value2"` 的字符串，需手动解析 |
| **读取特定Cookie** | 获取指定名称的Cookie值 | 手动解析字符串或使用封装函数 | 需要从 `document.cookie` 字符串中查找并提取 |
| **更新Cookie** | 修改已存在的Cookie | 同设置方法，保持名称、路径、域名不变即可覆盖 | 新值会覆盖旧值，其他属性需保持一致 |
| **删除Cookie** | 使Cookie立即失效 | 设置 `expires` 为过去时间或 `max-age` 为负值 | 推荐： `expires=Thu, 01 Jan 1970 00:00:00 GMT` |
| **使用js-cookie库** | 简化Cookie操作 | 引入库后使用简洁API | 设置： `Cookies.set('name', 'value', {options})` <br/>读取： `Cookies.get('name')` <br/>删除： `Cookies.remove('name')` |

#### 2.1 设置 Cookie

使用 `document.cookie` 属性设置 Cookie，可以包含名称、值、过期时间等参数 。

```javascript
// 基本设置
document.cookie = "username=JohnDoe";
// 设置带过期时间的 Cookie
const expirationDate = new Date();
expirationDate.setDate(expirationDate.getDate() + 7); // 7天后过期
document.cookie = username=JohnDoe; expires=${expirationDate.toUTCString()}; path=/;
```

#### 2.2 读取 Cookie

读取 `document.cookie` 会得到一个字符串，其中包含当前页面可访问的所有 Cookie。要获取特定值，需要手动解析。

```javascript
function getCookie(name) {
const nameEQ = name + "=";
const ca = document.cookie.split(';');
for (let i = 0; i < ca.length; i++) {
let c = ca[i];
while (c.charAt(0) === ' ') c = c.substring(1, c.length);
if (c.indexOf(nameEQ) === 0) {
return decodeURIComponent(c.substring(nameEQ.length, c.length));
}
}
return null;
}
// 使用示例
const username = getCookie("username");
console.log(username); // 输出 "JohnDoe"
```

#### 2.3 删除 Cookie

删除 Cookie 的本质是将该 Cookie 的过期时间设置为一个过去的日期。

```javascript
// 删除名为 "username" 的 Cookie
document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
```

#### 2.4 完整工具函数

以下是一套完整的 Cookie 操作工具函数 ：

```javascript
// 设置 Cookie
function setCookie(name, value, seconds, path = '/', domain, secure = false) {
    let cookieText = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    if (seconds) {
        cookieText += `; max-age=${seconds}`;
    }

    cookieText += `; path=${path}`;
    if (domain) cookieText += `; domain=${domain}`;
    if (secure) cookieText += '; secure';
    console.log(cookieText)
    document.cookie = cookieText;
}
// 获取 Cookie
function getCookie(name) {
    const nameEQ = encodeURIComponent(name) + "=";
    const cookieKV = document.cookie.split(';');
    for (let i = 0; i < cookieKV.length; i++) {
        let kv = cookieKV[i].trim();
        if (kv.indexOf(nameEQ) === 0) {
            return decodeURIComponent(kv.substring(nameEQ.length));
        }
    }
    return null;
}
// 删除 Cookie
function deleteCookie(name, path = '/', domain) {
    let cookieText = `${encodeURIComponent(name)}=; max-age=0; path=${path}`;
    if (domain) cookieText += `; domain=${domain}`;
    document.cookie = cookieText;
}

export {setCookie, getCookie, deleteCookie}
```

### 3. Cookie 属性详解

#### 3.1 过期时间（Expires/Max-Age）

控制 Cookie 的生命周期：

- **Expires** ：指定具体的过期时间（GMT 格式）

- **Max-Age** ：指定从设置开始的有效秒数

```javascript
// 使用 Expires
const expiresDate = new Date();
expiresDate.setFullYear(expiresDate.getFullYear() + 1);
document.cookie = username=JohnDoe; expires=${expiresDate.toUTCString()};
// 使用 Max-Age（优先级更高）
document.cookie = "username=JohnDoe; max-age=31536000"; // 1年有效
```

#### 3.2 路径（Path）和域（Domain）

控制 Cookie 的可访问范围 ：

```javascript
// 设置路径和域
document.cookie = "username=JohnDoe; path=/admin; domain=.example.com";
```

#### 3.3 安全标志

增强 Cookie 的安全性：

| 标志 | 作用 | 示例 |
|:---:|:---:|:---:|
| **Secure** | 仅通过 HTTPS 传输 | `document.cookie = "session=abc; secure"` |
| **HttpOnly** | 防止 JavaScript 访问（需服务器设置） | 服务器端设置 |
| **SameSite** | 控制跨站请求 Cookie 发送 | `SameSite=Strict\|Lax\|None` |
| javascript |   |   |
| // 安全 Cookie 设置示例 |   |   |
| document.cookie = “sessionId=abc123; secure; SameSite=Strict”; |   |   |

### 4. 使用 js-cookie 库

#### 4.1 安装和引入

```javascript
通过 npm 安装
npm install js-cookie

// 引入库
import Cookies from 'js-cookie';
```

#### 4.2 基本使用

```javascript
// 设置 Cookie
Cookies.set('username', 'JohnDoe', { expires: 7, path: '/', secure: true });
// 获取 Cookie
const username = Cookies.get('username');
// 删除 Cookie
Cookies.remove('username', { path: '/' });
// 设置 JSON 对象
Cookies.set('preferences', { theme: 'dark', language: 'zh-CN' }, { expires: 7 });
const prefs = Cookies.getJSON('preferences');
```

### 5. 实际应用场景

#### 5.1 用户登录状态保持

```javascript
// 登录成功后设置认证 Cookie
function setAuthCookie(userData) {
const expires = new Date();
expires.setDate(expires.getDate() + 30); // 30天有效期
document.cookie = `authToken=${userData.token}; expires=${expires.toUTCString()}; path=/; secure`;
document.cookie = `userInfo=${encodeURIComponent(JSON.stringify(userData))}; expires=${expires.toUTCString()}; path=/`;
}
// 检查登录状态
function checkAuth() {
const token = getCookie('authToken');
const userInfo = getCookie('userInfo');
if (token && userInfo) {
    return JSON.parse(decodeURIComponent(userInfo));
}
return null;
}
```

#### 5.2 用户偏好设置

```javascript
// 保存用户设置
function saveUserPreferences(settings) {
Cookies.set('userPrefs', settings, { expires: 365, path: '/' });
}
// 获取用户设置
function getUserPreferences() {
return Cookies.getJSON('userPrefs') || {
theme: 'light',
language: 'zh-CN',
notifications: true
};
}
```

#### 5.3 购物车功能

```javascript
// 添加商品到购物车
function addToCart(productId, quantity = 1) {
const cart = Cookies.getJSON('cart') || {};
cart[productId] = (cart[productId] || 0) + quantity;
Cookies.set('cart', cart, { expires: 7, path: '/' });
}
// 获取购物车内容
function getCart() {
return Cookies.getJSON('cart') || {};
}
// 清空购物车
function clearCart() {
Cookies.remove('cart', { path: '/' });
}
```

### 6. 安全最佳实践

#### 6.1 安全设置

```javascript
// 安全地设置认证 Cookie
document.cookie = [
authToken=${token},
'HttpOnly', // 防止 XSS 攻击
'Secure', // 仅 HTTPS 传输
'SameSite=Strict', // 防止 CSRF 攻击
'path=/',
domain=${window.location.hostname},
expires=${expiresDate.toUTCString()}
].join('; ');
```

#### 6.2 敏感数据处理

```javascript
// 对敏感数据进行加密
import CryptoJS from 'crypto-js';
function setEncryptedCookie(name, data, secretKey) {
const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
Cookies.set(name, encrypted, { secure: true, sameSite: 'strict' });
}
function getEncryptedCookie(name, secretKey) {
const encrypted = Cookies.get(name);
if (!encrypted) return null;
const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
```

### 7. 常见问题与解决方案

#### 7.1 Cookie 未正确设置

**问题原因：** 

- 路径或域名设置不正确

- 浏览器安全策略阻止

- 大小超过 4KB 限制

**解决方案：** 

```javascript
// 检查路径和域名
function debugCookie(name) {
console.log('All cookies:', document.cookie);
console.log('Cookie value:', getCookie(name));
}
// 确保使用正确的路径
document.cookie = test=value; path=/; domain=${window.location.hostname};
```

#### 7.2 跨域问题

```javascript
// 设置跨域 Cookie（需服务器配合）
document.cookie = "shared=value; domain=.example.com; path=/; SameSite=None; Secure";
// AJAX 请求携带 Cookie
fetch('/api/data', {
credentials: 'include', // 携带 Cookie
headers: {
'Content-Type': 'application/json'
}
});
```

#### 7.3 浏览器兼容性

```javascript
// 特性检测
function supportsCookies() {
try {
document.cookie = 'test=1';
return document.cookie.indexOf('test=') !== -1;
} catch (e) {
return false;
}
}
if (!supportsCookies()) {
// 降级方案：使用 localStorage 或 sessionStorage
console.warn('Cookies are disabled, using fallback storage');
}
```

### 8. 性能优化建议

#### 8.1 减少 Cookie 数量和大小

- 每个 Cookie 尽量小于 1KB

- 单个域名下 Cookie 数量控制在 20 个以内

- 避免在 Cookie 中存储大量数据

#### 8.2 合理设置过期时间

```javascript
// 根据使用场景设置不同的过期时间
const cookieConfigs = {
session: { expires: 0 }, // 会话期
shortTerm: { expires: 1 }, // 1天
longTerm: { expires: 30 }, // 30天
permanent: { expires: 365 } // 1年
};
Cookies.set('userPrefs', data, cookieConfigs.longTerm);
```

### 9. 与现代存储 API 的比较

| 存储方案 | 容量 | 生命周期 | 自动发送 | 适用场景 |
|:---:|:---:|:---:|:---:|:---:|
| **Cookie** | 4KB | 可设置 | 是 | 身份认证、会话管理 |
| **localStorage** | 5MB | 永久 | 否 | 用户偏好、缓存数据 |
| **sessionStorage** | 5MB | 会话期 | 否 | 页面级临时数据 |
| **IndexedDB** | 大量 | 永久 | 否 | 复杂结构化数据 |

### 10. 总结

JavaScript Cookie 是 Web 开发中不可或缺的重要技术，正确使用 Cookie 可以显著提升用户体验和应用安全性。通过掌握本文介绍的各项技术和最佳实践，您将能够：

1. **正确操作 Cookie** ：使用原生 API 或第三方库进行增删改查

2. **合理配置属性** ：根据需求设置过期时间、路径、安全标志等

3. **确保安全性** ：采用加密、HttpOnly、Secure 等安全措施

4. **优化性能** ：控制 Cookie 大小和数量，合理设置生命周期

5. **处理常见问题** ：解决跨域、兼容性、设置失败等问题

Cookie 技术虽然传统，但在用户认证、状态管理等方面仍然发挥着不可替代的作用。结合现代 Web 存储 API，可以构建出既安全又高效的前端数据存储方案 。
这份 Markdown 文档详细介绍了 JavaScript Cookie 的完整使用方法，涵盖了从基础概念到高级应用的所有方面。您可以直接将这份源码放入您的 Markdown 文档中使用。