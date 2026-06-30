---
title: "WebSocket 完整教程：从安装到实战"
date: 2026-02-18 04:42:06
category: "全栈技术栈"
tags:
- "websocket"
- "java"
---

## WebSocket 完整教程：从安装到实战

### 1. 简介

WebSocket 是一种在单个TCP连接上进行全双工通信的协议，允许服务器主动向客户端推送数据，非常适合需要实时交互的应用，如聊天室、实时通知、在线游戏等。

### 2. 环境与依赖安装

#### 2.1 后端 (以 Spring Boot + `spring-boot-starter-websocket` 为例)

##### Maven 依赖 ( `pom.xml` )

```xml
<dependencies>
	<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-web</artifactId>
	</dependency>
	
	<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-websocket</artifactId>
	</dependency>
	
	<dependency>
	<groupId>com.fasterxml.jackson.core</groupId>
	<artifactId>jackson-databind</artifactId>
	</dependency>
</dependencies>
```

#### 2.2 前端 (浏览器原生API)

前端无需安装额外库，现代浏览器均内置 `WebSocket` 对象。

### 3. 后端配置与实现 (Spring Boot)

#### 3.1 WebSocket 配置类

创建一个配置类，启用WebSocket并注册端点。

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
@Configuration
@EnableWebSocket // 启用WebSocket
public class WebSocketConfig implements WebSocketConfigurer {
@Override
public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    // 注册处理器和端点。
    // `withSockJS()` 提供了对不支持WebSocket浏览器的降级兼容。
    registry.addHandler(myWebSocketHandler(), "/ws")
            .setAllowedOrigins("*"); // 允许跨域，生产环境应指定具体域名
}

// 将处理器声明为Bean
public MyWebSocketHandler myWebSocketHandler() {
    return new MyWebSocketHandler();
}
}
```

#### 3.2 WebSocket 处理器 (Handler)

实现 `WebSocketHandler` 接口或继承 `TextWebSocketHandler` 来处理文本消息。

```java
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
public class MyWebSocketHandler extends TextWebSocketHandler {
// 存储所有活跃的会话 (线程安全)
private static final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

/**
 * 连接建立后触发
 */
@Override
public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    String sessionId = session.getId();
    sessions.put(sessionId, session);
    System.out.println("客户端连接成功，会话ID: " + sessionId + "，当前在线: " + sessions.size());
    // 可选：向客户端发送欢迎消息
    session.sendMessage(new TextMessage("{\"type\":\"welcome\",\"msg\":\"连接服务器成功！\"}"));
}

/**
 * 接收客户端消息时触发
 */
@Override
protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
    String payload = message.getPayload(); // 获取客户端发送的消息内容
    System.out.println("收到来自 " + session.getId() + " 的消息: " + payload);

    // 示例：简单回显消息给发送者
    // session.sendMessage(new TextMessage("服务器回显: " + payload));

    // 示例：广播消息给所有在线客户端
    broadcastMessage("用户 " + session.getId() + " 说: " + payload);
}

/**
 * 连接关闭后触发
 */
@Override
public void afterConnectionClosed(WebSocketSession session, org.springframework.web.socket.CloseStatus status) throws Exception {
    String sessionId = session.getId();
    sessions.remove(sessionId);
    System.out.println("客户端断开连接，会话ID: " + sessionId + "，当前在线: " + sessions.size());
}

/**
 * 向所有连接的客户端广播消息
 */
private void broadcastMessage(String message) {
    TextMessage textMessage = new TextMessage(message);
    for (WebSocketSession s : sessions.values()) {
        if (s.isOpen()) {
            try {
                s.sendMessage(textMessage);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }
}

// 可以添加一个静态方法供其他服务调用，主动推送消息
public static void sendMessageToAll(String message) {
    new MyWebSocketHandler().broadcastMessage(message);
}
}
```

### 4. 前端使用 (JavaScript)

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>WebSocket 客户端</title>
</head>
<body>
WebSocket 测试
<div>
<input type="text" id="messageInput" placeholder="输入要发送的消息">
<button onclick="sendMessage()">发送</button>
<button onclick="closeConnection()">断开连接</button>
</div>
<div id="messageArea" style="margin-top:20px; border:1px solid #ccc; min-height:200px; padding:10px;">
</div>
<script>
    let socket = null;
    const serverUrl = 'ws://localhost:8080/ws'; // 对应后端注册的端点
    // 如果使用了SockJS，URL应为：`http://localhost:8080/ws`，并使用 `SockJS` 库。

    // 1. 建立连接
    function connect() {
        if (socket && socket.readyState === WebSocket.OPEN) {
            logMessage('连接已存在。');
            return;
        }

        socket = new WebSocket(serverUrl);

        // 连接成功
        socket.onopen = function(event) {
            logMessage('<span style="color: green;">WebSocket 连接已建立。</span>');
        };

        // 接收服务器消息
        socket.onmessage = function(event) {
            logMessage('<span style="color: blue;">服务器: </span>' + event.data);
        };

        // 连接关闭
        socket.onclose = function(event) {
            logMessage('<span style="color: red;">WebSocket 连接已关闭。</span>');
            socket = null;
        };

        // 发生错误
        socket.onerror = function(error) {
            logMessage('<span style="color: darkred;">WebSocket 错误: </span>' + error);
        };
    }

    // 2. 发送消息
    function sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            logMessage('<span style="color: orange;">请先建立连接！</span>');
            return;
        }

        if (message) {
            socket.send(message);
            logMessage('<span style="color: purple;">我: </span>' + message);
            input.value = '';
        }
    }

    // 3. 关闭连接
    function closeConnection() {
        if (socket) {
            socket.close();
        }
    }

    // 辅助函数：在消息区域显示信息
    function logMessage(msg) {
        const messageArea = document.getElementById('messageArea');
        const p = document.createElement('p');
        p.innerHTML = msg;
        messageArea.appendChild(p);
        // 自动滚动到底部
        messageArea.scrollTop = messageArea.scrollHeight;
    }

    // 页面加载后自动连接（可选）
    window.onload = connect;
</script>
</body>
</html>
---
```

### 5. 运行与测试

1. **启动后端** ：

   - 确保你的Spring Boot应用主类正确。

   - 运行应用，默认端口为 `8080` 。

2. **访问前端** ：

   - 将上面的HTML文件保存为 `websocket-client.html` 。

   - 用浏览器直接打开该文件，或通过HTTP服务器（如Nginx, Python `http.server` ）访问。

   - 页面加载后会自动连接到 `ws://localhost:8080/ws` 。

3. **测试通信** ：

   - 在输入框中输入消息，点击“发送”。

   - 观察页面消息区域和后台控制台输出。

---

### 6. 高级特性与注意事项

- **心跳检测** ：长时间连接需要心跳（Ping/Pong）来保持活跃和检测死连接。

  - Spring Boot 可以通过 `WebSocketHandlerDecorator` 实现。

  - 前端可以定时发送特定消息。

- **消息协议** ：建议定义应用层协议（如JSON格式），包含 `type` 和 `data` 字段，便于路由和处理复杂消息。

```json
{
	"type": "chat",
	"data": {
		"from": "user1",
		"to": "room1",
		"content": "Hello!"
		}
}
```

- **用户会话关联** ：在 `afterConnectionEstablished` 中，通常需要将 `WebSocketSession` 与业务系统的用户ID关联起来（例如通过连接时传递的Token参数）。

- **集群部署** ：当应用部署在多台服务器上时，一个用户的连接可能落在任意服务器。广播消息需要使用中间件（如Redis Pub/Sub、RabbitMQ、专业的WebSocket网关）进行同步。

- **安全性** ：

- 使用 `wss://` (WebSocket over TLS) 保证传输安全。

- 在连接阶段进行身份验证（如校验URL中的Token）。

- 谨慎设置 `setAllowedOrigins("*")` ，生产环境务必指定可信源。

- **降级方案** ：对于不支持WebSocket的旧浏览器，可以使用SockJS库。Spring Boot配置中只需将 `.addHandler(...)` 改为 `.addHandler(...).withSockJS()` ，前端引入SockJS客户端库即可。

