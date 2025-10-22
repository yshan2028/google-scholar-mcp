# 🚀 生产环境部署指南

## 安全部署步骤

### 第 1 步：准备你的 API Keys

在部署前，你需要拥有：

1. **ScrapingDog API Key**
   - 访问：https://www.scrapingdog.com/
   - 登录你的账户
   - 在 Dashboard 获取你的 API Key

2. **SerpAPI Key**（可选但推荐）
   - 访问：https://serpapi.com/
   - 登录你的账户
   - 在 Dashboard 获取你的 API Key

### 第 2 步：创建本地 .env 文件

**只在你的本地机器上执行这步！**

```bash
cd Google-Scholar-MCP-Server

# 复制示例文件
cp env.example .env

# 编辑 .env，填入你的真实 keys
nano .env
# 或使用你喜欢的编辑器
```

编辑后的 `.env` 内容应该是：
```bash
SCRAPINGDOG_API_KEY=你的真实key
SERP_API_KEY=你的真实key
```

### 第 3 步：验证安全性

```bash
# 确保 .env 不在 git 中
git status
# 应该看不到 .env 文件

# 验证 .env 在 .gitignore 中
grep ".env" .gitignore
# 应该看到 .env
```

### 第 4 步：测试配置

**本地测试：**
```bash
# 测试 .env 是否正确加载
docker-compose config | grep SCRAPINGDOG_API_KEY
```

### 第 5 步：部署

**本地 Docker：**
```bash
docker-compose up -d
docker-compose logs -f
```

**生产服务器：**
```bash
# 方式 1：使用 .env 文件（如果服务器是你信任的）
scp .env user@server:/path/to/project/
ssh user@server
cd /path/to/project
docker-compose up -d

# 方式 2：使用环境变量（更安全）
ssh user@server
export SCRAPINGDOG_API_KEY=your_key
export SERP_API_KEY=your_key
cd /path/to/project
docker-compose up -d
```

## ⚠️ 安全检查清单

部署前必须检查：

- [ ] `.env` 文件已创建并填入真实 keys
- [ ] `.env` 在 `.gitignore` 中
- [ ] `.env` 不在 git 提交历史中
- [ ] 没有在代码中硬编码任何 keys
- [ ] 已验证 `.env` 正确加载
- [ ] 已在本地成功测试
- [ ] 如果部署到公共服务器，使用密钥管理系统

## 🚨 关键提醒

**千万不要：**
- ❌ 提交 `.env` 到 Git
- ❌ 把真实 keys 放在代码中
- ❌ 把 `.env` 文件分享给别人
- ❌ 在公共 GitHub 上暴露 keys

## 📝 文件清单

你需要做的只有 3 步：

1. 拥有你的真实 API keys
2. 本地创建 `.env` 文件
3. 运行 `docker-compose up -d`

就这么简单！

---

**安全部署从你的本地机器开始！** 🔐
