---
title: "MyBatis 注解详解"
date: 2025-11-28 23:06:09
category: "全栈技术栈"
tags:
- "mybatis"
- "后端"
- "java"
---

## MyBatis 注解详解

本文档详细介绍了 MyBatis 框架中提供的核心注解，包括其作用、属性、使用方法和实际示例。

### 1. MyBatis 注解概述

MyBatis 提供了基于注解的配置方式，可以直接在 Java 接口方法上编写 SQL 语句，减少了 XML 配置文件的使用。注解方式使代码更加集中和易于维护，特别适合简单的 CRUD 操作。

**注解与 XML 配置对比** ：

- **注解优势** ：代码即配置，简洁直观，减少文件切换

- **XML 优势** ：更适合复杂 SQL 和动态 SQL 场景

### 2. 核心 CRUD 注解

#### 2.1 @Select

**作用** ：执行查询操作

**属性** ：

- `value` ：SQL 语句字符串或字符串数组

**示例** ：

```java
// 简单查询
@Select("SELECT * FROM users WHERE id = #{id}")
User selectById(Long id);
// 多条件查询
@Select("SELECT * FROM users WHERE name = #{name} AND age = #{age}")
User selectByNameAndAge(@Param("name") String name, @Param("age") Integer age);
// 查询所有
@Select("SELECT * FROM users")
List<User> selectAll();
```

#### 2.2 @Insert

**作用** ：执行插入操作

**属性** ：

- `value` ：插入 SQL 语句

**示例** ：

```java
@Insert("INSERT INTO users (name, email, age) VALUES (#{name}, #{email}, #{age})")
int insertUser(User user);
```

#### 2.3 @Update

**作用** ：执行更新操作

**属性** ：

- `value` ：更新 SQL 语句

**示例** ：

```java
@Update("UPDATE users SET name = #{name}, email = #{email} WHERE id = #{id}")
int updateUser(User user);
```

#### 2.4 @Delete

**作用** ：执行删除操作

**属性** ：

- `value` ：删除 SQL 语句

**示例** ：

```java
@Delete("DELETE FROM users WHERE id = #{id}")
int deleteById(Long id);
```

### 3. 结果映射注解

#### 3.1 @Results 和 @Result

**作用** ：定义结果集映射关系，解决数据库列名与实体类属性名不一致的问题

**@Results 属性** ：

- `value` ： `@Result` 注解数组

- `id` ：结果映射的唯一标识，用于复用

**@Result 属性** ：

- `id` ：是否为主键（boolean）

- `column` ：数据库列名

- `property` ：实体类属性名

- `javaType` ：Java 类型

- `jdbcType` ：JDBC 类型

- `one` ：一对一关联（ `@One` ）

- `many` ：一对多关联（ `@Many` ）

**示例** ：

```java
// 基本结果映射
@Select("SELECT user_id, user_name, create_time FROM users WHERE id = #{id}")
@Results({
@Result(column = "user_id", property = "id", id = true),
@Result(column = "user_name", property = "name"),
@Result(column = "create_time", property = "createTime")
})
User selectUserWithMapping(Long id);
// 可复用的结果映射
@Results(id = "userMap", value = {
@Result(property = "id", column = "uid", id = true),
@Result(property = "firstName", column = "first_name"),
@Result(property = "lastName", column = "last_name")
})
@Select("SELECT * FROM users WHERE id = #{id}")
User getUserById(Integer id);
// 引用已定义的结果映射
@Select("SELECT * FROM users")
@ResultMap("userMap")
List<User> getAllUsers();
```

#### 3.2 @One 和 @Many

**作用** ：处理关联查询（一对一、一对多）

**@One 属性** ：

- `select` ：获取关联对象的方法全限定名

- `fetchType` ：加载策略（LAZY 或 EAGER）

**@Many 属性** ：

- `select` ：获取关联集合的方法全限定名

**示例** ：

```java
// 一对一关联（用户-身份证）
public interface UserMapper {
@Select("SELECT * FROM users WHERE id = #{id}")
@Results({
@Result(property = "id", column = "id"),
@Result(property = "idCard", column = "id",
one = @One(select = "com.example.mapper.IdCardMapper.selectByUserId"))
})
User selectUserWithIdCard(Long id);
}
// 一对多关联（用户-订单）
public interface UserMapper {
@Select("SELECT * FROM users WHERE id = #{id}")
@Results({
@Result(property = "id", column = "id"),
@Result(property = "orders", column = "id",
many = @Many(select = "com.example.mapper.OrderMapper.selectByUserId"))
})
User selectUserWithOrders(Long id);
}
public interface OrderMapper {
@Select("SELECT * FROM orders WHERE user_id = #{userId}")
List<Order> selectByUserId(Long userId);
}
```

### 4. 参数处理注解

#### 4.1 @Param

**作用** ：为方法参数命名，便于在 SQL 中引用

**使用场景** ：

- 方法有多个参数时

- 参数为基本类型或 String

**示例** ：

```java
// 多参数查询
@Select("SELECT * FROM users WHERE name = #{name} AND email = #{email}")
User selectByNameAndEmail(@Param("name") String name, @Param("email") String email);
// 分页查询
@Select("SELECT * FROM users LIMIT #{offset}, #{limit}")
List<User> selectByPage(@Param("offset") int offset, @Param("limit") int limit);
```

#### 4.2 @Options

**作用** ：配置 SQL 执行的选项

**重要属性** ：

- `useGeneratedKeys` ：是否使用自增主键（boolean）

- `keyProperty` ：主键对应的实体类属性

- `keyColumn` ：数据库中的主键列名

- `useCache` ：是否使用缓存（boolean）

- `flushCache` ：是否刷新缓存（boolean）

- `timeout` ：超时时间（秒）

**示例** ：

```java
// 获取自增主键
@Insert("INSERT INTO users (name, email) VALUES (#{name}, #{email})")
@Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
int insertUser(User user);
// 配置缓存行为
@Select("SELECT * FROM users WHERE id = #{id}")
@Options(useCache = true, flushCache = FlushCachePolicy.FALSE, timeout = 10)
User selectByIdWithOptions(Long id);
```

#### 4.3 @SelectKey

**作用** ：获取数据库生成的主键（类似 `<selectKey>` 标签）

**属性** ：

- `statement` ：获取主键的 SQL 语句

- `keyProperty` ：主键对应的实体类属性

- `before` ：在插入之前还是之后执行（boolean）

- `resultType` ：主键类型

**示例** ：

```java
@Insert("INSERT INTO users (name, email) VALUES (#{name}, #{email})")
@SelectKey(statement = "SELECT LAST_INSERT_ID()",
keyProperty = "id",
before = false,
resultType = Long.class)
int insertUserWithSelectKey(User user);
```

### 5. 动态 SQL 注解

#### 5.1 @*Provider 注解

**作用** ：通过外部类动态生成 SQL

**包括** ：

- `@SelectProvider`

- `@InsertProvider`

- `@UpdateProvider`

- `@DeleteProvider`

**属性** ：

- `type` ：提供 SQL 的类

- `method` ：生成 SQL 的方法名

**示例** ：

```java
// 定义 Provider 类
public class UserSqlProvider {
public String selectUsersDynamic(Map<String, Object> params) {
return new SQL() {{
SELECT("*");
FROM("users");
if (params.get("name") != null) {
WHERE("name = #{name}");
}
if (params.get("email") != null) {
WHERE("email = #{email}");
}
}}.toString();
}
}
// 使用 Provider
public interface UserMapper {
@SelectProvider(type = UserSqlProvider.class, method = "selectUsersDynamic")
List<User> selectUsersDynamic(Map<String, Object> params);
}
```

#### 5.2 注解中使用动态 SQL 标签

**说明** ：在注解中使用 `<script>` 标签包裹动态 SQL

**示例** ：

```java
@Select({"<script>",
"SELECT * FROM users",
"<where>",
" <if test='name != null'>AND name LIKE CONCAT('%', #{name}, '%')</if>",
" <if test='email != null'>AND email = #{email}</if>",
"</where>",
"</script>"})
List<User> selectUsersByConditions(User user);
@Select({"<script>",
"SELECT * FROM users WHERE id IN",
"<foreach collection='ids' item='id' open='(' separator=',' close=')'>",
" #{id}",
"</foreach>",
"</script>"})
List<User> selectUsersByIds(@Param("ids") List<Long> ids);
```

### 6. 其他重要注解

#### 6.1 @Mapper 和 @MapperScan

**@Mapper 作用** ：标记接口为 MyBatis Mapper 接口

**@MapperScan 作用** ：自动扫描包下的 Mapper 接口

**示例** ：

```java
// 在接口上使用 @Mapper
@Mapper
public interface UserMapper {
// Mapper 方法
}
// 在启动类上使用 @MapperScan（Spring Boot）
@SpringBootApplication
@MapperScan("com.example.mapper")
public class Application {
public static void main(String[] args) {
SpringApplication.run(Application.class, args);
}
}
```

#### 6.2 @MapKey

**作用** ：指定返回 Map 时使用的 key

**示例** ：

```java
@Select("SELECT * FROM users")
@MapKey("id") // 使用 id 作为 Map 的 key
Map<Long, User> selectAllUsersAsMap();
```

#### 6.3 @ResultMap

**作用** ：引用已定义的 @Results 映射

**示例** ：

```java
// 定义可复用的结果映射
@Results(id = "userResultMap", value = {
@Result(property = "id", column = "user_id", id = true),
@Result(property = "name", column = "user_name")
})
@Select("SELECT * FROM users WHERE id = #{id}")
User selectUserById(Long id);
// 复用结果映射
@Select("SELECT * FROM users")
@ResultMap("userResultMap")
List<User> selectAllUsers();
```

### 7. 缓存注解

#### 7.1 @CacheNamespace

**作用** ：为命名空间（Mapper）配置缓存

**属性** ：

- `implementation` ：缓存实现类

- `eviction` ：缓存淘汰策略

- `flushInterval` ：刷新间隔

- `size` ：缓存引用数目

**示例** ：

```java
@CacheNamespace(implementation = org.mybatis.caches.ehcache.EhcacheCache.class)
public interface UserMapper {
// Mapper 方法
}
```

#### 7.2 @CacheNamespaceRef

**作用** ：引用其他命名空间的缓存配置

**示例** ：

```java
@CacheNamespaceRef(UserMapper.class)
public interface AdminMapper {
// 共享 UserMapper 的缓存配置
}
```

### 8. 综合示例

#### 8.1 完整的 Mapper 接口示例

```java
@Mapper
@CacheNamespace(implementation = org.mybatis.caches.ehcache.EhcacheCache.class)
public interface UserMapper {
// 简单查询
@Select("SELECT * FROM users WHERE id = #{id}")
User selectById(Long id);

// 插入并返回自增主键
@Insert("INSERT INTO users (name, email, age) VALUES (#{name}, #{email}, #{age})")
@Options(useGeneratedKeys = true, keyProperty = "id")
int insert(User user);

// 更新操作
@Update("UPDATE users SET name = #{name}, email = #{email} WHERE id = #{id}")
int update(User user);

// 删除操作
@Delete("DELETE FROM users WHERE id = #{id}")
int delete(Long id);

// 复杂结果映射
@Select("SELECT u.*, d.department_name FROM users u LEFT JOIN departments d ON u.dept_id = d.id WHERE u.id = #{id}")
@Results({
    @Result(property = "id", column = "id", id = true),
    @Result(property = "name", column = "name"),
    @Result(property = "email", column = "email"),
    @Result(property = "department.name", column = "department_name")
})
User selectUserWithDepartment(Long id);

// 动态查询
@SelectProvider(type = UserSqlBuilder.class, method = "buildSelectByConditions")
List<User> selectByConditions(UserQuery query);

// 一对多关联查询
@Select("SELECT * FROM users WHERE id = #{id}")
@Results({
    @Result(property = "id", column = "id"),
    @Result(property = "orders", column = "id",
            many = @Many(select = "com.example.mapper.OrderMapper.selectByUserId"))
})
User selectUserWithOrders(Long id);
}
```

### 9. 最佳实践

1. **简单操作使用注解** ：对于简单的 CRUD 操作，注解方式更加简洁

2. **复杂 SQL 使用 XML** ：对于复杂的动态 SQL，XML 配置更具可读性和维护性

3. **合理使用结果映射** ：字段名不一致时使用 `@Results` 和 `@Result`

4. **多参数使用 @Param** ：避免参数混淆

5. **利用 Provider 处理复杂逻辑** ：动态 SQL 建议使用 `@*Provider` 注解

6. **注意缓存配置** ：根据业务需求合理配置缓存策略

通过合理使用 MyBatis 注解，可以显著提高开发效率，同时保持代码的可读性和可维护性。
希望这份详细的 MyBatis 注解文档对您有帮助！如有任何问题，欢迎继续交流。