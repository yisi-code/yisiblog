---
title: "JPA 注解完整指南"
date: 2025-11-28 16:11:54
category: "全栈技术栈"
tags:
- "数据库"
- "java"
- "后端"
---

## JPA 注解完整指南

### 1. 实体与表映射注解

| 注解 | 作用 | 关键属性 |
|:---:|:---:|:---:|
| **@Entity** | 标记一个类为JPA实体，表示该类的实例对应数据库中的一条记录 | `name` : 指定实体名称（默认使用类名） |
| **@Table** | 指定实体映射的数据库表信息 | `name` : 数据库表名<br/>`schema` : 数据库模式名<br/>`catalog` : 数据库目录名<br/>`uniqueConstraints` : 定义唯一约束 |
| **@MappedSuperclass** | 标识一个类为映射超类，其属性将被继承到实体类中，但不会生成单独的表 | 无主要属性（类级别注解） |

```java
@Entity
public class User {
// 类实现
}
@Entity
@Table(name = "users", schema = "public")
public class User {
// 类实现
}
@MappedSuperclass
public abstract class BaseEntity {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
@CreatedDate
private LocalDateTime createTime;

@LastModifiedDate
private LocalDateTime updateTime;
}
@Entity
public class User extends BaseEntity {
private String username;
// 继承id, createTime, updateTime字段
}
```

### 2. 主键相关注解

| 注解 | 作用 | 关键属性 |
|:---:|:---:|:---:|
| **@Id** | 标识实体类的主键字段 | 无属性 |
| **@GeneratedValue** | 定义主键的生成策略 | `strategy` : 生成策略（IDENTITY/SEQUENCE/TABLE/AUTO）<br/>`GenerationType.IDENTITY` : 数据库自增（MySQL、SQL Server）<br/>`GenerationType.SEQUENCE` : 使用数据库序列（Oracle、PostgreSQL）<br/>`GenerationType.TABLE` : 使用专门的表来维护主键<br/>`GenerationType.AUTO` : 由JPA提供商自动选择<br/>`generator` : 主键生成器名称 |
| **@EmbeddedId** | 用于复合主键（嵌入类方式） | 无属性（需结合@Embeddable类使用） |
| **@IdClass** | 用于复合主键（独立主键类方式） | `value` : 指定主键类的类名 |

```java
@Entity
public class User {
@Id
private Long id;
}

@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;
// 使用序列的示例
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
@SequenceGenerator(name = "user_seq", sequenceName = "user_sequence", allocationSize = 1)
private Long id;
```

#### GeneratedValue主键生成策略

| 策略 | 适用场景 |
|:---:|:---:|
| **IDENTITY** | 数据库自增（MySQL、SQL Server） |
| **SEQUENCE** | 数据库序列（Oracle、PostgreSQL） |
| **TABLE** | 使用专用表生成主键 |
| **AUTO** | 由JPA提供商自动选择 |

#### 复合主键注解

```java
// 复合主键类
@Embeddable
public class UserRoleId implements Serializable {
private Long userId;
private Long roleId;
// 必须实现equals和hashCode方法
}
// 实体类使用复合主键
@Entity
public class UserRole {
@EmbeddedId
private UserRoleId id;
private String description;
}
// 复合主键类
public class UserRoleId implements Serializable {
private Long userId;
private Long roleId;
}
// 实体类
@Entity
@IdClass(UserRoleId.class)
public class UserRole {
@Id
private Long userId;
@Id
private Long roleId;

private String description;
}
```

### 3. 字段映射注解

| 注解 | 作用 | 关键属性 |
|:---:|:---:|:---:|
| **@Column** | 定义属性与数据库列的映射关系 | `name` : 列名<br/>`nullable` : 是否允许为null<br/>`unique` : 是否唯一约束<br/>`length` : 字符串长度限制<br/>`precision` : 数值精度（总位数）<br/>`scale` : 小数位数<br/>`insertable` : 是否参与INSERT<br/>`updatable` : 是否参与UPDATE |
| **@Enumerated** | 映射Java枚举类型到数据库 | `value` : 存储方式<br/>`EnumType.STRING` : 存储枚举的名称（推荐）<br/>`EnumType.ORDINAL` : 存储枚举的序号 |
| **@Temporal** | 指定日期时间类型的精度（用于java.util.Date和java.util.Calendar） | `value` : 精度类型（DATE/TIME/TIMESTAMP）<br/>`TemporalType.DATE` : 只存储日期<br/>`TemporalType.TIME` : 只存储时间<br/>`TemporalType.TIMESTAMP` : 存储日期和时间 |
| **@Lob** | 映射大对象类型（CLOB/BLOB）<br/>CLOB (Character Large Object，可存大型文本数据)<br/>BLOB (Binary Large Object，可存大型二进制数据) | 无属性 |
| **@Transient** | 标记字段不持久化到数据库 | 无属性 |
| **@Basic** | 定义基本属性的加载策略 | `fetch` : 加载策略（LAZY/EAGER）<br/>`optional` : 是否允许为null |

#### 日期时间精度

| 类型 | 存储格式 |
|:---:|:---:|
| **DATE** | 只存储日期（2008-08-08） |
| **TIME** | 只存储时间（20:00:00） |
| **TIMESTAMP** | 存储日期和时间（2008-08-08 20:00:00.000000001） |

```java
@Entity
public class User {
@Column(
name = "user_name",
nullable = false,
unique = true,
length = 50
)
private String username;
@Column(precision = 10, scale = 2)
private BigDecimal salary;
}

public enum UserStatus {
ACTIVE, INACTIVE, PENDING
}
@Entity
public class User {
@Enumerated(EnumType.STRING)
private UserStatus status;
}
@Entity
public class Event {
@Temporal(TemporalType.DATE)
private Date eventDate;
@Temporal(TemporalType.TIMESTAMP)
private Date createTime;
}
@Entity
public class User {
@Lob
private String biography; // 映射为CLOB
@Lob
private byte[] avatar; // 映射为BLOB
}
@Entity
public class User {
private String password;
@Transient
private String confirmPassword; // 不存储到数据库
}
```java
@Entity
public class User {
@Basic(fetch = FetchType.LAZY, optional = false)
private String largeText;
}
```

### 4. 关联关系注解

| 注解 | 作用 | 关键属性 |
|:---:|:---:|:---:|
| **@OneToOne** | 定义一对一关联关系 | `cascade` : 级联操作类型<br/>`fetch` : 加载策略<br/>`mappedBy` : 关系被维护方（主键被作为其他表外键） |
| **@OneToMany** | 定义一对多关联关系 | `cascade` : 级联操作类型<br/>`fetch` : 加载策略<br/>`mappedBy` : 关系被维护方（主键被作为其他表外键）<br/>`orphanRemoval` : 是否级联删除孤儿子实体 |
| **@ManyToOne** | 定义多对一关联关系 | `cascade` : 级联操作类型<br/>`fetch` : 加载策略<br/>`optional` : 是否允许为null |
| **@ManyToMany** | 定义多对多关联关系 | `cascade` : 级联操作类型<br/>`fetch` : 加载策略<br/>`mappedBy` : 关系被维护方（主键被作为其他表外键） |
| **@JoinColumn** | 定义外键列的属性 | `name` : 本表中要添加的外键列名<br/>`referencedColumnName` : 引用列名<br/>`nullable` : 是否允许为null |
| **@JoinTable** | 定义多对多关系的连接表 | `name` : 连接表名<br/>`joinColumns` :本表主键在连接表中的外键名<br/>`inverseJoinColumns` : 关联表主键在链接表中的外键名 |

注：

1. 主键列指当前表的唯一标识字段，如user表的id字段；外键列指引用其他表主键的字段，如order表中的user_id字段（引用user表的id）。

2. 在关系维护方（拥有外键的一方）修改对方表值会使对方表改变，而在对方表中尝试修改本方的值不会改变本方的值。

```java
@Entity
public class User {
@Id
private Long id;
@OneToOne(cascade = CascadeType.ALL)
@JoinColumn(name = "profile_id")
private UserProfile profile;
}
@Entity
public class UserProfile {
@Id
private Long id;
@OneToOne(mappedBy = "profile")
private User user;
}

@Entity
public class Department {
@Id
private Long id;
@OneToMany(mappedBy = "department", cascade = CascadeType.ALL)
private List<Employee> employees = new ArrayList<>();
}
@Entity
public class Employee {
@Id
private Long id;
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "dept_id")
private Department department;
}

@Entity
public class Student {
@Id
private Long id;
@ManyToMany
@JoinTable(
    name = "student_course",
    joinColumns = @JoinColumn(name = "student_id"),
    inverseJoinColumns = @JoinColumn(name = "course_id")
)
private List<Course> courses = new ArrayList<>();
}
@Entity
public class Course {
@Id
private Long id;
@ManyToMany(mappedBy = "courses")
private List<Student> students = new ArrayList<>();
}
```

#### 关联关系通用属性说明

##### cascade（级联操作）

| 类型 | 作用 |
|:---:|:---:|
| **PERSIST** | 级联保存操作 |
| **MERGE** | 级联合并操作 |
| **REMOVE** | 级联删除操作 |
| **REFRESH** | 级联刷新操作 |
| **DETACH** | 级联脱管操作 |
| **ALL** | 所有级联操作 |

```java
// 级联保存和删除
@OneToMany(cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
private List<Order> orders;
// 全部级联操作（谨慎使用）
@OneToMany(cascade = CascadeType.ALL)
private List<Order> orders;
```

##### fetch（加载策略）

| 策略 | 作用 |
|:---:|:---:|
| **LAZY** | 懒加载，访问时才加载关联数据 |
| **EAGER** | 急加载，立即加载关联数据 |

```java
// 懒加载（推荐用于大数据量关联）
@ManyToOne(fetch = FetchType.LAZY)
private Department department;
// 急加载（立即加载关联数据）
@OneToMany(fetch = FetchType.EAGER)
private List<Order> orders;
```

### 5. 继承策略注解

| 注解 | 作用 | 关键属性 |
|:---:|:---:|:---:|
| **@Inheritance** | 指定实体类的继承映射策略，定义父类实体与子类实体在数据库中的存储方式 | `strategy` : 继承策略（SINGLE_TABLE/JOINED/TABLE_PER_CLASS） |
| **@DiscriminatorColumn** | 用于定义鉴别字段，区分单表策略或连接表策略中不同子类的记录。 | `name ` :指定鉴别字段的列名，默认值 `"DTYPE"` <br/>`discriminatorType ` :指定鉴别字段的数据类型，默认值 `"DiscriminatorType.STRING"` <br/>`length ` :指定鉴别字段的长度（仅对STRING类型有效），默认值 `"31"` <br/>`columnDefinition ` :自定义鉴别字段的DDL定义 |
| **@DiscriminatorValue** | 用于为每个子类实体指定在鉴别字段中存储的具体值。 | – |

InheritanceType.SINGLE_TABLE（单表策略，默认值）
特点：所有继承体系的实体都映射到同一张数据库表，通过鉴别字段区分不同类型。

InheritanceType.JOINED（连接表策略）
特点：父类和子类分别映射到不同的表，通过主键关联。

InheritanceType.TABLE_PER_CLASS（每个类一张表）
特点：每个具体类映射到独立的表，包含所有继承的字段。

**需要使用这些注解的情况是** ：当实体类有继承关系时。

1. 追求最佳查询性能并能接受单表冗余和 NULL值，选择单表策略 (SINGLE_TABLE) 。

2. 注重数据库设计的规范性，希望减少冗余和NULL值，并能接受因表连接带来的性能开销，选择连接表策略 (JOINED) 。

3. 每个类一张表策略 (TABLE_PER_CLASS)因性能和维护性问题，通常不推荐使用。

#### @Inheritance

```java
// 单表策略（所有子类字段都在一张表）
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "user_type")
public abstract class User {
@Id
private Long id;
private String name;
}
@Entity
@DiscriminatorValue("CUSTOMER")
public class Customer extends User {
private String loyaltyLevel;
}
@Entity
@DiscriminatorValue("ADMIN")
public class Admin extends User {
private String permissions;
}
// 连接表策略
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class User {
@Id
private Long id;
}
@Entity
public class Customer extends User {
private String loyaltyLevel;
}
// 每个类对应表策略
@Entity
@Inheritance(strategy = InheritanceType.TABLE_PER_CLASS)
public abstract class User {
@Id
private Long id;
}
```

### 6. 高级功能注解

| 注解 | 作用 | 关键属性 |
|:---:|:---:|:---:|
| **@Version** | 实现乐观锁控制 | 无属性 |
| **@Embeddable** | 标记类为可嵌入类（值对象） | 无属性（类级别注解） |
| **@Embedded** | 将可嵌入类的实例嵌入到实体中 | 无属性 |
| **@ElementCollection** | 映射基本类型或可嵌入类的集合 | `targetClass` : 集合元素类型<br/>`fetch` : 加载策略 |
| **@AttributeOverrides** | 多个属性重写 | 包含@AttributeOverride |
| **@AttributeOverride** | 用于 **重写嵌入式对象（@Embeddable）中单个属性的数据库列映射** | `name` :嵌入式对象中的属性名<br/>`column ` :@Column(重写的列定义) |

```java
@Entity
public class Product {
@Id
private Long id;
@Version
private Long version; // 用于乐观锁控制

private String name;
private Integer stock;
}
```

```java
// @Embeddable / @Embedded（组件映射）
@Embeddable
public class Address {
private String street;
private String city;
private String zipCode;
}
@Entity
public class User {
@Id
private Long id;
@Embedded
private Address homeAddress;

@Embedded
@AttributeOverrides({
    @AttributeOverride(name = "street", column = @Column(name = "office_street")),
    @AttributeOverride(name = "city", column = @Column(name = "office_city"))
})
private Address officeAddress;
}

// @ElementCollection（元素集合）
@Entity
public class User {
@Id
private Long id;
@ElementCollection
@CollectionTable(name = "user_phones", joinColumns = @JoinColumn(name = "user_id"))
@Column(name = "phone_number")
private Set<String> phoneNumbers = new HashSet<>();

@ElementCollection
@CollectionTable(name = "user_addresses")
private List<Address> addresses = new ArrayList<>();
}
```

### 7. 查询相关注解

| 注解 | 作用 | 关键属性 |
|:---:|:---:|:---:|
| **@NamedQuery** | 定义命名的JPQL查询 | `name` : 查询名称<br/>`query` : JPQL查询语句 |
| **@NamedNativeQuery** | 定义命名的原生SQL查询 | `name` : 查询名称<br/>`query` : SQL查询语句<br/>`resultClass` : 结果类型 |

```java
//@NamedQuery

@Entity
@NamedQuery(
name = "User.findByStatus",
query = "SELECT u FROM User u WHERE u.status = :status"
)
@NamedQueries({
@NamedQuery(name = "User.findAll", query = "SELECT u FROM User u"),
@NamedQuery(name = "User.countByStatus", query = "SELECT COUNT(u) FROM User u WHERE u.status = :status")
})
public class User {
// 实体定义
}
// 使用命名查询
List<User> users = entityManager.createNamedQuery("User.findByStatus", User.class)
.setParameter("status", "ACTIVE")
.getResultList();

//@NamedNativeQuery

@Entity
@NamedNativeQuery(
name = "User.findActiveUsers",
query = "SELECT * FROM users WHERE status = 'ACTIVE'",
resultClass = User.class
)
public class User {
// 实体定义
}
```

### 8. 审计注解（Spring Data JPA）

| 注解 | 作用 | 关键属性 |
|:---:|:---:|:---:|
| **@CreatedDate** | 自动设置实体创建时间 | 无属性 |
| **@LastModifiedDate** | 自动设置最后修改时间 | 无属性 |
| **@CreatedBy** | 自动设置创建用户 | 无属性 |
| **@LastModifiedBy** | 自动设置最后修改用户 | 无属性 |

```java
@Entity
@EntityListeners(AuditingEntityListener.class)
public class User {
@Id
private Long id;
@CreatedDate
private LocalDateTime createTime;

@LastModifiedDate
private LocalDateTime updateTime;

@CreatedBy
private String createdBy;

@LastModifiedBy
private String lastModifiedBy;
}
// 启用JPA审计
@Configuration
@EnableJpaAuditing
public class JpaConfig {
@Bean
public AuditorAware<String> auditorProvider() {
return () -> Optional.of("system"); // 从安全上下文获取当前用户
}
}
```

### 9. 完整实体类示例

```java
@Entity
@Table(name = "users")
@Data
public class User {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long uID;
@NotBlank(message = "账号不能为空")
@Column(name = "account", unique = true, nullable = false, length = 50)
private String account;

@Column(name = "password", nullable = false, length = 100)
private String password;

@Column(name = "name", length = 50)
private String name;

@Column(name = "avatar")
private String avatar;

@Enumerated(EnumType.STRING)
@Column(name = "sex", length = 10)
private Gender sex = Gender.UNKNOWN;

@Lob
@Column(name = "profile")
private String profile;

@Column(name = "phone", length = 20)
private String phone;

@Email(message = "邮箱格式不正确")
@Column(name = "email", unique = true)
private String email;

@Column(name = "real_name")
private String realName;

@Column(name = "citizen_id")
private String citizenIDNumber;

@Column(name = "enabled")
private boolean enabled = true;

@Column(name = "locked")
private boolean locked = false;

@Transient
private String accessToken;

@Version
private Long version;

@CreatedDate
private LocalDateTime createTime;

@LastModifiedDate
private LocalDateTime updateTime;

public enum Gender {
    MALE, FEMALE, UNKNOWN
}
}
```

### 10. 最佳实践建议

1. **合理使用延迟加载** : 对大数据量的关联使用 `FetchType.LAZY`

2. **谨慎使用级联操作** : 避免误用 `CascadeType.ALL` 导致意外数据删除

3. **正确实现equals/hashCode** : 基于业务主键或数据库主键实现

4. **使用枚举字符串存储** : 优先使用 `EnumType.STRING` 而非 `EnumType.ORDINAL`

5. **合理设计继承策略** : 根据业务需求选择合适的继承映射策略

6. **使用乐观锁控制并发** : 通过 `@Version` 注解实现乐观锁机制

7. **规范命名约定** : 保持数据库列名与实体字段名的一致性

这份完整的JPA注解指南涵盖了日常开发中的主要使用场景，可以作为JPA开发的参考手册。