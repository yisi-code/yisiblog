---
title: "Spring Boot CORS 配置详解：CorsConfigurationSource 全面指南"
date: 2025-11-28 14:48:19
category: "全栈技术栈"
tags:
- "spring boot"
- "后端"
- "java"
---

## Spring Boot CORS 配置详解：CorsConfigurationSource 全面指南

### 1. CorsConfigurationSource 核心概念

#### 1.1 什么是 CorsConfigurationSource？

`CorsConfigurationSource` 是 Spring Framework 中用于提供 CORS（跨源资源共享）配置信息的核心接口。它定义了如何根据 HTTP 请求返回相应的 CORS 配置规则。

**接口定义** ：

```javascript
public interface CorsConfigurationSource {
CorsConfiguration getCorsConfiguration(HttpServletRequest request);
}
```

#### 1.2 在 Spring 安全架构中的角色

在 Spring Security 环境中， `CorsConfigurationSource` 扮演着 CORS 配置提供者的角色。当启用 CORS 支持时，Spring Security 会从该接口获取配置信息来处理跨域请求。

### 2. 核心实现类详解

#### 2.1 UrlBasedCorsConfigurationSource

这是最常用的实现类，它基于 URL 路径模式来匹配和提供 CORS 配置。

**核心工作机制** ：

- 内部维护一个映射表，将 URL 模式与 `CorsConfiguration` 关联

- 使用 `PathMatcher` （默认 `AntPathMatcher` ）来匹配请求路径

- 返回第一个匹配的配置，如果没有匹配则返回 `null`

```java
public class UrlBasedCorsConfigurationSource implements CorsConfigurationSource {
private final PathMatcher pathMatcher = new AntPathMatcher();
private final Map<String, CorsConfiguration> corsConfigurations = new HashMap<>();
@Override
public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
    String lookupPath = this.urlPathHelper.getLookupPathForRequest(request);
    for (Map.Entry<String, CorsConfiguration> entry : this.corsConfigurations.entrySet()) {
        if (this.pathMatcher.match(entry.getKey(), lookupPath)) {
            return entry.getValue();
        }
    }
    return null;
}
}
```

### 3. 完整配置示例

CorsConfiguration 关键属性

| 属性 | 类型 | 说明 | 默认值 | 注意事项 |
|:---:|:---:|:---:|:---:|:---:|
| `allowedOrigins` | `List<String>` | 允许访问的源 | 空列表 | 与 `allowCredentials=true` 时不能包含 `"*"` |
| `allowedOriginPatterns` | `List<String>` | 使用模式匹配允许的源 | 空列表 | Spring 5.3+，与allowedOrigins选一个使用 |
| `allowedMethods` | `List<String>` | 允许的HTTP方法 | 空列表 | 必须包含 `OPTIONS` （预检请求） |
| `allowedHeaders` | `List<String>` | 允许的请求头 | 空列表 | 可设置为 `"*"` 允许所有头 |
| `exposedHeaders` | `List<String>` | 暴露给前端的响应头 | 空列表 | 浏览器默认只暴露基本头信息 |
| `allowCredentials` | `Boolean` | 是否允许携带凭证 | `null` | 为 `true` 时不能使用 `allowedOrigins: "*"` |
| `maxAge` | `Long` | 预检请求缓存时间（秒） | `null` | 减少重复预检请求，提升性能 |

#### 3.1 基础全局配置

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import java.util.Arrays;
@Configuration
public class GlobalCorsConfig {
@Bean
public CorsFilter corsFilter() {
    // 1. 创建 CORS 配置对象
    CorsConfiguration config = new CorsConfiguration();
    
    // 设置允许的源
    config.setAllowedOrigins(Arrays.asList("http://localhost:3000", "https://example.com"));
    
    // 设置允许的 HTTP 方法
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    
    // 设置允许的请求头
    config.setAllowedHeaders(Arrays.asList("*"));
    
    // 设置是否允许携带凭证（如 cookies）
    config.setAllowCredentials(true);
    
    // 设置预检请求的有效期（秒）
    config.setMaxAge(3600L);
    
    // 设置暴露的响应头
    config.setExposedHeaders(Arrays.asList("Authorization", "X-Total-Count"));
    
    // 2. 创建基于 URL 的配置源
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    
    // 3. 注册配置：对所有路径应用 CORS 规则
    source.registerCorsConfiguration("/api/**", config);
    
    return new CorsFilter(source);
}
}
```

#### 3.2 多路径差异化配置

```java
@Configuration
public class MultiPathCorsConfig {
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    
    // 配置1：公共API路径 - 宽松策略
    CorsConfiguration publicApiConfig = new CorsConfiguration();
    publicApiConfig.setAllowedOrigins(Arrays.asList("*"));
    publicApiConfig.setAllowedMethods(Arrays.asList("GET", "POST"));
    publicApiConfig.setAllowedHeaders(Arrays.asList("Content-Type", "Authorization"));
    publicApiConfig.setMaxAge(1800L);
    source.registerCorsConfiguration("/api/public/**", publicApiConfig);
    
    // 配置2：管理API路径 - 严格策略
    CorsConfiguration adminApiConfig = new CorsConfiguration();
    adminApiConfig.setAllowedOrigins(Arrays.asList("https://admin.example.com"));
    adminApiConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE"));
    adminApiConfig.setAllowedHeaders(Arrays.asList("Content-Type", "Authorization", "X-Admin-Token"));
    adminApiConfig.setExposedHeaders(Arrays.asList("X-Total-Count", "X-Page-Count"));
    adminApiConfig.setAllowCredentials(true);
    adminApiConfig.setMaxAge(3600L);
    source.registerCorsConfiguration("/api/admin/**", adminApiConfig);
    
    // 配置3：文件上传路径 - 特殊配置
    CorsConfiguration uploadConfig = new CorsConfiguration();
    uploadConfig.setAllowedOrigins(Arrays.asList("https://app.example.com"));
    uploadConfig.setAllowedMethods(Arrays.asList("POST", "PUT"));
    uploadConfig.setAllowedHeaders(Arrays.asList("Content-Type", "Authorization", "X-File-Size"));
    uploadConfig.setAllowCredentials(true);
    uploadConfig.setMaxAge(7200L);
    source.registerCorsConfiguration("/api/upload/**", uploadConfig);
    
    return source;
}
}
```

#### 3.3 与 Spring Security 集成

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
@Configuration
public class SecurityCorsConfig {
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // 启用 CORS 支持
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        // 其他安全配置...
        .authorizeHttpRequests(authz -> authz
            .requestMatchers("/api/public/**").permitAll()
            .anyRequest().authenticated()
        );
    
    return http.build();
}

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    
    // 使用模式匹配允许的源（Spring Framework 5.3+）
    configuration.setAllowedOriginPatterns(Arrays.asList(
        "https://*.example.com",
        "http://localhost:[*]"
    ));
    
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Total-Count"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    
    return source;
}
}
```

### 4. 配置方法对比

```java
// 方法1：设置具体源（传统方式）
configuration.setAllowedOrigins(Arrays.asList("https://example.com"));
// 方法2：使用通配符（不推荐与allowCredentials=true同时使用）
configuration.setAllowedOrigins(Arrays.asList("*"));
// 方法3：使用模式匹配（推荐，Spring 5.3+）
configuration.setAllowedOriginPatterns(Arrays.asList("https://*.example.com"));
// 方法4：应用默认值
configuration.applyPermitDefaultValues();
```

### 5. 高级特性与最佳实践

#### 5.1 动态配置源

```java
@Component
public class DynamicCorsConfigurationSource implements CorsConfigurationSource {
@Autowired
private DomainWhitelistService whitelistService;

@Override
public CorsConfiguration getCorsConfiguration(HttpServletRequest request) {
    CorsConfiguration config = new CorsConfiguration();
    
    // 从数据库或配置服务动态获取允许的源
    List<String> allowedOrigins = whitelistService.getAllowedOrigins();
    config.setAllowedOrigins(allowedOrigins);
    
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(Arrays.asList("*"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    
    return config;
}
}
```

#### 5.2 环境特定配置

```java
@Configuration
public class EnvironmentAwareCorsConfig {
@Value("${app.cors.allowed-origins:}")
private String[] allowedOrigins;

@Value("${app.cors.max-age:3600}")
private long maxAge;

@Bean
@Profile("!prod") // 非生产环境
public CorsConfigurationSource devCorsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(Arrays.asList("*"));
    configuration.setAllowedMethods(Arrays.asList("*"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setMaxAge(maxAge);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}

@Bean
@Profile("prod") // 生产环境
public CorsConfigurationSource prodCorsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(maxAge);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
}
```

### 6. 常见问题与解决方案

#### 6.1 配置不生效问题

**问题原因** ：过滤器顺序问题，CORS 过滤器需要在安全过滤器之前执行。

**解决方案** ：

```java
@Configuration
public class CorsConfig {
@Bean
public FilterRegistrationBean<CorsFilter> corsFilterRegistration() {
    FilterRegistrationBean<CorsFilter> registration = new FilterRegistrationBean<>();
    registration.setFilter(new CorsFilter(corsConfigurationSource()));
    registration.addUrlPatterns("/*");
    registration.setOrder(Ordered.HIGHEST_PRECEDENCE); // 设置最高优先级
    return registration;
}

@Bean
public CorsConfigurationSource corsConfigurationSource() {
    // ... 配置逻辑
}
}
```

#### 6.2 凭证与通配符冲突

**问题描述** ：当 `allowCredentials = true` 时， `allowedOrigins` 不能包含 `"*"` 。

**解决方案** ：

```java
// 错误配置
configuration.setAllowedOrigins(Arrays.asList("*"));
configuration.setAllowCredentials(true); // 这会抛出异常
// 正确配置1：使用具体域名
configuration.setAllowedOrigins(Arrays.asList("https://example.com"));
configuration.setAllowCredentials(true);
// 正确配置2：使用模式匹配（Spring 5.3+）
configuration.setAllowedOriginPatterns(Arrays.asList("https://*.example.com"));
configuration.setAllowCredentials(true);
```

#### 6.3 预检请求处理

**OPTIONS 请求处理** ：确保 Spring Security 配置中放行 OPTIONS 请求。

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
@Override
protected void configure(HttpSecurity http) throws Exception {
    http
        .cors().and()
        .authorizeHttpRequests(authz -> authz
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() // 放行所有OPTIONS请求
            .anyRequest().authenticated()
        );
}
}
```

### 7. 测试与验证

#### 7.1 测试配置有效性

```java
@SpringBootTest
class CorsConfigurationTest {
@Autowired
private CorsConfigurationSource corsConfigurationSource;

@Test
void testCorsConfiguration() {
    // 模拟HTTP请求
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setMethod("GET");
    request.setRequestURI("/api/test");
    request.addHeader("Origin", "https://example.com");
    
    // 获取CORS配置
    CorsConfiguration config = corsConfigurationSource.getCorsConfiguration(request);
    
    // 验证配置
    assertNotNull(config);
    assertTrue(config.getAllowedOrigins().contains("https://example.com"));
    assertTrue(config.getAllowedMethods().contains("GET"));
}
}
```

#### 7.2 集成测试

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class CorsIntegrationTest {
@LocalServerPort
private int port;

@Test
void testCorsHeaders() {
    // 发送跨域请求
    ResponseEntity<String> response = restTemplate.exchange(
        "http://localhost:" + port + "/api/data",
        HttpMethod.GET,
        new HttpEntity<>(null),
        String.class
    );
    
    // 验证CORS头信息
    HttpHeaders headers = response.getHeaders();
    assertNotNull(headers.getAccessControlAllowOrigin());
    assertTrue(headers.getAccessControlAllowMethods().contains(HttpMethod.GET));
}
}
```

### 8. 性能优化建议

#### 8.1 合理设置 maxAge

```java
// 开发环境：较短的缓存时间便于调试
configuration.setMaxAge(300L); // 5分钟
// 生产环境：较长的缓存时间提升性能
configuration.setMaxAge(7200L); // 2小时
```

#### 8.2 精细化路径配置

```java
// 避免对所有路径应用复杂配置
source.registerCorsConfiguration("/api/public/**", simpleConfig);
source.registerCorsConfiguration("/api/secure/**", complexConfig);
source.registerCorsConfiguration("/static/**", staticResourceConfig);
```

### 9. 总结

`CorsConfigurationSource` 是 Spring Framework 中处理 CORS 配置的核心抽象，通过 `UrlBasedCorsConfigurationSource` 实现，提供了基于 URL 模式的灵活配置能力。正确配置 CORS 对于现代 Web 应用至关重要，既能保证前端跨域访问的正常进行，又能确保应用的安全性。

**关键要点** ：

- 在 Spring Security 环境中优先使用 `CorsConfigurationSource` Bean

- 注意凭证与通配符的兼容性问题

- 根据环境差异配置不同的安全策略

- 合理利用预检请求缓存提升性能

通过本文的详细示例和最佳实践，您可以构建出既安全又高效的 CORS 配置方案。