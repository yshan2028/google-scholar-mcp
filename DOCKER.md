# 🐳 Docker 部署指南

本项目支持 Docker 部署，完全兼容 PDF 项目的部署方式。

## 📋 快速开始

### 方法 1：使用 docker-compose（推荐）

```bash
# 1. 克隆或进入项目目录
cd Google-Scholar-MCP-Server

# 2. 复制环境变量（已预配置 API Keys）
cp env.example .env

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f

# 5. 停止服务
docker-compose down
```

### 方法 2：手动构建和运行

```bash
# 1. 构建镜像
docker build -t google-scholar-mcp:latest .

# 2. 运行容器
docker run -d \
  --name google-scholar-mcp \
  -e SCRAPINGDOG_API_KEY=your_scrapingdog_key_here \
  -e SERP_API_KEY=your_serpapi_key_here \
  google-scholar-mcp:latest

# 3. 查看日志
docker logs -f google-scholar-mcp

# 4. 停止容器
docker stop google-scholar-mcp

# 5. 删除容器
docker rm google-scholar-mcp
```

## 🔧 Dockerfile 说明

```dockerfile
FROM python:3.10-slim          # 基础镜像

WORKDIR /app                    # 工作目录

# 复制项目文件
COPY pyproject.toml ./
COPY uv.lock ./
COPY README.md ./
COPY google_scholar_server_api.py ./

# 安装依赖
RUN pip install --no-cache-dir uv && \
    uv pip install --system --no-cache-dir -e . && \
    pip uninstall -y uv

# 设置入口点
ENTRYPOINT ["google-scholar-mcp"]
```

**特点：**
- 使用 `python:3.10-slim` 最小化镜像大小
- 使用 `uv` 高效管理依赖
- 支持 setuptools 入口点
- 镜像大小：~500MB

## 📦 docker-compose.yml 说明

```yaml
version: '3.8'

services:
  google-scholar-mcp:
    build: .                              # 从本地 Dockerfile 构建
    container_name: google-scholar-mcp-server
    environment:
      - SCRAPINGDOG_API_KEY=${SCRAPINGDOG_API_KEY:-}
      - SERP_API_KEY=${SERP_API_KEY:-}
    restart: unless-stopped               # 自动重启
    stdin_open: true                      # 保持 stdin 打开
    tty: true                             # 分配伪终端
```

## 🔑 环境变量

在 `.env` 文件中设置：

```bash
SCRAPINGDOG_API_KEY=your_scrapingdog_key_here
SERP_API_KEY=your_serpapi_key_here
```

或在 `docker run` 时指定：

```bash
docker run -d \
  -e SCRAPINGDOG_API_KEY=your_key \
  -e SERP_API_KEY=your_key \
  google-scholar-mcp:latest
```

## 📊 常用命令

### 构建镜像

```bash
# 正常构建
docker build -t google-scholar-mcp:latest .

# 不使用缓存构建
docker build --no-cache -t google-scholar-mcp:latest .

# 构建特定版本
docker build -t google-scholar-mcp:v0.3.0 .
```

### 运行容器

```bash
# 后台运行
docker run -d --name google-scholar-mcp google-scholar-mcp:latest

# 前台运行（查看日志）
docker run -it google-scholar-mcp:latest

# 自动重启
docker run -d --restart=always google-scholar-mcp:latest

# 设置资源限制
docker run -d \
  --memory=512m \
  --cpus=1 \
  google-scholar-mcp:latest
```

### 查看日志

```bash
# 查看全部日志
docker logs google-scholar-mcp

# 实时查看日志
docker logs -f google-scholar-mcp

# 查看最后 100 行
docker logs --tail 100 google-scholar-mcp
```

### 容器管理

```bash
# 列出运行中的容器
docker ps

# 列出所有容器
docker ps -a

# 进入容器
docker exec -it google-scholar-mcp /bin/bash

# 停止容器
docker stop google-scholar-mcp

# 启动容器
docker start google-scholar-mcp

# 删除容器
docker rm google-scholar-mcp
```

### 镜像管理

```bash
# 列出镜像
docker images

# 删除镜像
docker rmi google-scholar-mcp:latest

# 标记镜像
docker tag google-scholar-mcp:latest myregistry.azurecr.io/google-scholar-mcp:latest

# 推送镜像
docker push myregistry.azurecr.io/google-scholar-mcp:latest
```

## 🚀 生产部署

### 使用 docker-compose 扩展

```yaml
version: '3.8'

services:
  google-scholar-mcp:
    build: .
    container_name: google-scholar-mcp-server
    environment:
      - SCRAPINGDOG_API_KEY=${SCRAPINGDOG_API_KEY}
      - SERP_API_KEY=${SERP_API_KEY}
    restart: always
    stdin_open: true
    tty: true
    # 日志配置
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    # 资源限制
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

### Kubernetes 部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: google-scholar-mcp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: google-scholar-mcp
  template:
    metadata:
      labels:
        app: google-scholar-mcp
    spec:
      containers:
      - name: google-scholar-mcp
        image: google-scholar-mcp:latest
        env:
        - name: SCRAPINGDOG_API_KEY
          valueFrom:
            secretKeyRef:
              name: google-scholar-secrets
              key: scrapingdog-key
        - name: SERP_API_KEY
          valueFrom:
            secretKeyRef:
              name: google-scholar-secrets
              key: serpapi-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
```

## 🛠️ 故障排除

### 容器无法启动

```bash
# 1. 查看错误日志
docker logs google-scholar-mcp

# 2. 检查镜像构建
docker build --no-cache -t google-scholar-mcp:latest .

# 3. 手动运行检查
docker run -it google-scholar-mcp:latest
```

### 依赖安装失败

```bash
# 重新构建，跳过缓存
docker build --no-cache -t google-scholar-mcp:latest .

# 检查 pyproject.toml 和 uv.lock
docker run -it python:3.10-slim bash
pip install uv
uv pip install -e .
```

### 内存不足

```bash
# 增加容器内存限制
docker run -d \
  --memory=1g \
  google-scholar-mcp:latest
```

## 📝 最佳实践

1. **使用版本标签**
   ```bash
   docker build -t google-scholar-mcp:v0.3.0 .
   docker build -t google-scholar-mcp:latest .
   ```

2. **安全性**
   - 使用非 root 用户运行
   - 定期更新基础镜像
   - 使用密钥管理系统存储 API Keys

3. **性能**
   - 使用 slim/alpine 基础镜像
   - 合理设置资源限制
   - 使用多阶段构建优化镜像

4. **监控**
   ```bash
   # 查看容器资源使用
   docker stats google-scholar-mcp
   ```

## 📚 相关文档

- [Docker 官方文档](https://docs.docker.com/)
- [docker-compose 文档](https://docs.docker.com/compose/)
- [Kubernetes 文档](https://kubernetes.io/docs/)

---

**Docker 部署就是这么简单！** 🚀
