---
title: "MyBatis-Plus Mapper 接口方法详解"
date: 2025-11-29 16:20:27
category: "全栈技术栈"
tags:
- "java"
- "mybatis"
---

## MyBatis-Plus Mapper 接口方法详解

### 1. BaseMapper 核心方法概览

MyBatis-Plus 的 `BaseMapper<T>` 接口提供了丰富的 CRUD 操作方法，所有方法都 **不需要编写 SQL** 即可使用。

#### 1.1 完整方法列表

| 方法类别 | 方法名 | 说明 | 使用场景 |
|:---:|:---:|:---:|:---:|
| **插入** | `insert(T entity)` | 插入一条记录 | 新增数据 |
| **删除** | `deleteById(Serializable id)` | 根据ID删除 | 按主键删除 |
|   | `deleteBatchIds(Collection ids)` | 批量ID删除 | 批量删除 |
|   | `deleteByMap(Map map)` | 根据Map删除 | 简单条件删除 |
|   | `delete(Wrapper wrapper)` | 条件删除 | 复杂条件删除 |
| **更新** | `updateById(T entity)` | 根据ID更新 | 按主键更新 |
|   | `update(T entity, Wrapper wrapper)` | 条件更新 | 复杂更新逻辑 |
| **查询** | `selectById(Serializable id)` | 根据ID查询 | 按主键查询 |
|   | `selectBatchIds(Collection ids)` | 批量ID查询 | 按主键列表查询 |
|   | `selectByMap(Map map)` | 根据Map查询 | 简单条件查询 |
|   | `selectOne(Wrapper wrapper)` | 查询单条记录 | 确保结果唯一时 |
|   | `selectCount(Wrapper wrapper)` | 查询记录数 | 统计数量 |
|   | `selectList(Wrapper wrapper)` | 查询列表 | 条件查询 |
|   | `selectMaps(Wrapper wrapper)` | 查询Map列表 | 只需要部分字段 |
| **分页** | `selectPage(Page page, Wrapper wrapper)` | 分页查询 | 分页数据查询 |
|   | `selectMapsPage(Page page, Wrapper wrapper)` | Map分页查询 | 分页+部分字段 |

```java
public interface BaseMapper<T> extends Mapper<T> {
// ========== 插入操作 ==========
int insert(T entity);

// ========== 删除操作 ==========
int deleteById(Serializable id);
int deleteByMap(@Param(Constants.COLUMN_MAP) Map<String, Object> columnMap);
int delete(@Param(Constants.WRAPPER) Wrapper<T> wrapper);
int deleteBatchIds(@Param(Constants.COLLECTION) Collection<? extends Serializable> idList);

// ========== 更新操作 ==========
int updateById(@Param(Constants.ENTITY) T entity);
int update(@Param(Constants.ENTITY) T entity, @Param(Constants.WRAPPER) Wrapper<T> updateWrapper);

// ========== 查询操作 ==========
T selectById(Serializable id);
List<T> selectBatchIds(@Param(Constants.COLLECTION) Collection<? extends Serializable> idList);
List<T> selectByMap(@Param(Constants.COLUMN_MAP) Map<String, Object> columnMap);
T selectOne(@Param(Constants.WRAPPER) Wrapper<T> queryWrapper);

Integer selectCount(@Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
List<T> selectList(@Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
List<Map<String, Object>> selectMaps(@Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
List<Object> selectObjs(@Param(Constants.WRAPPER) Wrapper<T> queryWrapper);

// ========== 分页查询 ==========
<E extends IPage<T>> E selectPage(E page, @Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
<E extends IPage<Map<String, Object>>> E selectMapsPage(E page, @Param(Constants.WRAPPER) Wrapper<T> queryWrapper);
}
```

### 2. 插入操作（Insert）

#### 2.1 基本插入方法

```java
// Mapper接口定义
public interface UserMapper extends BaseMapper<User> {
// 无需额外声明，直接使用继承的方法
}
// 使用示例
@Service
public class UserService {
@Autowired
private UserMapper userMapper;
public void testInsert() {
    User user = new User();
    user.setName("张三");
    user.setAge(25);
    user.setEmail("zhangsan@example.com");
    
    // 插入一条记录
    int result = userMapper.insert(user);
    System.out.println("插入结果: " + result); // 影响行数
    System.out.println("自增ID: " + user.getId()); // 自动回填主键
}
}
```

#### 2.2 插入相关配置

```java
// 实体类配置示例
@Data
@TableName("user")
public class User {
@TableId(type = IdType.AUTO) // 自增主键
private Long id;
private String name;
private Integer age;
private String email;

@TableField(fill = FieldFill.INSERT)  // 自动填充
private LocalDateTime createTime;
}
```

### 3. 删除操作（Delete）

#### 3.1 根据ID删除

```java
// 根据主键删除
public void testDeleteById() {
// 删除ID为1的用户
int result = userMapper.deleteById(1L);
System.out.println("删除行数: " + result);
}
// 批量根据ID删除
public void testDeleteBatchIds() {
List<Long> ids = Arrays.asList(1L, 2L, 3L);
int result = userMapper.deleteBatchIds(ids);
System.out.println("批量删除行数: " + result);
}
```

#### 3.2 条件删除

```java
// 根据Map条件删除
public void testDeleteByMap() {
Map<String, Object> condition = new HashMap<>();
condition.put("name", "张三"); // name = '张三'
condition.put("age", 25); // AND age = 25
int result = userMapper.deleteByMap(condition);
System.out.println("条件删除行数: " + result);
}
// 使用Wrapper条件删除
public void testDeleteByWrapper() {
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(User::getName, "张三")
.ge(User::getAge, 18); // name = '张三' AND age >= 18
int result = userMapper.delete(wrapper);
System.out.println("Wrapper删除行数: " + result);
}
```

### 4. 更新操作（Update）

#### 4.1 根据ID更新

```java
// 根据主键更新
public void testUpdateById() {
User user = new User();
user.setId(1L);
user.setName("李四");
user.setEmail("lisi@example.com");
int result = userMapper.updateById(user);
System.out.println("更新行数: " + result);
}
```

#### 4.2 条件更新

```java
// 使用UpdateWrapper进行条件更新
public void testUpdateByWrapper() {
// 方法1：实体 + wrapper
User user = new User();
user.setEmail("updated@example.com");
UpdateWrapper<User> wrapper = new UpdateWrapper<>();
wrapper.eq("name", "张三")                    // 条件：name = '张三'
       .set("age", 30)                       // 直接设置字段值
       .setSql("version = version + 1");     // 自定义SQL片段

int result = userMapper.update(user, wrapper);

// 方法2：纯wrapper更新（推荐）
LambdaUpdateWrapper<User> lambdaWrapper = new LambdaUpdateWrapper<>();
lambdaWrapper.eq(User::getName, "张三")
            .set(User::getAge, 30)
            .set(User::getEmail, "updated@example.com");

int result2 = userMapper.update(null, lambdaWrapper);
}
```

### 5. 查询操作（Select）

#### 5.1 根据ID查询

```java
// 基本ID查询
public void testSelectById() {
User user = userMapper.selectById(1L);
System.out.println("查询结果: " + user);
}
// 批量ID查询
public void testSelectBatchIds() {
List<Long> ids = Arrays.asList(1L, 2L, 3L, 4L);
List<User> users = userMapper.selectBatchIds(ids);
System.out.println("批量查询结果: " + users.size());
}
```

#### 5.2 条件查询

```java
// 根据Map条件查询
public void testSelectByMap() {
Map<String, Object> condition = new HashMap<>();
condition.put("name", "张三");
condition.put("status", 1);
List<User> users = userMapper.selectByMap(condition);
System.out.println("Map条件查询: " + users);
}
// 查询单条记录
public void testSelectOne() {
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
wrapper.eq(User::getName, "张三");
User user = userMapper.selectOne(wrapper);  // 必须确保结果唯一
System.out.println("单条查询: " + user);
}
// 查询数量
public void testSelectCount() {
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
wrapper.ge(User::getAge, 18); // 年龄 >= 18
Long count = userMapper.selectCount(wrapper);
System.out.println("满足条件的记录数: " + count);
}
```

#### 5.3 复杂查询示例

```java
// 复杂条件查询
public void testComplexQuery() {
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
// 条件组合
wrapper.select(User::getId, User::getName, User::getAge)  // 指定查询字段
      .like(User::getName, "张")                          // 模糊查询
      .between(User::getAge, 18, 30)                      // 范围查询
      .isNotNull(User::getEmail)                        // 非空查询
      .in(User::getStatus, Arrays.asList(1, 2, 3))      // IN查询
      .orderByDesc(User::getCreateTime)                  // 排序
      .last("LIMIT 10");                                 // 自定义SQL后缀

List<User> users = userMapper.selectList(wrapper);
System.out.println("复杂查询结果: " + users);
}
// 查询特定字段
public void testSelectSpecificFields() {
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.select("id", "name", "email") // 只查询指定字段
.eq("status", 1);
List<User> users = userMapper.selectList(wrapper);
}
// 查询为Map列表
public void testSelectMaps() {
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
wrapper.select(User::getId, User::getName)
.ge(User::getAge, 18);
List<Map<String, Object>> mapList = userMapper.selectMaps(wrapper);
// 结果: [{"id":1, "name":"张三"}, {"id":2, "name":"李四"}]
}
```

### 6. 分页查询

#### 6.1 基本分页配置

```java
// 配置分页插件
@Configuration
public class MybatisPlusConfig {
@Bean
public MybatisPlusInterceptor mybatisPlusInterceptor() {
    MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
    interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
    return interceptor;
}
}
```

#### 6.2 分页查询使用

```java
// 分页查询示例
public void testSelectPage() {
// 创建分页对象：查询第1页，每页10条
Page<User> page = new Page<>(1, 10);
LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
wrapper.ge(User::getAge, 18)
      .orderByDesc(User::getCreateTime);

// 执行分页查询
Page<User> result = userMapper.selectPage(page, wrapper);

System.out.println("总记录数: " + result.getTotal());
System.out.println("总页数: " + result.getPages());
System.out.println("当前页数据: " + result.getRecords());
System.out.println("是否有下一页: " + result.hasNext());
}
// Map分页查询
public void testSelectMapsPage() {
Page<Map<String, Object>> page = new Page<>(1, 10);
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.select("id", "name", "age")
      .ge("age", 18);

Page<Map<String, Object>> result = userMapper.selectMapsPage(page, wrapper);

// 结果处理
result.getRecords().forEach(map -> {
    System.out.println("ID: " + map.get("id") + ", Name: " + map.get("name"));
});
}
```

### 7. 自定义方法扩展

#### 7.1 自定义SQL方法

```java
// 在BaseMapper基础上扩展自定义方法
public interface UserMapper extends BaseMapper<User> {
// 自定义查询方法
@Select("SELECT * FROM user WHERE age > #{minAge} AND age < #{maxAge}")
List<User> selectByAgeRange(@Param("minAge") Integer minAge, 
                           @Param("maxAge") Integer maxAge);

// 自定义更新方法
@Update("UPDATE user SET email = #{email} WHERE name = #{name}")
int updateEmailByName(@Param("name") String name, 
                     @Param("email") String email);

// 复杂查询方法
List<User> selectComplexUsers(@Param("name") String name,
                             @Param("minAge") Integer minAge,
                             @Param("statusList") List<Integer> statusList);
}
```

#### 7.2 对应的XML配置

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.UserMapper">
<select id="selectComplexUsers" resultType="User">
    SELECT * FROM user 
    <where>
        <if test="name != null">AND name LIKE CONCAT('%', #{name}, '%')</if>
        <if test="minAge != null">AND age >= #{minAge}</if>
        <if test="statusList != null and statusList.size() > 0">
            AND status IN
            <foreach collection="statusList" item="status" open="(" separator="," close=")">
                #{status}
            </foreach>
        </if>
    </where>
</select>
</mapper>
```

### 8. 完整使用示例

#### 8.1 完整服务类示例

```java
@Service
@Transactional
public class UserService {
@Autowired
private UserMapper userMapper;

/**
 * 完整的CRUD操作示例
 */
public void completeCrudExample() {
    // 1. 插入
    User newUser = new User();
    newUser.setName("测试用户");
    newUser.setAge(20);
    newUser.setEmail("test@example.com");
    userMapper.insert(newUser);
    Long userId = newUser.getId();
    
    // 2. 查询
    User dbUser = userMapper.selectById(userId);
    System.out.println("插入后查询: " + dbUser);
    
    // 3. 更新
    dbUser.setAge(25);
    userMapper.updateById(dbUser);
    
    // 4. 条件查询
    LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
    wrapper.between(User::getAge, 20, 30)
          .orderByDesc(User::getId);
    List<User> users = userMapper.selectList(wrapper);
    
    // 5. 分页查询
    Page<User> page = new Page<>(1, 5);
    Page<User> pageResult = userMapper.selectPage(page, wrapper);
    
    // 6. 删除
    userMapper.deleteById(userId);
}

/**
 * 批量操作示例
 */
public void batchOperationExample() {
    // 批量插入
    List<User> userList = new ArrayList<>();
    for (int i = 1; i <= 5; i++) {
        User user = new User();
        user.setName("批量用户" + i);
        user.setAge(20 + i);
        userList.add(user);
    }
    
    // 注意：BaseMapper没有批量插入方法，需要自定义或使用Service的saveBatch
    userList.forEach(userMapper::insert);
    
    // 批量删除
    List<Long> ids = userList.stream()
        .map(User::getId)
        .collect(Collectors.toList());
    userMapper.deleteBatchIds(ids);
}
}
```

### 9. 最佳实践建议

1. **简单CRUD** ：直接使用BaseMapper提供的方法

2. **复杂查询** ：使用Wrapper构建查询条件

3. **分页查询** ：配置分页插件后使用selectPage方法

4. **自定义SQL** ：在BaseMapper基础上扩展自定义方法

5. **事务管理** ：在Service层使用@Transactional注解

6. **自动填充** ：利用@TableField(fill)实现自动填充

7. **逻辑删除** ：使用@TableLogic实现逻辑删除

8. **乐观锁** ：使用@Version实现乐观锁控制

MyBatis-Plus的BaseMapper提供了丰富的开箱即用方法，可以满足95%以上的日常开发需求。通过合理使用这些方法，可以显著提高开发效率，减少重复代码编写。