# 🔐 安全性说明

## ⚠️ API Key 管理

本项目处理敏感的 API 密钥。请遵循以下安全最佳实践。

## 📋 文件说明

### ✅ 安全的文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `env.example` | ✅ 安全 | 示例配置，包含占位符，**可以**提交到 Git |
| `.gitignore` | ✅ 安全 | 已配置忽略 `.env` 文件 |
| `docker-compose.yml` | ✅ 安全 | 使用环境变量占位符 `${VAR}` |
| `Dockerfile` | ✅ 安全 | 不包含任何硬编码的 keys |
| `README.md` | ✅ 安全 | 仅包含示例说明，不含真实 keys |

### ⚠️ 敏感文件

| 文件 | 状态 | 说明 |
|------|------|------|
| `.env` | ⚠️ 敏感 | 包含真实 API keys，**不要**提交到 Git |
| `.env.local` | ⚠️ 敏感 | 本地覆盖配置，**不要**提交到 Git |

## 🛡️ 使用 API Key 的最佳实践

### 1. 开发环境

```bash
# 1. 复制示例配置
cp env.example .env

# 2. 编辑 .env，填入你的真实 API keys
nano .env

# 3. 验证 .env 不在 git 中
git status  # 确保 .env 不显示

# 4. 运行项目
python google_scholar_server_api.py
```

### 2. Docker 本地部署

```bash
# 1. 创建 .env 文件（包含真实 keys）
cp env.example .env
nano .env

# 2. docker-compose 会自动加载 .env
docker-compose up -d

# 3. 验证
docker-compose logs
```

### 3. 生产环境（Docker）

**推荐方式：使用环境变量**

```bash
# 方法 1：通过环境变量启动
export SCRAPINGDOG_API_KEY=your_actual_key
export SERP_API_KEY=your_actual_key
docker-compose up -d

# 方法 2：使用 .env 文件（仍然安全）
cp env.example .env
# 编辑 .env 添加真实 keys
docker-compose up -d
```

### 4. 生产环境（Kubernetes）

使用 Kubernetes Secrets：

```bash
# 创建 secret
kubectl create secret generic google-scholar-secrets \
  --from-literal=scrapingdog-key=your_actual_key \
  --from-literal=serpapi-key=your_actual_key

# 在部署中引用
# 参考 DOCKER.md 中的 Kubernetes 配置示例
```

## 🔒 安全检查清单

部署前请检查：

- [ ] `.env` 文件已创建并填入真实 keys
- [ ] `.env` **不在** git 提交历史中
- [ ] `env.example` **只包含**示例占位符
- [ ] 所有文档中的 API key 都是示例（`your_*_key_here`）
- [ ] 没有硬编码的 keys 在代码中
- [ ] `.gitignore` 包含 `.env` 和 `.env.local`
- [ ] 生产环境使用密钥管理系统

## 🚨 如果 API Key 被泄露

**立即操作：**

1. **撤销泄露的 key**
   - ScrapingDog: https://www.scrapingdog.com/
   - SerpAPI: https://serpapi.com/

2. **生成新的 key**
   - 在各服务的 Dashboard 生成新 key

3. **更新配置**
   ```bash
   # 编辑 .env
   nano .env  # 更新新的 key
   
   # 重启服务
   docker-compose restart
   ```

4. **检查日志**
   ```bash
   docker-compose logs | grep ERROR
   ```

## 📚 参考

- [Docker 环境变量最佳实践](https://docs.docker.com/compose/env-file/)
- [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [OWASP 密钥管理](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**安全第一！** 🔐
