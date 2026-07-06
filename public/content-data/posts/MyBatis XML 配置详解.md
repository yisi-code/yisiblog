---
title: "MyBatis XML 配置详解"
date: 2025-11-29 13:54:56
category: "全栈技术栈"
tags:
- "mybatis"
- "xml"
- "java"
---

## MyBatis XML 配置详解

本文档详细介绍了 MyBatis 框架中 XML 配置方式的使用方法，包括核心配置文件结构、映射文件编写、动态 SQL 以及高级功能配置。

### 1. MyBatis XML 配置概述

MyBatis 的 XML 配置方式是通过编写 XML 文件来定义 SQL 语句和映射关系，与注解方式相比，XML 方式更适合复杂的 SQL 场景，提供了更好的可读性和维护性。

**XML 配置与注解配置对比** ：

- **XML 优势** ：适合复杂 SQL、动态 SQL、结果映射配置，SQL 与 Java 代码分离

- **注解优势** ：简单直观，适合简单的 CRUD 操作

### 2. 核心配置文件（mybatis-config.xml）

#### 2.1 基本结构

MyBatis 的核心配置文件通常命名为 `mybatis-config.xml` ，遵循固定的元素顺序（顺序必须固定）：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
<properties></properties>
<settings></settings>
<typeAliases></typeAliases>
<typeHandlers></typeHandlers>
<objectFactory></objectFactory>
<plugins></plugins>
<environments></environments>
<databaseIdProvider></databaseIdProvider>
<mappers></mappers>
</configuration>
```

完整配置示例：

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">

<configuration>
    <!-- 
        1. properties：引入外部属性文件，用于配置数据库连接参数等。
           - resource：从类路径加载属性文件
           - 也可以使用<property>子元素内联定义属性
    -->
    <properties resource="jdbc.properties">
        <property name="jdbc.username" value="root"/>
        <property name="jdbc.password" value="123456"/>
        <!-- 启用占位符默认值特性，允许${key:default}语法 -->
        <property name="org.apache.ibatis.parsing.PropertyParser.enable-default-value" value="true"/>
    </properties>

    <!-- 
        2. settings：MyBatis的全局核心设置，会改变运行时行为 
    -->
    <settings>
        <!-- 启用二级缓存（默认true） -->
        <setting name="cacheEnabled" value="true"/>
        <!-- 启用延迟加载（默认false） -->
        <setting name="lazyLoadingEnabled" value="true"/>
        <!-- 积极的延迟加载开关（3.4.1后默认false） -->
        <setting name="aggressiveLazyLoading" value="false"/>
        <!-- 允许单语句返回多结果集（需要数据库驱动支持） -->
        <setting name="multipleResultSetsEnabled" value="true"/>
        <!-- 使用列标签代替列名 -->
        <setting name="useColumnLabel" value="true"/>
        <!-- 允许JDBC支持自动生成主键 -->
        <setting name="useGeneratedKeys" value="false"/>
        <!-- 自动映射行为：NONE|PARTIAL|FULL -->
        <setting name="autoMappingBehavior" value="PARTIAL"/>
        <!-- 自动映射未知列行为：NONE|WARNING|FAILING -->
        <setting name="autoMappingUnknownColumnBehavior" value="NONE"/>
        <!-- 默认执行器类型：SIMPLE|REUSE|BATCH -->
        <setting name="defaultExecutorType" value="SIMPLE"/>
        <!-- 数据库响应超时时间（秒） -->
        <setting name="defaultStatementTimeout" value="25"/>
        <!-- 驱动的结果集获取数量建议值 -->
        <setting name="defaultFetchSize" value="100"/>
        <!-- 是否允许在嵌套语句中使用分页（RowBounds） -->
        <setting name="safeRowBoundsEnabled" value="false"/>
        <!-- 开启驼峰命名自动映射（下划线转驼峰） -->
        <setting name="mapUnderscoreToCamelCase" value="true"/>
        <!-- 本地缓存作用域：SESSION|STATEMENT -->
        <setting name="localCacheScope" value="SESSION"/>
        <!-- 空值的默认JDBC类型 -->
        <setting name="jdbcTypeForNull" value="OTHER"/>
        <!-- 延迟加载的触发方法 -->
        <setting name="lazyLoadTriggerMethods" value="equals,clone,hashCode,toString"/>
        <!-- 日志实现 -->
        <setting name="logImpl" value="STDOUT_LOGGING"/>
        <!-- 当结果集为空时是否返回空实例而非null -->
        <setting name="returnInstanceForEmptyRow" value="false"/>
    </settings>

    <!-- 
        3. typeAliases：为Java类型设置别名，简化XML配置中的类型书写 
    -->
    <typeAliases>
        <!-- 为单个类定义别名 -->
        <typeAlias type="com.example.entity.User" alias="User"/>
        <!-- 扫描整个包，默认别名为类名（首字母小写） -->
        <package name="com.example.entity"/>
    </typeAliases>

    <!-- 
        4. typeHandlers：注册自定义类型处理器，用于Java类型与JDBC类型转换 
    -->
    <typeHandlers>
        <!-- 注册单个类型处理器 -->
        <typeHandler handler="com.example.handler.DateTypeHandler"/>
        <!-- 扫描包下的所有类型处理器 -->
        <package name="com.example.handler"/>
    </typeHandlers>

    <!-- 
        5. objectFactory：自定义对象工厂，用于创建结果集对象的实例 
    -->
    <objectFactory type="com.example.factory.CustomObjectFactory">
        <property name="someProperty" value="100"/>
    </objectFactory>

    <!-- 
        6. plugins：注册拦截器，可在SQL执行前后加入自定义逻辑 
    -->
    <plugins>
        <plugin interceptor="com.example.plugin.PageInterceptor">
            <property name="dialect" value="mysql"/>
        </plugin>
        <plugin interceptor="com.example.plugin.SqlLogInterceptor"/>
    </plugins>

    <!-- 
        7. environments：数据库环境配置，支持多环境（如开发、测试、生产） 
        default：指定默认使用的环境ID
    -->
    <environments default="development">
        <!-- 开发环境 -->
        <environment id="development">
            <!-- 事务管理器类型：JDBC|MANAGED -->
            <transactionManager type="JDBC"/>
            <!-- 
                数据源类型：UNPOOLED|POOLED|JNDI 
                POOLED：使用连接池
            -->
            <dataSource type="POOLED">
                <property name="driver" value="${jdbc.driver}"/>
                <property name="url" value="${jdbc.url}"/>
                <!-- 使用默认值语法，如果属性不存在则使用默认值 -->
                <property name="username" value="${jdbc.username:root}"/>
                <property name="password" value="${jdbc.password:123456}"/>
                <!-- 连接池特定属性 -->
                <property name="poolMaximumActiveConnections" value="20"/>
                <property name="poolMaximumIdleConnections" value="10"/>
                <property name="poolMaximumCheckoutTime" value="20000"/>
            </dataSource>
        </environment>

        <!-- 生产环境示例 -->
        <environment id="production">
            <transactionManager type="JDBC"/>
            <dataSource type="POOLED">
                <property name="driver" value="${prod.jdbc.driver}"/>
                <property name="url" value="${prod.jdbc.url}"/>
                <property name="username" value="${prod.jdbc.username}"/>
                <property name="password" value="${prod.jdbc.password}"/>
            </dataSource>
        </environment>
    </environments>

    <!-- 
        8. databaseIdProvider：数据库厂商标识，用于根据数据库类型执行不同SQL 
    -->
    <databaseIdProvider type="DB_VENDOR">
        <property name="MySQL" value="mysql"/>
        <property name="Oracle" value="oracle"/>
        <property name="PostgreSQL" value="postgresql"/>
    </databaseIdProvider>

    <!-- 
        9. mappers：注册映射文件或接口，告诉MyBatis到哪里去找SQL映射 
    -->
    <mappers>
        <!-- 通过资源路径引用XML映射文件 -->
        <mapper resource="com/example/mapper/UserMapper.xml"/>
        <!-- 通过类名引用注解配置的Mapper接口 -->
        <mapper class="com.example.mapper.UserMapper"/>
        <!-- 通过包名扫描包下的所有Mapper接口 -->
        <package name="com.example.mapper"/>
        <!-- 通过URL引用文件系统上的映射文件 -->
        <mapper url="file:///var/mappers/UserMapper.xml"/>
    </mappers>
</configuration>
```

#### 2.2 properties 属性配置

properties 元素用于外部化配置，可以从属性文件或直接内嵌属性值：

```xml
<properties resource="jdbc.properties"/>
<properties>
<property name="jdbc.driver" value="com.mysql.jdbc.Driver"/>
<property name="jdbc.url" value="jdbc:"/>
<property name="jdbc.username" value="root"/>
<property name="jdbc.password" value="password"/>
</properties>
<properties resource="jdbc.properties">
<property name="jdbc.username" value="override_username"/>
</properties>
```

**属性加载优先级** ：方法参数 > resource/url 读取 > properties 子元素定义

#### 2.3 settings 全局设置

settings 是 MyBatis 中极为重要的调整设置，它们会改变 MyBatis 的运行时行为：

```xml
<settings>
<setting name="cacheEnabled" value="true"/>
<setting name="lazyLoadingEnabled" value="true"/>
<setting name="autoMappingBehavior" value="PARTIAL"/>
<setting name="mapUnderscoreToCamelCase" value="true"/>
<setting name="logImpl" value="STDOUT_LOGGING"/>
<setting name="defaultExecutorType" value="SIMPLE"/>
<setting name="defaultStatementTimeout" value="25"/>
</settings>
```

#### 2.4 typeAliases 类型别名

类型别名可为 Java 类型设置简短名称，减少冗余的全限定类名书写：

```xml
<typeAliases>
<typeAlias alias="User" type="com.example.model.User"/>
<typeAlias alias="Order" type="com.example.model.Order"/>
</typeAliases>
<typeAliases>
<package name="com.example.model"/>
</typeAliases>
```

MyBatis 为常用 Java 类型内建了类型别名，如 `string` 对应 `String` ， `int` 对应 `Integer` ， `map` 对应 `Map` 等。

#### 2.5 environments 环境配置

environments 用于配置多环境数据源和事务管理器：

```xml
<environments default="development">
<environment id="development">
<transactionManager type="JDBC"/>
<dataSource type="POOLED">
<property name="driver" value="${jdbc.driver}"/>
<property name="url" value="${jdbc.url}"/>
<property name="username" value="${jdbc.username}"/>
<property name="password" value="${jdbc.password}"/>
</dataSource>
</environment>
<environment id="production">
<transactionManager type="JDBC"/>
<dataSource type="POOLED">
</dataSource>
</environment>
</environments>
```

#### 2.6 mappers 映射器配置

mappers 用于注册包含 SQL 映射的 Mapper 文件或接口：

```java
<mappers>
<mapper resource="com/example/mapper/UserMapper.xml"/>
<mapper class="com.example.mapper.UserMapper"/>
<package name="com.example.mapper"/>
<mapper url=""/>
</mappers>
```

### 3. Mapper XML 映射文件

#### 3.1 基本结构

Mapper XML 文件用于定义 SQL 语句和映射关系：

```java
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.UserMapper">
	<select></select>
	<insert></insert>
	<update></update>
	<delete></delete>
	<!-- ... -->
</mapper>
```

XML 文件开头的文档类型声明 DTD（Document Type Declaration，简称 DOCTYPE）用于定义 XML 文档的结构和约束规则。

| 组成部分 | 说明 |
|:---:|:---:|
| `<!DOCTYPE mapper` | 声明此 XML 文档的根元素是 `<mapper>` |
| `PUBLIC` | 表示这是一个"公开的" DTD，有正式的名称标识 |
| `"-//mybatis.org//DTD Mapper 3.0//EN"` | 正式公共标识符（Formal Public Identifier） |
| `"http://mybatis.org/dtd/mybatis-3-mapper.dtd"` | DTD 文件的实际网络位置 |

其中：
`-//mybatis.org//DTD Mapper 3.0//EN` 
语言：英语（EN）
文档描述：MyBatis Mapper DTD 版本 3.0
所有者：mybatis.org
注册状态（固定前缀）：- 表示未注册，+ 表示已注册

#### 3.2 CRUD 操作标签

`<mapper>` 标签是 MyBatis 映射文件的根元素，包含以下核心属性：

| 属性 | 必需 | 描述 | 示例 |
|:---:|:---:|:---:|:---:|
| `namespace` | 是 | 命名空间，用于隔离不同的 SQL 映射，通常对应 Mapper 接口的全限定名 | `namespace="com.example.mapper.UserMapper"` |

**公共属性（所有CRUD标签共用）** 

| 属性 | 适用标签 | 描述 | 默认值 | 可选值 |
|:---:|:---:|:---:|:---:|:---:|
| `id` | 所有 | 语句唯一标识 | - | - |
| `parameterType` | 所有 | 参数类型 | 自动推断 | 类全名/别名 |
| `flushCache` | 所有 | 是否清空缓存 | `false` | `true/false` |
| `timeout` | 所有 | 超时时间（秒） | 未设置 | 正整数 |
| `statementType` | 所有 | Statement类型 | `PREPARED` | `STATEMENT/PREPARED/CALLABLE` |
| `databaseId` | 所有 | 数据库厂商标识 | - | 如 `mysql/oracle` |

**Select 特有属性** 

| 属性 | 描述 | 默认值 |
|:---:|:---:|:---:|
| `resultType` | 结果类型 | - |
| `resultMap` | 结果映射引用 | - |
| `useCache` | 是否使用二级缓存 | `true` |
| `fetchSize` | 每次获取记录数 | 驱动决定 |
| `resultSetType` | 结果集类型 | 驱动决定 |

**Insert/Update 特有属性** 

| 属性 | 描述 | 默认值 |
|:---:|:---:|:---:|
| `useGeneratedKeys` | 使用自增主键 | `false` |
| `keyProperty` | 主键属性 | - |
| `keyColumn` | 主键列名 | - |

##### 3.3.1 select 查询语句

```java
<select id="selectUserById" parameterType="int" resultType="User">
SELECT id, username, email FROM users WHERE id = #{id}
</select>
<select id="selectUsersByCondition" parameterType="map" resultType="User">
SELECT * FROM users
WHERE username LIKE CONCAT('%', #{name}, '%')
AND age > #{minAge}
ORDER BY ${orderBy} DESC
LIMIT #{offset}, #{limit}
</select>
```

##### 3.3.2 insert 插入语句

```java
<insert id="insertUser" parameterType="User" useGeneratedKeys="true" keyProperty="id">
INSERT INTO users (username, email, age)
VALUES (#{username}, #{email}, #{age})
</insert>
<insert id="batchInsertUsers" parameterType="list">
INSERT INTO users (username, email) VALUES
<foreach collection="list" item="user" separator=",">
(#{user.username}, #{user.email})
</foreach>
</insert>
```

##### 3.3.3 update 更新语句

```xml
<update id="updateUser" parameterType="User">
UPDATE users
SET username = #{username}, email = #{email}, age = #{age}
WHERE id = #{id}
</update>
```

##### 3.3.4 delete 删除语句

```xml
<delete id="deleteUserById" parameterType="int">
DELETE FROM users WHERE id = #{id}
</delete>
```

#### 3.4 参数传递

**单个参数** ：

```xml
<select id="selectUserById" parameterType="int" resultType="User">
SELECT * FROM users WHERE id = #{id}
</select>
```

**多个参数** （使用 @Param 注解或默认名称）：

```xml
<select id="selectByNameAndAge" resultType="User">
SELECT * FROM users WHERE username = #{param1} AND age = #{param2}
</select>
```

**Map 参数** ：

```xml
<select id="selectByMap" parameterType="map" resultType="User">
SELECT * FROM users
WHERE username = #{name} AND age BETWEEN #{minAge} AND #{maxAge}
</select>
```

### 4. 结果映射（ResultMap）

#### 4.1映射表格汇总

**ResultMap基本属性表** 

| 属性 | 必需 | 描述 | 默认值 | 示例 |
|:---:|:---:|:---:|:---:|:---:|
| `id` | 是 | 结果映射的唯一标识符，在命名空间内必须唯一 | - | `id="userMap"` |
| `type` | 是 | 映射的目标 Java 类型（全限定类名或别名） | - | `type="com.example.User"` |
| `extends` | 否 | 继承另一个已定义的 resultMap | - | `extends="baseMap"` |
| `autoMapping` | 否 | 是否开启未明确映射字段的自动映射 | `false` | `autoMapping="true"` |

**所有子标签功能总结** 

| 子标签 | 用途 | 关键属性 | 适用场景 |
|:---:|:---:|:---:|:---:|
| `<id>` | 主键映射 | `property` , `column` | 数据库主键字段 |
| `<result>` | 普通字段映射 | `property` , `column` | 非主键字段 |
| `<association>` | 一对一关联 | `property` , `javaType` , `select` | 用户-个人资料 |
| `<collection>` | 一对多关联 | `property` , `ofType` , `select` | 用户-订单列表 |
| `<constructor>` | 构造器注入 | `<idArg>` , `<arg>` | 不可变对象 |
| `<discriminator>` | 动态映射选择 | `column` , `<case>` | 继承关系处理 |

**配置选择指南** 

| 场景 | 推荐配置 | 理由 |
|:---:|:---:|:---:|
| 简单字段映射 | `<result>` + `autoMapping="true"` | 减少配置量 |
| 复杂关联查询 | 嵌套结果映射 | 性能更好，单次查询 |
| 大数据量关联 | 嵌套查询 + `fetchType="lazy"` | 避免内存溢出 |
| 继承关系处理 | `<discriminator>` | 结构清晰 |
| 不可变对象 | `<constructor>` | 符合设计原则 |

**1) id主键映射标签** 

用于映射数据库主键字段，MyBatis 使用此标识进行结果集分组和缓存优化。

**属性表：** 

| 属性 | 必需 | 描述 | 示例 |
|:---:|:---:|:---:|:---:|
| `property` | 是 | Java 对象属性名 | `property="id"` |
| `column` | 是 | 数据库列名 | `column="user_id"` |
| `javaType` | 否 | Java 类型（通常可自动推断） | `javaType="java.lang.Long"` |
| `jdbcType` | 否 | JDBC 类型 | `jdbcType="BIGINT"` |
| `typeHandler` | 否 | 自定义类型处理器 | `typeHandler="com.example.MyTypeHandler"` |

**2) result 普通字段映射标签** 

用于映射非主键字段。

**属性表：** 

| 属性 | 必需 | 描述 | 示例 |
|:---:|:---:|:---:|:---:|
| `property` | 是 | Java 对象属性名 | `property="userName"` |
| `column` | 是 | 数据库列名 | `column="user_name"` |
| `javaType` | 否 | Java 类型 | `javaType="java.lang.String"` |
| `jdbcType` | 否 | JDBC 类型 | `jdbcType="VARCHAR"` |
| `typeHandler` | 否 | 自定义类型处理器 | `typeHandler="StringTypeHandler"` |

**关联关系映射标签：** 
**3) association一对一关联映射** 

用于处理"有一个"的关系，如用户有一个个人资料。

**属性表：** 

| 属性 | 必需 | 描述 | 示例 |
|:---:|:---:|:---:|:---:|
| `property` | 是 | Java 对象中的关联属性名 | `property="profile"` |
| `javaType` | 否 | 关联对象的 Java 类型 | `javaType="UserProfile"` |
| `resultMap` | 否 | 引用已定义的 resultMap | `resultMap="profileMap"` |
| `column` | 否 | 传递给嵌套查询的列 | `column="user_id"` |
| `select` | 否 | 嵌套查询的语句 ID | `select="selectProfileById"` |
| `fetchType` | 否 | 加载策略：lazy/eager | `fetchType="lazy"` |

**4) collection一对多关联映射** 

用于处理"有多个"的关系，如用户有多个订单。

**属性表：** 

| 属性 | 必需 | 描述 | 示例 |
|:---:|:---:|:---:|:---:|
| `property` | 是 | Java 对象中的集合属性名 | `property="orders"` |
| `ofType` | 是 | 集合中元素的 Java 类型 | `ofType="Order"` |
| `resultMap` | 否 | 引用已定义的 resultMap | `resultMap="orderMap"` |
| `column` | 否 | 传递给嵌套查询的列 | `column="id"` |
| `select` | 否 | 嵌套查询的语句 ID | `select="selectOrdersByUserId"` |
| `fetchType` | 否 | 加载策略：lazy/eager | `fetchType="lazy"` |

#### 4.2 基本结果映射

当数据库列名与 Java 属性名不一致时，使用 resultMap 进行映射：

```xml
<!-- 结果集映射 -->
<resultMap id="userResultMap" type="User">
<!-- 主键映射 -->
<id property="id" column="user_id"/>
<!-- 普通字段映射 -->
<result property="username" column="user_name"/>
<result property="email" column="user_email"/>
<result property="createTime" column="create_time"/>
</resultMap>
<select id="selectUserWithMapping" resultMap="userResultMap">
SELECT user_id, user_name, user_email, create_time FROM users
</select>
<!-- 鉴别器 -->
<discriminator javaType="int" column="type">
    <case value="1" resultMap="adminMap"/>
    <case value="2" resultMap="userMap"/>
</discriminator>
```

#### 4.3 关联查询（一对一）

使用 `association` 处理一对一关联关系：

```xml
<resultMap id="userWithProfileMap" type="User">
<id property="id" column="id"/>
<result property="username" column="username"/>
<result property="email" column="email"/>
<!-- 一对一关联 -->
<association property="profile" javaType="UserProfile">
<id property="profileId" column="profile_id"/>
<result property="realName" column="real_name"/>
<result property="address" column="address"/>
</association>
</resultMap>
<select id="selectUserWithProfile" resultMap="userWithProfileMap">
SELECT u.*, p.profile_id, p.real_name, p.address
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.id = #{id}
</select>
```

#### 4.4 集合查询（一对多）

使用 `collection` 处理一对多关联关系：

```xml
<resultMap id="userWithOrdersMap" type="User">
<id property="id" column="id"/>
<result property="username" column="username"/>
<result property="email" column="email"/>
<!-- 一对多关联 -->
<collection property="orders" ofType="Order">
<id property="orderId" column="order_id"/>
<result property="orderNo" column="order_no"/>
<result property="amount" column="amount"/>
<result property="createTime" column="order_create_time"/>
</collection>
</resultMap>
<select id="selectUserWithOrders" resultMap="userWithOrdersMap">
SELECT u.*, o.order_id, o.order_no, o.amount, o.create_time as order_create_time
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.id = #{id}
</select>
```

### 5. 动态 SQL

#### 5.1 if 条件判断

```xml
<select id="findUsersByCondition" parameterType="map" resultType="User">
SELECT * FROM users
<where>
<if test="username != null and username != ''">
AND username LIKE CONCAT('%', #{username}, '%')
</if>
<if test="email != null">
AND email = #{email}
</if>
<if test="minAge != null">
AND age >= #{minAge}
</if>
<if test="maxAge != null">
AND age <= #{maxAge}
</if>
</where>
</select>
```

#### 5.2 choose, when, otherwise 多条件选择

```xml
<select id="findUsersDynamic" parameterType="map" resultType="User">
SELECT * FROM users
<where>
<choose>
<when test="username != null">
AND username = #{username}
</when>
<when test="email != null">
AND email = #{email}
</when>
<otherwise>
AND status = 'ACTIVE'
</otherwise>
</choose>
</where>
</select>
```

#### 5.3 foreach 循环遍历

```xml
<select id="findUsersByIds" parameterType="list" resultType="User">
SELECT * FROM users
WHERE id IN
<foreach collection="list" item="id" open="(" separator="," close=")">
#{id}
</foreach>
</select>
<insert id="batchInsert" parameterType="list">
INSERT INTO users (username, email) VALUES
<foreach collection="list" item="user" separator=",">
(#{user.username}, #{user.email})
</foreach>
</insert>
```

#### 5.4 trim, set 语句优化

```xml
<update id="updateUserDynamic" parameterType="User">
UPDATE users
<set>
<if test="username != null">username = #{username},</if>
<if test="email != null">email = #{email},</if>
<if test="age != null">age = #{age},</if>
</set>
WHERE id = #{id}
</update>
```

### 6. 高级功能配置

#### 6.1 `<selectKey>` 主键处理

```xml
<insert id="insertUser" parameterType="User">
<selectKey keyProperty="id" resultType="Long" order="BEFORE">
SELECT user_seq.nextval FROM dual
</selectKey>
INSERT INTO users (id, name, email) VALUES (#{id}, #{name}, #{email})
</insert>
<insert id="insertUserMySQL" parameterType="User">
INSERT INTO users (name, email) VALUES (#{name}, #{email})
<selectKey keyProperty="id" resultType="Long" order="AFTER">
SELECT LAST_INSERT_ID()
</selectKey>
</insert>
```

#### 6.2 缓存配置

**一级缓存** ：默认开启，SqlSession 级别。

**二级缓存配置** ：

```xml
<cache
eviction="FIFO"
flushInterval="60000"
size="512"
readOnly="true"/>
<select id="selectUserById" parameterType="int" resultType="User" useCache="true">
SELECT * FROM users WHERE id = #{id}
</select>
```

#### 6.3 SQL 片段重用

使用 `sql` 和 `include` 标签实现 SQL 片段重用：

```xml
<sql id="userColumns">
id, username, email, age, create_time
</sql>
<sql id="userTable">
users
</sql>
<select id="selectAllUsers" resultType="User">
SELECT
<include refid="userColumns"/>
FROM
<include refid="userTable"/>
</select>
<sql id="dynamicWhere">
<where>
<if test="username != null">AND username = #{username}</if>
<if test="status != null">AND status = #{status}</if>
</where>
</sql>
<select id="findUsers" parameterType="map" resultType="User">
SELECT <include refid="userColumns"/>
FROM <include refid="userTable"/>
<include refid="dynamicWhere"/>
</select>
```

### 7. 类型处理器（TypeHandlers）

自定义类型处理器处理特殊数据类型转换：

```xml
<typeHandlers>
<typeHandler handler="com.example.handler.JsonTypeHandler"
javaType="com.example.model.JsonData"/>
</typeHandlers>
```

```java
// 自定义类型处理器实现
public class JsonTypeHandler extends BaseTypeHandler<JsonData> {
@Override
public void setNonNullParameter(PreparedStatement ps, int i,
JsonData parameter, JdbcType jdbcType) throws SQLException {
ps.setString(i, parameter.toJson());
}
@Override
public JsonData getNullableResult(ResultSet rs, String columnName) throws SQLException {
return JsonData.fromJson(rs.getString(columnName));
}
}
```

### 8. 插件（Plugins）配置

配置 MyBatis 插件实现拦截器功能：

```xml
<plugins>
<plugin interceptor="com.example.plugin.SqlLogPlugin">
<property name="enableLog" value="true"/>
</plugin>
<plugin interceptor="com.github.pagehelper.PageInterceptor">
<property name="helperDialect" value="mysql"/>
<property name="reasonable" value="true"/>
</plugin>
</plugins>
```

### 9. 完整配置示例

#### 9.1 完整的 mybatis-config.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
<properties resource="jdbc.properties">
<property name="logEnabled" value="true"/>
</properties>
<settings>
<setting name="cacheEnabled" value="true"/>
<setting name="lazyLoadingEnabled" value="true"/>
<setting name="mapUnderscoreToCamelCase" value="true"/>
<setting name="logImpl" value="STDOUT_LOGGING"/>
</settings>
<typeAliases>
<package name="com.example.model"/>
</typeAliases>
<plugins>
<plugin interceptor="com.example.plugin.SqlLogPlugin"/>
</plugins>
<environments default="development">
<environment id="development">
<transactionManager type="JDBC"/>
<dataSource type="POOLED">
<property name="driver" value="${jdbc.driver}"/>
<property name="url" value="${jdbc.url}"/>
<property name="username" value="${jdbc.username}"/>
<property name="password" value="${jdbc.password}"/>
</dataSource>
</environment>
</environments>
<mappers>
<package name="com.example.mapper"/>
</mappers>
</configuration>
```

#### 9.2 完整的 Mapper XML 示例

```java
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
"http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.UserMapper">
<resultMap id="userDetailMap" type="User">
<id property="id" column="id"/>
<result property="username" column="username"/>
<result property="email" column="email"/>
<result property="age" column="age"/>
<result property="createTime" column="create_time"/>
<!-- 一对一关联 -->
<association property="profile" javaType="UserProfile">
  <id property="id" column="profile_id"/>
  <result property="realName" column="real_name"/>
</association>

<!-- 一对多关联 -->
<collection property="orders" ofType="Order">
  <id property="id" column="order_id"/>
  <result property="orderNo" column="order_no"/>
  <result property="amount" column="amount"/>
</collection>
</resultMap>
<sql id="userColumns">
u.id, u.username, u.email, u.age, u.create_time
</sql>
<select id="findUsersByCondition" parameterType="map" resultMap="userDetailMap">
SELECT
<include refid="userColumns"/>,
p.id as profile_id, p.real_name,
o.id as order_id, o.order_no, o.amount
FROM users u
LEFT JOIN user_profiles p ON u.id = p.user_id
LEFT JOIN orders o ON u.id = o.user_id
<where>
<if test="username != null and username != ''">
AND u.username LIKE CONCAT('%', #{username}, '%')
</if>
<if test="minAge != null">
AND u.age >= #{minAge}
</if>
<if test="maxAge != null">
AND u.age <= #{maxAge}
</if>
<if test="statusList != null and statusList.size() > 0">
AND u.status IN
<foreach collection="statusList" item="status" open="(" separator="," close=")">
#{status}
</foreach>
</if>
</where>
ORDER BY u.create_time DESC
</select>
<insert id="insertUser" parameterType="User" useGeneratedKeys="true" keyProperty="id">
INSERT INTO users (username, email, age, create_time)
VALUES (#{username}, #{email}, #{age}, NOW())
</insert>
</mapper>
```

### 10. 最佳实践

1. **配置文件管理** ：将数据库连接信息等敏感配置放在外部属性文件中

2. **结果映射** ：复杂查询优先使用 `resultMap` 而非 `resultType`

3. **动态 SQL** ：合理使用动态 SQL 标签提高代码复用性

4. **SQL 片段** ：将重复的 SQL 片段提取出来使用 `sql` 和 `include` 标签

5. **缓存策略** ：根据业务需求合理配置缓存策略

6. **命名规范** ：遵循统一的命名规范，提高代码可读性

通过合理的 XML 配置，可以充分发挥 MyBatis 的强大功能，构建高效、可维护的数据访问层。