---
title: "MyBatis-Plus 核心注解详解"
date: 2025-11-29 00:06:29
category: "全栈技术栈"
tags:
- "mybatis"
- "数据库"
- "java"
---

## MyBatis-Plus 核心注解详解

本文档详细介绍了 MyBatis-Plus 框架中提供的核心注解，包括其作用、属性、使用场景和代码示例，旨在帮助开发者更好地理解和运用这些注解以提升开发效率。
[mybatis注解讲解请见此](https://blog.csdn.net/m1751250104/article/details/155363456?spm=1001.2014.3001.5501) 

### 一、 核心映射注解

这类注解用于建立 Java 实体类与数据库表、字段之间的映射关系，是 MyBatis-Plus 的基石。

#### 1. `@TableName` - 表名映射

**作用** ：标识实体类对应的数据库表名。当实体类名（驼峰命名）与数据库表名（下划线命名）无法自动转换或根本不同时使用。

**常用属性** ：

- `value` ： **（String）** 指定对应的数据库表名。

- `schema` ： **（String）** 指定数据库 schema（可选）。

**示例** ：

```java
// 映射到 "user_info" 表
@TableName("user_info")
public class UserInfo {
// ...
}
// 全局配置表前缀（在 application.yml 中）
// mybatis-plus.global-config.db-config.table-prefix=t_
```

**说明** ：如果所有表都有统一前缀（如 `t_` ），可在配置文件中使用 `table-prefix` 进行全局配置，避免在每个类上使用该注解。

---

#### 2. `@TableId` - 主键映射

**作用** ：标识实体类中的主键字段，并指定主键生成策略。

**常用属性** ：

- `value` ： **（String）** 指定数据库主键字段名（若字段名与列名一致可省略）。

- `type` ： **（IdType）** 指定主键生成策略，这是一个非常重要的属性。

**主键策略（IdType）详解** ：

| 策略值 | 描述 | 使用场景 |
|:---|:---|:---|
| `ASSIGN_ID` | **（默认）** 使用雪花算法生成 Long 类型的 ID。 | **分布式系统** ，保证全局唯一。 |
| `AUTO` | 数据库 ID 自增。 | 单库单表，需确保数据库表字段已设置为自增。 |
| `ASSIGN_UUID` | 分配一个 UUID（不含中划线）字符串作为主键。 | 需要字符串类型主键的场景。 |
| `INPUT` | 手动设置主键值。 | 主键由业务逻辑生成，在插入数据前需自行赋值。 |
| `NONE` | 未设置主键策略（跟随全局配置）。 | - |

**示例** ：

```java
public class User {
// 指定表主键列为 user_id，并使用雪花算法
@TableId(value = "user_id", type = IdType.ASSIGN_ID)
private Long id;
// 使用数据库自增
// @TableId(type = IdType.AUTO)
// private Long id;
}
```

**雪花算法简介** ：由 Twitter 开源，生成 64 位长整型 ID，整体上按时间自增排序，在分布式系统内不会产生 ID 碰撞。

---

#### 3. `@TableField` - 非主键字段映射

**作用** ：标识非主键字段与数据库表列的映射关系。功能最为丰富。

**常用属性** ：

- `value` ： **（String）** 指定数据库字段名。解决最常见的不匹配问题。

- `exist` ： **（boolean）** 是否为数据库表字段（默认 `true` ）。若设置为 `false` ，则 MyBatis-Plus 会忽略该属性，常用于实体类中的辅助属性（如 `List list` ）。

- `select` ： **（boolean）** 是否参与查询（默认 `true` ）。设置为 `false` 后，查询时会自动屏蔽该字段（如密码字段）。

- `fill` ： **（FieldFill）** 指定字段的 **自动填充策略** ，用于处理如创建时间、更新时间等字段。需配合实现 `MetaObjectHandler` 接口使用。

- `insertStrategy` / `updateStrategy` / `whereStrategy` ： **（FieldStrategy）** 字段的插入、更新、条件验证策略（已取代旧的 `field-strategy` ），用于控制 `NULL` 值或空值在 SQL 操作中的行为。

**字段填充策略（FieldFill）** ：

- `FieldFill.DEFAULT` ：不填充。

- `FieldFill.INSERT` ：插入时填充。

- `FieldFill.UPDATE` ：更新时填充。

- `FieldFill.INSERT_UPDATE` ：插入和更新时都填充。

**示例** ：

```java
public class User {
// 解决字段名不一致
@TableField("user_name")
private String name;
// 非数据库字段
@TableField(exist = false)
private String extraInfo;

// 查询时不返回
@TableField(select = false)
private String password;

// 自动填充
@TableField(fill = FieldFill.INSERT)
private Date createTime;
@TableField(fill = FieldFill.INSERT_UPDATE)
private Date updateTime;
}
```

**自动填充处理器示例** ：

```java
@Component // 需要声明为Spring组件
public class MyMetaObjectHandler implements MetaObjectHandler {
@Override
public void insertFill(MetaObject metaObject) {
this.strictInsertFill(metaObject, "createTime", Date.class, new Date());
this.strictInsertFill(metaObject, "updateTime", Date.class, new Date());
}
@Override
public void updateFill(MetaObject metaObject) {
this.strictUpdateFill(metaObject, "updateTime", Date.class, new Date());
}
}
```

### 二、 功能注解

这类注解为数据操作提供了更高级的功能。

#### 4. `@TableLogic` - 逻辑删除

**作用** ：实现 **逻辑删除** 。标注后，删除操作将变为更新操作（修改指定字段的值），查询时会自动过滤已标记为删除的数据。

**常用属性** ：

- `value` ： **（String）** 逻辑未删除值（默认 `0` ）。

- `delval` ： **（String）** 逻辑删除值（默认 `1` ）。

**示例** ：

```java
public class User {
// 逻辑删除字段
@TableLogic(value = "0", delval = "1") // 通常可省略 value 和 delval，使用全局配置
// @TableField("is_deleted") // 若字段名不同，可配合使用
private Integer deleted;
}
```

- **删除操作** ： `mapper.deleteById(1)` → 实际执行 `UPDATE user SET deleted = 1 WHERE id = ? AND deleted = 0` 。

- **查询操作** ： `mapper.selectList(null)` → 实际执行 `SELECT ... FROM user WHERE deleted = 0` 。

**全局配置** ：

```yaml
mybatis-plus:
global-config:
db-config:
logic-delete-field: deleted # 全局逻辑删除字段名
logic-delete-value: 1 # 逻辑已删除值
logic-not-delete-value: 0 # 逻辑未删除值
```

#### 5. `@Version` - 乐观锁

**作用** ：实现 **乐观锁** 。用于解决高并发下的数据更新冲突。需要在数据库中添加一个版本号字段（如 `version` ）。

**机制** ：更新数据时，会带上版本号作为条件（ `UPDATE ... SET ..., version = new_version WHERE id=? AND version = old_version` ）。如果版本号不匹配，更新失败。

**要求** ：需要配置乐观锁插件 `OptimisticLockerInnerInterceptor` 。

**示例** ：

```java
@Configuration
public class MyBatisPlusConfig {
@Bean
public MybatisPlusInterceptor mybatisPlusInterceptor() {
MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
return interceptor;
}
}
@Entity
public class User {
@Version // 标记乐观锁版本字段
private Integer version;
}
```

#### 6. `@EnumValue` - 枚举映射

**作用** ：标注在 **枚举类** 的某个属性上，表示该属性的值将作为存储到数据库中的实际值（而不是枚举的 `ordinal` 或 `name` ）。

**示例** ：

```java
// 1. 定义枚举
public enum GenderEnum {
MALE(1, "男"),
FEMALE(2, "女");
@EnumValue // 标记数据库存储的是 code 值
private final Integer code;
private final String desc;

GenderEnum(Integer code, String desc) {
    this.code = code;
    this.desc = desc;
}
// ... getter
}
// 2. 在实体类中使用该枚举类型
public class User {
private GenderEnum gender; // 数据库中存储的是 1 或 2
}
```

### 三、 其他注解

#### 7. `@KeySequence` 

**作用** ：指定序列名称，用于像 Oracle、PostgreSQL 这类使用序列（Sequence）管理主键的数据库。

**属性** ： `value` 指定序列名， `clazz` 指定主键类型。

**示例** ： `@KeySequence(value = "seq_user_id", clazz = Long.class)` 。

#### 8. `@InterceptorIgnore` 

**作用** ：忽略特定拦截器，例如在多租户场景下，某次查询需要忽略租户过滤器。

**示例** ：在 Mapper 方法上使用 `@InterceptorIgnore(tenantLine = "true")` 可忽略多租户 SQL 解析。

### 四、 配置与扫描注解

#### 9. `@MapperScan` 

**作用** ：在 Spring Boot 启动类上使用，指定 Mapper 接口的扫描路径。可批量扫描，避免在每个 Mapper 接口上使用 `@Mapper` 。

**示例** ： `@MapperScan("com.example.mapper")` 。

#### 10. `@Param` （MyBatis 原生注解）

**注意** ：此注解是 MyBatis 原生注解，非 MyBatis-Plus 特有，但非常常用。

**作用** ：用于给 Mapper 接口方法的参数命名，以便在 XML 或注解 SQL 中引用。

**示例** ： `Page<User> selectPageByAge(Page<User> page, @Param("age") Integer age);` 。

### 五、 全局配置建议

对于项目内统一的规则，建议在 `application.yml` 中进行全局配置，使代码更简洁。

```yaml
mybatis-plus:
global-config:
db-config:
id-type: assign_id # 全局主键策略
table-prefix: t_ # 表名前缀
logic-delete-field: is_deleted # 逻辑删除字段
logic-delete-value: 1 # 逻辑删除值
logic-not-delete-value: 0 # 逻辑未删除值
configuration:
map-underscore-to-camel-case: true # 开启驼峰下划线自动转换（默认开启）
log-impl: org.apache.ibatis.logging.stdout.StdOutImpl # 输出SQL日志（开发环境）
```

### 总结

| 注解 | 主要作用 | 关键属性 |
|:---|:---|:---|
| **`@TableName`** | 指定实体类对应的表名 | `value` （表名） |
| **`@TableId`** | 标识主键字段并指定策略 | `value` （字段名）, `type` （策略） |
| **`@TableField`** | 建立字段映射，功能丰富 | `value` , `exist` , `select` , `fill` |
| **`@TableLogic`** | 实现逻辑删除 | `value` , `delval` |
| **`@Version`** | 实现乐观锁 | - |
| **`@EnumValue`** | 指定枚举的存储值 | - |

**最佳实践提示** ：

- **优先使用全局配置** ：对于项目内统一的规则，在配置文件中进行全局配置。

- **善用自动填充** ：利用 `@TableField(fill = ...)` 配合 `MetaObjectHandler` 来处理审计字段，能有效减少重复代码。

- **理解默认规则** ：MyBatis-Plus 默认开启驼峰命名到下划线命名的自动转换，了解这一点可以避免不必要的 `@TableField` 注解。
  希望这份详细的 Markdown 文档对您有帮助！

