---
title: "WebSocket连接教程示例（Spring Boot + STOMP + SockJS + Vue）"
date: 2026-02-21 20:13:45
category: "全栈技术栈"
tags:
- "websocket"
- "spring boot"
- "vue.js"
---

## WebSocket连接教程示例（Spring Boot + STOMP + SockJS + Vue）

### 一、整体架构介绍

本示例实现了一个基于Spring Boot STOMP协议的WebSocket服务，支持：

- **公共频道** ：无需认证，直接连接

- **私有频道** ：需要HTTP会话认证

- **心跳机制** ：保持连接活跃

- **线程池优化** ：高性能消息处理

### 二、后端Spring Boot配置

#### 1. 核心依赖 (pom.xml)

```xml
<dependencies>
<dependency>
<groupId>org.springframework.boot</groupId>
<artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
<!-- 安全认证（如需） -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>

<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
</dependencies>
```

#### 2. WebSocket主配置类

```java
@Configuration
@RequiredArgsConstructor
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
private final WebSocketHandshakeInterceptor handshakeInterceptor;
private final WebSocketAuthInterceptor authInterceptor;

/**
 * 配置消息代理
 */
@Override
public void configureMessageBroker(MessageBrokerRegistry config) {
    // 启用简单内存消息代理，处理订阅前缀
    config.enableSimpleBroker("/public", "/private")
          .setHeartbeatValue(new long[]{10000, 10000}); // 心跳：10秒
    
    // 客户端发送消息的前缀
    config.setApplicationDestinationPrefixes("/hanhan");
    
    // 用户目的地前缀（用于点对点消息）
    config.setUserDestinationPrefix("/user");
}

/**
 * 配置入站通道（客户端→服务器）
 */
@Override
public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.taskExecutor()
            .corePoolSize(10)        // 核心线程数
            .maxPoolSize(20)         // 最大线程数
            .queueCapacity(100)      // 队列容量
            .keepAliveSeconds(60);   // 线程空闲时间
    
    registration.interceptors(authInterceptor); // 添加认证拦截器
}

/**
 * 配置出站通道（服务器→客户端）
 */
@Override
public void configureClientOutboundChannel(ChannelRegistration registration) {
    registration.taskExecutor()
            .corePoolSize(10)
            .maxPoolSize(20)
            .queueCapacity(100)
            .keepAliveSeconds(60);
}

/**
 * 注册STOMP端点
 */
@Override
public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws/hanhan")
            .addInterceptors(handshakeInterceptor) // 握手拦截器
            .setAllowedOriginPatterns(
                "http://localhost:5173", 
                "https://hanhanys.cpolar.cn"
            )
            .withSockJS()           // 支持SockJS降级
            .setDisconnectDelay(30 * 1000); // 断开延迟30秒
}
}
```

#### 3. 握手拦截器（HandshakeInterceptor）

```java
@Slf4j
@Component
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {
private static final String CONNECT_WS_PREFIX = "/ws/hanhan";
private static final String PUBLIC_WS_PREFIX = "/ws/public/";
private static final String PRIVATE_WS_PREFIX = "/ws/private/";

@Override
public boolean beforeHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Map<String, Object> attributes) {
    try {
        if (!(request instanceof ServletServerHttpRequest)) {
            log.warn("非Servlet请求，拒绝握手");
            return false;
        }

        String requestPath = request.getURI().getPath();
        log.info("WebSocket握手请求路径: {}", requestPath);
        
        // 1. 处理公共连接端点（/ws/hanhan）
        if (requestPath.startsWith(CONNECT_WS_PREFIX)) {
            String channelID = requestPath.substring(CONNECT_WS_PREFIX.length());
            attributes.put("channelID", channelID);
            attributes.put("channelType", "PUBLIC");
            attributes.put("authentication", null);
            log.info("公共连接端点: channelID={}", channelID);
            return true;
        }
        
        // 2. 处理公共频道（/ws/public/{channelId}）
        if (requestPath.startsWith(PUBLIC_WS_PREFIX)) {
            String channelID = requestPath.substring(PUBLIC_WS_PREFIX.length());
            attributes.put("channelID", channelID);
            attributes.put("channelType", "PUBLIC");
            attributes.put("authentication", null);
            log.info("公共频道连接: channelID={}", channelID);
            return true;
        }
        
        // 3. 处理私有频道（/ws/private/{channelId}）需要认证
        if (requestPath.startsWith(PRIVATE_WS_PREFIX)) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            HttpServletRequest httpRequest = servletRequest.getServletRequest();
            
            // 从现有HTTP会话获取认证信息
            HttpSession httpSession = httpRequest.getSession(false);
            if (httpSession == null) {
                log.warn("私有频道需要认证，但无HTTP会话");
                return false;
            }
            
            Authentication auth = (Authentication) httpSession.getAttribute("authentication");
            if (auth == null || !auth.isAuthenticated()) {
                log.warn("用户未认证或认证已过期");
                return false;
            }
            
            String channelID = requestPath.substring(PRIVATE_WS_PREFIX.length());
            attributes.put("channelID", channelID);
            attributes.put("channelType", "PRIVATE");
            attributes.put("authentication", auth);
            
            log.info("私有频道握手成功: 用户={}, channelID={}", 
                    auth.getName(), channelID);
            return true;
        }
        
        log.warn("未知的WebSocket路径: {}", requestPath);
        return false;
        
    } catch (Exception e) {
        log.error("握手过程异常: {}", e.getMessage(), e);
        return false;
    }
}

@Override
public void afterHandshake(ServerHttpRequest request,
                           ServerHttpResponse response,
                           WebSocketHandler wsHandler,
                           Exception exception) {
    // 握手后处理，可记录日志等
    if (exception != null) {
        log.error("握手后处理异常: {}", exception.getMessage());
    }
}
}
```

#### 4. 认证拦截器（ChannelInterceptor）

```java
@Slf4j
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {
@Override
public Message<?> preSend(Message<?> message, MessageChannel channel) {
    StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
        message, StompHeaderAccessor.class
    );
    
    if (accessor == null) {
        return message;
    }
    
    // 处理CONNECT命令（连接建立）
    if (StompCommand.CONNECT.equals(accessor.getCommand())) {
        Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
        
        if (sessionAttrs == null) {
            log.warn("WebSocket连接被拒绝：无session属性");
            return null; // 拒绝连接
        }
        
        // 检查是否为公共频道
        if ("PUBLIC".equals(sessionAttrs.get("channelType"))) {
            String channelId = (String) sessionAttrs.get("channelID");
            log.info("公共频道连接成功: channelID={}", channelId);
            return message;
        }
        
        // 检查私有频道的认证信息
        Authentication auth = (Authentication) sessionAttrs.get("authentication");
        if (auth != null && auth.isAuthenticated()) {
            // 设置安全上下文
            SecurityContextHolder.getContext().setAuthentication(auth);
            // 设置STOMP用户
            accessor.setUser(auth);
            log.info("私有频道连接成功: 用户={}", auth.getName());
            return message;
        }
        
        log.warn("WebSocket连接被拒绝：认证失败");
        return null; // 拒绝连接
    }
    
    return message;
}
}
```

#### 5. 消息控制器示例

```java
@Controller
@Slf4j
public class WebSocketController {
/**
 * 处理发送到 /hanhan/message 的消息
 */
@MessageMapping("/message")
@SendTo("/public/chat")  // 广播到所有订阅者
public ChatMessage handleMessage(ChatMessage message) {
    log.info("收到消息: {}", message);
    message.setTimestamp(new Date());
    return message;
}

/**
 * 点对点消息
 */
@MessageMapping("/private")
public void sendPrivateMessage(@Payload PrivateMessage message,
                               @Header("simpSessionId") String sessionId) {
    log.info("私密消息: from={}, to={}", message.getFrom(), message.getTo());
    
    // 通过消息模板发送给特定用户
    simpMessagingTemplate.convertAndSendToUser(
        message.getTo(), 
        "/queue/private", 
        message
    );
}
}
@Data
class ChatMessage {
private String from;
private String content;
private Date timestamp;
}
@Data
class PrivateMessage {
private String from;
private String to;
private String content;
}
```

### 三、前端实现（Vue 3 + SockJS + STOMP）

#### 1. 安装依赖

```bash
npm install sockjs-client @stomp/stompjs
或
yarn add sockjs-client @stomp/stompjs
```

#### 2. WebSocket工具类

```javascript
// utils/websocket.js
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
class WebSocketService {
constructor() {
this.stompClient = null;
this.subscriptions = new Map(); // 保存订阅引用
this.reconnectAttempts = 0;
this.maxReconnectAttempts = 5;
}
/**
 * 连接公共频道（无需认证）
 * @param {string} channelId - 频道ID
 * @param {function} onMessage - 消息回调
 */
connectToPublicChannel(channelId, onMessage) {
    const socketUrl = 'http://localhost:8080/ws/hanhan';
    const socket = new SockJS(socketUrl);
    
    this.stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: (frame) => {
            console.log('公共频道连接成功', frame);
            
            // 订阅公共频道
            const subscription = this.stompClient.subscribe(
                `/public/${channelId}`,
                (message) => {
                    const parsed = JSON.parse(message.body);
                    onMessage(parsed);
                }
            );
            
            this.subscriptions.set(`public_${channelId}`, subscription);
        },
        onStompError: (frame) => {
            console.error('STOMP协议错误:', frame);
        },
        onWebSocketError: (event) => {
            console.error('WebSocket连接错误:', event);
            this.handleReconnect();
        }
    });
    
    this.stompClient.activate();
}

/**
 * 连接私有频道（需要认证）
 * @param {string} channelId - 频道ID
 * @param {string} token - 认证令牌
 * @param {function} onMessage - 消息回调
 */
connectToPrivateChannel(channelId, token, onMessage) {
    const socketUrl = `http://localhost:8080/ws/private/${channelId}`;
    
    // 添加认证头
    const socket = new SockJS(socketUrl, null, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    this.stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: (frame) => {
            console.log('私有频道连接成功', frame);
            
            // 订阅私有频道
            const subscription = this.stompClient.subscribe(
                `/private/${channelId}`,
                (message) => {
                    const parsed = JSON.parse(message.body);
                    onMessage(parsed);
                }
            );
            
            // 订阅用户专属队列（点对点消息）
            const userSubscription = this.stompClient.subscribe(
                `/user/queue/private`,
                (message) => {
                    const parsed = JSON.parse(message.body);
                    console.log('收到私信:', parsed);
                }
            );
            
            this.subscriptions.set(`private_${channelId}`, subscription);
            this.subscriptions.set('user_queue', userSubscription);
        },
        onDisconnect: () => {
            console.log('WebSocket连接断开');
        }
    });
    
    this.stompClient.activate();
}

/**
 * 发送消息到服务器
 * @param {string} destination - 目标地址
 * @param {object} payload - 消息内容
 */
sendMessage(destination, payload) {
    if (this.stompClient && this.stompClient.connected) {
        this.stompClient.publish({
            destination: `/hanhan${destination}`,
            body: JSON.stringify(payload)
        });
    } else {
        console.warn('WebSocket未连接，无法发送消息');
    }
}

/**
 * 发送私信
 * @param {string} toUser - 目标用户
 * @param {string} content - 消息内容
 */
sendPrivateMessage(toUser, content) {
    this.sendMessage('/private', {
        from: 'currentUser',
        to: toUser,
        content: content,
        timestamp: new Date().toISOString()
    });
}

/**
 * 取消订阅
 * @param {string} subscriptionKey - 订阅键值
 */
unsubscribe(subscriptionKey) {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
        subscription.unsubscribe();
        this.subscriptions.delete(subscriptionKey);
    }
}

/**
 * 断开连接
 */
disconnect() {
    if (this.stompClient) {
        // 取消所有订阅
        this.subscriptions.forEach(sub => sub.unsubscribe());
        this.subscriptions.clear();
        
        this.stompClient.deactivate();
        this.stompClient = null;
        console.log('WebSocket已断开连接');
    }
}

/**
 * 重连处理
 */
handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
            if (this.stompClient) {
                this.stompClient.activate();
            }
        }, 3000);
    }
}
}
export default new WebSocketService();
```

#### 3. Vue组件使用示例

```html
<template>
<div class="chat-room">
<div :class="['status', { connected: isConnected }]">
{{ isConnected ? '已连接' : '未连接' }}
</div>
<!-- 频道选择 -->
<div class="channel-selector">
  <button @click="connectPublic('general')">连接公共聊天室</button>
  <button @click="connectPrivate('private-room', userToken)">
    连接私有房间
  </button>
  <button @click="disconnect" :disabled="!isConnected">断开连接</button>
</div>

<!-- 消息列表 -->
<div class="message-list">
  <div v-for="(msg, index) in messages" :key="index" class="message">
    <span class="sender">{{ msg.from }}:</span>
    <span class="content">{{ msg.content }}</span>
    <span class="time">{{ formatTime(msg.timestamp) }}</span>
  </div>
</div>

<!-- 消息发送 -->
<div class="message-input">
  <input 
    v-model="inputMessage" 
    @keyup.enter="sendMessage"
    placeholder="输入消息..."
    :disabled="!isConnected"
  />
  <button @click="sendMessage" :disabled="!isConnected">发送</button>
</div>

<!-- 私信发送 -->
<div class="private-message">
  <input v-model="privateTo" placeholder="目标用户" />
  <input v-model="privateContent" placeholder="私信内容" />
  <button @click="sendPrivate">发送私信</button>
</div>
</div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import websocket from '@/utils/websocket';
const isConnected = ref(false);
const messages = ref([]);
const inputMessage = ref('');
const privateTo = ref('');
const privateContent = ref('');
const userToken = ref('your-auth-token'); // 从登录状态获取
// 连接公共频道
const connectPublic = (channelId) => {
websocket.connectToPublicChannel(channelId, (message) => {
messages.value.push(message);
console.log('收到公共消息:', message);
});
isConnected.value = true;
};
// 连接私有频道
const connectPrivate = (channelId, token) => {
websocket.connectToPrivateChannel(channelId, token, (message) => {
messages.value.push(message);
console.log('收到私有消息:', message);
});
isConnected.value = true;
};
// 发送公共消息
const sendMessage = () => {
if (!inputMessage.value.trim()) return;
const message = {
from: '当前用户',
content: inputMessage.value,
type: 'public'
};
websocket.sendMessage('/message', message);
inputMessage.value = '';
};
// 发送私信
const sendPrivate = () => {
if (!privateTo.value || !privateContent.value) return;
websocket.sendPrivateMessage(privateTo.value, privateContent.value);
privateContent.value = '';
};
// 断开连接
const disconnect = () => {
websocket.disconnect();
isConnected.value = false;
messages.value = [];
};
// 格式化时间
const formatTime = (timestamp) => {
return new Date(timestamp).toLocaleTimeString();
};
// 组件生命周期
onMounted(() => {
console.log('聊天室组件已加载');
});
onUnmounted(() => {
disconnect();
});
</script>
<style scoped>
.chat-room {
max-width: 800px;
margin: 0 auto;
padding: 20px;
}
.status {
padding: 8px 16px;
border-radius: 4px;
margin-bottom: 20px;
background: #ff6b6b;
color: white;
}
.status.connected {
background: #51cf66;
}
.channel-selector {
display: flex;
gap: 10px;
margin-bottom: 20px;
}
.channel-selector button {
padding: 10px 20px;
background: #339af0;
color: white;
border: none;
border-radius: 4px;
cursor: pointer;
}
.channel-selector button:disabled {
background: #ccc;
cursor: not-allowed;
}
.message-list {
height: 400px;
overflow-y: auto;
border: 1px solid #ddd;
border-radius: 4px;
padding: 10px;
margin-bottom: 20px;
}
.message {
padding: 8px;
border-bottom: 1px solid #eee;
}
.message .sender {
font-weight: bold;
margin-right: 10px;
color: #339af0;
}
.message .time {
float: right;
color: #999;
font-size: 0.8em;
}
.message-input, .private-message {
display: flex;
gap: 10px;
margin-top: 10px;
}
input {
flex: 1;
padding: 10px;
border: 1px solid #ddd;
border-radius: 4px;
}
button {
padding: 10px 20px;
background: #51cf66;
color: white;
border: none;
border-radius: 4px;
cursor: pointer;
}
</style>
```

#### 4. 主应用入口

```html
// main.js
import { createApp } from 'vue';
import App from './App.vue';
// 全局挂载WebSocket服务
const app = createApp(App);
// 可选：提供全局WebSocket实例
app.config.globalProperties.$websocket = websocket;
app.mount('#app');
```