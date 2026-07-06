---
title: "Redisson 基本操作指令完整指南"
date: 2025-11-21 20:34:23
category: "全栈技术栈"
tags:
- "java"
- "后端"
- "redis"
---

## Redisson 基本操作指令完整指南

### 📋 目录

- [键(Key)操作](#%E9%94%AEkey%E6%93%8D%E4%BD%9C)

- [字符串(String)操作](#%E5%AD%97%E7%AC%A6%E4%B8%B2string%E6%93%8D%E4%BD%9C)

- [哈希(Hash)操作](#%E5%93%88%E5%B8%8Chash%E6%93%8D%E4%BD%9C)

- [列表(List)操作](#%E5%88%97%E8%A1%A8list%E6%93%8D%E4%BD%9C)

- [集合(Set)操作](#%E9%9B%86%E5%90%88set%E6%93%8D%E4%BD%9C)

- [有序集合(Sorted Set)操作](#%E6%9C%89%E5%BA%8F%E9%9B%86%E5%90%88sorted-set%E6%93%8D%E4%BD%9C)

- [原子操作](#%E5%8E%9F%E5%AD%90%E6%93%8D%E4%BD%9C)

- [过期时间操作](#%E8%BF%87%E6%9C%9F%E6%97%B6%E9%97%B4%E6%93%8D%E4%BD%9C)

- [发布订阅操作](#%E5%8F%91%E5%B8%83%E8%AE%A2%E9%98%85%E6%93%8D%E4%BD%9C)

- [批量操作](#%E6%89%B9%E9%87%8F%E6%93%8D%E4%BD%9C)

- [实用工具类示例](#%E5%AE%9E%E7%94%A8%E5%B7%A5%E5%85%B7%E7%B1%BB%E7%A4%BA%E4%BE%8B)

### 🔑 键(Key)操作

#### 基本键管理指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 检查键是否存在 | `bucket.isExists()` | 检查指定键是否存在于Redis中 | 验证键是否存在 before 操作 |
| 删除键 | `bucket.delete()` | 永久删除指定的键 | 清理无用数据或重置状态 |
| 重命名键 | `bucket.rename("newkeyname")` | 修改键的名称 | 键名变更或数据重组 |
| 设置过期时间 | `bucket.expire(10, TimeUnit.SECONDS)` | 设置键的相对过期时间 | 临时数据缓存 |
| 设置绝对过期时间 | `bucket.expireAt(new Date(timestamp))` | 设置键的绝对过期时间点 | 定时失效场景 |
| 获取剩余生存时间 | `bucket.remainTimeToLive()` | 查询键的剩余存活时间 | 监控缓存有效期 |
| 移除过期时间 | `bucket.clearExpire()` | 取消键的过期时间，使其持久化 | 将临时数据转为永久数据 |
| 模式匹配查询键 | `keys.getKeysByPattern("user:*")` | 根据模式查找匹配的键 | 批量操作或数据检索 |
| 统计键数量 | `keys.count()` | 计算当前数据库的键总数 | 系统监控和数据统计 |

#### 基本键管理示例

```java
RedissonClient redisson = RedissonConfig.createClient();
// 检查键是否存在
RBucket<String> bucket = redisson.getBucket("mykey");
boolean exists = bucket.isExists();
// 删除键
boolean deleted = bucket.delete();
// 重命名键
bucket.rename("newkeyname");
// 设置过期时间
bucket.expire(10, TimeUnit.SECONDS); // 已废弃
bucket.expire(Duration.ofSeconds(10)); // 新方式
bucket.expireAt(new Date(System.currentTimeMillis() + 10000));
// 获取剩余生存时间
long ttl = bucket.remainTimeToLive();
// 移除过期时间（持久化）
bucket.clearExpire();
// 获取所有匹配模式的键
RKeys keys = redisson.getKeys();
Iterable<String> allKeys = keys.getKeysByPattern("user:*");
long keyCount = keys.count();
redisson.shutdown();
```

### 📝 字符串(String)操作

#### RBucket 操作指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 设置值 | `bucket.set("我的网站首页")` | 存储字符串值 | 基本数据存储 |
| 设置带过期的值 | `bucket.set("临时数据", 30, TimeUnit.SECONDS)` | 存储具有过期时间的值 | 临时数据缓存 |
| 条件设置值 | `bucket.trySet("初始值")` | 仅当键不存在时设置值 | 初始化操作，防覆盖 |
| 获取值 | `bucket.get()` | 读取键对应的值 | 数据检索 |
| 获取并设置新值 | `bucket.getAndSet("新值")` | 原子性地获取旧值并设置新值 | 原子更新操作 |
| 比较并设置 | `bucket.compareAndSet("期望值", "新值")` | 原子比较并条件更新 | 乐观锁实现 |
| 存储对象 | `userBucket.set(new User("张三", 25))` | 存储Java对象 | 对象序列化存储 |
| 获取对象 | `User user = userBucket.get()` | 读取Java对象 | 对象反序列化 |

#### RBucket 基本操作实例

```java
RBucket<String> bucket = redisson.getBucket("website:title");
// 设置值
bucket.set("我的网站首页");
// 设置值并指定过期时间
bucket.set("临时数据", 30, TimeUnit.SECONDS);
bucket.set("临时数据",Duration.ofSeconds(30)); // 新方式
// 仅在键不存在时设置
boolean setIfAbsent = bucket.trySet("初始值");
// 获取值
String value = bucket.get();
// 获取并设置新值（原子操作）
String oldValue = bucket.getAndSet("新值");
// 比较并设置（CAS操作）
boolean casSuccess = bucket.compareAndSet("期望值", "新值");
// 存储对象
RBucket<User> userBucket = redisson.getBucket("user:1001");
userBucket.set(new User("张三", 25));
// 获取对象
User user = userBucket.get();
```

### 🗂️ 哈希(Hash)操作

#### RMap 操作指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 设置字段值 | `userMap.put("name", "李四")` | 设置哈希表中的字段值 | 对象属性存储 |
| 批量设置字段 | `userMap.putAll(additionalInfo)` | 一次性设置多个字段值 | 批量更新操作 |
| 获取字段值 | `userMap.get("name")` | 读取指定字段的值 | 属性访问 |
| 获取所有字段 | `userMap.readAllMap()` | 获取哈希表的所有字段和值 | 完整对象检索 |
| 检查字段存在 | `userMap.containsKey("email")` | 验证字段是否存在 | 属性存在性检查 |
| 删除字段 | `userMap.remove("city")` | 移除指定字段 | 属性删除 |
| 快速设置字段 | `userMap.fastPut("login_count", "1")` | 高效设置字段值（无返回值） | 性能敏感场景 |
| 原子递增字段 | `userMap.addAndGet("login_count", 1)` | 原子性地增加字段的数值 | 计数器场景 |
| 获取所有字段名 | `userMap.readAllKeySet()` | 获取所有字段的名称集合 | 字段枚举 |
| 获取所有字段值 | `userMap.readAllValues()` | 获取所有字段值的集合 | 值集合操作 |

#### RMap 基本操作示例

```java
RMap<String, String> userMap = redisson.getMap("user:info:1001");
// 添加/更新字段
userMap.put("name", "李四");
userMap.put("age", "30");
// 批量添加
Map<String, String> additionalInfo = new HashMap<>();
additionalInfo.put("job", "工程师");
userMap.putAll(additionalInfo);
// 获取字段值
String name = userMap.get("name");
// 获取所有字段和值
Map<String, String> allFields = userMap.readAllMap();
// 检查字段是否存在
boolean hasEmail = userMap.containsKey("email");
// 删除字段
String removedValue = userMap.remove("city");
// 原子操作 - 快速添加
userMap.fastPut("login_count", "1");
// 原子操作 - 递增字段值
userMap.addAndGet("login_count", 1);
// 获取所有字段名
Set<String> fieldNames = userMap.readAllKeySet();
// 获取所有字段值
Collection<String> values = userMap.readAllValues();
```

### 📃 列表(List)操作

#### RList 操作指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 添加元素 | `taskList.add("任务1")` | 向列表末尾添加元素 | 列表构建 |
| 插入元素 | `taskList.add(0, "紧急任务")` | 在指定位置插入元素 | 优先级队列 |
| 批量添加 | `taskList.addAll(Arrays.asList("任务3", "任务4"))` | 一次性添加多个元素 | 批量数据导入 |
| 获取元素 | `taskList.get(0)` | 根据索引获取元素 | 随机访问 |
| 获取子列表 | `taskList.read(0, 2)` | 获取指定范围的子列表 | 分页查询 |
| 获取列表大小 | `taskList.size()` | 获取列表元素数量 | 列表统计 |
| 检查元素存在 | `taskList.contains("任务1")` | 检查元素是否在列表中 | 成员存在性验证 |
| 查找元素索引 | `taskList.indexOf("任务2")` | 查找元素的首次出现位置 | 元素定位 |
| 移除元素 | `taskList.remove("任务1")` | 删除指定元素 | 元素删除 |
| 按索引移除 | `taskList.remove(0)` | 删除指定位置的元素 | 顺序处理 |
| 队列出队 | `taskList.remove(0)` | 从列表开头移除元素（FIFO） | 队列实现 |
| 栈出栈 | `taskList.remove(taskList.size() - 1)` | 从列表末尾移除元素（LIFO） | 栈实现 |
| 列表修剪 | `taskList.trim(0, 4)` | 只保留指定范围内的元素 | 列表大小控制 |

#### RList 基本操作示例

```java
RList<String> taskList = redisson.getList("project:tasks");
// 添加元素
taskList.add("任务1");
taskList.add("任务2");
taskList.add(0, "紧急任务");
// 批量添加
taskList.addAll(Arrays.asList("任务3", "任务4"));
// 获取元素
String firstTask = taskList.get(0);
// 获取子列表
List<String> subList = taskList.read(0, 2);
// 列表长度
int size = taskList.size();
// 检查元素存在
boolean contains = taskList.contains("任务1");
// 获取元素索引
int index = taskList.indexOf("任务2");
// 移除元素
taskList.remove("任务1");
taskList.remove(0);
// 队列操作（FIFO）
taskList.add("新任务");
String nextTask = taskList.remove(0);
// 栈操作（LIFO）
taskList.add("栈元素");
String topElement = taskList.remove(taskList.size() - 1);
// 修剪列表
taskList.trim(0, 4);
```

### 🔄 集合(Set)操作

#### RSet 操作指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 添加元素 | `ipSet.add("192.168.1.1")` | 向集合添加元素（自动去重） | 唯一值收集 |
| 批量添加 | `ipSet.addAll(Arrays.asList("192.168.1.3", "192.168.1.4"))` | 一次性添加多个元素 | 批量数据导入 |
| 检查元素存在 | `ipSet.contains("192.168.1.1")` | 验证元素是否在集合中 | 成员资格验证 |
| 获取所有元素 | `ipSet.readAll()` | 获取集合中的所有元素 | 完整集合检索 |
| 获取集合大小 | `ipSet.size()` | 获取集合元素数量 | 集合统计 |
| 移除元素 | `ipSet.remove("192.168.1.2")` | 从集合中删除元素 | 元素删除 |
| 随机获取元素 | `ipSet.random()` | 随机返回一个集合元素 | 随机抽样 |
| 计算并集 | `setA.readUnion("set:B")` | 计算两个集合的并集 | 数据合并 |
| 计算交集 | `setA.readIntersection("set:B")` | 计算两个集合的交集 | 共同元素查找 |
| 计算差集 | `setA.readDiff("set:B")` | 计算两个集合的差集 | 差异分析 |
| 移动元素 | `setA.move("setName", "element")` | 将元素移动到另一个集合 | 元素转移 |

#### RSet 基本操作示例

```java
RSet<String> ipSet = redisson.getSet("unique:visitors");
// 添加元素（自动去重）
ipSet.add("192.168.1.1");
ipSet.add("192.168.1.2");
// 批量添加
ipSet.addAll(Arrays.asList("192.168.1.3", "192.168.1.4"));
// 检查元素存在
boolean exists = ipSet.contains("192.168.1.1");
// 获取所有元素
Set<String> allIps = ipSet.readAll();
// 集合大小
int count = ipSet.size();
// 移除元素
ipSet.remove("192.168.1.2");
// 随机获取元素
String randomIp = ipSet.random();
// 集合运算
RSet<String> setA = redisson.getSet("set:A");
RSet<String> setB = redisson.getSet("set:B");
// 并集
Set<String> union = setA.readUnion("set:B");
// 交集
Set<String> intersection = setA.readIntersection("set:B");
// 差集
Set<String> difference = setA.readDiff("set:B");
// 移动元素到另一个集合
boolean moved = setA.move("setName", "element");
```

### 📊 有序集合(Sorted Set)操作

#### RScoredSortedSet 操作指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 添加带分数元素 | `leaderboard.add(100.0, "PlayerA")` | 添加元素及其分数 | 排行榜数据录入 |
| 增加元素分数 | `leaderboard.addScore("PlayerA", 50.0)` | 原子性地增加元素分数 | 分数更新 |
| 获取元素分数 | `leaderboard.getScore("PlayerB")` | 查询指定元素的分数 | 分数查询 |
| 获取正序排名 | `leaderboard.rank("PlayerB")` | 获取元素从小到大的排名 | 排名查询 |
| 获取倒序排名 | `leaderboard.revRank("PlayerB")` | 获取元素从大到小的排名 | 排行榜显示 |
| 获取前N名 | `leaderboard.valueRangeReversed(0, 2)` | 获取排名前N的元素 | 排行榜TopN |
| 分数范围查询 | `leaderboard.valueRange(100, true, 200, true)` | 获取分数在指定区间的元素 | 范围查询 |
| 获取带分数元素 | `leaderboard.entryRangeReversed(0, 2)` | 获取元素及其分数 | 详细排行榜 |
| 统计分数段数量 | `leaderboard.count(100, true, 200, true)` | 统计分数区间内的元素数量 | 分布统计 |
| 移除元素 | `leaderboard.remove("PlayerC")` | 删除指定元素 | 数据清理 |
| 按排名移除 | `leaderboard.removeRangeByRank(0, 2)` | 删除排名区间的元素 | 批量清理 |
| 按分数移除 | `leaderboard.removeRangeByScore(0, 100)` | 删除分数区间的元素 | 条件清理 |

#### RScoredSortedSet 基本操作示例

```java
RScoredSortedSet<String> leaderboard = redisson.getScoredSortedSet("game:leaderboard");
// 添加带分数的元素
leaderboard.add(100.0, "PlayerA");
leaderboard.add(150.5, "PlayerB");
// 增加元素分数
Double newScore = leaderboard.addScore("PlayerA", 50.0);
// 获取元素分数
Double score = leaderboard.getScore("PlayerB");
// 获取排名
int rankAsc = leaderboard.rank("PlayerB");
int rankDesc = leaderboard.revRank("PlayerB");
// 范围查询
// 获取前3名
Collection<String> top3 = leaderboard.valueRangeReversed(0, 2);
// 获取分数在 [100, 200] 区间的元素
Collection<String> inRange = leaderboard.valueRange(100, true, 200, true);
// 获取分数段元素（带分数）
Collection<ScoredEntry<String>> entries = leaderboard.entryRangeReversed(0, 2);
// 统计分数段元素数量
int count = leaderboard.count(100, true, 200, true);
// 移除元素
leaderboard.remove("PlayerC");
// 按排名移除
leaderboard.removeRangeByRank(0, 2);
// 按分数移除
leaderboard.removeRangeByScore(0, 100);
```

### ⚛️ 原子操作

#### 原子操作指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 设置原子值 | `counter.set(0L)` | 设置原子变量的初始值 | 计数器初始化 |
| 递增并获取 | `counter.incrementAndGet()` | 原子递增并返回新值 | 序列号生成 |
| 获取并递增 | `counter.getAndIncrement()` | 原子获取当前值后递增 | 计数统计 |
| 递减并获取 | `counter.decrementAndGet()` | 原子递减并返回新值 | 资源计数 |
| 设置双精度值 | `doubleCounter.set(25.5)` | 设置双精度原子变量的值 | 浮点数计算 |
| 增加值并获取 | `doubleCounter.addAndGet(1.5)` | 原子增加浮点数值 | 精确计算 |
| 设置原子引用 | `atomicRef.set("production")` | 设置原子引用的值 | 配置管理 |
| 获取原子引用 | `atomicRef.get()` | 获取原子引用的当前值 | 状态读取 |
| 原子递增 | `adder.increment()` | 原子增加计数器的值 | 高并发计数 |
| 原子加法 | `adder.add(100)` | 原子增加指定数值 | 批量计数 |
| 获取总和 | `adder.sum()` | 获取计数器的当前总值 | 统计查询 |
| 重置计数器 | `adder.reset()` | 将计数器重置为零 | 计数重置 |

#### 原子计数器示例

```java
// 原子长整型
RAtomicLong counter = redisson.getAtomicLong("page:views");
counter.set(0L);
long current = counter.incrementAndGet();
long old = counter.getAndIncrement();
long decremented = counter.decrementAndGet();
// 原子双精度
RAtomicDouble doubleCounter = redisson.getAtomicDouble("temperature");
doubleCounter.set(25.5);
double newValue = doubleCounter.addAndGet(1.5);
// 原子引用
RAtomicReference<String> atomicRef = redisson.getAtomicReference("config:mode");
atomicRef.set("production");
String mode = atomicRef.get();
// 原子LongAdder
RLongAdder adder = redisson.getLongAdder("total:requests");
adder.increment();
adder.add(100);
long sum = adder.sum();
adder.reset();
```

### ⏰ 过期时间操作

#### 过期时间操作指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 设置带过期时间的值 | `bucket.set("session_content", 30, TimeUnit.MINUTES)` | 存储值并设置过期时间 | 会话管理 |
| 设置哈希表过期时间 | `map.expire(1, TimeUnit.HOURS)` | 为整个哈希表设置过期时间 | 对象级缓存 |
| 设置绝对过期时间 | `list.expireAt(new Date(timestamp))` | 设置精确到时间的过期点 | 定时任务 |
| 设置集合过期时间 | `set.expire(10, TimeUnit.MINUTES)` | 为集合设置过期时间 | 临时数据集 |
| 持久化键 | `bucket.clearExpire()` | 移除键的过期时间，使其持久化 | 数据永久化 |
| 获取剩余时间 | `bucket.remainTimeToLive()` | 查询键的剩余存活时间 | 缓存监控 |

#### 各种数据结构的过期时间设置示例

```java
// 字符串过期时间
RBucket<String> bucket = redisson.getBucket("session:data");
bucket.set("session_content", 30, TimeUnit.MINUTES);
// 哈希表过期时间
RMap<String, String> map = redisson.getMap("cache:data");
map.put("key", "value");
map.expire(1, TimeUnit.HOURS);
// 列表过期时间
RList<String> list = redisson.getList("temp:data");
list.add("item1");
list.expireAt(new Date(System.currentTimeMillis() + 3600000));
// 集合过期时间
RSet<String> set = redisson.getSet("temp:set");
set.add("value1");
set.expire(10, TimeUnit.MINUTES);
// 持久化（移除过期时间）
bucket.clearExpire();
// 获取剩余时间
long ttl = bucket.remainTimeToLive();
if (ttl == -1) {
System.out.println("永不过期");
} else if (ttl == -2) {
System.out.println("键不存在");
} else {
System.out.println("剩余时间: " + ttl + "ms");
}
```

### 📢 发布订阅操作

#### 发布订阅操作指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 创建主题 | `redisson.getTopic("news")` | 获取或创建消息主题 | 消息通道建立 |
| 添加消息监听器 | `topic.addListener(String.class, (channel, msg) -> { ... })` | 订阅主题并处理消息 | 消息消费 |
| 发布消息 | `topic.publish("重要新闻")` | 向主题发布消息 | 消息生产 |
| 获取接收者数量 | `topic.publish(...)` 返回值 | 获取接收到消息的订阅者数量 | 消息投递统计 |
| 移除监听器 | `topic.removeListener(listenerId)` | 取消指定的消息监听 | 资源清理 |
| 发布复杂对象 | `objectTopic.publish(new Message(...))` | 发布序列化对象消息 | 复杂消息传输 |

#### 主题发布订阅示例

```java
// 创建主题
RTopic newsTopic = redisson.getTopic("news");
RTopic notificationsTopic = redisson.getTopic("notifications");
// 添加监听器（订阅）
int listenerId1 = newsTopic.addListener(String.class, (channel, msg) -> {
System.out.println("订阅者1收到: " + msg + " 来自频道: " + channel);
});
int listenerId2 = newsTopic.addListener(String.class, (channel, msg) -> {
System.out.println("订阅者2收到: " + msg);
});
// 发布消息
long receivers = newsTopic.publish("重要新闻：系统升级通知");
System.out.println("消息被 " + receivers + " 个订阅者接收");
// 移除监听器
newsTopic.removeListener(listenerId1);
// 发布复杂对象
RTopic objectTopic = redisson.getTopic("objects");
objectTopic.addListener(Message.class, (channel, message) -> {
System.out.println("收到消息: " + message.getContent());
});
objectTopic.publish(new Message("Hello", "user123"));
```

### 🔄 批量操作

#### 批量操作指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 创建批量操作 | `redisson.createBatch()` | 创建批量操作对象 | 批量任务处理 |
| 异步设置值 | `batch.getBucket("key1").setAsync("value1")` | 添加异步设置操作到批量任务 | 并行操作 |
| 执行批量操作 | `batch.execute()` | 执行所有批量操作 | 批量提交 |
| 批量读取值 | `redisson.getBuckets().get("key1", "key2")` | 一次性读取多个键的值 | 批量数据检索 |
| 批量设置值 | `redisson.getBuckets().set(newValues)` | 一次性设置多个键值对 | 批量数据存储 |

#### 管道批量操作示例

```java
// 批量操作（管道）
RBatch batch = redisson.createBatch();
batch.getBucket("key1").setAsync("value1");
batch.getBucket("key2").setAsync("value2");
batch.getMap("map1").putAsync("field1", "value1");
BatchResult<?> result = batch.execute();
// 批量读取
Map<String, String> results = redisson.getBuckets().get("key1", "key2", "key3");
// 批量设置
Map<String, String> newValues = new HashMap<>();
newValues.put("key1", "value1");
newValues.put("key2", "value2");
redisson.getBuckets().set(newValues);
```

### 🎯 实用工具类示例

#### 缓存管理工具类方法表

| 方法名 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 设置缓存 | `setCache(key, value, timeout, unit)` | 存储值并设置过期时间 | 通用缓存管理 |
| 获取缓存 | `getCache(key)` | 读取指定键的缓存值 | 缓存数据检索 |
| 删除缓存 | `deleteCache(key)` | 删除指定的缓存键 | 缓存清理 |
| 检查缓存存在 | `exists(key)` | 验证缓存键是否存在 | 缓存有效性检查 |
| 获取剩余时间 | `getTTL(key)` | 查询缓存剩余存活时间 | 缓存有效期监控 |
| 模式删除 | `deletePattern(pattern)` | 批量删除匹配模式的键 | 批量缓存清理 |

#### 缓存管理工具类示例

```java
@Component
public class RedisCacheManager {
private final RedissonClient redisson;
public RedisCacheManager(RedissonClient redisson) {
    this.redisson = redisson;
}

// 设置缓存（带过期时间）
public <T> void setCache(String key, T value, long timeout, TimeUnit unit) {
    RBucket<T> bucket = redisson.getBucket(key);
    bucket.set(value, timeout, unit);
}

// 获取缓存
public <T> T getCache(String key) {
    RBucket<T> bucket = redisson.getBucket(key);
    return bucket.get();
}

// 删除缓存
public boolean deleteCache(String key) {
    RBucket<Object> bucket = redisson.getBucket(key);
    return bucket.delete();
}

// 检查缓存是否存在
public boolean exists(String key) {
    return redisson.getBucket(key).isExists();
}

// 获取缓存剩余时间
public long getTTL(String key) {
    return redisson.getBucket(key).remainTimeToLive();
}

// 批量删除匹配模式的键
public long deletePattern(String pattern) {
    return redisson.getKeys().deleteByPattern(pattern);
}
}
```

#### 其他实用操作指令表

| 指令/方法 | 语法示例 | 功能描述 | 适用场景 |
|:---:|:---:|:---:|:---:|
| 模式删除键 | `keys.deleteByPattern("temp:*")` | 批量删除匹配模式的键 | 批量数据清理 |
| 随机获取键 | `keys.randomKey()` | 随机返回一个数据库中的键 | 数据抽样 |
| 清空当前数据库 | `keys.flushdb()` | 清空当前选择的数据库 | 测试环境重置 |
| 清空所有数据库 | `keys.flushall()` | 清空所有Redis数据库 | 系统重置 |
| 移动键到其他数据库 | `bucket.move(1)` | 将键移动到指定数据库 | 数据重组 |

#### 其他实用操作示例

```java
// 模糊删除键
RKeys keys = redisson.getKeys();
long deletedCount = keys.deleteByPattern("temp:*");
// 随机获取一个键
String randomKey = keys.randomKey();
// 数据库操作
keys.flushdb(); // 清空当前数据库
keys.flushall(); // 清空所有数据库
// 键转移
boolean moved = bucket.move(1); // 移动到数据库1
```

### 💡 使用建议

1. **连接管理** ：确保正确关闭RedissonClient

2. **异常处理** ：添加适当的异常处理逻辑

3. **资源清理** ：及时删除不再需要的键

4. **性能优化** ：合理使用批量操作和管道

5. **内存管理** ：设置合理的过期时间避免内存泄漏

这个完整的操作指南涵盖了Redisson最常用的基本操作，可以作为日常开发的参考手册。