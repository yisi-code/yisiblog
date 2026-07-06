---
title: "MySQL 并发控制机制详解：锁机制、MVCC 与 Read View"
date: 2025-11-15 15:46:18
category: "全栈技术栈"
tags:
- "mysql"
- "数据库"
---

## MySQL 并发控制机制详解：锁机制、MVCC 与 Read View

### 1. 锁机制

数据库锁机制是处理并发访问的核心技术，通过合理的锁策略可以在保证数据一致性的同时提高系统并发性能。MySQL 中锁机制按照粒度可分为表锁、行锁和间隙锁等。

#### 1.1 表锁 (Table Lock)

表锁是 MySQL 中粒度最大的锁，它会锁定整张表，当一个事务对表进行读写操作时，其他事务需要等待锁释放才能访问该表。

- **特点** ：加锁简单、开销小，但并发性能低，容易发生锁冲突。

- **适用场景** ：主要用于 MyISAM、MEMORY 等存储引擎，这些引擎不支持行级锁。

- **加锁方式** ：使用 `LOCK TABLES ... READ/WRITE` 手动加锁，但 InnoDB 引擎不建议使用，会降低并发能力。

- **元数据锁 (MDL)** ：MySQL 自动管理的表级锁，读操作加 MDL 读锁（兼容），写操作加 MDL 写锁（互斥），用于保护表结构变更的安全性。

**使用实例** ：

```sql
-- 加表读锁
LOCK TABLES users READ;
-- 加表写锁
LOCK TABLES users WRITE;
-- 解锁
UNLOCK TABLES;
```

#### 1.2 行锁 (Row Lock)

行锁是 InnoDB 存储引擎支持的细粒度锁，锁定索引中的单条记录，大大提升了数据库的并发处理能力。

- **特点** ：锁粒度小、开销大、加锁慢，但并发性能高，冲突概率低。

- **实现基础** ：InnoDB 的行锁是通过给索引项加锁实现的，WHERE 条件必须命中索引，否则会退化为表锁。

- **类型** ：

  - **记录锁 (Record Lock)** ：锁定单条索引记录，针对精确匹配的唯一索引或主键查询。

  - **共享锁 (S Lock)** ：允许多个事务同时读取同一行数据，但阻止排他锁。使用 `SELECT ... LOCK IN SHARE MODE` 或 `SELECT ... FOR SHARE` 加锁。

  - **排他锁 (X Lock)** ：允许一个事务读写某行数据，阻止其他事务加任何锁。UPDATE、DELETE、INSERT 自动加排他锁，也可用 `SELECT ... FOR UPDATE` 显式加锁。

**锁兼容性矩阵** ：

| 当前已持有锁 | 请求共享锁 (S) | 请求排他锁 (X) |
|:---:|:---:|:---:|
| 共享锁 (S) | ✔️ 兼容 | ❌ 冲突 |
| 排他锁 (X) | ❌ 冲突 | ❌ 冲突 |

**使用实例** ：

```sql
-- 加共享锁读
SELECT * FROM accounts WHERE id = 1 LOCK IN SHARE MODE;
-- 加排他锁写
SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
```

#### 1.3 间隙锁 (Gap Lock) 与临键锁 (Next-Key Lock)

间隙锁和临键锁是 InnoDB 在可重复读 (REPEATABLE READ) 隔离级别下用于解决幻读问题的重要机制。

- **间隙锁 (Gap Lock)** ：

  - **作用** ：锁定索引记录之间的间隙（区间），防止其他事务在间隙内插入新数据。

  - **触发条件** ：范围查询或查询不存在的唯一记录时，基于非唯一索引。

  - **锁定范围** ：左开右开区间 (a, b)，仅锁间隙，不锁已有记录。

- **临键锁 (Next-Key Lock)** ：

  - **作用** ：InnoDB 默认的行锁算法，相当于记录锁 + 间隙锁，锁定一个左开右闭区间 (a, b]，既防止幻读又保证当前读的数据一致性。

  - **触发条件** ：范围查询或在非唯一索引上的等值查询。

**使用实例** ：
假设表 `users` 的 id 字段有值 5, 10, 15。

```sql
-- 事务A执行范围查询，会加临键锁锁定区间 (10, 15] 和 (15, +∞)
SELECT * FROM users WHERE id > 10 FOR UPDATE;
-- 事务B尝试在间隙插入会被阻塞
INSERT INTO users (id) VALUES (12); -- 阻塞
INSERT INTO users (id) VALUES (18); -- 阻塞
```

#### 1.4 意向锁 (Intention Lock)

意向锁是表级锁，由 InnoDB 自动管理，用于快速判断表中是否有行被锁定，避免遍历每行检查锁状态。

- **意向共享锁 (IS)** ：事务准备给某些行加共享锁前，先为该表加 IS 锁。

- **意向排他锁 (IX)** ：事务准备给某些行加排他锁前，先为该表加 IX 锁。

意向锁之间兼容，但与表级 S/X 锁互斥，提高了表级锁检查的效率。

#### 1.5 两阶段锁协议 (Two-Phase Locking, 2PL)

InnoDB 遵循两阶段锁协议：

- **加锁阶段** ：事务执行过程中逐步获取锁。

- **解锁阶段** ：事务提交或回滚时一次性释放所有锁。

**最佳实践** ：将最可能引起锁冲突的写操作放在事务后面，缩短排他锁持有时间。

### 2. MVCC (多版本并发控制)

MVCC 是一种非阻塞的并发控制技术，通过维护数据的多个版本，实现读写操作不相互阻塞，大幅提升数据库并发性能。

#### 2.1 MVCC 出现背景

在高并发场景下，单纯使用锁机制会导致频繁的锁竞争和阻塞。MVCC 的出现主要是为了解决：

- **读写阻塞** ：传统锁机制中读会阻塞写，写会阻塞读。

- **隔离级别实现** ：在保证隔离性的同时避免大量加锁，特别是可重复读隔离级别的实现。

- **幻读问题** ：结合间隙锁/临键锁解决幻读。

#### 2.2 MVCC 核心组件

MVCC 的实现依赖于三个核心组件：

1. **隐藏字段** ：

   - `DB_TRX_ID` （6字节）：最近修改该行数据的事务 ID。

   - `DB_ROLL_PTR` （7字节）：回滚指针，指向该行数据的上一个版本在 Undo Log 中的位置。

   - `DB_ROW_ID` （6字节）：隐藏自增 ID，当无合适主键时用作聚集索引。

2. **Undo Log（回滚日志）** ：

   - 存储数据的历史版本，用于事务回滚和 MVCC 的快照读。

   - 数据修改时，旧数据副本会存入 Undo Log，形成版本链。

3. **Read View（读视图）** ：

   - 决定事务可以看到哪些版本的数据，解决可见性问题。

#### 2.3 MVCC 工作流程

当执行快照读（普通 SELECT）时，MVCC 的工作流程如下：

1. 获取当前事务的 ID。

2. 生成或获取 Read View。

3. 读取数据行的最新版本。

4. 检查数据行版本的事务 ID 与 Read View 的可见性规则。

5. 如果不符合可见性规则，则通过 Undo Log 的版本链查找可见的历史版本。

6. 返回符合规则的数据版本。

#### 2.4 快照读与当前读

- **快照读** ：普通 SELECT 语句，读取数据的可见版本（可能是历史版本），不加锁。

- **当前读** ：加锁的 SELECT（如 `SELECT ... FOR UPDATE` ）、UPDATE、DELETE、INSERT 等操作，总是读取最新已提交的数据版本。

### 3. Read View 机制

Read View 是 MVCC 的核心组件，决定了事务在快照读时能看到哪些数据版本。

#### 3.1 Read View 结构

Read View 主要包含四个关键属性：

- `creator_trx_id` ：创建该 Read View 的事务 ID。

- `trx_ids` ：生成 Read View 时系统内活跃（未提交）的事务 ID 列表。

- `up_limit_id` ：活跃事务中最小的事务 ID。

- `low_limit_id` ：生成 Read View 时系统应分配给下一个事务的 ID 值。

#### 3.2 Read View 可见性规则

当检查数据行版本的 `DB_TRX_ID` 时，判断可见性的规则如下：

1. 如果 `DB_TRX_ID` = `creator_trx_id` ，当前事务修改的数据，可见。

2. 如果 `DB_TRX_ID` < `up_limit_id` ，该版本在 Read View 创建前已提交，可见。

3. 如果 `DB_TRX_ID` ≥ `low_limit_id` ，该版本在 Read View 创建后开启，不可见。

4. 如果 `up_limit_id` ≤ `DB_TRX_ID` < `low_limit_id` ，且 `DB_TRX_ID` 在 `trx_ids` 列表中，表示该版本由活跃事务创建，不可见；否则可见。

#### 3.3 不同隔离级别下的 Read View 生成策略

- **读已提交 (READ COMMITTED)** ：每次执行快照读时都生成新的 Read View，导致每次能看到已提交的最新数据，可能出现不可重复读和幻读。

- **可重复读 (REPEATABLE READ)** ：仅在第一次执行快照读时生成 Read View，后续操作复用该视图，保证同一事务内读取数据的一致性。

#### 3.4 Read View 示例分析

**可重复读隔离级别下解决幻读的示例** ：

```sql
-- 表 student 初始数据：id=1, trx_id=10
-- 事务 A (trx_id=20) 第一次查询
SELECT * FROM student WHERE id >= 1;
-- 生成 ReadView: trx_ids=[20,30], up_limit_id=20, low_limit_id=31, creator_trx_id=20
-- 可见性检查：id=1 的 trx_id=10 < up_limit_id(20)，可见 → 返回 id=1
-- 事务 B (trx_id=30) 插入并提交新数据
INSERT INTO student(id,name) VALUES(2,'李四');
INSERT INTO student(id,name) VALUES(3,'王五');
COMMIT;
-- 事务 A 第二次查询（复用第一次的 ReadView）
SELECT * FROM student WHERE id >= 1;
-- 检查新数据：id=2 的 trx_id=30，在 trx_ids 列表中 → 不可见
-- id=3 的 trx_id=30，同样不可见 → 仍只返回 id=1，无幻读
```

### 4. 总结

MySQL 的并发控制通过锁机制和 MVCC 共同实现，两者协同工作保证了数据的一致性和高并发性能。

- **锁机制** ：主要处理写-写冲突，通过表锁、行锁、间隙锁等实现不同粒度的并发控制，解决脏写、更新丢失等问题。

- **MVCC** ：主要处理读-写冲突，通过多版本控制和 Read View 实现非阻塞读，提高并发性能。

- **协同工作** ：在可重复读隔离级别下，MVCC 实现快照读的可重复性，间隙锁/临键锁防止幻读；当前读操作仍使用行锁保证数据一致性。

**实践建议** ：

- 合理设计索引，确保行锁有效工作，避免退化为表锁。

- 尽量使用快照读，减少显式加锁，提升并发能力。

- 避免长事务，减少锁持有时间和 Undo Log 版本链长度。

- 根据业务需求选择合适的事务隔离级别。

通过理解锁机制、MVCC 和 Read View 的协同工作原理，可以更好地设计和优化高并发数据库应用。