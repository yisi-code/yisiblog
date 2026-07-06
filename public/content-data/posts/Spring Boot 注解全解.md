---
title: "Spring Boot 注解全解"
date: 2025-11-24 02:09:54
category: "全栈技术栈"
tags:
- "spring boot"
- "后端"
- "java"
---

## Spring Boot 注解全解

更详细请见：
(补充中···)
[测试注解全解](https://blog.csdn.net/m1751250104/article/details/155144877?spm=1001.2014.3001.5502) 

### 1. 核心启动与配置注解

#### 1.1 @SpringBootApplication

这是 Spring Boot 应用的 **基石注解** ，通常应用于主启动类上。它是一个组合注解，等同于 `@SpringBootConfiguration` 、 `@EnableAutoConfiguration` 和 `@ComponentScan` 三个注解的合集。

**核心功能分解** ：

- **@SpringBootConfiguration** ：标记类为配置类，是 `@Configuration` 的特殊形式

- **@EnableAutoConfiguration** ：启用 Spring Boot 的自动配置机制，根据类路径依赖自动配置 Bean

- **@ComponentScan** ：自动扫描当前包及其子包下的组件（@Component, @Service, @Controller 等）

```java
@SpringBootApplication
public class MyApplication {
public static void main(String[] args) {
SpringApplication.run(MyApplication.class, args);
}
}
```

**高级配置选项** ：

```java
@SpringBootApplication(
scanBasePackages = {"com.example.project", "org.example.another"},
exclude = {DataSourceAutoConfiguration.class},
excludeName = {"org.springframework.boot.autoconfigure.jdbc.JdbcTemplateAutoConfiguration"}
)
public class CustomizedApplication {
public static void main(String[] args) {
SpringApplication.run(CustomizedApplication.class, args);
}
}
```

#### 1.2 条件化配置注解

Spring Boot 的自动配置核心在于条件化注解，它们根据特定条件决定是否创建 Bean。

| 注解 | 生效条件 | 应用场景 |
|:---:|:---:|:---:|
| `@ConditionalOnProperty` | 配置文件中包含指定属性 | 多环境配置切换 |
| `@ConditionalOnClass` | Classpath 中存在指定类 | 自动配置类条件加载 |
| `@ConditionalOnMissingBean` | 容器中不存在指定 Bean | 默认配置覆盖 |
| `@ConditionalOnWebApplication` | 当前应用是 Web 应用 | Web 相关自动配置 |

**实际应用示例** ：

```java
@Configuration
public class FeatureConfig {
@Bean
@ConditionalOnProperty(name = "feature.advanced", havingValue = "true")
public AdvancedService advancedService() {
    return new AdvancedService();
}

@Bean
@ConditionalOnClass(name = "com.example.ExternalLibrary")
public ExternalIntegration integration() {
    return new ExternalIntegration();
}
}
```

### 2. Bean 定义与管理注解

#### 2.1 组件扫描与注册

Spring 通过组件扫描自动发现和注册 Bean。

| 注解 | 层级 | 用途说明 | 特殊功能 |
|:---:|:---:|:---:|:---:|
| `@Component` | 通用层 | 通用的组件注解 | 基础组件标记 |
| `@Service` | 服务层 | 业务逻辑层组件 | 标识业务服务 |
| `@Repository` | 持久层 | 数据访问层组件 | **异常转译** 为 Spring 统一异常 |
| `@Controller` | 控制层 | Web 控制层 | 配合视图解析器使用 |
| `@RestController` | 控制层 | `@Controller` + `@ResponseBody` | **专为 RESTful API** 设计 |

```java
@Service
public class UserService {
// 业务逻辑实现
}
@Repository
public class UserRepository {
// 数据访问实现，自动进行异常转译
}
@RestController
@RequestMapping("/api/users")
public class UserController {
// RESTful API 实现
}
```

#### 2.2 Bean 配置注解

**@Configuration 与 @Bean** ：
用于显式定义 Bean，特别适用于第三方库的集成。

```java
@Configuration
public class AppConfig {
@Bean
public MyService myService() {
    return new MyServiceImpl();
}

@Bean({"b1", "b2"})  // 多个Bean名称
@Profile("production")  // 仅在生产环境生效
@Scope("prototype")     // 原型作用域，每次获取新实例
@Lazy                   // 延迟初始化
public MyBean myBean() {
    return new MyBean();
}
}
```

**作用域注解详解** ：

```java
@Component
@Scope("prototype") // 每次注入时创建新实例
public class ShoppingCart {
// 购物车实现，每个会话需要独立实例
}
@Component
@Scope(value = WebApplicationContext.SCOPE_SESSION, proxyMode = ScopedProxyMode.TARGET_CLASS)
public class UserSession {
// 会话作用域的Bean
}
```

### 3. 依赖注入注解

#### 3.1 @Autowired

Spring 的核心依赖注入注解，按类型进行自动装配。

```java
@Service
public class UserService {
// 字段注入（不推荐，破坏封装性）
@Autowired
private UserRepository userRepository;

// 构造器注入（推荐方式，保证依赖不可变）
private final ProductRepository productRepo;

@Autowired
public UserService(ProductRepository productRepo) {
    this.productRepo = productRepo;
}

// Setter 注入（可选依赖时使用）
private NotificationService notificationService;

@Autowired
public void setNotificationService(NotificationService notificationService) {
    this.notificationService = notificationService;
}
}
```

#### 3.2 解决依赖冲突

**@Qualifier** - 明确指定 Bean 名称：

```java
@Service
public class OrderService {
@Autowired
@Qualifier("emailNotification")  // 指定具体实现
private NotificationService notificationService;

@Autowired
@Qualifier("smsNotification")
private NotificationService backupNotificationService;
}
```

**@Primary** - 设置首选 Bean：

```java
@Component
@Primary // 当有多个同类型Bean时优先使用
public class PrimaryService implements MyService {
// 优先使用的实现
}
@Component
public class SecondaryService implements MyService {
// 备选实现
}
```

**@Resource** - JSR-250 标准注解：

```java
@Component
public class PaymentProcessor {
@Resource(name = "visaPaymentGateway")  // 按名称注入
private PaymentGateway paymentGateway;

@Resource  // 默认按字段名注入
private PaymentGateway defaultPaymentGateway;
}
```

### 4. Web MVC 开发注解

#### 4.1 请求映射注解

Spring MVC 提供了丰富的请求映射注解，简化 RESTful API 开发。

| 注解 | HTTP 方法 | 用途说明 | 等价写法 |
|:---:|:---:|:---:|:---:|
| `@RequestMapping` | 通用 | 可配置所有HTTP方法 | - |
| `@GetMapping` | GET | 获取资源 | `@RequestMapping(method=GET)` |
| `@PostMapping` | POST | 创建资源 | `@RequestMapping(method=POST)` |
| `@PutMapping` | PUT | 更新资源 | `@RequestMapping(method=PUT)` |
| `@DeleteMapping` | DELETE | 删除资源 | `@RequestMapping(method=DELETE)` |
| `@PatchMapping` | PATCH | 部分更新 | `@RequestMapping(method=PATCH)` |

#### 4.2 控制器实现详解

```java
@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {
@Autowired
private UserService userService;

// GET 请求：获取用户列表
@GetMapping
public List<User> getAllUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    return userService.findAll(page, size);
}

// GET 请求：根据ID获取用户
@GetMapping("/{id}")
public User getUserById(@PathVariable Long id) {
    return userService.findById(id);
}

// POST 请求：创建用户
@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public User createUser(@Valid @RequestBody User user) {
    return userService.save(user);
}

// PUT 请求：更新用户
@PutMapping("/{id}")
public User updateUser(@PathVariable Long id, 
                      @Valid @RequestBody User user) {
    return userService.update(id, user);
}

// DELETE 请求：删除用户
@DeleteMapping("/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
public void deleteUser(@PathVariable Long id) {
    userService.delete(id);
}
}
```

#### 4.3 参数绑定详解

```java
@RestController
@RequestMapping("/api")
public class ApiController {
// @PathVariable - 路径参数绑定
@GetMapping("/users/{userId}/orders/{orderId}")
public Order getOrder(@PathVariable Long userId, 
                     @PathVariable("orderId") Long orderId) {
    return orderService.findOrder(userId, orderId);
}

// @RequestParam - 查询参数绑定
@GetMapping("/search")
public List<User> searchUsers(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(required = false) String sort) {
    return userService.search(keyword, page, sort);
}

// @RequestBody - 请求体绑定（JSON/XML）
@PostMapping("/register")
public User registerUser(@Valid @RequestBody UserRegistrationRequest request) {
    return userService.register(request);
}

// @RequestHeader - 请求头绑定
@GetMapping("/info")
public AppInfo getInfo(@RequestHeader("User-Agent") String userAgent,
                      @RequestHeader(value = "X-API-Version", defaultValue = "1.0") String apiVersion) {
    return appService.getInfo(userAgent, apiVersion);
}

// @CookieValue - Cookie值绑定
@GetMapping("/preferences")
public Preferences getPreferences(@CookieValue("sessionId") String sessionId) {
    return preferenceService.getBySession(sessionId);
}
}
```

#### 4.4 响应处理注解

```java
@RestController
@RequestMapping("/api/response")
public class ResponseController {
// 手动控制响应
@GetMapping("/custom")
public ResponseEntity<ApiResponse<User>> getCustomResponse() {
    User user = userService.getCurrentUser();
    ApiResponse<User> response = new ApiResponse<>("success", user);
    
    return ResponseEntity.ok()
            .header("Custom-Header", "value")
            .contentType(MediaType.APPLICATION_JSON)
            .body(response);
}

// 设置状态码
@PostMapping("/process")
public ResponseEntity<Void> processData() {
    // 处理逻辑
    return ResponseEntity.accepted().build();  // 202 Accepted
}

// 特定状态码注解}
@PostMapping("/create")
@ResponseStatus(HttpStatus.CREATED)  // 201 Created
public Resource createResource(@RequestBody Resource resource) {
    return resourceService.create(resource);
}
}
```

### 5. 数据校验注解

#### 5.1 字段级校验注解

Bean Validation 注解用于确保数据的完整性和有效性。

```java
public class UserRegistrationRequest {
@NotBlank(message = "用户名不能为空")
@Size(min = 3, max = 20, message = "用户名长度3-20字符")
private String username;

@Email(message = "邮箱格式不正确")
@NotBlank(message = "邮箱不能为空")
private String email;

@Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$", 
         message = "密码必须包含大小写字母和数字，至少8位")
private String password;

@Min(value = 18, message = "年龄必须满18岁")
@Max(value = 100, message = "年龄不能超过100岁")
private Integer age;

@Future(message = "生日必须是未来时间")
private LocalDate birthDate;

@AssertTrue(message = "必须接受服务条款")
private Boolean termsAccepted;

@DecimalMin(value = "0.0", inclusive = false, message = "金额必须大于0")
@Digits(integer = 5, fraction = 2, message = "金额格式不正确")
private BigDecimal amount;
}
```

#### 5.2 校验触发与处理

```java
@RestController
@RequestMapping("/api/users")
@Validated // 启用方法级别校验
public class UserController {
// 对象级别校验
@PostMapping
public User createUser(@Valid @RequestBody UserRegistrationRequest request) {
    return userService.register(request);
}

// 方法参数校验
@GetMapping("/by-age")
public List<User> getUsersByAge(@RequestParam @Min(0) int minAge,
                               @RequestParam @Max(150) int maxAge) {
    return userService.findByAgeRange(minAge, maxAge);
}

// 路径变量校验
@GetMapping("/{id}")
public User getUser(@PathVariable @Positive Long id) {
    return userService.findById(id);
}
}
```

#### 5.3 全局异常处理

```java
@ControllerAdvice
public class GlobalExceptionHandler {
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ErrorResponse> handleValidationExceptions(
        MethodArgumentNotValidException ex) {
    
    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error ->
        errors.put(error.getField(), error.getDefaultMessage()));
    
    ErrorResponse errorResponse = new ErrorResponse("验证失败", errors);
    return ResponseEntity.badRequest().body(errorResponse);
}

@ExceptionHandler(ConstraintViolationException.class)
public ResponseEntity<ErrorResponse> handleConstraintViolation(
        ConstraintViolationException ex) {
    
    Map<String, String> errors = new HashMap<>();
    ex.getConstraintViolations().forEach(violation -> {
        String fieldName = violation.getPropertyPath().toString();
        errors.put(fieldName, violation.getMessage());
    });
    
    ErrorResponse errorResponse = new ErrorResponse("参数验证失败", errors);
    return ResponseEntity.badRequest().body(errorResponse);
}
}
```

### 6. 配置属性注解

#### 6.1 @Value 注解

用于注入单个配置属性。

```java
@Component
public class AppConfig {
@Value("${app.name}")
private String appName;

@Value("${app.version:1.0.0}")  // 默认值
private String appVersion;

@Value("${server.port}")
private int serverPort;

@Value("${app.features.enabled:false}")
private boolean featuresEnabled;

@Value("${app.servers:localhost:8080,localhost:8081}")
private String[] servers;

// SpEL 表达式
@Value("#{systemProperties['java.version']}")
private String javaVersion;

@Value("#{T(java.lang.Math).random() * 100.0}")
private double randomPercentage;

@Value("#{${app.map.values}}")
private Map<String, String> configMap;
}
```

#### 6.2 @ConfigurationProperties 注解

用于批量绑定配置到对象，支持类型安全的配置。

```java
@Component
@ConfigurationProperties(prefix = "app.datasource")
@Validated
public class DataSourceProperties {
@NotBlank
private String url;

@NotBlank
private String username;

private String password;

@Min(1)
@Max(100)
private int maxPoolSize = 10;

private Duration connectionTimeout = Duration.ofSeconds(30);

// 嵌套配置
private Pool pool = new Pool();

@Data
public static class Pool {
    @Min(1)
    private int minIdle = 5;
    
    private long validationTimeout = 5000;
    
    private Duration maxLifetime = Duration.ofMinutes(30);
}

// Map 类型配置
private Map<String, String> properties = new HashMap<>();

// List 类型配置
private List<String> whitelist = new ArrayList<>();
}
```

**对应的 application.yml** ：

```yaml
app:
datasource:
url: jdbc:
username: admin
password: secret
max-pool-size: 20
connection-timeout: 60s
pool:
min-idle: 10
validation-timeout: 3000
max-lifetime: 30m
properties:
cachePrepStmts: true
prepStmtCacheSize: 250
whitelist:
192.168.1.1
192.168.1.2
```

### 7. 数据持久化注解（JPA）

#### 7.1 实体类注解

JPA 注解用于对象关系映射（ORM）。

```java
@Entity
@Table(name = "users",
indexes = {
@Index(columnList = "email", unique = true),
@Index(columnList = "createdAt")
},
uniqueConstraints = {
@UniqueConstraint(columnNames = {"username", "tenant_id"})
})
public class User {
@Id
@GeneratedValue(strategy = GenerationType.IDENTITY)
private Long id;

@Column(name = "username", nullable = false, length = 50)
private String username;

@Column(unique = true, nullable = false)
private String email;

@Enumerated(EnumType.STRING)
@Column(nullable = false)
private UserStatus status = UserStatus.ACTIVE;

@CreationTimestamp
private LocalDateTime createdAt;

@UpdateTimestamp
private LocalDateTime updatedAt;

@Version
private Long version;

@Transient  // 不持久化到数据库
private String temporaryData;

// 关系映射
@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
private List<Order> orders = new ArrayList<>();

@ManyToMany
@JoinTable(name = "user_roles",
          joinColumns = @JoinColumn(name = "user_id"),
          inverseJoinColumns = @JoinColumn(name = "role_id"))
private Set<Role> roles = new HashSet<>();

// 枚举类型
public enum UserStatus {
    ACTIVE, INACTIVE, SUSPENDED
}
}
```

#### 7.2 Repository 层注解

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
// 派生查询方法
Optional<User> findByEmail(String email);

List<User> findByStatusOrderByCreatedAtDesc(UserStatus status);

// 分页查询
Page<User> findByStatus(UserStatus status, Pageable pageable);

// 自定义查询
@Query("SELECT u FROM User u WHERE u.createdAt >= :startDate AND u.status = :status")
List<User> findRecentUsers(@Param("startDate") LocalDateTime startDate, 
                          @Param("status") UserStatus status);

// 更新操作
@Modifying
@Query("UPDATE User u SET u.status = :status WHERE u.lastLogin < :expireDate")
int deactivateInactiveUsers(@Param("status") UserStatus status, 
                           @Param("expireDate") LocalDateTime expireDate);

// 原生SQL查询
@Query(value = "SELECT * FROM users u WHERE u.email LIKE %:domain", nativeQuery = true)
List<User> findByEmailDomain(@Param("domain") String domain);

// 投影查询
@Query("SELECT new com.example.dto.UserInfo(u.username, u.email) FROM User u")
List<UserInfo> findUserInfos();
}
```

### 8. 高级特性注解

#### 8.1 事务管理注解

`@Transactional` 提供声明式事务管理。

```java
@Service
@Transactional
public class OrderService {
@Autowired
private OrderRepository orderRepository;

@Autowired
private InventoryService inventoryService;

// 只读事务，优化性能
@Transactional(readOnly = true)
public Order getOrder(Long id) {
    return orderRepository.findById(id).orElseThrow();
}

// 完整事务配置
@Transactional(
    rollbackFor = Exception.class,  // 所有异常都回滚
    timeout = 30,                   // 30秒超时
    isolation = Isolation.DEFAULT,  // 隔离级别
    propagation = Propagation.REQUIRED  // 事务传播行为
)
public Order createOrder(Order order) {
    Order savedOrder = orderRepository.save(order);
    inventoryService.updateStock(order);  // 跨服务调用
    return savedOrder;
}

// 新事务中执行（独立事务）
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void auditAction(Action action) {
    auditRepository.save(action);
}

// 不回滚的异常
@Transactional(noRollbackFor = BusinessException.class)
public void processWithTolerance(Order order) {
    // 业务逻辑，BusinessException 时不回滚
}
}
```

#### 8.2 定时任务与异步处理

```java
@Configuration
@EnableScheduling
@EnableAsync
public class ScheduleConfig {
// 自定义线程池
@Bean
public TaskExecutor taskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setCorePoolSize(5);
    executor.setMaxPoolSize(10);
    executor.setQueueCapacity(25);
    executor.setThreadNamePrefix("Async-");
    executor.initialize();
    return executor;
}
}
@Service
public class AsyncService {
@Async
public CompletableFuture<String> processData() {
    // 异步执行耗时操作
    return CompletableFuture.completedFuture("处理完成");
}

@Async("taskExecutor")  // 指定线程池
public CompletableFuture<String> processWithCustomExecutor() {
    return CompletableFuture.completedFuture("自定义线程池处理");
}
}
@Component
@EnableScheduling
public class ScheduledTasks {
// 固定速率执行（每5秒）
@Scheduled(fixedRate = 5000)
public void reportCurrentTime() {
    System.out.println("当前时间: " + LocalDateTime.now());
}

// 固定延迟执行（上次结束后延迟5秒）
@Scheduled(fixedDelay = 5000)
public void processAfterDelay() {
    // 处理逻辑
}

// Cron 表达式（每天中午12点执行）
@Scheduled(cron = "0 0 12 * * ?")
public void dailyTask() {
    // 执行每日任务
}

// 初始延迟（应用启动后延迟10秒开始执行）
@Scheduled(initialDelay = 10000, fixedRate = 30000)
public void delayedTask() {
    // 延迟执行的任务
}
}
```

#### 8.3 切面编程（AOP）注解

```java
@Aspect
@Component
@Order(1) // 切面执行顺序
public class LoggingAspect {
// 切入点定义：service 包下的所有方法
@Pointcut("execution(* com.example.service.*.*(..))")
public void serviceLayer() {}

// 切入点定义：带有特定注解的方法
@Pointcut("@annotation(com.example.annotation.LogExecutionTime)")
public void loggableMethod() {}

// 前置通知
@Before("serviceLayer()")
public void logBefore(JoinPoint joinPoint) {
    System.out.println("方法执行前: " + joinPoint.getSignature().getName());
}

// 后置通知（无论是否异常都执行）
@After("serviceLayer()")
public void logAfter(JoinPoint joinPoint) {
    System.out.println("方法执行后: " + joinPoint.getSignature().getName());
}

// 返回通知（正常返回后执行）
@AfterReturning(pointcut = "serviceLayer()", returning = "result")
public void logAfterReturning(JoinPoint joinPoint, Object result) {
    System.out.println("方法返回: " + result);
}

// 异常通知
@AfterThrowing(pointcut = "serviceLayer()", throwing = "ex")
public void logAfterThrowing(JoinPoint joinPoint, Throwable ex) {
    System.out.println("方法异常: " + ex.getMessage());
}

// 环绕通知（最强大的通知类型）
@Around("loggableMethod()")
public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
    long start = System.currentTimeMillis();
    
    try {
        Object result = joinPoint.proceed();  // 执行目标方法
        long duration = System.currentTimeMillis() - start;
        
        System.out.println(joinPoint.getSignature() + " 执行时间: " + duration + "ms");
        return result;
        
    } catch (Exception e) {
        long duration = System.currentTimeMillis() - start;
        System.out.println(joinPoint.getSignature() + " 异常执行时间: " + duration + "ms");
        throw e;
    }
}
}
// 自定义注解，用于标记需要记录执行时间的方法
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface LogExecutionTime {
}
```

### 9. 测试相关注解

#### 9.1 单元测试注解

Spring Boot 提供丰富的测试支持。

```java
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = {"app.test.mode=true"})
@ActiveProfiles("test")
class UserServiceTest {
@Autowired
private UserService userService;

@MockBean
private EmailService emailService;

@MockBean
private NotificationService notificationService;

@Autowired
private TestEntityManager entityManager;

@BeforeEach
void setUp() {
    // 每个测试方法执行前初始化
    Mockito.reset(emailService, notificationService);
}

@Test
void shouldCreateUserSuccessfully() {
    // 给定
    User user = new User("test", "test@example.com");
    given(emailService.sendWelcomeEmail(anyString())).willReturn(true);
    
    // 当
    User savedUser = userService.createUser(user);
    
    // 那么
    assertThat(savedUser.getId()).isNotNull();
    then(emailService).should().sendWelcomeEmail(user.getEmail());
}

@Test
void shouldFindUserById() {
    // 给定
    User user = entityManager.persistAndFlush(new User("test", "test@example.com"));
    
    // 当
    User found = userService.findById(user.getId());
    
    // 那么
    assertThat(found).isNotNull();
    assertThat(found.getEmail()).isEqualTo(user.getEmail());
}

@Test
void shouldThrowExceptionWhenUserNotFound() {
    // 当 + 那么
    assertThatThrownBy(() -> userService.findById(999L))
        .isInstanceOf(UserNotFoundException.class)
        .hasMessage("用户不存在");
}

@ParameterizedTest
@ValueSource(strings = {"user1@test.com", "user2@test.com"})
void shouldFindUserByEmail(String email) {
    // 参数化测试
    User user = userService.findByEmail(email);
    assertThat(user).isNotNull();
}

@AfterEach
void tearDown() {
    // 每个测试方法执行后清理
}
}
```

#### 9.2 Web MVC 测试注解

```java
@WebMvcTest(UserController.class)
@AutoConfigureMockMvc
class UserControllerTest {
@Autowired
private MockMvc mockMvc;

@MockBean
private UserService userService;

@Test
void shouldReturnUserWhenValidId() throws Exception {
    // 给定
    User user = new User(1L, "test", "test@example.com");
    given(userService.findById(1L)).willReturn(user);
    
    // 当 + 那么
    mockMvc.perform(get("/api/users/1")
            .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.username").value("test"))
            .andExpect(jsonPath("$.email").value("test@example.com"));
}

@Test
void shouldCreateUserWhenValidInput() throws Exception {
    // 给定
    User user = new User("test", "test@example.com");
    given(userService.save(any(User.class))).willReturn(user);
    
    // 当 + 那么
    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"test\",\"email\":\"test@example.com\"}"))
            .andExpect(status().isCreated());
}

@Test
void shouldReturnBadRequestWhenInvalidInput() throws Exception {
    mockMvc.perform(post("/api/users")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"\",\"email\":\"invalid\"}"))
            .andExpect(status().isBadRequest());
}
}
```

### 10. 最佳实践总结

#### 10.1 注解使用准则

1. **选择合适的注解** ：根据组件层次选择对应的注解（@Service、@Repository等）

2. **优先使用构造器注入** ：保证依赖不可变，避免空指针异常

3. **合理使用事务** ：只在需要的方法上添加@Transactional，避免过长事务

4. **充分利用校验** ：在入口处进行参数校验，保证数据完整性

5. **适度使用条件注解** ：根据环境配置灵活控制Bean创建

#### 10.2 常见陷阱避免

```java
// 错误示例：在构造函数中访问被注入的字段
@Service
public class ProblematicService {
private final Dependency dependency;

public ProblematicService() {
    this.dependency.doSomething();  // NullPointerException!
}

@Autowired
public void setDependency(Dependency dependency) {
    this.dependency = dependency;
}
}
// 正确做法：使用构造器注入
@Service
public class CorrectService {
private final Dependency dependency;

public CorrectService(Dependency dependency) {
    this.dependency = dependency;
    this.dependency.doSomething();  // 安全使用
}
}
// 错误示例：滥用字段注入
@RestController
public class BadController {
@Autowired  // 不推荐：难以测试，破坏封装
private UserService userService;

@Autowired
private ProductService productService;
}
// 正确做法：使用构造器注入
@RestController
public class GoodController {
private final UserService userService;
private final ProductService productService;

public GoodController(UserService userService, ProductService productService) {
    this.userService = userService;
    this.productService = productService;
}
}
```

这份详细的 Spring Boot 注解指南涵盖了从基础到高级的各个方面，可以作为日常开发的参考资料。根据具体的业务需求和技术栈，可以灵活选择和组合这些注解来构建健壮的应用程序。