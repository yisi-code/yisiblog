---
title: "Spring Boot 整合 Redisson 极易上手的入门教程"
date: 2026-01-19 18:55:42
category: "全栈技术栈"
tags:
- "spring boot"
- "后端"
- "java"
- "redis"
---

## Spring Boot 整合 Redisson 极易上手的入门教程

### 一、Redisson 简介

Redisson 是一个基于 Redis 的 Java 驻内存数据网格（In-Memory Data Grid），提供了丰富的分布式 Java 对象和服务。相比传统的 Redis Java 客户端，Redisson 提供了更高级的抽象和分布式数据结构，让开发者能够更轻松地构建分布式系统。

#### 主要特性

- 分布式 Java 对象（Map、List、Set、Lock 等）

- 分布式服务（远程服务、执行服务、调度服务）

- 支持多种 Redis 部署模式（单机、集群、哨兵、主从）

- 高性能、高可用的设计架构

- 与 Spring Framework 完美集成

### 二、环境准备

#### 2.1 前提条件

- JDK 1.8+

- Maven 3.5+

- Spring Boot 2.5+

- Redis 5.0+

#### 2.2 安装 Redis

Redisson是一个用于连接和操作 Redis 的 Java 客户端库（就像数据库驱动程序，如 MySQL Connector），而 Redis 本身则是一个独立的、需要安装和运行的数据存储服务（就像 MySQL 数据库服务器）。您的应用程序（通过 Redisson）需要与一个正在运行的 Redis 服务建立连接才能工作。
[windows版本的redis安装](https://github.com/redis-windows/redis-windows/releases) （注意：本版本仅供开发、学习）
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/387f3af900ae48c9b85419ff28a73f04.png)

其中只有service可以开启系统服务如开机自启，解压后可使用默认配置或根据需要配置redis服务设置（文末给出注释说明及样例）
 ![在这里插入图片描述](https://i-blog.csdnimg.cn/direct/bdf3f637d89040fe828ae0fc6619a67c.png)

```bash
cd C:\Redis
# 临时启动
redis-server redis.conf
# 安装为Windows服务（只需执行一次）
sc.exe create Redis binpath= "C:\Redis\RedisService.exe -c C:\Redis\redis.conf" start= auto  displayname= "Redis服务"
# 启动服务（后续无需指定配置）
net start Redis
# 停止服务
net stop Redis
# 卸载服务
sc.exe delete Redis
# 检查 Redis 是否正常运行
redis-cli ping
# 应该返回 PONG
# 注：以上命令都要在redis目录下使用，
# 若要全局使用将redis根目录添加入环境变量
```

### 三、Spring Boot 项目配置

#### 3.1 添加 Maven 依赖

在 `pom.xml` 中添加 Redisson Spring Boot Starter 依赖：

```xml
<dependencies>
	<dependency>
	<!-- 与Spring Boot 3.3.0兼容的redisson版本 -->
	    <groupId>org.redisson</groupId>
	    <artifactId>redisson-spring-boot-starter</artifactId>
	    <version>3.30.0</version>
	</dependency>
</dependencies>
```

<mark>注意，使用redisson则不需要添加 spring-boot-starter-data-redis 依赖。</mark> 

#### 3.2 配置文件配置

##### 3.2.1 application.yml （springboot 3.3.0）配置方式

```yaml
spring:
  redis:
    redisson:
      file: classpath:redisson.yml  # 指向类路径下的配置文件
```

##### 3.2.2 专门的 Redisson 配置文件

要配置的属性比较多时，创建 `src/main/resources/redisson.yml` 作为独立配置文件：

```yaml
# 业务线程数：处理Redis服务器返回响应的线程数量。默认值为0。
threads: 8
# I/O线程数：Netty框架用于处理I/O事件的线程数。默认值为0。适用于高并发场景
nettyThreads: 8
# 序列化编解码器：指定Java对象与Redis存储数据间的序列化方式。JsonJacksonCodec通用性好
codec: !<org.redisson.codec.JsonJacksonCodec> {}

# 模式选择：根据不同的配置项启用不同的模式
# 方案1：单机模式（默认启用）
singleServerConfig:
  address: "redis://localhost:6379"
  # 如果设置了密码
  password: "20000520"
  # 选择Redis的数据库编号，默认为0。
  database: 0
  # 连接超时设置
  # 空闲连接超时：连接空闲多久后会被关闭（毫秒）。默认10000
  idleConnectionTimeout: 10000
  # 连接建立超时：与Redis服务器建立连接时的最长等待时间（毫秒）。默认10000
  connectTimeout: 10000
  # 命令执行超时：发送命令后等待响应的最长时间（毫秒）。默认3000
  timeout: 3000
  # 重试机制
  # 命令重试次数：命令执行失败后的自动重试次数。需与retryInterval配合使用
  retryAttempts: 3
  # 命令重试间隔：每次命令重试之间的时间间隔（毫秒）。需与retryAttempts配合使用
  retryInterval: 1500
  # 连接池配置（重要性能参数）
  # 最大连接数。控制连接池中允许创建的最大连接数量，根据应用并发量调整
  connectionPoolSize: 64
  # 最小空闲连接数。连接池中始终保持的空闲连接数，有助于快速响应请求
  connectionMinimumIdleSize: 24
  # 发布/订阅连接的池大小。用于管理发布订阅功能的专用连接
  subscriptionConnectionPoolSize: 50

## 方案2：集群模式（注释掉单机模式并取消注释以下内容来启用）
#clusterServersConfig:
#  #集群节点地址列表，列表形式指定集群中所有节点的地址
#  nodeAddresses:
#    - "redis://192.168.1.101:7001"
#    - "redis://192.168.1.101:7002"
#    - "redis://192.168.1.102:7001"
#    - "redis://192.168.1.102:7002"
#    - "redis://192.168.1.103:7001"
#    - "redis://192.168.1.103:7002"
#  password: "your_secure_password"
#  idleConnectionTimeout: 10000
#  connectTimeout: 10000
#  timeout: 3000
#  retryAttempts: 3
#  retryInterval: 1500
#  #集群拓扑刷新间隔（毫秒），用于动态发现节点变化
#  scanInterval: 2000
#  # 连接池配置（为每个主从节点分别设置）
#  # 分别为 master 和 slave 节点设置连接池。在集群模式下，读写操作可能分布在不同的节点上，因此需要分别配置
#  masterConnectionPoolSize: 64
#  masterConnectionMinimumIdleSize: 24
#  slaveConnectionPoolSize: 64
#  slaveConnectionMinimumIdleSize: 24
#  # 从从节点读取数据，设定读命令优先在从节点执行，提升读取性能，适合读多写少的场景
#  readMode: "SLAVE"


## 方案3：哨兵模式（注释掉单机模式并取消注释以下内容来启用）
#sentinelServersConfig:
#  指定由哨兵监控的主节点名称，必须与哨兵配置一致
#  masterName: "mymaster"
#  # 哨兵节点地址，列出所有哨兵节点的地址
#  sentinelAddresses:
#    - "redis://192.168.1.101:26379"
#    - "redis://192.168.1.102:26379"
#    - "redis://192.168.1.103:26379"
#  # Redis密码
#  password: "your_secure_password"
#  database: 0
#  idleConnectionTimeout: 10000
#  connectTimeout: 10000
#  timeout: 3000
#  retryAttempts: 3
#  retryInterval: 1500
#  # 哨兵特定配置
#  # 哨兵状态扫描间隔（毫秒），用于监听主节点切换
#  scanInterval: 1000
#  masterConnectionPoolSize: 64
#  masterConnectionMinimumIdleSize: 24
#  slaveConnectionPoolSize: 64
#  slaveConnectionMinimumIdleSize: 24
```

更多配置请自行查阅redisson官网

#### 3.3 Java 代码配置方式

如果需要更灵活的配置，可以使用 Java 配置类：

```java
@Configuration
public class RedissonConfig {
@Value("${spring.redis.host}")
private String redisHost;

@Value("${spring.redis.port}")
private String redisPort;

@Bean(destroyMethod = "shutdown")
public RedissonClient redissonClient() {
    Config config = new Config();
    
    // 单机模式配置
    config.useSingleServer()
          .setAddress("redis://" + redisHost + ":" + redisPort)
          .setConnectionPoolSize(64)
          .setConnectionMinimumIdleSize(10)
          .setIdleConnectionTimeout(10000)
          .setConnectTimeout(10000)
          .setTimeout(3000)
          .setRetryAttempts(3)
          .setRetryInterval(1500);
    
    // 序列化配置
    config.setCodec(new JsonJacksonCodec());
    
    return Redisson.create(config);
}
}
```

### 四、基础使用

#### 4.1 注入 RedissonClient

```java
@Service
public class RedissonService {
@Autowired
private RedissonClient redissonClient;

// 基础键值操作示例
public void basicOperations() {
    // 字符串操作
    RBucket<String> bucket = redissonClient.getBucket("testKey");
    bucket.set("Hello Redisson");
    String value = bucket.get();
    System.out.println("获取的值: " + value);
    
    // 设置过期时间
    bucket.set("Expiring Value", 60, TimeUnit.SECONDS);
    
    // 原子操作
    RAtomicLong atomicLong = redissonClient.getAtomicLong("myCounter");
    atomicLong.incrementAndGet();
    atomicLong.addAndGet(10L);
}
}
```

在Spring Boot项目中，通过@Autowired注入的RedissonClient实例，默认是单例（Singleton）的。这意味着在整个Spring应用上下文中，只会存在一个RedissonClient实例。因此，所有前端请求访问同一个Service类时，使用的都是同一个RedissonClient对象。

##### RedissonClient的单例性与线程安全

单例性保障：在标准的Spring Boot配置下，你通常会在一个@Configuration类中通过@Bean方法创建RedissonClient。由于Spring容器默认管理的是单例Bean，所以无论你的Service类被实例化多少次，或被多少个不同的控制器调用，它们所依赖的RedissonClient都是指向内存中同一个对象。

##### 线程安全：RedissonClient被设计为线程安全的。

它内部通过连接池（如PubSubConnectionPool）来管理与Redis服务器的物理连接。当多个线程（即处理多个并发的前端请求）同时调用RedissonClient的方法时（例如redissonClient.getTopic(“news”)），每个操作会从连接池中获取一个独立的连接来执行，从而避免了状态冲突和数据污染。因此，你可以安全地在多线程环境下共享使用这个单例对象。

#### 4.2 分布式集合操作

```java
@Service
public class DistributedCollectionService {
@Autowired
private RedissonClient redissonClient;

// Map 操作
public void mapOperations() {
    RMap<String, String> map = redissonClient.getMap("userMap");
    
    // 基本操作
    map.put("user1", "张三");
    map.put("user2", "李四");
    map.put("user3", "王五");
    
    // 批量操作
    Map<String, String> users = new HashMap<>();
    users.put("user4", "赵六");
    users.put("user5", "钱七");
    map.putAll(users);
    
    // 读取操作
    String user1 = map.get("user1");
    int size = map.size();
}

// Set 操作
public void setOperations() {
    RSet<String> set = redissonClient.getSet("userSet");
    set.add("user1");
    set.add("user2");
    set.add("user3");
    
    boolean contains = set.contains("user1");
    Set<String> allUsers = set.readAll();
}

// List 操作
public void listOperations() {
    RList<String> list = redissonClient.getList("userList");
    list.add("user1");
    list.add("user2");
    list.add(0, "user0"); // 在指定位置插入
    
    String firstUser = list.get(0);
    List<String> subList = list.readAll();
}
}
```

### 五、高级特性

#### 5.1 分布式锁

```java
@Service
public class DistributedLockService {
@Autowired
private RedissonClient redissonClient;

public void performTaskWithLock(String taskId) {
    RLock lock = redissonClient.getLock("taskLock:" + taskId);
    
    try {
        // 尝试获取锁，最多等待10秒，锁过期时间30秒
        boolean isLocked = lock.tryLock(10, 30, TimeUnit.SECONDS);
        
        if (isLocked) {
            try {
                // 获取锁成功，执行需要同步的业务逻辑
                System.out.println("获取分布式锁成功，执行任务: " + taskId);
                // 模拟业务处理
                Thread.sleep(5000);
            } finally {
                // 确保释放锁
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                    System.out.println("释放分布式锁: " + taskId);
                }
            }
        } else {
            System.out.println("获取分布式锁失败: " + taskId);
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        System.out.println("获取锁被中断: " + taskId);
    }
}

// 公平锁示例
public void fairLockExample() {
    RLock fairLock = redissonClient.getFairLock("fairLock");
    
    try {
        fairLock.lock(30, TimeUnit.SECONDS);
        // 执行需要公平访问的业务逻辑
    } finally {
        if (fairLock.isHeldByCurrentThread()) {
            fairLock.unlock();
        }
    }
}
}
```

#### 5.2 延迟队列

```java
@Service
public class DelayedQueueService {
@Autowired
private RedissonClient redissonClient;

private RBlockingQueue<String> delayedQueue;

@PostConstruct
public void init() {
    delayedQueue = redissonClient.getBlockingQueue("delayedQueue");
    
    // 启动处理线程
    startQueueProcessor();
}

public void addDelayedTask(String task, long delay, TimeUnit timeUnit) {
    // 将任务添加到延迟队列
    delayedQueue.offer(task, delay, timeUnit);
    System.out.println("添加延迟任务: " + task + ", 延迟: " + delay + " " + timeUnit);
}

private void startQueueProcessor() {
    new Thread(() -> {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                // 从队列获取任务，如果没有任务会阻塞
                String task = delayedQueue.take();
                System.out.println("处理延迟任务: " + task + ", 时间: " + new Date());
                
                // 实际业务处理逻辑
                processTask(task);
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("处理任务异常: " + e.getMessage());
            }
        }
    }).start();
}

private void processTask(String task) {
    // 实现具体的任务处理逻辑
    System.out.println("执行任务: " + task);
}
}
```

#### 5.3 实时排行榜

```java
@Service
public class RankingService {
@Autowired
private RedissonClient redissonClient;

/**
 * 更新用户分数
 */
public void updateUserScore(String userId, double score) {
    RScoredSortedSet<String> ranking = redissonClient.getScoredSortedSet("userRanking");
    
    // 添加或更新用户分数
    ranking.addScore(userId, score);
    
    System.out.println("更新用户分数 - 用户: " + userId + ", 分数: " + score);
}

/**
 * 获取用户排名
 */
public Integer getUserRank(String userId) {
    RScoredSortedSet<String> ranking = redissonClient.getScoredSortedSet("userRanking");
    
    // 获取排名（从0开始，分数从高到低）
    Integer rank = ranking.rank(userId);
    if (rank != null) {
        // 转换为从1开始的排名
        return rank + 1;
    }
    return null;
}

/**
 * 获取Top N用户
 */
public List<Map<String, Object>> getTopN(int n) {
    RScoredSortedSet<String> ranking = redissonClient.getScoredSortedSet("userRanking");
    
    // 获取前N名（分数从高到低）
    Collection<String> topUsers = ranking.valueRangeReversed(0, n - 1);
    
    List<Map<String, Object>> result = new ArrayList<>();
    int rank = 1;
    
    for (String userId : topUsers) {
        Double score = ranking.getScore(userId);
        
        Map<String, Object> userRank = new HashMap<>();
        userRank.put("rank", rank);
        userRank.put("userId", userId);
        userRank.put("score", score);
        
        result.add(userRank);
        rank++;
    }
    
    return result;
}

/**
 * 获取用户分数
 */
public Double getUserScore(String userId) {
    RScoredSortedSet<String> ranking = redissonClient.getScoredSortedSet("userRanking");
    return ranking.getScore(userId);
}
}
```

#### 5.4 发布订阅模式

```java
@Component
public class MessageService {
@Autowired
private RedissonClient redissonClient;

/**
 * 发布消息
 */
public void publishMessage(String channel, String message) {
    RTopic topic = redissonClient.getTopic(channel);
    long clientsReceived = topic.publish(message);
    System.out.println("消息发布成功，频道: " + channel + ", 消息: " + message + 
                     ", 接收客户端数: " + clientsReceived);
}

/**
 * 订阅消息
 */
public void subscribeChannel(String channel) {
    RTopic topic = redissonClient.getTopic(channel);
    
    topic.addListener(String.class, (charSequence, message) -> {
        System.out.println("收到消息 - 频道: " + charSequence + ", 内容: " + message);
        // 处理接收到的消息
        handleMessage(message);
    });
    //订阅者无法取消订阅：会导致监听器无法被垃圾回收，可能引起内存
    //泄漏，应int newsListenerId = topic.addListener始终保
    //存监听器ID以便在适当时机（如Bean销毁时）调用removeListener。
    
    System.out.println("已订阅频道: " + channel);
}

private void handleMessage(String message) {
    // 实现消息处理逻辑
    System.out.println("处理消息: " + message);
}
}
```

### 六、Spring Cache 集成

#### 6.1 配置 Redisson 作为缓存管理器

```java
@Configuration
@EnableCaching
public class CacheConfig {
@Bean
public CacheManager cacheManager(RedissonClient redissonClient) {
    Map<String, CacheConfig> config = new HashMap<>();
    
    // 创建默认缓存配置（1小时过期，30分钟最大空闲时间）
    CacheConfig defaultConfig = new CacheConfig(
        60 * 60 * 1000, // 1小时
        30 * 60 * 1000   // 30分钟
    );
    config.put("default", defaultConfig);
    
    // 为用户缓存创建特定配置
    config.put("userCache", new CacheConfig(
        2 * 60 * 60 * 1000, // 2小时
        60 * 60 * 1000       // 1小时
    ));
    
    return new RedissonSpringCacheManager(redissonClient, config);
}
}
```

#### 6.2 使用缓存注解

```java
@Service
public class UserService {
@Cacheable(value = "userCache", key = "#userId")
public User getUserById(String userId) {
    // 模拟从数据库查询
    System.out.println("从数据库查询用户: " + userId);
    return userRepository.findById(userId);
}

@CachePut(value = "userCache", key = "#user.id")
public User updateUser(User user) {
    // 更新用户信息
    User updatedUser = userRepository.save(user);
    System.out.println("更新用户并刷新缓存: " + user.getId());
    return updatedUser;
}

@CacheEvict(value = "userCache", key = "#userId")
public void deleteUser(String userId) {
    // 删除用户
    userRepository.deleteById(userId);
    System.out.println("删除用户并清除缓存: " + userId);
}

@Caching(evict = {
    @CacheEvict(value = "userCache", allEntries = true)
})
public void clearAllUserCache() {
    System.out.println("清除所有用户缓存");
}
}
```

### 七、高级应用场景

#### 7.1 批量操作优化

```java
@Service
public class BatchOperationService {
@Autowired
private RedissonClient redissonClient;

public void batchOperations() {
    // 创建批量操作
    RBatch batch = redissonClient.createBatch();
    
    // 添加多个操作到批量任务
    for (int i = 0; i < 100; i++) {
        batch.getMap("testMap").fastPutAsync("key" + i, "value" + i);
    }
    
    // 执行批量操作
    BatchResult<?> result = batch.execute();
    
    System.out.println("批量操作完成，响应数量: " + result.getResponses().size());
}

public void pipelineOperations() {
    // 使用管道提高性能
    RMap<String, String> map = redissonClient.getMap("pipelineMap");
    
    // 管道操作会自动批量执行
    map.put("key1", "value1");
    map.put("key2", "value2");
    map.put("key3", "value3");
}
}
```

#### 7.2 分布式限流

```java
@Service
public class RateLimitService {
@Autowired
private RedissonClient redissonClient;

public boolean tryAcquire(String key, int rate, int rateInterval, TimeUnit unit) {
    RRateLimiter rateLimiter = redissonClient.getRateLimiter(key);
    
    // 设置速率：rateInterval时间内允许rate个请求
    rateLimiter.trySetRate(RateType.OVERALL, rate, rateInterval, unit);
    
    // 尝试获取许可
    return rateLimiter.tryAcquire();
}

public boolean tryAcquireWithTimeout(String key, long timeout, TimeUnit timeUnit) {
    RRateLimiter rateLimiter = redissonClient.getRateLimiter(key);
    
    try {
        return rateLimiter.tryAcquire(1, timeout, timeUnit);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return false;
    }
}
}
```

### 八、监控和运维

#### 8.1 健康检查

```java
@Component
public class RedissonHealthIndicator implements HealthIndicator {
@Autowired
private RedissonClient redissonClient;

@Override
public Health health() {
    try {
        // 检查 Redisson 连接状态
        long startTime = System.currentTimeMillis();
        redissonClient.getNodesGroup().pingAll();
        long responseTime = System.currentTimeMillis() - startTime;
        
        return Health.up()
            .withDetail("nodes", redissonClient.getNodesGroup().getNodes().size())
            .withDetail("responseTime", responseTime + "ms")
            .build();
            
    } catch (Exception e) {
        return Health.down(e).build();
    }
}
}
```

#### 8.2 性能监控

```java
@Service
public class RedissonMonitorService {
@Autowired
private RedissonClient redissonClient;

public void monitorPerformance() {
    // 获取 Redis 服务器信息
    RedisNodesCollector nodesCollector = redissonClient.getRedisNodesCollector();
    Collection<RedisClient> clients = nodesCollector.getRedisClients();
    
    for (RedisClient client : clients) {
        RedisClientConfig config = client.getConfig();
        System.out.println("Redis 地址: " + config.getAddress());
        
        // 可以获取更多服务器指标信息
    }
}
}
```

### 九、最佳实践和故障排除

#### 9.1 配置优化建议

生产环境推荐配置

```yaml
singleServerConfig:
address: ""
connectionPoolSize: 64
connectionMinimumIdleSize: 24
idleConnectionTimeout: 10000
connectTimeout: 10000
timeout: 3000
retryAttempts: 3
retryInterval: 1500
subscriptionConnectionPoolSize: 50
subscriptionConnectionMinimumIdleSize: 1
```

#### 9.2 常见问题解决

```java
@Component
public class RedissonProblemSolver {
@Autowired
private RedissonClient redissonClient;

/**
 * 处理连接中断的重试逻辑
 */
@Retryable(value = {RedisException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
public void retryableOperation() {
    // 可能抛出RedisException的操作
    redissonClient.getBucket("key").set("value");
}

/**
 * 资源清理
 */
@PreDestroy
public void cleanup() {
    if (redissonClient != null && !redissonClient.isShutdown()) {
        redissonClient.shutdown();
    }
}
}
```

#### 9.3 安全配置

```java
@Configuration
public class SecurityRedissonConfig {
@Bean
public RedissonClient secureRedissonClient() {
    Config config = new Config();
    
    config.useSingleServer()
          .setAddress("redis://127.0.0.1:6379")
          .setPassword("your_secure_password")
          .setSslEnableEndpointIdentification(true)  // 启用SSL
          .setSslProtocols("TLSv1.2,TLSv1.3")        // 指定TLS版本
          .setConnectionPoolSize(32)
          .setConnectionMinimumIdleSize(8);
    
    // 启用传输加密
    config.setTransportMode(TransportMode.NIO);
    
    return Redisson.create(config);
}
}
```

### 十、完整示例项目结构

src/main/java/
├── config/
│ ├── RedissonConfig.java # Redisson 配置
│ └── CacheConfig.java # 缓存配置
├── service/
│ ├── RedissonService.java # 基础服务
│ ├── DistributedLockService.java # 分布式锁服务
│ ├── DelayedQueueService.java # 延迟队列服务
│ ├── RankingService.java # 排行榜服务
│ └── MessageService.java # 消息服务
├── controller/
│ └── DemoController.java # 演示控制器
└── Application.java # 主应用类

本教程涵盖了 Spring Boot 集成 Redisson 的所有关键方面，从基础配置到高级特性，应该能够满足大多数应用场景的需求。根据你的具体业务需求，可以选择合适的组件进行使用和扩展。

redis配置样例（以下是msys2版本配置，cygwin版本需要把C:替换为/cygdrive/c，同时路径分隔符要用/）：

```bash

# =============================================
# 路径集中配置
# =============================================

# 日志文件路径，空字符串表示输出到标准输出
logfile C:\programming\Redis-8.2.3-Windows-x64-msys2-with-Service\LOG\redis-log.log
# 当以守护进程运行时，PID文件路径
pidfile C:\programming\Redis-8.2.3-Windows-x64-msys2-with-Service\PID\redis-pid.pid
# RDB文件和AOF文件的工作目录
dir C:\programming\Redis-8.2.3-Windows-x64-msys2-with-Service\RDB_AOF
# RDB文件名
dbfilename redisdump.rdb
# AOF文件名
appendfilename appendonly.aof

# =============================================
# 网络相关配置
# =============================================

# 绑定IP地址，默认为127.0.0.1（仅本地访问）
# 如需远程访问，可设置为 0.0.0.0 或具体IP，多个IP用空格分隔
bind 127.0.0.1
# 监听端口，默认为6379
port 6379


# 客户端空闲超时时间（秒），0表示禁用
# 超过指定时间无活动则关闭连接
timeout 0

# TCP连接保活时长（秒），建议设置为300秒
tcp-keepalive 300

# 设置TCP连接队列长度，高并发场景需要调整
tcp-backlog 511

# 保护模式，增强安全性（默认开启）
# 如果没有设置密码且未绑定特定IP，只允许本地回环地址访问
protected-mode yes


# =============================================
# 通用配置
# =============================================
# 设置连接密码（取消注释并修改）
requirepass 20000520

# 是否以守护进程（后台）模式运行
daemonize no

# 日志级别：debug, verbose, notice, warning
loglevel notice

# 数据库数量，默认16个（编号0-15）
databases 8

# 是否显示Redis logo
always-show-logo yes


# =============================================
# 快照持久化（RDB）配置
# =============================================

# 保存条件：在指定秒数内，有指定数量的键改变时触发保存
# 15分钟内至少有1个键改变
save 900 1      
# 5分钟内至少有10个键改变 
save 300 10      
# 1分钟内至少有10000个键改变
save 60 10000   

# 当bgsave出错时是否停止接受写操作
stop-writes-on-bgsave-error yes

# 是否对RDB文件进行压缩（会消耗CPU）
rdbcompression yes

# 是否对RDB文件进行CRC64校验
rdbchecksum yes

# =============================================
# 只追加文件持久化（AOF）配置
# =============================================

# 是否开启AOF持久化模式
appendonly yes

# AOF同步策略：
# no - 由操作系统决定同步时机（性能最好，安全性最低）
# everysec - 每秒同步一次（平衡性能与安全，推荐）
# always - 每次写操作都同步（最安全，性能最低）
appendfsync everysec

# AOF重写时是否禁止fsync（可提升性能但可能丢失数据）
no-appendfsync-on-rewrite no

# 触发AOF重写的条件：当前AOF文件比上次重写后文件增长的百分比
auto-aof-rewrite-percentage 100

# 触发AOF重写的最小文件大小
auto-aof-rewrite-min-size 64mb

# 加载AOF文件时，如果文件末尾被截断是否继续
aof-load-truncated yes

# 是否开启混合持久化（RDB+AOF）
aof-use-rdb-preamble yes


# =============================================
# 安全配置
# =============================================

# 重命名危险命令以增强安全性
# 禁用FLUSHDB命令
# rename-command FLUSHDB ""          
# 禁用FLUSHALL命令  
# rename-command FLUSHALL ""         
# 重命名CONFIG命令
# rename-command CONFIG "CONFIG_SAFE" 


# =============================================
# 客户端连接配置
# =============================================

# 最大客户端连接数，0表示无限制
maxclients 1000

# 客户端输出缓冲区限制
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60


# =============================================
# 内存管理配置
# =============================================

# Redis最大内存限制，0表示无限制（推荐设置）
maxmemory 0

# 内存达到上限时的数据淘汰策略：
# volatile-lru -> 从已设置过期时间的键中淘汰最近最少使用的
# allkeys-lru -> 从所有键中淘汰最近最少使用的（推荐）
# volatile-random -> 从已设置过期时间的键中随机淘汰
# allkeys-random -> 从所有键中随机淘汰
# volatile-ttl -> 淘汰剩余存活时间最短的键
# noeviction -> 不淘汰，返回错误（默认）
maxmemory-policy noeviction

# LRU/LFU算法采样数量
maxmemory-samples 5

# 是否启用惰性删除（lazy free）
lazyfree-lazy-eviction no
lazyfree-lazy-expire no
lazyfree-lazy-server-del no
replica-lazy-flush no


# =============================================
# 慢查询日志配置
# =============================================

# 慢查询阈值（微秒），超过该时间的查询会被记录
slowlog-log-slower-than 10000

# 慢查询日志最大长度
slowlog-max-len 128


# =============================================
# 高级配置
# =============================================

# 哈希数据结构配置
hash-max-ziplist-entries 512
hash-max-ziplist-value 64

# 列表数据结构配置
list-max-ziplist-size -2
list-compress-depth 0

# 集合数据结构配置
set-max-intset-entries 512

# 有序集合数据结构配置
zset-max-ziplist-entries 128
zset-max-ziplist-value 64

# HyperLogLog数据结构配置
hll-sparse-max-bytes 3000

# 流数据结构配置
stream-node-max-bytes 4096
stream-node-max-entries 100

# 主动重新哈希配置
activerehashing yes

# 客户端查询缓冲区限制
client-query-buffer-limit 1gb

# 协议配置
proto-max-bulk-len 512mb

# 动态HZ配置（根据客户端数量自动调整）
dynamic-hz yes

# 正常关闭前执行保存操作的最大等待时间（秒）
shutdown-timeout 10


# =============================================
# 复制（主从）配置
# =============================================

# 设置本机为从服务器，指向主服务器的IP和端口
# replicaof <masterip> <masterport>

# 主服务器密码（如果主服务器设置了密码）
# masterauth <master-password>

# 从服务器只读（默认yes）
replica-read-only yes

# 从服务器与主服务器断开连接时的复制策略
repl-diskless-sync no
repl-diskless-sync-delay 5

# 复制积压缓冲区大小
repl-backlog-size 1mb

# 复制超时时间（秒）
repl-timeout 60

# 在从服务器上禁用TCP_NODELAY
repl-disable-tcp-nodelay no


# =============================================
# 键空间事件通知配置
# =============================================

# 配置Redis发送键空间事件通知
# K - 键空间事件，通过__keyspace@<db>__频道发布
# E - 键事件事件，通过__keyevent@<db>__频道发布  
# g - 通用命令（如DEL, EXPIRE等）
# $ - 字符串命令
# l - 列表命令
# s - 集合命令
# h - 哈希命令
# z - 有序集合命令
# x - 过期事件（键过期时产生）
# e - 驱逐事件（键因内存不足被驱逐时产生）
# A - g$lshzxe的别名（所有命令）
# 默认为空字符串（禁用）
notify-keyspace-events ""


# =============================================
# 监控与调试配置
# =============================================

# 设置看门狗超时时间（0表示禁用）
watchdog-period 0

# 延迟监控阈值（毫秒）
latency-monitor-threshold 0


# =============================================
# 包含其他配置文件
# =============================================

# 包含其他配置文件
# include /path/to/local.conf
# include /path/to/other.conf
```