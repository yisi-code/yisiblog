---
title: "Spring Boot 架构中的异常处理分层指南"
date: 2025-11-27 14:19:33
category: "全栈技术栈"
tags:
- "spring boot"
- "架构"
- "后端"
---

## Spring Boot 架构中的异常处理分层指南

### 1. 概述

在 Spring Boot 分层架构中，异常处理是一个关键的设计决策。正确的异常处理策略能够提高代码的可维护性、可读性和系统的健壮性。本指南详细介绍了在何处抛出异常、如何处理异常以及最佳实践。

### 2. 分层架构中的异常处理原则

#### 2.1 核心原则：早抛出，晚捕获（Throw Early, Catch Late）

![](data:image/svg+xml;base64,PHN2ZyBpZD0ibWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyIgd2lkdGg9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjkyOS43OTk5ODc3OTI5Njg4IiB2aWV3Qm94PSIwIDAgMTgwIDkyOS43OTk5ODc3OTI5Njg4IiBjbGFzcz0ibWVybWFpZC1zdmciPjxzdHlsZT4jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyB7Zm9udC1mYW1pbHk6InRyZWJ1Y2hldCBtcyIsdmVyZGFuYSxhcmlhbCxzYW5zLXNlcmlmO2ZvbnQtc2l6ZToxNnB4O2ZpbGw6IzMzMzt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLmVycm9yLWljb257ZmlsbDojNTUyMjIyO30jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyAuZXJyb3ItdGV4dHtmaWxsOiM1NTIyMjI7c3Ryb2tlOiM1NTIyMjI7fSNtZXJtYWlkLXN2Zy1SY2JZS0dzYk9HNGI5VE9XIC5lZGdlLXRoaWNrbmVzcy1ub3JtYWx7c3Ryb2tlLXdpZHRoOjJweDt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLmVkZ2UtdGhpY2tuZXNzLXRoaWNre3N0cm9rZS13aWR0aDozLjVweDt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLmVkZ2UtcGF0dGVybi1zb2xpZHtzdHJva2UtZGFzaGFycmF5OjA7fSNtZXJtYWlkLXN2Zy1SY2JZS0dzYk9HNGI5VE9XIC5lZGdlLXBhdHRlcm4tZGFzaGVke3N0cm9rZS1kYXNoYXJyYXk6Mzt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLmVkZ2UtcGF0dGVybi1kb3R0ZWR7c3Ryb2tlLWRhc2hhcnJheToyO30jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyAubWFya2Vye2ZpbGw6IzMzMzMzMztzdHJva2U6IzMzMzMzMzt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLm1hcmtlci5jcm9zc3tzdHJva2U6IzMzMzMzMzt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgc3Zne2ZvbnQtZmFtaWx5OiJ0cmVidWNoZXQgbXMiLHZlcmRhbmEsYXJpYWwsc2Fucy1zZXJpZjtmb250LXNpemU6MTZweDt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLmxhYmVse2ZvbnQtZmFtaWx5OiJ0cmVidWNoZXQgbXMiLHZlcmRhbmEsYXJpYWwsc2Fucy1zZXJpZjtjb2xvcjojMzMzO30jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyAuY2x1c3Rlci1sYWJlbCB0ZXh0e2ZpbGw6IzMzMzt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLmNsdXN0ZXItbGFiZWwgc3Bhbntjb2xvcjojMzMzO30jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyAubGFiZWwgdGV4dCwjbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyBzcGFue2ZpbGw6IzMzMztjb2xvcjojMzMzO30jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyAubm9kZSByZWN0LCNtZXJtYWlkLXN2Zy1SY2JZS0dzYk9HNGI5VE9XIC5ub2RlIGNpcmNsZSwjbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyAubm9kZSBlbGxpcHNlLCNtZXJtYWlkLXN2Zy1SY2JZS0dzYk9HNGI5VE9XIC5ub2RlIHBvbHlnb24sI21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLm5vZGUgcGF0aHtmaWxsOiNFQ0VDRkY7c3Ryb2tlOiM5MzcwREI7c3Ryb2tlLXdpZHRoOjFweDt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLm5vZGUgLmxhYmVse3RleHQtYWxpZ246Y2VudGVyO30jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyAubm9kZS5jbGlja2FibGV7Y3Vyc29yOnBvaW50ZXI7fSNtZXJtYWlkLXN2Zy1SY2JZS0dzYk9HNGI5VE9XIC5hcnJvd2hlYWRQYXRoe2ZpbGw6IzMzMzMzMzt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLmVkZ2VQYXRoIC5wYXRoe3N0cm9rZTojMzMzMzMzO3N0cm9rZS13aWR0aDoyLjBweDt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLmZsb3djaGFydC1saW5re3N0cm9rZTojMzMzMzMzO2ZpbGw6bm9uZTt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLmVkZ2VMYWJlbHtiYWNrZ3JvdW5kLWNvbG9yOiNlOGU4ZTg7dGV4dC1hbGlnbjpjZW50ZXI7fSNtZXJtYWlkLXN2Zy1SY2JZS0dzYk9HNGI5VE9XIC5lZGdlTGFiZWwgcmVjdHtvcGFjaXR5OjAuNTtiYWNrZ3JvdW5kLWNvbG9yOiNlOGU4ZTg7ZmlsbDojZThlOGU4O30jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyAuY2x1c3RlciByZWN0e2ZpbGw6I2ZmZmZkZTtzdHJva2U6I2FhYWEzMztzdHJva2Utd2lkdGg6MXB4O30jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyAuY2x1c3RlciB0ZXh0e2ZpbGw6IzMzMzt9I21lcm1haWQtc3ZnLVJjYllLR3NiT0c0YjlUT1cgLmNsdXN0ZXIgc3Bhbntjb2xvcjojMzMzO30jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyBkaXYubWVybWFpZFRvb2x0aXB7cG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpjZW50ZXI7bWF4LXdpZHRoOjIwMHB4O3BhZGRpbmc6MnB4O2ZvbnQtZmFtaWx5OiJ0cmVidWNoZXQgbXMiLHZlcmRhbmEsYXJpYWwsc2Fucy1zZXJpZjtmb250LXNpemU6MTJweDtiYWNrZ3JvdW5kOmhzbCg4MCwgMTAwJSwgOTYuMjc0NTA5ODAzOSUpO2JvcmRlcjoxcHggc29saWQgI2FhYWEzMztib3JkZXItcmFkaXVzOjJweDtwb2ludGVyLWV2ZW50czpub25lO3otaW5kZXg6MTAwO30jbWVybWFpZC1zdmctUmNiWUtHc2JPRzRiOVRPVyA6cm9vdHstLW1lcm1haWQtZm9udC1mYW1pbHk6InRyZWJ1Y2hldCBtcyIsdmVyZGFuYSxhcmlhbCxzYW5zLXNlcmlmO308L3N0eWxlPjxnPjxnIGNsYXNzPSJvdXRwdXQiPjxnIGNsYXNzPSJjbHVzdGVycyI+PC9nPjxnIGNsYXNzPSJlZGdlUGF0aHMiPjxnIGNsYXNzPSJlZGdlUGF0aCBMUy1BIExFLUIiIGlkPSJMLUEtQiIgc3R5bGU9Im9wYWNpdHk6IDE7Ij48cGF0aCBjbGFzcz0icGF0aCIgZD0iTTkwLDU0TDkwLDU4LjE2NjY2NjY2NjY2NjY2NEM5MCw2Mi4zMzMzMzMzMzMzMzMzMzYsOTAsNzAuNjY2NjY2NjY2NjY2NjcsOTAsNzlDOTAsODcuMzMzMzMzMzMzMzMzMzMsOTAsOTUuNjY2NjY2NjY2NjY2NjcsOTAsOTkuODMzMzMzMzMzMzMzMzNMOTAsMTA0IiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93aGVhZDI4NykiIHN0eWxlPSJmaWxsOm5vbmUiPjwvcGF0aD48ZGVmcz48bWFya2VyIGlkPSJhcnJvd2hlYWQyODciIHZpZXdCb3g9IjAgMCAxMCAxMCIgcmVmWD0iOSIgcmVmWT0iNSIgbWFya2VyVW5pdHM9InN0cm9rZVdpZHRoIiBtYXJrZXJXaWR0aD0iOCIgbWFya2VySGVpZ2h0PSI2IiBvcmllbnQ9ImF1dG8iPjxwYXRoIGQ9Ik0gMCAwIEwgMTAgNSBMIDAgMTAgeiIgY2xhc3M9ImFycm93aGVhZFBhdGgiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDE7IHN0cm9rZS1kYXNoYXJyYXk6IDEsIDA7Ij48L3BhdGg+PC9tYXJrZXI+PC9kZWZzPjwvZz48ZyBjbGFzcz0iZWRnZVBhdGggTFMtQiBMRS1DIiBzdHlsZT0ib3BhY2l0eTogMTsiIGlkPSJMLUItQyI+PHBhdGggY2xhc3M9InBhdGgiIGQ9Ik05MCwxNTBMOTAsMTU0LjE2NjY2NjY2NjY2NjY2QzkwLDE1OC4zMzMzMzMzMzMzMzMzNCw5MCwxNjYuNjY2NjY2NjY2NjY2NjYsOTAsMTc1QzkwLDE4My4zMzMzMzMzMzMzMzMzNCw5MCwxOTEuNjY2NjY2NjY2NjY2NjYsOTAsMTk1LjgzMzMzMzMzMzMzMzM0TDkwLDIwMCIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQyODgpIiBzdHlsZT0iZmlsbDpub25lIj48L3BhdGg+PGRlZnM+PG1hcmtlciBpZD0iYXJyb3doZWFkMjg4IiB2aWV3Qm94PSIwIDAgMTAgMTAiIHJlZlg9IjkiIHJlZlk9IjUiIG1hcmtlclVuaXRzPSJzdHJva2VXaWR0aCIgbWFya2VyV2lkdGg9IjgiIG1hcmtlckhlaWdodD0iNiIgb3JpZW50PSJhdXRvIj48cGF0aCBkPSJNIDAgMCBMIDEwIDUgTCAwIDEwIHoiIGNsYXNzPSJhcnJvd2hlYWRQYXRoIiBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAxOyBzdHJva2UtZGFzaGFycmF5OiAxLCAwOyI+PC9wYXRoPjwvbWFya2VyPjwvZGVmcz48L2c+PGcgY2xhc3M9ImVkZ2VQYXRoIExTLUMgTEUtRCIgc3R5bGU9Im9wYWNpdHk6IDE7IiBpZD0iTC1DLUQiPjxwYXRoIGNsYXNzPSJwYXRoIiBkPSJNOTAsMjQ2TDkwLDI1MC4xNjY2NjY2NjY2NjY2NkM5MCwyNTQuMzMzMzMzMzMzMzMzMzQsOTAsMjYyLjY2NjY2NjY2NjY2NjcsOTAsMjcxQzkwLDI3OS4zMzMzMzMzMzMzMzMzLDkwLDI4Ny42NjY2NjY2NjY2NjY3LDkwLDI5MS44MzMzMzMzMzMzMzMzTDkwLDI5NiIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQyODkpIiBzdHlsZT0iZmlsbDpub25lIj48L3BhdGg+PGRlZnM+PG1hcmtlciBpZD0iYXJyb3doZWFkMjg5IiB2aWV3Qm94PSIwIDAgMTAgMTAiIHJlZlg9IjkiIHJlZlk9IjUiIG1hcmtlclVuaXRzPSJzdHJva2VXaWR0aCIgbWFya2VyV2lkdGg9IjgiIG1hcmtlckhlaWdodD0iNiIgb3JpZW50PSJhdXRvIj48cGF0aCBkPSJNIDAgMCBMIDEwIDUgTCAwIDEwIHoiIGNsYXNzPSJhcnJvd2hlYWRQYXRoIiBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAxOyBzdHJva2UtZGFzaGFycmF5OiAxLCAwOyI+PC9wYXRoPjwvbWFya2VyPjwvZGVmcz48L2c+PGcgY2xhc3M9ImVkZ2VQYXRoIExTLUQgTEUtRSIgc3R5bGU9Im9wYWNpdHk6IDE7IiBpZD0iTC1ELUUiPjxwYXRoIGNsYXNzPSJwYXRoIiBkPSJNOTAsMzQyTDkwLDM0Ni4xNjY2NjY2NjY2NjY3QzkwLDM1MC4zMzMzMzMzMzMzMzMzLDkwLDM1OC42NjY2NjY2NjY2NjY3LDkwLjA4MzMzMzMzMzMzMzMzLDM2Ny4wODMzMzM1ODc2NDY0NUM5MC4xNjY2NjY2NjY2NjY2NywzNzUuNTAwMDAwNTA4NjI2Myw5MC4zMzMzMzMzMzMzMzMzMywzODQuMDAwMDAxMDE3MjUyNTQsOTAuNDE2NjY2NjY2NjY2NjcsMzg4LjI1MDAwMTI3MTU2NTc0TDkwLjUsMzkyLjUwMDAwMTUyNTg3ODkiIG1hcmtlci1lbmQ9InVybCgjYXJyb3doZWFkMjkwKSIgc3R5bGU9ImZpbGw6bm9uZSI+PC9wYXRoPjxkZWZzPjxtYXJrZXIgaWQ9ImFycm93aGVhZDI5MCIgdmlld0JveD0iMCAwIDEwIDEwIiByZWZYPSI5IiByZWZZPSI1IiBtYXJrZXJVbml0cz0ic3Ryb2tlV2lkdGgiIG1hcmtlcldpZHRoPSI4IiBtYXJrZXJIZWlnaHQ9IjYiIG9yaWVudD0iYXV0byI+PHBhdGggZD0iTSAwIDAgTCAxMCA1IEwgMCAxMCB6IiBjbGFzcz0iYXJyb3doZWFkUGF0aCIgc3R5bGU9InN0cm9rZS13aWR0aDogMTsgc3Ryb2tlLWRhc2hhcnJheTogMSwgMDsiPjwvcGF0aD48L21hcmtlcj48L2RlZnM+PC9nPjxnIGNsYXNzPSJlZGdlUGF0aCBMUy1FIExFLUYiIHN0eWxlPSJvcGFjaXR5OiAxOyIgaWQ9IkwtRS1GIj48cGF0aCBjbGFzcz0icGF0aCIgZD0iTTkwLjUsNTM4LjI5OTk5ODQ3NDEyMUw5MC40MTY2NjY2NjY2NjY2Nyw1NDIuMzgzMzMyNTcwMzkzOEM5MC4zMzMzMzMzMzMzMzMzMyw1NDYuNDY2NjY2NjY2NjY2Niw5MC4xNjY2NjY2NjY2NjY2Nyw1NTQuNjMzMzM0ODU5MjEyMSw5MC4wODMzMzMzMzMzMzMzMyw1NjIuODgzMzM1NjIyMTUxN0M5MCw1NzEuMTMzMzM2Mzg1MDkxMiw5MCw1NzkuNDY2NjY5NzE4NDI0NCw5MCw1ODMuNjMzMzM2Mzg1MDkxMkw5MCw1ODcuODAwMDAzMDUxNzU3OCIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQyOTEpIiBzdHlsZT0iZmlsbDpub25lIj48L3BhdGg+PGRlZnM+PG1hcmtlciBpZD0iYXJyb3doZWFkMjkxIiB2aWV3Qm94PSIwIDAgMTAgMTAiIHJlZlg9IjkiIHJlZlk9IjUiIG1hcmtlclVuaXRzPSJzdHJva2VXaWR0aCIgbWFya2VyV2lkdGg9IjgiIG1hcmtlckhlaWdodD0iNiIgb3JpZW50PSJhdXRvIj48cGF0aCBkPSJNIDAgMCBMIDEwIDUgTCAwIDEwIHoiIGNsYXNzPSJhcnJvd2hlYWRQYXRoIiBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAxOyBzdHJva2UtZGFzaGFycmF5OiAxLCAwOyI+PC9wYXRoPjwvbWFya2VyPjwvZGVmcz48L2c+PGcgY2xhc3M9ImVkZ2VQYXRoIExTLUYgTEUtRyIgc3R5bGU9Im9wYWNpdHk6IDE7IiBpZD0iTC1GLUciPjxwYXRoIGNsYXNzPSJwYXRoIiBkPSJNOTAsNjMzLjgwMDAwMzA1MTc1NzhMOTAsNjM3Ljk2NjY2OTcxODQyNDRDOTAsNjQyLjEzMzMzNjM4NTA5MTIsOTAsNjUwLjQ2NjY2OTcxODQyNDQsOTAsNjU4LjgwMDAwMzA1MTc1NzhDOTAsNjY3LjEzMzMzNjM4NTA5MTIsOTAsNjc1LjQ2NjY2OTcxODQyNDQsOTAsNjc5LjYzMzMzNjM4NTA5MTJMOTAsNjgzLjgwMDAwMzA1MTc1NzgiIG1hcmtlci1lbmQ9InVybCgjYXJyb3doZWFkMjkyKSIgc3R5bGU9ImZpbGw6bm9uZSI+PC9wYXRoPjxkZWZzPjxtYXJrZXIgaWQ9ImFycm93aGVhZDI5MiIgdmlld0JveD0iMCAwIDEwIDEwIiByZWZYPSI5IiByZWZZPSI1IiBtYXJrZXJVbml0cz0ic3Ryb2tlV2lkdGgiIG1hcmtlcldpZHRoPSI4IiBtYXJrZXJIZWlnaHQ9IjYiIG9yaWVudD0iYXV0byI+PHBhdGggZD0iTSAwIDAgTCAxMCA1IEwgMCAxMCB6IiBjbGFzcz0iYXJyb3doZWFkUGF0aCIgc3R5bGU9InN0cm9rZS13aWR0aDogMTsgc3Ryb2tlLWRhc2hhcnJheTogMSwgMDsiPjwvcGF0aD48L21hcmtlcj48L2RlZnM+PC9nPjxnIGNsYXNzPSJlZGdlUGF0aCBMUy1HIExFLUgiIHN0eWxlPSJvcGFjaXR5OiAxOyIgaWQ9IkwtRy1IIj48cGF0aCBjbGFzcz0icGF0aCIgZD0iTTkwLDcyOS44MDAwMDMwNTE3NTc4TDkwLDczMy45NjY2Njk3MTg0MjQ0QzkwLDczOC4xMzMzMzYzODUwOTEyLDkwLDc0Ni40NjY2Njk3MTg0MjQ0LDkwLDc1NC44MDAwMDMwNTE3NTc4QzkwLDc2My4xMzMzMzYzODUwOTEyLDkwLDc3MS40NjY2Njk3MTg0MjQ0LDkwLDc3NS42MzMzMzYzODUwOTEyTDkwLDc3OS44MDAwMDMwNTE3NTc4IiBtYXJrZXItZW5kPSJ1cmwoI2Fycm93aGVhZDI5MykiIHN0eWxlPSJmaWxsOm5vbmUiPjwvcGF0aD48ZGVmcz48bWFya2VyIGlkPSJhcnJvd2hlYWQyOTMiIHZpZXdCb3g9IjAgMCAxMCAxMCIgcmVmWD0iOSIgcmVmWT0iNSIgbWFya2VyVW5pdHM9InN0cm9rZVdpZHRoIiBtYXJrZXJXaWR0aD0iOCIgbWFya2VySGVpZ2h0PSI2IiBvcmllbnQ9ImF1dG8iPjxwYXRoIGQ9Ik0gMCAwIEwgMTAgNSBMIDAgMTAgeiIgY2xhc3M9ImFycm93aGVhZFBhdGgiIHN0eWxlPSJzdHJva2Utd2lkdGg6IDE7IHN0cm9rZS1kYXNoYXJyYXk6IDEsIDA7Ij48L3BhdGg+PC9tYXJrZXI+PC9kZWZzPjwvZz48ZyBjbGFzcz0iZWRnZVBhdGggTFMtSCBMRS1JIiBzdHlsZT0ib3BhY2l0eTogMTsiIGlkPSJMLUgtSSI+PHBhdGggY2xhc3M9InBhdGgiIGQ9Ik05MCw4MjUuODAwMDAzMDUxNzU3OEw5MCw4MjkuOTY2NjY5NzE4NDI0NEM5MCw4MzQuMTMzMzM2Mzg1MDkxMiw5MCw4NDIuNDY2NjY5NzE4NDI0NCw5MCw4NTAuODAwMDAzMDUxNzU3OEM5MCw4NTkuMTMzMzM2Mzg1MDkxMiw5MCw4NjcuNDY2NjY5NzE4NDI0NCw5MCw4NzEuNjMzMzM2Mzg1MDkxMkw5MCw4NzUuODAwMDAzMDUxNzU3OCIgbWFya2VyLWVuZD0idXJsKCNhcnJvd2hlYWQyOTQpIiBzdHlsZT0iZmlsbDpub25lIj48L3BhdGg+PGRlZnM+PG1hcmtlciBpZD0iYXJyb3doZWFkMjk0IiB2aWV3Qm94PSIwIDAgMTAgMTAiIHJlZlg9IjkiIHJlZlk9IjUiIG1hcmtlclVuaXRzPSJzdHJva2VXaWR0aCIgbWFya2VyV2lkdGg9IjgiIG1hcmtlckhlaWdodD0iNiIgb3JpZW50PSJhdXRvIj48cGF0aCBkPSJNIDAgMCBMIDEwIDUgTCAwIDEwIHoiIGNsYXNzPSJhcnJvd2hlYWRQYXRoIiBzdHlsZT0ic3Ryb2tlLXdpZHRoOiAxOyBzdHJva2UtZGFzaGFycmF5OiAxLCAwOyI+PC9wYXRoPjwvbWFya2VyPjwvZGVmcz48L2c+PC9nPjxnIGNsYXNzPSJlZGdlTGFiZWxzIj48ZyBjbGFzcz0iZWRnZUxhYmVsIiB0cmFuc2Zvcm09IiIgc3R5bGU9Im9wYWNpdHk6IDE7Ij48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBjbGFzcz0ibGFiZWwiPjxyZWN0IHJ4PSIwIiByeT0iMCIgd2lkdGg9IjAiIGhlaWdodD0iMCI+PC9yZWN0Pjxmb3JlaWduT2JqZWN0IHdpZHRoPSIwIiBoZWlnaHQ9IjAiPjxkaXYgc3R5bGU9ImRpc3BsYXk6IGlubGluZS1ibG9jazsgd2hpdGUtc3BhY2U6IG5vd3JhcDsiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIj48c3BhbiBpZD0iTC1MLUEtQiIgY2xhc3M9ImVkZ2VMYWJlbCBMLUxTLUEnIEwtTEUtQiI+PC9zcGFuPjwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjxnIGNsYXNzPSJlZGdlTGFiZWwiIHN0eWxlPSJvcGFjaXR5OiAxOyIgdHJhbnNmb3JtPSIiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMCkiIGNsYXNzPSJsYWJlbCI+PHJlY3Qgcng9IjAiIHJ5PSIwIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3JlY3Q+PGZvcmVpZ25PYmplY3Qgd2lkdGg9IjAiIGhlaWdodD0iMCI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyB3aGl0ZS1zcGFjZTogbm93cmFwOyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiPjxzcGFuIGlkPSJMLUwtQi1DIiBjbGFzcz0iZWRnZUxhYmVsIEwtTFMtQicgTC1MRS1DIj48L3NwYW4+PC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PGcgY2xhc3M9ImVkZ2VMYWJlbCIgc3R5bGU9Im9wYWNpdHk6IDE7IiB0cmFuc2Zvcm09IiI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwwKSIgY2xhc3M9ImxhYmVsIj48cmVjdCByeD0iMCIgcnk9IjAiIHdpZHRoPSIwIiBoZWlnaHQ9IjAiPjwvcmVjdD48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IHdoaXRlLXNwYWNlOiBub3dyYXA7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCI+PHNwYW4gaWQ9IkwtTC1DLUQiIGNsYXNzPSJlZGdlTGFiZWwgTC1MUy1DJyBMLUxFLUQiPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48ZyBjbGFzcz0iZWRnZUxhYmVsIiBzdHlsZT0ib3BhY2l0eTogMTsiIHRyYW5zZm9ybT0iIj48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBjbGFzcz0ibGFiZWwiPjxyZWN0IHJ4PSIwIiByeT0iMCIgd2lkdGg9IjAiIGhlaWdodD0iMCI+PC9yZWN0Pjxmb3JlaWduT2JqZWN0IHdpZHRoPSIwIiBoZWlnaHQ9IjAiPjxkaXYgc3R5bGU9ImRpc3BsYXk6IGlubGluZS1ibG9jazsgd2hpdGUtc3BhY2U6IG5vd3JhcDsiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIj48c3BhbiBpZD0iTC1MLUQtRSIgY2xhc3M9ImVkZ2VMYWJlbCBMLUxTLUQnIEwtTEUtRSI+PC9zcGFuPjwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjxnIGNsYXNzPSJlZGdlTGFiZWwiIHN0eWxlPSJvcGFjaXR5OiAxOyIgdHJhbnNmb3JtPSIiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMCkiIGNsYXNzPSJsYWJlbCI+PHJlY3Qgcng9IjAiIHJ5PSIwIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3JlY3Q+PGZvcmVpZ25PYmplY3Qgd2lkdGg9IjAiIGhlaWdodD0iMCI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyB3aGl0ZS1zcGFjZTogbm93cmFwOyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiPjxzcGFuIGlkPSJMLUwtRS1GIiBjbGFzcz0iZWRnZUxhYmVsIEwtTFMtRScgTC1MRS1GIj48L3NwYW4+PC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PGcgY2xhc3M9ImVkZ2VMYWJlbCIgc3R5bGU9Im9wYWNpdHk6IDE7IiB0cmFuc2Zvcm09IiI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwwKSIgY2xhc3M9ImxhYmVsIj48cmVjdCByeD0iMCIgcnk9IjAiIHdpZHRoPSIwIiBoZWlnaHQ9IjAiPjwvcmVjdD48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IHdoaXRlLXNwYWNlOiBub3dyYXA7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCI+PHNwYW4gaWQ9IkwtTC1GLUciIGNsYXNzPSJlZGdlTGFiZWwgTC1MUy1GJyBMLUxFLUciPjwvc3Bhbj48L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48ZyBjbGFzcz0iZWRnZUxhYmVsIiBzdHlsZT0ib3BhY2l0eTogMTsiIHRyYW5zZm9ybT0iIj48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIiBjbGFzcz0ibGFiZWwiPjxyZWN0IHJ4PSIwIiByeT0iMCIgd2lkdGg9IjAiIGhlaWdodD0iMCI+PC9yZWN0Pjxmb3JlaWduT2JqZWN0IHdpZHRoPSIwIiBoZWlnaHQ9IjAiPjxkaXYgc3R5bGU9ImRpc3BsYXk6IGlubGluZS1ibG9jazsgd2hpdGUtc3BhY2U6IG5vd3JhcDsiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIj48c3BhbiBpZD0iTC1MLUctSCIgY2xhc3M9ImVkZ2VMYWJlbCBMLUxTLUcnIEwtTEUtSCI+PC9zcGFuPjwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjxnIGNsYXNzPSJlZGdlTGFiZWwiIHN0eWxlPSJvcGFjaXR5OiAxOyIgdHJhbnNmb3JtPSIiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMCkiIGNsYXNzPSJsYWJlbCI+PHJlY3Qgcng9IjAiIHJ5PSIwIiB3aWR0aD0iMCIgaGVpZ2h0PSIwIj48L3JlY3Q+PGZvcmVpZ25PYmplY3Qgd2lkdGg9IjAiIGhlaWdodD0iMCI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyB3aGl0ZS1zcGFjZTogbm93cmFwOyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiPjxzcGFuIGlkPSJMLUwtSC1JIiBjbGFzcz0iZWRnZUxhYmVsIEwtTFMtSCcgTC1MRS1JIj48L3NwYW4+PC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PC9nPjxnIGNsYXNzPSJub2RlcyI+PGcgY2xhc3M9Im5vZGUgZGVmYXVsdCIgaWQ9ImZsb3djaGFydC1BLTMxMiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTAsMzEpIiBzdHlsZT0ib3BhY2l0eTogMTsiPjxyZWN0IHJ4PSIwIiByeT0iMCIgeD0iLTQyIiB5PSItMjMiIHdpZHRoPSI4NCIgaGVpZ2h0PSI0NiIgY2xhc3M9ImxhYmVsLWNvbnRhaW5lciI+PC9yZWN0PjxnIGNsYXNzPSJsYWJlbCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwwKSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTMyLC0xMykiPjxmb3JlaWduT2JqZWN0IHdpZHRoPSI2NCIgaGVpZ2h0PSIyNiI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyB3aGl0ZS1zcGFjZTogbm93cmFwOyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiPuivt+axgui/m+WFpTwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjwvZz48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0IiBzdHlsZT0ib3BhY2l0eTogMTsiIGlkPSJmbG93Y2hhcnQtQi0zMTMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDkwLDEyNykiPjxyZWN0IHJ4PSIwIiByeT0iMCIgeD0iLTU0LjIxODc1IiB5PSItMjMiIHdpZHRoPSIxMDguNDM3NSIgaGVpZ2h0PSI0NiIgY2xhc3M9ImxhYmVsLWNvbnRhaW5lciI+PC9yZWN0PjxnIGNsYXNzPSJsYWJlbCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwwKSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQ0LjIxODc1LC0xMykiPjxmb3JlaWduT2JqZWN0IHdpZHRoPSI4OC40Mzc1IiBoZWlnaHQ9IjI2Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IHdoaXRlLXNwYWNlOiBub3dyYXA7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCI+Q29udHJvbGxlcuWxgjwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjwvZz48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0IiBzdHlsZT0ib3BhY2l0eTogMTsiIGlkPSJmbG93Y2hhcnQtQy0zMTUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDkwLDIyMykiPjxyZWN0IHJ4PSIwIiByeT0iMCIgeD0iLTQzLjg0Mzc1IiB5PSItMjMiIHdpZHRoPSI4Ny42ODc1IiBoZWlnaHQ9IjQ2IiBjbGFzcz0ibGFiZWwtY29udGFpbmVyIj48L3JlY3Q+PGcgY2xhc3M9ImxhYmVsIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIj48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMzMuODQzNzUsLTEzKSI+PGZvcmVpZ25PYmplY3Qgd2lkdGg9IjY3LjY4NzUiIGhlaWdodD0iMjYiPjxkaXYgc3R5bGU9ImRpc3BsYXk6IGlubGluZS1ibG9jazsgd2hpdGUtc3BhY2U6IG5vd3JhcDsiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIj5TZXJ2aWNl5bGCPC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PC9nPjxnIGNsYXNzPSJub2RlIGRlZmF1bHQiIHN0eWxlPSJvcGFjaXR5OiAxOyIgaWQ9ImZsb3djaGFydC1ELTMxNyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTAsMzE5KSI+PHJlY3Qgcng9IjAiIHJ5PSIwIiB4PSItNTUuNDg3NDk5MjM3MDYwNTUiIHk9Ii0yMyIgd2lkdGg9IjExMC45NzQ5OTg0NzQxMjExIiBoZWlnaHQ9IjQ2IiBjbGFzcz0ibGFiZWwtY29udGFpbmVyIj48L3JlY3Q+PGcgY2xhc3M9ImxhYmVsIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwLDApIj48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNDUuNDg3NDk5MjM3MDYwNTUsLTEzKSI+PGZvcmVpZ25PYmplY3Qgd2lkdGg9IjkwLjk3NDk5ODQ3NDEyMTEiIGhlaWdodD0iMjYiPjxkaXYgc3R5bGU9ImRpc3BsYXk6IGlubGluZS1ibG9jazsgd2hpdGUtc3BhY2U6IG5vd3JhcDsiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIj5SZXBvc2l0b3J55bGCPC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PC9nPjxnIGNsYXNzPSJub2RlIGRlZmF1bHQiIHN0eWxlPSJvcGFjaXR5OiAxOyIgaWQ9ImZsb3djaGFydC1FLTMxOSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTAsNDY0LjkwMDAwMTUyNTg3ODkpIj48cG9seWdvbiBwb2ludHM9IjcyLjksMCAxNDUuOCwtNzIuOSA3Mi45LC0xNDUuOCAwLC03Mi45IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNzIuOSw3Mi45KSIgY2xhc3M9ImxhYmVsLWNvbnRhaW5lciI+PC9wb2x5Z29uPjxnIGNsYXNzPSJsYWJlbCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwwKSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQ4LC0xMykiPjxmb3JlaWduT2JqZWN0IHdpZHRoPSI5NiIgaGVpZ2h0PSIyNiI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyB3aGl0ZS1zcGFjZTogbm93cmFwOyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiPuWPkeeOsOW8guW4uOadoeS7tjwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjwvZz48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0IiBzdHlsZT0ib3BhY2l0eTogMTsiIGlkPSJmbG93Y2hhcnQtRi0zMjEiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDkwLDYxMC44MDAwMDMwNTE3NTc4KSI+PHJlY3Qgcng9IjAiIHJ5PSIwIiB4PSItNTgiIHk9Ii0yMyIgd2lkdGg9IjExNiIgaGVpZ2h0PSI0NiIgY2xhc3M9ImxhYmVsLWNvbnRhaW5lciI+PC9yZWN0PjxnIGNsYXNzPSJsYWJlbCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwwKSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQ4LC0xMykiPjxmb3JlaWduT2JqZWN0IHdpZHRoPSI5NiIgaGVpZ2h0PSIyNiI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyB3aGl0ZS1zcGFjZTogbm93cmFwOyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiPueri+WNs+aKm+WHuuW8guW4uDwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjwvZz48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0IiBzdHlsZT0ib3BhY2l0eTogMTsiIGlkPSJmbG93Y2hhcnQtRy0zMjMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDkwLDcwNi44MDAwMDMwNTE3NTc4KSI+PHJlY3Qgcng9IjAiIHJ5PSIwIiB4PSItNTgiIHk9Ii0yMyIgd2lkdGg9IjExNiIgaGVpZ2h0PSI0NiIgY2xhc3M9ImxhYmVsLWNvbnRhaW5lciI+PC9yZWN0PjxnIGNsYXNzPSJsYWJlbCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwwKSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTQ4LC0xMykiPjxmb3JlaWduT2JqZWN0IHdpZHRoPSI5NiIgaGVpZ2h0PSIyNiI+PGRpdiBzdHlsZT0iZGlzcGxheTogaW5saW5lLWJsb2NrOyB3aGl0ZS1zcGFjZTogbm93cmFwOyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWwiPuW8guW4uOWQkeS4iuS8oOaSrTwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjwvZz48ZyBjbGFzcz0ibm9kZSBkZWZhdWx0IiBzdHlsZT0ib3BhY2l0eTogMTsiIGlkPSJmbG93Y2hhcnQtSC0zMjUiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDkwLDgwMi44MDAwMDMwNTE3NTc4KSI+PHJlY3Qgcng9IjAiIHJ5PSIwIiB4PSItNjYiIHk9Ii0yMyIgd2lkdGg9IjEzMiIgaGVpZ2h0PSI0NiIgY2xhc3M9ImxhYmVsLWNvbnRhaW5lciI+PC9yZWN0PjxnIGNsYXNzPSJsYWJlbCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCwwKSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTU2LC0xMykiPjxmb3JlaWduT2JqZWN0IHdpZHRoPSIxMTIiIGhlaWdodD0iMjYiPjxkaXYgc3R5bGU9ImRpc3BsYXk6IGlubGluZS1ibG9jazsgd2hpdGUtc3BhY2U6IG5vd3JhcDsiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIj7lhajlsYDlvILluLjlpITnkIblmag8L2Rpdj48L2ZvcmVpZ25PYmplY3Q+PC9nPjwvZz48L2c+PGcgY2xhc3M9Im5vZGUgZGVmYXVsdCIgc3R5bGU9Im9wYWNpdHk6IDE7IiBpZD0iZmxvd2NoYXJ0LUktMzI3IiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5MCw4OTguODAwMDAzMDUxNzU3OCkiPjxyZWN0IHJ4PSIwIiByeT0iMCIgeD0iLTgyIiB5PSItMjMiIHdpZHRoPSIxNjQiIGhlaWdodD0iNDYiIGNsYXNzPSJsYWJlbC1jb250YWluZXIiPjwvcmVjdD48ZyBjbGFzcz0ibGFiZWwiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDAsMCkiPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC03MiwtMTMpIj48Zm9yZWlnbk9iamVjdCB3aWR0aD0iMTQ0IiBoZWlnaHQ9IjI2Ij48ZGl2IHN0eWxlPSJkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IHdoaXRlLXNwYWNlOiBub3dyYXA7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCI+6L+U5Zue57uT5p6E5YyW6ZSZ6K+v5ZON5bqUPC9kaXY+PC9mb3JlaWduT2JqZWN0PjwvZz48L2c+PC9nPjwvZz48L2c+PC9nPjwvc3ZnPg==)

#### 2.2 各层级职责总结

| 架构层级 | 是否主动抛出异常？ | 是否处理异常？ | 核心职责说明 |
|:---:|:---:|:---:|:---:|
| **Repository/Dao 层** | ✅ 是（技术异常） | ❌ 不处理 | 抛出数据访问相关异常，如约束违反、连接问题等 |
| **Service 层** | ✅ 是（主要抛出方） | ⚠️ 选择性处理 | 抛出业务逻辑异常，是业务规则的主要执行者 |
| **Controller 层** | ❌ 不抛出 | ❌ 不处理 | 专注请求/响应处理，将异常委托给全局处理器 |
| **全局异常处理器** | 不适用 | ✅ 是（主要处理方） | 集中处理所有未捕获异常，返回统一错误格式 |

### 3. 各层级详细设计

#### 3.1 Repository/Dao 层

**职责** ：数据持久化操作，与数据库直接交互。

##### 抛出策略

- 只抛出与技术实现相关的异常

- 将底层数据库异常转换为 Spring 的 `DataAccessException` 体系

##### 代码示例

```java
@Repository
public class UserRepository {
public User findById(Long id) {
    // 不捕获异常，让 Spring 的数据访问异常体系处理
    return entityManager.find(User.class, id);
}

public User findByUsername(String username) {
    try {
        return entityManager.createQuery("FROM User u WHERE u.username = :username", User.class)
                .setParameter("username", username)
                .getSingleResult();
    } catch (NoResultException e) {
        // 明确抛出业务相关的异常，而不是返回null
        throw new UserNotFoundException("用户不存在: " + username);
    }
}
}
```

##### 不应该在 Repository 层做的

```java
// 错误示例：在Repository层处理业务逻辑
public User findById(Long id) {
User user = entityManager.find(User.class, id);
if (user == null) {
// 错误：在Repository层返回null或默认值
return createDefaultUser(); // 应该抛出异常
}
return user;
}
```

#### 3.2 Service 层

**职责** ：业务逻辑的核心实现，协调多个 Repository 操作。

##### 抛出策略

- 主动抛出业务相关的检查异常和非检查异常

- 使用自定义的业务异常类

- 在需要事务回滚时抛出运行时异常

##### 代码示例

```java
@Service
@Transactional
public class UserService {
private final UserRepository userRepository;
private final EmailService emailService;

public UserService(UserRepository userRepository, EmailService emailService) {
    this.userRepository = userRepository;
    this.emailService = emailService;
}

/**
 * 用户注册服务
 */
public User registerUser(UserRegistrationDto registrationDto) {
    // 1. 检查用户名是否已存在（业务规则验证）
    if (userRepository.existsByUsername(registrationDto.getUsername())) {
        throw new BusinessException("USERNAME_EXISTS", "用户名已存在");
    }
    
    // 2. 检查邮箱是否已注册
    if (userRepository.existsByEmail(registrationDto.getEmail())) {
        throw new BusinessException("EMAIL_EXISTS", "邮箱已被注册");
    }
    
    try {
        // 3. 创建用户（可能抛出数据访问异常）
        User user = new User(registrationDto);
        userRepository.save(user);
        
        // 4. 发送欢迎邮件（可能抛出邮件发送异常）
        emailService.sendWelcomeEmail(user.getEmail());
        
        return user;
    } catch (DataAccessException e) {
        // 转换技术异常为业务异常
        throw new BusinessException("REGISTRATION_FAILED", "用户注册失败，请稍后重试", e);
    }
}

/**
 * 选择性处理异常的场景：重试机制
 */
public void updateUserProfile(Long userId, UserProfileDto profileDto) {
    int maxRetries = 3;
    int attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UserNotFoundException("用户不存在"));
            
            user.updateProfile(profileDto);
            userRepository.save(user);
            return; // 成功则退出
            
        } catch (OptimisticLockingFailureException e) {
            // 处理乐观锁异常，进行重试
            attempt++;
            if (attempt == maxRetries) {
                throw new BusinessException("UPDATE_CONFLICT", "数据更新冲突，请重试");
            }
            sleep(100 * attempt); // 指数退避
        }
    }
}
}
```

#### 3.3 Controller 层

**职责** ：HTTP 请求处理，参数验证，响应格式化。

##### 最佳实践

- 不捕获业务异常，让其传播到全局异常处理器

- 只处理与 HTTP 相关的异常（如参数验证）

- 保持代码简洁，专注在请求/响应转换

##### 代码示例

```java
@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {
private final UserService userService;

public UserController(UserService userService) {
    this.userService = userService;
}

/**
 * 用户注册接口
 */
@PostMapping("/register")
public ResponseEntity<ApiResponse<User>> registerUser(
        @Valid @RequestBody UserRegistrationDto registrationDto) {
    
    // 不捕获Service层抛出的异常，让其自然传播
    User user = userService.registerUser(registrationDto);
    
    return ResponseEntity.ok(ApiResponse.success(user));
}

/**
 * 参数验证异常由Controller处理（或者交给全局处理器）
 */
@GetMapping("/{userId}")
public ResponseEntity<ApiResponse<User>> getUserProfile(
        @PathVariable @Min(1) Long userId) {
    
    // 参数验证失败会自动抛出MethodArgumentNotValidException
    User user = userService.getUserById(userId);
    
    return ResponseEntity.ok(ApiResponse.success(user));
}
}
```

#### 3.4 全局异常处理层（@ControllerAdvice）

**职责** ：集中处理整个应用程序中抛出的异常，返回统一的错误响应格式。

##### 完整示例

```java
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
/**
 * 处理业务异常
 */
@ExceptionHandler(BusinessException.class)
public ResponseEntity<ApiResponse<?>> handleBusinessException(
        BusinessException ex, HttpServletRequest request) {
    
    log.warn("业务异常: {} - {}", ex.getCode(), ex.getMessage());
    
    ErrorDetail errorDetail = new ErrorDetail(
        ex.getCode(),
        ex.getMessage(),
        request.getRequestURI()
    );
    
    return ResponseEntity.badRequest()
            .body(ApiResponse.error(errorDetail));
}

/**
 * 处理数据不存在异常
 */
@ExceptionHandler({UserNotFoundException.class, ResourceNotFoundException.class})
public ResponseEntity<ApiResponse<?>> handleNotFoundException(
        RuntimeException ex, HttpServletRequest request) {
    
    log.warn("资源未找到: {}", ex.getMessage());
    
    ErrorDetail errorDetail = new ErrorDetail(
        "RESOURCE_NOT_FOUND",
        ex.getMessage(),
        request.getRequestURI()
    );
    
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error(errorDetail));
}

/**
 * 处理参数验证异常
 */
@ExceptionHandler(MethodArgumentNotValidException.class)
public ResponseEntity<ApiResponse<?>> handleValidationException(
        MethodArgumentNotValidException ex, HttpServletRequest request) {
    
    List<String> errors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.toList());
    
    log.warn("参数验证失败: {}", errors);
    
    ErrorDetail errorDetail = new ErrorDetail(
        "VALIDATION_FAILED",
        "参数校验失败: " + String.join("; ", errors),
        request.getRequestURI()
    );
    
    return ResponseEntity.badRequest()
            .body(ApiResponse.error(errorDetail));
}

/**
 * 处理所有未预期的异常
 */
@ExceptionHandler(Exception.class)
public ResponseEntity<ApiResponse<?>> handleUnexpectedException(
        Exception ex, HttpServletRequest request) {
    
    // 生产环境记录详细日志但返回通用错误信息
    log.error("系统异常: {} {}", request.getMethod(), request.getRequestURI(), ex);
    
    boolean isProduction = "prod".equals(System.getenv("SPRING_PROFILES_ACTIVE"));
    
    ErrorDetail errorDetail = new ErrorDetail(
        "INTERNAL_ERROR",
        isProduction ? "系统繁忙，请稍后重试" : ex.getMessage(),
        request.getRequestURI()
    );
    
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(errorDetail));
}
}
```

##### 支持类定义

```java
// 统一API响应格式
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
private boolean success;
private T data;
private ErrorDetail error;
private long timestamp;
public static <T> ApiResponse<T> success(T data) {
    return new ApiResponse<>(true, data, null, System.currentTimeMillis());
}

public static <T> ApiResponse<T> error(ErrorDetail error) {
    return new ApiResponse<>(false, null, error, System.currentTimeMillis());
}
}
// 错误详情
@Data
@AllArgsConstructor
public class ErrorDetail {
private String code;
private String message;
private String path;
}
// 业务异常基类
public class BusinessException extends RuntimeException {
private final String code;
public BusinessException(String code, String message) {
    super(message);
    this.code = code;
}

public BusinessException(String code, String message, Throwable cause) {
    super(message, cause);
    this.code = code;
}

public String getCode() {
    return code;
}
}
```

### 4. 高级主题与最佳实践

#### 4.1 异常分类策略

```java
// 定义异常层次结构
public abstract class AppException extends RuntimeException {
private final String code;
private final HttpStatus httpStatus;
public AppException(String code, String message, HttpStatus httpStatus) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
}

// getters
}
// 具体异常类型
public class ValidationException extends AppException {
public ValidationException(String message) {
super("VALIDATION_ERROR", message, HttpStatus.BAD_REQUEST);
}
}
public class AuthenticationException extends AppException {
public AuthenticationException(String message) {
super("AUTH_FAILED", message, HttpStatus.UNAUTHORIZED);
}
}
public class AuthorizationException extends AppException {
public AuthorizationException(String message) {
super("FORBIDDEN", message, HttpStatus.FORBIDDEN);
}
}
```

#### 4.2 事务边界中的异常处理

```java
@Service
@Transactional
public class OrderService {
/**
 * 运行时异常会自动触发事务回滚
 */
public void placeOrder(Order order) {
    try {
        inventoryService.reserveItems(order.getItems()); // 可能抛出异常
        orderRepository.save(order);
        paymentService.processPayment(order); // 可能抛出异常
        
    } catch (InsufficientStockException | PaymentFailedException e) {
        // 转换为运行时异常以确保事务回滚
        throw new BusinessException("ORDER_FAILED", "订单处理失败", e);
    }
}

/**
 * 检查异常需要明确配置回滚
 */
@Transactional(rollbackFor = BusinessException.class)
public void updateOrder(Order order) throws BusinessException {
    // 业务逻辑...
}
}
```

#### 4.3 异常处理与监控集成

```java
@RestControllerAdvice
public class MonitoringExceptionHandler {
private final MeterRegistry meterRegistry;

@ExceptionHandler(Exception.class)
public ResponseEntity<ApiResponse<?>> handleException(Exception ex, HttpServletRequest request) {
    // 记录监控指标
    meterRegistry.counter("http_errors",
            "exception", ex.getClass().getSimpleName(),
            "path", request.getRequestURI(),
            "method", request.getMethod())
        .increment();
    
    // 正常的异常处理逻辑...
    return handleExceptionInternal(ex, request);
}
}
```

### 5. 测试策略

#### 5.1 Service 层异常测试

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
@Mock
private UserRepository userRepository;

@InjectMocks
private UserService userService;

@Test
void registerUser_shouldThrowException_whenUsernameExists() {
    // Given
    UserRegistrationDto dto = new UserRegistrationDto("existingUser", "email@test.com");
    when(userRepository.existsByUsername("existingUser")).thenReturn(true);
    
    // When & Then
    BusinessException exception = assertThrows(BusinessException.class, 
        () -> userService.registerUser(dto));
    
    assertEquals("USERNAME_EXISTS", exception.getCode());
}
}
```

#### 5.2 全局异常处理器测试

```java
@WebMvcTest(UserController.class)
class GlobalExceptionHandlerTest {
@Autowired
private MockMvc mockMvc;

@MockBean
private UserService userService;

@Test
void shouldReturnBadRequest_whenBusinessExceptionThrown() throws Exception {
    // Given
    when(userService.registerUser(any()))
        .thenThrow(new BusinessException("USERNAME_EXISTS", "用户名已存在"));
    
    // When & Then
    mockMvc.perform(post("/api/users/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"username\":\"test\",\"email\":\"test@test.com\"}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.success").value(false))
        .andExpect(jsonPath("$.error.code").value("USERNAME_EXISTS"));
}
}
```

### 6. 总结

在 Spring Boot 分层架构中，异常处理应该遵循以下核心原则：

1. **Repository 层** ：专注于数据访问，抛出技术相关的异常

2. **Service 层** ：作为业务逻辑的核心，主动抛出业务异常

3. **Controller 层** ：保持简洁，不处理业务异常，专注请求/响应转换

4. **全局异常处理器** ：集中处理所有异常，返回统一的错误格式

这种分层处理策略确保了关注点分离，使代码更易于维护、测试和扩展。通过统一的异常处理机制，可以确保应用程序提供一致的用户体验，同时便于问题排查和监控。

记住关键原则： **在合适的层级抛出异常，在统一的层级处理异常** 。