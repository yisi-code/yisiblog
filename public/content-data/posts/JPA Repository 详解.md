---
title: "JPA Repository 详解"
date: 2025-11-28 17:22:54
category: "全栈技术栈"
tags:
- "数据库"
- "后端"
- "java"
---

## JPA Repository 详解

[JPA事务和锁详细讲解请见此](https://blog.csdn.net/m1751250104/article/details/155354167?sharetype=blogdetail&sharerId=155354167&sharerefer=PC&sharesource=m1751250104&spm=1011.2480.3001.8118) 

### 1. 概述

JPA Repository 是 Spring Data JPA 的核心组件，它通过接口声明的方式简化了数据访问层(DAO)的开发。基于方法命名约定和注解配置，可以自动生成查询实现，大大减少了样板代码。

### 2. 接口层次结构

#### 2.1 核心接口关系

Repository (标记接口)
↓
CrudRepository (基础CRUD操作)
↓
PagingAndSortingRepository (分页排序扩展)
↓
JpaRepository (JPA特定功能扩展)

#### 2.2 功能扩展接口

- `JpaSpecificationExecutor` - 动态查询条件支持

- `QueryByExampleExecutor` - 按示例查询支持

### 3. 核心接口详解

#### 3.1 Repository<T, ID> 接口

**作用** ：标记接口，用于类型定义和组件扫描

```java
// 源码定义
@Indexed
public interface Repository<T, ID> {
// 空接口，无方法定义
}
```

**特性** ：

- 不包含任何方法

- 主要用于被Spring容器识别

- 所有Repository接口的根接口

#### 3.2 CrudRepository<T, ID> 接口

**核心CRUD操作方法** ：

| 方法签名 | 返回类型 | 说明 |
|:---:|:---:|:---:|
| `save(S entity)` | `<S extends T> S` | 保存单个实体 |
| `saveAll(Iterable<S> entities)` | `<S extends T> Iterable<S>` | 批量保存实体 |
| `findById(ID id)` | `Optional<T>` | 根据ID查询实体 |
| `existsById(ID id)` | `boolean` | 检查实体是否存在 |
| `findAll()` | `Iterable<T>` | 查询所有实体 |
| `findAllById(Iterable<ID> ids)` | `Iterable<T>` | 根据ID列表查询 |
| `count()` | `long` | 统计实体总数 |
| `deleteById(ID id)` | `void` | 根据ID删除实体 |
| `delete(T entity)` | `void` | 删除指定实体 |
| `deleteAll(Iterable<? extends T> entities)` | `void` | 批量删除实体 |
| `deleteAll()` | `void` | 删除所有实体 |

**实现细节** ：

- `save()` 方法会根据实体状态自动选择 `persist()` 或 `merge()`

- `delete` 操作会先检查实体是否存在，不存在会抛出异常

- 所有查询方法都包装在只读事务中

#### 3.3 PagingAndSortingRepository<T, ID> 接口

**扩展方法** ：

```java
public interface PagingAndSortingRepository<T, ID> extends CrudRepository<T, ID> {
Iterable<T> findAll(Sort sort); // 排序查询
Page<T> findAll(Pageable pageable); // 分页查询
}
```

**Sort 排序使用** ：

```java
// 单字段排序
Sort sort1 = Sort.by("name").ascending();
// 多字段排序
Sort sort2 = Sort.by("name").ascending()
.and(Sort.by("age").descending());
// 排序方向常量
Sort sort3 = Sort.by(Sort.Direction.ASC, "name");
```

**Pageable 分页使用** ：

```java
// 创建分页请求（页数从0开始）
Pageable pageable = PageRequest.of(0, 10, Sort.by("name"));
// 分页查询结果
Page<User> page = userRepository.findAll(pageable);
// 获取分页信息
List<User> content = page.getContent(); // 当前页数据
int totalPages = page.getTotalPages(); // 总页数
long totalElements = page.getTotalElements(); // 总记录数
int number = page.getNumber(); // 当前页码
int size = page.getSize(); // 每页大小
```

#### 3.4 JpaRepository<T, ID> 接口

**JPA特定扩展方法** ：

| 方法签名 | 返回类型 | 说明 |
|:---:|:---:|:---:|
| `findAll()` | `List<T>` | 查询所有（返回List） |
| `findAll(Sort sort)` | `List<T>` | 排序查询（返回List） |
| `findAllById(Iterable<ID> ids)` | `List<T>` | ID列表查询（返回List） |
| `saveAll(Iterable<S> entities)` | `List<S>` | 批量保存（返回List） |
| `flush()` | `void` | 强制刷新持久化上下文 |
| `saveAndFlush(S entity)` | `<S extends T> S` | 保存并立即刷新 |
| `saveAllAndFlush(Iterable<S> entities)` | `<S extends T> List<S>` | 批量保存并刷新 |
| `deleteInBatch(Iterable<T> entities)` | `void` | 批量删除（高效） |
| `deleteAllInBatch()` | `void` | 批量删除所有 |
| `getReferenceById(ID id)` | `T` | 获取实体引用（延迟加载） |

**批量操作优势** ：

- `deleteInBatch()` 直接生成DELETE SQL，避免先查询再删除

- 适合大量数据删除场景，性能更高

### 4. 查询方法详解

#### 4.1 方法名派生查询规则

**支持的关键字** ：

| 关键字 | 示例方法名 | 生成的JPQL片段 |
|:---:|:---:|:---:|
| `And` | `findByLastnameAndFirstname` | `where x.lastname = ?1 and x.firstname = ?2` |
| `Or` | `findByLastnameOrFirstname` | `where x.lastname = ?1 or x.firstname = ?2` |
| `Between` | `findByStartDateBetween` | `where x.startDate between ?1 and ?2` |
| `LessThan` | `findByAgeLessThan` | `where x.age < ?1` |
| `GreaterThan` | `findByAgeGreaterThan` | `where x.age > ?1` |
| `IsNull` | `findByAgeIsNull` | `where x.age is null` |
| `IsNotNull` , `NotNull` | `findByAge(Is)NotNull` | `where x.age not null` |
| `Like` | `findByFirstnameLike` | `where x.firstname like ?1` |
| `NotLike` | `findByFirstnameNotLike` | `where x.firstname not like ?1` |
| `StartingWith` | `findByFirstnameStartingWith` | `where x.firstname like ?1` (参数加 %) |
| `EndingWith` | `findByFirstnameEndingWith` | `where x.firstname like ?1` (参数加 %) |
| `Containing` | `findByFirstnameContaining` | `where x.firstname like %?1%` |
| `OrderBy` | `findByAgeOrderByLastnameDesc` | `where x.age = ?1 order by x.lastname desc` |
| `Not` | `findByLastnameNot` | `where x.lastname <> ?1` |
| `In` | `findByAgeIn(Collection<Age> ages)` | `where x.age in ?1` |
| `True` | `findByActiveTrue()` | `where x.active = true` |
| `False` | `findByActiveFalse()` | `where x.active = false` |
| `IgnoreCase` | `findByFirstnameIgnoreCase` | `where UPPER(x.firstame) = UPPER(?1)` |

其中?1时占位符：

```java
String sql = "SELECT * FROM users x WHERE x.firstname LIKE ?1";
PreparedStatement stmt = connection.prepareStatement(sql);

// 设置参数值（?1对应第一个参数）
stmt.setString(1, "%张%");  // 匹配包含"张"的姓氏
```

**属性表达式规则** ：

- 支持嵌套属性： `findByAddressZipCode(String zipCode)`

- 使用 `_` 显式分隔： `findByUser_DepUuid(String depUuid)`

- 解析顺序：从右向左截取匹配

#### 4.2 返回类型支持

| 返回类型 | 说明 | 示例 |
|:---:|:---:|:---:|
| `T` | 单个实体 | `User findById(Long id)` |
| `Optional<T>` | 可能为空的单个实体 | `Optional<User> findById(Long id)` |
| `List<T>` | 实体列表 | `List<User> findAll()` |
| `Page<T>` | 分页结果 | `Page<User> findAll(Pageable pageable)` |
| `Slice<T>` | 分片结果（不统计总数） | `Slice<User> findTop10ByAge(int age)` |
| `Stream<T>` | 流式结果（需在事务中） | `Stream<User> findAllByAge(int age)` |
| `long` | 计数结果 | `long countByAge(int age)` |
| `boolean` | 存在性检查 | `boolean existsByEmail(String email)` |

#### 4.3 @Query 注解查询

**JPQL 查询示例** ：

```java
public interface UserRepository extends JpaRepository<User, Long> {
// 基本查询
@Query("SELECT u FROM User u WHERE u.email = ?1")
User findByEmail(String email);

// 命名参数
@Query("SELECT u FROM User u WHERE u.name = :name AND u.age = :age")
List<User> findByNameAndAge(@Param("name") String name, 
                           @Param("age") int age);

// 关联查询
@Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName")
List<User> findByRoleName(@Param("roleName") String roleName);

// 自定义返回DTO
@Query("SELECT new com.example.UserDTO(u.id, u.name) FROM User u")
List<UserDTO> findUserDTOs();

// 分页查询
@Query(value = "SELECT u FROM User u WHERE u.age > :age",
       countQuery = "SELECT COUNT(u) FROM User u WHERE u.age > :age")
Page<User> findUsersOlderThan(@Param("age") int age, Pageable pageable);
}
```

**原生SQL查询** ：

```java
public interface UserRepository extends JpaRepository<User, Long> {
@Query(value = "SELECT * FROM users WHERE age > ?1", 
       nativeQuery = true)
List<User> findUsersOlderThanNative(int age);

// 分页原生查询
@Query(value = "SELECT * FROM users WHERE lastname = ?1 ORDER BY ?2\\:\\:text",
       countQuery = "SELECT COUNT(*) FROM users WHERE lastname = ?1",
       nativeQuery = true)
Page<User> findByLastnameNative(String lastname, String sort, Pageable pageable);
}
```

**修改操作** ：

```java
@Modifying
@Transactional
@Query("UPDATE User u SET u.name = :name WHERE u.id = :id")
int updateUserName(@Param("name") String name, @Param("id") Long id);
@Modifying
@Transactional
@Query("DELETE FROM User u WHERE u.active = false")
int deleteInactiveUsers();
```

**@Modifying 参数说明** ：

- `clearAutomatically = true` ：执行后自动清理持久化上下文

- `flushAutomatically = true` ：执行前自动flush待保存的实体

### 5. 高级特性

#### 5.1 动态查询 Specification

**接口定义** ：

```java
public interface JpaSpecificationExecutor<T> {
Optional<T> findOne(Specification<T> spec);
List<T> findAll(Specification<T> spec);
Page<T> findAll(Specification<T> spec, Pageable pageable);
List<T> findAll(Specification<T> spec, Sort sort);
long count(Specification<T> spec);
}
```

**使用示例** ：

```java
// Specification 构建
public class UserSpecifications {
public static Specification<User> hasName(String name) {
    return (root, query, cb) -> 
        name == null ? null : cb.equal(root.get("name"), name);
}

public static Specification<User> olderThan(int age) {
    return (root, query, cb) -> 
        age <= 0 ? null : cb.greaterThan(root.get("age"), age);
}

public static Specification<User> isActive() {
    return (root, query, cb) -> cb.isTrue(root.get("active"));
}
}
// 组合查询
Specification<User> spec = Specification.where(UserSpecifications.hasName("John"))
.and(UserSpecifications.olderThan(18))
.and(UserSpecifications.isActive());
List<User> users = userRepository.findAll(spec);
```

#### 5.2 示例查询 Example

**接口定义** ：

```java
public interface QueryByExampleExecutor<T> {
<S extends T> Optional<S> findOne(Example<S> example);
<S extends T> Iterable<S> findAll(Example<S> example);
<S extends T> Iterable<S> findAll(Example<S> example, Sort sort);
<S extends T> Page<S> findAll(Example<S> example, Pageable pageable);
<S extends T> long count(Example<S> example);
<S extends T> boolean exists(Example<S> example);
}
**使用示例**：
java
// 创建查询示例
User probe = new User();
probe.setName("John");
probe.setActive(true);
Example<User> example = Example.of(probe,
ExampleMatcher.matching()
.withIgnorePaths("id", "createdDate") // 忽略字段
.withStringMatcher(StringMatcher.CONTAINING)); // 字符串包含匹配
List<User> users = userRepository.findAll(example);
```

#### 5.3 实体图 EntityGraph

**解决N+1查询问题** ：

```java
@Entity
@NamedEntityGraphs({
@NamedEntityGraph(
name = "User.withRoles",
attributeNodes = @NamedAttributeNode("roles")
),
@NamedEntityGraph(
name = "User.withRolesAndPermissions",
attributeNodes = {
@NamedAttributeNode("roles"),
@NamedAttributeNode(value = "roles", subgraph = "roles.permissions")
},
subgraphs = {
@NamedSubgraph(
name = "roles.permissions",
attributeNodes = @NamedAttributeNode("permissions")
)
}
)
})
public class User {
// 实体定义
}
// Repository中使用
public interface UserRepository extends JpaRepository<User, Long> {
@EntityGraph(value = "User.withRoles", type = EntityGraphType.LOAD)
List<User> findByName(String name);

@EntityGraph(attributePaths = {"roles", "profile"})
@Query("SELECT u FROM User u WHERE u.age > :age")
List<User> findAdultUsers(@Param("age") int age);
}
```

#### 5.4 审计功能 Auditing

**启用审计** ：

```java
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
// 审计实体
@Entity
@EntityListeners(AuditingEntityListener.class)
public class User {
@CreatedDate
private LocalDateTime createdDate;

@LastModifiedDate
private LocalDateTime lastModifiedDate;

@CreatedBy
private String createdBy;

@LastModifiedBy
private String lastModifiedBy;
}
// 实现AuditorAware
@Component
public class AuditorAwareImpl implements AuditorAware<String> {
@Override
public Optional<String> getCurrentAuditor() {
// 从安全上下文获取当前用户
return Optional.of(SecurityContextHolder.getContext()
.getAuthentication().getName());
}
}
```

#### 5.5 自定义Repository实现

**定义自定义接口** ：

```java
// 自定义功能接口
public interface CustomUserRepository {
List<User> findActiveUsers();
void refreshUserCache();
int updateLastLoginTime(Long userId, LocalDateTime loginTime);
}
// 主Repository继承
public interface UserRepository extends JpaRepository<User, Long>, CustomUserRepository {
}
// 实现类（命名规则：接口名 + Impl）
@Repository
@Transactional
public class UserRepositoryImpl implements CustomUserRepository {
@PersistenceContext
private EntityManager entityManager;

@Override
public List<User> findActiveUsers() {
    return entityManager.createQuery(
        "SELECT u FROM User u WHERE u.active = true AND u.deleted = false", 
        User.class)
        .getResultList();
}

@Override
public void refreshUserCache() {
    entityManager.getEntityManagerFactory().getCache().evictAll();
}

@Override
public int updateLastLoginTime(Long userId, LocalDateTime loginTime) {
    return entityManager.createQuery(
        "UPDATE User u SET u.lastLoginTime = :loginTime WHERE u.id = :userId")
        .setParameter("loginTime", loginTime)
        .setParameter("userId", userId)
        .executeUpdate();
}
}
```

### 6. 事务管理

#### 6.1 默认事务行为

- **查询方法** ： `@Transactional(readOnly = true)`

- **修改方法** ：需要显式声明 `@Transactional`

- **自定义查询** ：默认无事务，需要手动声明

#### 6.2 事务配置示例

```java
@Service
@Transactional
public class UserService {
private final UserRepository userRepository;

public UserService(UserRepository userRepository) {
    this.userRepository = userRepository;
}

// 继承类级别事务
public User createUser(User user) {
    return userRepository.save(user);
}

// 只读事务
@Transactional(readOnly = true)
public List<User> findAllActiveUsers() {
    return userRepository.findByActiveTrue();
}

// 自定义事务属性
@Transactional(propagation = Propagation.REQUIRES_NEW,
               isolation = Isolation.READ_COMMITTED,
               timeout = 30)
public User updateUserWithAudit(User user) {
    // 复杂业务逻辑
    return userRepository.save(user);
}
}
```

### 7. 性能优化建议

#### 7.1 批量操作优化

```java
// 批量保存（分批处理）
@Transactional
public void batchSaveUsers(List<User> users) {
int batchSize = 50;
for (int i = 0; i < users.size(); i++) {
userRepository.save(users.get(i));
// 分批flush和clear
if (i % batchSize == 0 && i > 0) {
    userRepository.flush();
    entityManager.clear();
}
}
userRepository.flush();
}
// 使用JPA批量操作
@Modifying
@Query("UPDATE User u SET u.loginCount = u.loginCount + 1 WHERE u.id IN :ids")
int incrementLoginCountBatch(@Param("ids") List<Long> ids);
```

#### 7.2 查询优化技巧

```java
// 1. 使用投影减少数据传输
public interface UserSummary {
String getName();
String getEmail();
@Value("#{target.name + ' (' + target.email + ')'}")
String getDisplayInfo();
}
@Query("SELECT u.name as name, u.email as email FROM User u")
List<UserSummary> findUserSummaries();
// 2. 使用JOIN FETCH避免N+1查询
@Query("SELECT u FROM User u JOIN FETCH u.roles WHERE u.department.id = :deptId")
List<User> findUsersByDepartmentWithRoles(@Param("deptId") Long deptId);
// 3. 分页优化（避免count查询）
Slice<User> findTop100ByActiveTrue(Pageable pageable);
```

### 8. 常见问题与解决方案

#### 8.1 延迟加载异常处理

```java
// 方案1：使用@Transactional确保会话存在
@Transactional(readOnly = true)
public User getUserWithRoles(Long userId) {
User user = userRepository.findById(userId).orElseThrow();
user.getRoles().size(); // 触发延迟加载
return user;
}
// 方案2：使用EntityGraph预先加载
@EntityGraph(attributePaths = "roles")
Optional<User> findWithRolesById(Long id);
```

#### 8.2 唯一约束异常处理

```java
@Transactional
public User createUserSafe(User user) {
try {
return userRepository.save(user);
} catch (DataIntegrityViolationException e) {
// 处理唯一约束冲突
if (e.getMessage().contains("UK_USER_EMAIL")) {
throw new EmailAlreadyExistsException("邮箱已存在");
}
throw e;
}
}
```

#### 8.3 手动ID分配问题

```java
@Entity
public class User implements Persistable<Long> {
@Id
private Long id;

@Transient
private boolean isNew = true;

@Override
public Long getId() {
    return id;
}

@Override
public boolean isNew() {
    return isNew;
}

@PostLoad
@PrePersist
public void markNotNew() {
    this.isNew = false;
}
}
```

### 9. 测试策略

#### 9.1 Repository测试配置

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTest {
@Autowired
private TestEntityManager entityManager;

@Autowired
private UserRepository userRepository;

@Test
void shouldFindByEmail() {
    // given
    User user = new User("test@example.com", "John");
    entityManager.persist(user);
    
    // when
    User found = userRepository.findByEmail("test@example.com");
    
    // then
    assertThat(found.getName()).isEqualTo("John");
}
}
```

#### 9.2 集成测试示例

```java
@SpringBootTest
@Transactional
class UserServiceIntegrationTest {
@Autowired
private UserService userService;

@Autowired
private UserRepository userRepository;

@Test
void shouldCreateUser() {
    // given
    User user = new User("test@example.com", "John");
    
    // when
    User saved = userService.createUser(user);
    
    // then
    assertThat(saved.getId()).isNotNull();
    assertThat(userRepository.count()).isEqualTo(1);
}
}
```

### 10. 最佳实践总结

1. **接口选择** ：根据需求选择最小化接口（需要分页用PagingAndSortingRepository，否则用CrudRepository）

2. **查询设计** ：简单查询用方法名派生，复杂查询用@Query，动态查询用Specification

3. **性能考虑** ：合理使用批量操作、延迟加载、二级缓存

4. **事务管理** ：在Service层管理事务，确保一致性

5. **测试覆盖** ：编写全面的Repository测试用例

6. **异常处理** ：合理处理持久化异常，提供友好错误信息

通过合理运用JPA Repository的各种特性，可以显著提高开发效率，同时保证代码的质量和性能。