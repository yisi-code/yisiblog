---
title: "Spring WebSocket 核心注解详解"
date: 2026-02-22 01:25:29
category: "全栈技术栈"
tags:
- "spring"
- "websocket"
- "java"
---

## Spring WebSocket 核心注解详解

### 一、@MessageMapping 注解

#### 1.1 定义与作用

`@MessageMapping` 是 Spring WebSocket (STOMP) 中用于定义 **消息处理方法** 的注解，它标记的方法负责接收并处理从客户端发送到服务器的消息。

#### 1.2 路径匹配规则

在 `@MessageMapping` 注解中指定的路径会与 `WebSocketConfig` 中配置的 `applicationDestinationPrefixes` 前缀进行拼接，形成完整的消息目的地。

**配置示例：** 

```java
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
@Override
public void configureMessageBroker(MessageBrokerRegistry config) {
config.setApplicationDestinationPrefixes("/hanhan"); // 应用前缀
}
}
```

**控制器示例：** 

```java
@Controller
public class ChatController {
@MessageMapping("/chat/send")  // 实际访问路径：/hanhan/chat/send
public void handleChatMessage(ChatMessage message) {
    // 处理消息逻辑
}
}
```

#### 1.3 工作原理

当客户端向服务器发送消息时：

1. 客户端发送到拼接后的完整路径： `/hanhan/chat/send`

2. Spring WebSocket 根据路径匹配到对应的 `@MessageMapping` 方法

3. 方法参数会自动绑定消息内容

#### 1.4 方法参数支持

`@MessageMapping` 方法支持多种参数类型：

- `@Payload` ：消息体内容

- `@Header` ：消息头

- `SimpMessageHeaderAccessor` ：消息头访问器

- `Principal` ：认证用户

- `@DestinationVariable` ：路径变量

```java
@MessageMapping("/chat/{roomId}/send")
public void handleRoomMessage(
@Payload ChatMessage message,
@DestinationVariable String roomId,
@Header("token") String token,
Principal user) {
// 处理逻辑
}
```

### 二、@SendTo 注解

#### 2.1 定义与作用

`@SendTo` 注解用于指定消息处理方法执行完毕后，将返回值发送到哪个目的地。它定义了服务器向客户端广播消息的路径。

#### 2.2 路径配置规则

`@SendTo` 中指定的路径会通过 `WebSocketConfig` 中配置的消息代理（Broker）进行转发。

**配置示例：** 

```java
@Configuration
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
@Override
public void configureMessageBroker(MessageBrokerRegistry config) {
config.enableSimpleBroker("/public", "/private"); // 代理前缀
}
}
```

**控制器示例：** 

```java
@Controller
public class ChatController {
@MessageMapping("/chat/send")
@SendTo("/public/chat-room")  // 广播到：/public/chat-room
public ChatMessage handleAndBroadcast(ChatMessage message) {
    // 处理逻辑
    return message;  // 返回值自动发送到 /public/chat-room
}
}
```

#### 2.3 消息广播机制

1. **广播到所有客户端** ：使用 `/public` 或 `/topic` 前缀

2. **发送给特定用户** ：使用 `/user` 前缀结合 `@SendToUser` 注解

3. **点对点发送** ：使用 `/queue` 前缀

#### 2.4 @SendToUser 注解

用于将消息发送给特定用户的专用注解：

```java
@MessageMapping("/private/message")
@SendToUser("/queue/messages") // 发送到用户私有队列
public PrivateMessage sendPrivateMessage(PrivateMessage message) {
// 处理逻辑
return message; // 只发送给消息相关的用户
}
```

### 三、完整工作流程

以下是客户端发送消息到服务器处理，再到广播的完整流程：

**后端控制器：** 

```java
@Controller
public class ChatController {
// 接收消息并广播到公共聊天室
@MessageMapping("/chat/send")  // 完整路径：/hanhan/chat/send
@SendTo("/public/chat-room")   // 广播路径：/public/chat-room
public ChatMessage handlePublicChat(@Payload ChatMessage message,
                                   SimpMessageHeaderAccessor headerAccessor) {
    // 设置发送者信息
    Principal user = headerAccessor.getUser();
    if (user != null) {
        message.setSender(user.getName());
    }
    
    // 设置时间戳
    message.setTimestamp(LocalDateTime.now());
    
    // 记录日志
    log.info("收到聊天消息: {} 来自 {}", message.getContent(), message.getSender());
    
    // 返回值会自动发送到 /public/chat-room
    return message;
}

// 处理私人消息
@MessageMapping("/private/send")  // 完整路径：/hanhan/private/send
public void handlePrivateMessage(@Payload PrivateMessage message,
                                 SimpMessageHeaderAccessor headerAccessor) {
    // 获取发送者
    Principal sender = headerAccessor.getUser();
    if (sender == null) return;
    
    // 设置发送者信息
    message.setSender(sender.getName());
    message.setTimestamp(LocalDateTime.now());
    
    // 使用 SimpMessagingTemplate 发送给特定用户
    messagingTemplate.convertAndSendToUser(
        message.getRecipient(),
        "/queue/messages",
        message
    );
}
}
```

**前端发送消息：** 

```javascript
// 连接WebSocket
const stompClient = Stomp.over(new SockJS('/ws/hanhan'));
// 订阅公共聊天室消息
stompClient.subscribe('/public/chat-room', (message) => {
const chatMsg = JSON.parse(message.body);
console.log('收到聊天消息:', chatMsg);
});
// 发送消息到服务器
function sendChatMessage(content) {
const message = {
content: content,
roomId: 'main-room'
};
// 注意：发送到 /hanhan/chat/send
stompClient.send('/hanhan/chat/send', {}, JSON.stringify(message));
}
```

### 四、路径配置总结

| 操作类型 | 前端使用路径 | 对应后端配置 | 说明 |
|:---:|:---:|:---:|:---:|
| **建立连接** | `/ws/hanhan` | `registry.addEndpoint("/ws/hanhan")` | WebSocket握手端点 |
| **发送消息** | `/hanhan/*` | `config.setApplicationDestinationPrefixes("/hanhan")` | 客户端发送到服务器的消息 |
| **订阅广播** | `/public/*` | `config.enableSimpleBroker("/public")` | 订阅公共频道广播 |
| **订阅私信** | `/private/*` | `config.enableSimpleBroker("/private")` | 订阅私人频道广播 |
| **用户队列** | `/user/queue/*` | `config.setUserDestinationPrefix("/user")` | 用户专属消息队列 |

### 五、常见问题与解决方案

#### 5.1 消息发送失败

**问题** ：客户端发送消息后，服务器没有响应

**检查点** ：

1. 确认发送路径以 `/hanhan/` 开头

2. 确认 `@MessageMapping` 的值正确拼接

3. 检查 WebSocket 连接状态

#### 5.2 订阅收不到消息

**问题** ：订阅了频道但收不到广播消息

**检查点** ：

1. 确认订阅路径与 `@SendTo` 路径完全一致

2. 确认消息代理前缀配置正确

3. 检查服务器端方法是否有返回值

### 六、最佳实践建议

#### 6.1 路径命名规范

1. **统一前缀** ：为不同类型的消息使用统一前缀

2. **动词命名** ：在 `@MessageMapping` 路径中使用动词描述操作

3. **名词命名** ：在 `@SendTo` 路径中使用名词描述频道

```java
// 良好示例
@MessageMapping("/messages/send") // 发送消息
@SendTo("/channels/general") // 通用频道
@MessageMapping("/files/upload") // 上传文件
@SendTo("/notifications/uploads") // 上传通知频道
```

#### 6.2 异常处理

在消息处理方法中添加异常处理：

```java
@MessageMapping("/chat/send")
@SendTo("/public/chat-room")
public ChatMessage handleChat(@Payload ChatMessage message) {
try {
// 业务逻辑
return processMessage(message);
} catch (Exception e) {
log.error("处理消息失败", e);
// 可以返回错误消息或抛出异常
throw new MessagingException("消息处理失败");
}
}
```

#### 6.3 性能优化

1. **异步处理** ：对于耗时操作使用 `@Async`

2. **消息验证** ：在方法开始处验证消息格式

3. **资源清理** ：及时释放资源，避免内存泄漏

```java
@MessageMapping("/heavy/operation")
@Async // 异步处理耗时操作
public void handleHeavyOperation(@Payload HeavyRequest request) {
// 耗时处理逻辑
processHeavyRequest(request);
// 处理完成后发送通知
messagingTemplate.convertAndSend("/topic/results", result);
}
```

### 七、总结

`@MessageMapping` 和 `@SendTo` 是 Spring WebSocket 的核心注解，它们共同定义了 WebSocket 消息的接收、处理和发送流程：

1. **`@MessageMapping`** ：定义消息的接收端点，客户端通过 `应用前缀 + @MessageMapping路径` 发送消息

2. **`@SendTo`** ：定义消息的发送目的地，服务器通过 `代理前缀 + @SendTo路径` 广播消息

正确理解和使用这两个注解，可以构建出高效、可靠的实时 WebSocket 通信系统。