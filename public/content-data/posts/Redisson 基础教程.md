---
title: "Redisson 基础教程"
date: 2025-11-21 16:52:10
category: "全栈技术栈"
tags:
- "java"
- "后端"
- "redis"
---

## Redisson 基础教程

### 目录

- [一、Redisson 简介](#%E4%B8%80redisson-%E7%AE%80%E4%BB%8B)

- [二、环境配置与依赖](#%E4%BA%8C%E7%8E%AF%E5%A2%83%E9%85%8D%E7%BD%AE%E4%B8%8E%E4%BE%9D%E8%B5%96)

- [三、核心数据结构操作](#%E4%B8%89%E6%A0%B8%E5%BF%83%E6%95%B0%E6%8D%AE%E7%BB%93%E6%9E%84%E6%93%8D%E4%BD%9C)

- [四、完整示例](#%E5%9B%9B%E5%AE%8C%E6%95%B4%E7%A4%BA%E4%BE%8B)

- [五、最佳实践与注意事项](#%E4%BA%94%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5%E4%B8%8E%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A1%B9)

- [六、总结](#%E5%85%AD%E6%80%BB%E7%BB%93)

[基本操作指令可以参考此](https://blog.csdn.net/m1751250104/article/details/155106268?spm=1011.2415.3001.5331) 

### 一、Redisson 简介

Redisson 是一个在 Redis 基础上实现的 Java 驻内存数据网格（In-Memory Data Grid），不仅提供了 Redis 基础数据结构的操作，还封装了许多分布式常用功能，如分布式锁、集合、限流器、队列等 。

**核心优势：** 

- 提供更直观的、面向对象的 API

- 支持 Redis 单机、哨兵、集群等部署模式

- 提供丰富的分布式 Java 对象和服务

- 与 Java 标准库 API 高度兼容

### 二、环境配置与依赖

#### 2.1 添加 Maven 依赖

```xml
<dependency>
<groupId>org.redisson</groupId>
<artifactId>redisson</artifactId>
<version>3.30.0</version>
</dependency>
```

#### 2.2 配置 RedissonClient

```java
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
public class RedissonConfig {
/**
 * 单机模式配置
 */
public static RedissonClient createSingleServerClient() {
    Config config = new Config();
    config.useSingleServer()
          .setAddress("redis://127.0.0.1:6379") // Redis服务器地址
          .setPassword("your_password_here")    // 密码（如无密码可省略）
          .setDatabase(0)                      // 数据库编号
          .setConnectionPoolSize(64)           // 连接池大小
          .setConnectionMinimumIdleSize(10)    // 最小空闲连接数
          .setIdleConnectionTimeout(10000)     // 空闲连接超时时间
          .setConnectTimeout(10000)           // 连接超时时间
          .setTimeout(3000);                   // 操作超时时间
    
    return Redisson.create(config);
}

/**
 * 集群模式配置
 */
public static RedissonClient createClusterServerClient() {
    Config config = new Config();
    config.useClusterServers()
          .addNodeAddress("redis://127.0.0.1:7000", 
                         "redis://127.0.0.1:7001")
          .setPassword("your_password_here");
    return Redisson.create(config);
}
}
```

### 三、核心数据结构操作

#### 3.1 数据结构操作概览

| 数据结构 | Redisson 接口 | 主要特点 |
|:---:|:---:|:---:|
| **字符串(String)** | `RBucket<V>` | 存储单个值，支持泛型 |
| **哈希(Hash)** | `RMap<K, V>` | 键值对集合，类似Java Map |
| **列表(List)** | `RList<V>` | 有序集合，支持双向操作 |
| **集合(Set)** | `RSet<V>` | 无序唯一元素集合 |
| **有序集合** | `RScoredSortedSet<V>` | 带分数的有序集合 |
| **发布订阅** | `RTopic` | 消息发布/订阅模式 |

#### 3.2 字符串(String)操作

```java
public class StringOperations {
public static void main(String[] args) {
RedissonClient redisson = RedissonConfig.createSingleServerClient();
try {
    // 获取字符串对象（获取的是指向键"website:title"
    // 的引用对象，有则获取引用对象，无则新建引用对象）
    RBucket<String> bucket = redisson.getBucket("website:title");
    
    // 设置值（当redis中存在键值对则覆盖值，若不存在，
    // 则新建键值对，键为"website:title"，值为"我的网站"）
    bucket.set("我的网站");
    
    // 获取值（当redis中存在键值对则获取值，不存在则得到null）
    String title = bucket.get();
    System.out.println("网站标题: " + title);
    
    // 带过期时间的操作（30分钟后过期）
    bucket.set("临时数据", 30, TimeUnit.MINUTES);
    
    // 原子性递增操作
    RAtomicLong counter = redisson.getAtomicLong("page:views:home");
    counter.set(0L); // 初始值
    Long newCount = counter.incrementAndGet();
    System.out.println("新访问量: " + newCount);
    
} finally {
    redisson.shutdown();
}
}
}
```

检查键在Redis中是否存在可以使用isExists()如上面示例：
<mark>bucket.isExists()</mark> 

#### 3.3 哈希(Hash)操作

```java
public class HashOperations {
public static void main(String[] args) {
RedissonClient redisson = RedissonConfig.createSingleServerClient();
try {
    // 获取哈希对象
    RMap<String, String> userMap = redisson.getMap("user:info:1001");
    
    // 添加字段
    userMap.put("name", "李四");
    userMap.put("age", "28");
    userMap.put("city", "北京");
    
    // 获取字段值
    String userName = userMap.get("name");
    System.out.println("用户姓名: " + userName);
    
    // 批量操作
    Map<String, String> additionalInfo = new HashMap<>();
    additionalInfo.put("job", "工程师");
    additionalInfo.put("department", "技术部");
    userMap.putAll(additionalInfo);
    
    // 获取所有字段和值
    Map<String, String> allFields = userMap.readAllMap();
    System.out.println("所有用户信息:");
    for (Map.Entry<String, String> entry : allFields.entrySet()) {
        System.out.println("  " + entry.getKey() + ": " + entry.getValue());
    }
    
} finally {
    redisson.shutdown();
}
}
}
```

#### 3.4 列表(List)操作

```java
public class ListOperations {
public static void main(String[] args) {
RedissonClient redisson = RedissonConfig.createSingleServerClient();
try {
    // 获取列表对象
    RList<String> taskList = redisson.getList("project:tasks");
    
    // 添加元素（尾部添加）
    taskList.add("需求分析");
    taskList.add("技术设计");
    taskList.add("编码实现");
    
    // 在指定位置插入
    taskList.add(1, "UI设计"); // 在索引1处插入
    
    // 获取元素
    String firstTask = taskList.get(0);
    System.out.println("第一个任务: " + firstTask);
    
    // 获取列表大小
    int size = taskList.size();
    System.out.println("任务数量: " + size);
    
    // 队列操作（先进先出）
    taskList.add("新任务"); // 入队
    String nextTask = taskList.remove(0); // 出队
    System.out.println("下一个任务: " + nextTask);
    
} finally {
    redisson.shutdown();
}
}
}
```

#### 3.5 集合(Set)操作

```java
public class SetOperations {
public static void main(String[] args) {
RedissonClient redisson = RedissonConfig.createSingleServerClient();
try {
    // 获取集合对象
    RSet<String> ipSet = redisson.getSet("uniqueVisitors");
    
    // 添加元素（自动去重）
    ipSet.add("192.168.1.1");
    ipSet.add("192.168.1.2");
    ipSet.add("192.168.1.1"); // 这个重复元素不会被添加进去
    
    // 检查元素是否存在
    boolean exists = ipSet.contains("192.168.1.1");
    System.out.println("IP是否存在: " + exists);
    
    // 获取所有元素
    Set<String> allIps = ipSet.readAll();
    System.out.println("所有唯一IP: " + allIps);
    
    // 集合运算示例
    RSet<String> todaySet = redisson.getSet("ips:today");
    RSet<String> yesterdaySet = redisson.getSet("ips:yesterday");
    Set<String> repeatIps = todaySet.intersection(yesterdaySet); // 求交集
    System.out.println("重复访问IP: " + repeatIps);
    
} finally {
    redisson.shutdown();
}
}
}
```

#### 3.6 有序集合(Sorted Set)操作

```java
public class SortedSetOperations {
public static void main(String[] args) {
RedissonClient redisson = RedissonConfig.createSingleServerClient();
try {
    // 获取有序集合对象
    RScoredSortedSet<String> leaderboard = redisson.getScoredSortedSet("gameLeaderboard");
    
    // 添加带分数的元素
    leaderboard.add(100.0, "PlayerA");
    leaderboard.add(150.5, "PlayerB");
    leaderboard.add(88.3, "PlayerC");
    
    // 增加某个元素的分数
    leaderboard.addScore("PlayerA", 20.0); // PlayerA 的新分数是 120.0
    
    // 获取排名（从0开始）
    int rankAsc = leaderboard.rank("PlayerB"); // 升序排名
    int rankDesc = leaderboard.revRank("PlayerB"); // 降序排名
    System.out.println("PlayerB 升序排名: " + rankAsc + ", 降序排名: " + rankDesc);
    
    // 获取前3名（分数从高到低）
    Collection<String> top3 = leaderboard.valueRangeReversed(0, 2);
    System.out.println("排行榜前三名:");
    for (String player : top3) {
        Double score = leaderboard.getScore(player);
        System.out.println(" - " + player + ": " + score);
    }
    
} finally {
    redisson.shutdown();
}
}
}
```

#### 3.7 发布订阅(Pub/Sub)操作

```java
public class PubSubOperations {
public static void main(String[] args) throws InterruptedException {
RedissonClient redisson = RedissonConfig.createSingleServerClient();
try {
    // 创建主题
    RTopic newsTopic = redisson.getTopic("news");
    RTopic notificationsTopic = redisson.getTopic("notifications");
    
    // 订阅者A - 订阅新闻主题
    int newsListenerId = newsTopic.addListener(String.class, (channel, msg) -> {
        System.out.println("[订阅者A] 收到新闻: " + msg + " (频道: " + channel + ")");
    });
    
    // 订阅者B - 也订阅新闻主题
    newsTopic.addListener(String.class, (channel, msg) -> {
        System.out.println("[订阅者B] 收到新闻: " + msg);
    });
    //订阅者B无法取消订阅：会导致监听器无法被垃圾回收，可能引起内存
    //泄漏，应int newsListenerId = topic.addListener始终保
    //存监听器ID以便在适当时机调用removeListener。
    
    // 等待订阅者就绪
    Thread.sleep(1000);
    
    // 发布消息
    long newsReceivers = newsTopic.publish("今日头条：Redisson发布新版本！");
    System.out.println("新闻消息已发布，被 " + newsReceivers + " 个订阅者接收");
    
    // 取消订阅
    Thread.sleep(2000);
    newsTopic.removeListener(newsListenerId);
    System.out.println("订阅者A已取消订阅");
    
} finally {
    redisson.shutdown();
}
}
}
```

### 四、完整示例

#### 4.1 用户会话管理系统示例

```java
import org.redisson.api.RMap;
import org.redisson.api.RBucket;
import org.redisson.api.RTopic;
import org.redisson.api.listener.MessageListener;
import java.util.concurrent.TimeUnit;
public class UserSessionManager {
private RedissonClient redisson;
private RTopic sessionTopic;
public UserSessionManager(RedissonClient redisson) {
    this.redisson = redisson;
    this.sessionTopic = redisson.getTopic("user:sessions");
    
    // 监听会话事件
    sessionTopic.addListener(String.class, this::handleSessionEvent);
}

public void createUserSession(String userId, UserSession session) {
    // 存储会话信息到哈希
    RMap<String, String> sessionMap = redisson.getMap("session:" + userId);
    sessionMap.put("userId", session.getUserId());
    sessionMap.put("username", session.getUsername());
    sessionMap.put("loginTime", session.getLoginTime());
    sessionMap.put("lastActivity", session.getLastActivity());
    
    // 设置会话状态（30分钟过期）
    RBucket<String> statusBucket = redisson.getBucket("session:status:" + userId);
    statusBucket.set("active", 30, TimeUnit.MINUTES);
    
    // 发布会话创建事件
    sessionTopic.publish("SESSION_CREATED:" + userId);
}

public UserSession getUserSession(String userId) {
    RMap<String, String> sessionMap = redisson.getMap("session:" + userId);
    if (!sessionMap.isExists()) {
        return null;
    }
    
    UserSession session = new UserSession();
    session.setUserId(sessionMap.get("userId"));
    session.setUsername(sessionMap.get("username"));
    session.setLoginTime(sessionMap.get("loginTime"));
    session.setLastActivity(sessionMap.get("lastActivity"));
    
    return session;
}

private void handleSessionEvent(CharSequence channel, String message) {
    System.out.println("处理会话事件: " + message);
}

// 用户会话类
static class UserSession {
    private String userId;
    private String username;
    private String loginTime;
    private String lastActivity;
    
    // getter和setter方法
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getLoginTime() { return loginTime; }
    public void setLoginTime(String loginTime) { this.loginTime = loginTime; }
    public String getLastActivity() { return lastActivity; }
    public void setLastActivity(String lastActivity) { this.lastActivity = lastActivity; }
}
}
```

### 五、最佳实践与注意事项

#### 5.1 配置优化建议

```yaml
redisson.yaml 配置文件示例
singleServerConfig:
address: ""
connectionPoolSize: 64
connectionMinimumIdleSize: 24
idleConnectionTimeout: 10000
connectTimeout: 10000
timeout: 3000
retryAttempts: 3
retryInterval: 1500
threads: 16
nettyThreads: 32
codec: !<org.redisson.codec.JsonJacksonCodec> {}
```

#### 5.2 重要注意事项

1. **资源管理**

```java
// 始终在finally块中关闭客户端
RedissonClient redisson = null;
try {
redisson = Redisson.create(config);
// 执行业务操作
} finally {
if (redisson != null) {
redisson.shutdown(); // 重要：释放连接资源
}
}
```

1. **异常处理**

```java
public class SafeRedisOperations {
public static void setValueSafely(RedissonClient redisson, String key, String value) {
try {
RBucket<String> bucket = redisson.getBucket(key);
bucket.set(value);
} catch (Exception e) {
// 记录日志，进行降级处理
System.err.println("Redis操作失败: " + e.getMessage());
// 可以切换到本地缓存或其他存储
}
}
}
```

1. **性能优化建议**

- 使用连接池，避免频繁创建关闭连接

- 合理设置超时时间，避免长时间阻塞

- 对于读多写少的数据启用本地缓存

- 使用批量操作减少网络开销

### 六、总结

本教程详细介绍了 Redisson 的基础使用方法，包括环境配置、各种数据结构的操作示例以及最佳实践。通过 Redisson，您可以以更直观、面向对象的方式操作 Redis，大大提高开发效率。

**核心要点回顾：** 

- Redisson 提供了丰富的分布式数据结构和服务

- 配置简单，支持多种 Redis 部署模式

- API 设计直观，与 Java 集合框架高度兼容

- 使用时需要注意资源管理和异常处理

建议在实际项目中根据具体需求选择合适的配置和数据结构，并遵循最佳实践来确保系统的稳定性和性能 。

**进一步学习：** 

- 官方文档：https://github.com/redisson/redisson/wiki

- 高级特性：分布式锁、布隆过滤器、延迟队列等

- 性能调优和监控指标

希望本教程能帮助您快速上手 Redisson，并在实际项目中有效应用！