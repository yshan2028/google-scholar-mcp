# Google Scholar MCP Server

🔍 支持多平台的 Google Scholar MCP 服务器，专注于学术搜索和 BibTeX 引用补全。采用 uv 依赖管理和标准 Python 包结构。

## ✨ 核心功能

### 1. **学术搜索** - `search_google_scholar`
- 支持关键词、DOI、论文标题搜索
- 支持年份范围过滤
- 支持多 API 平台（ScrapingDog、SerpAPI、scholarly）
- 返回完整论文信息（标题、作者、年份、摘要、引用数、PDF 链接等）

### 2. **BibTeX 补全** - `search_paper_by_title`
- 通过论文标题获取完整 BibTeX 引用
- 自动生成标准 BibTeX 格式
- 生成 RIS 格式（备用）
- 支持多 API 平台自动转移

## 📂 项目结构

标准 Python 包结构，与 PDF MCP 项目一致：

```
google-scholar-mcp/
├── src/
│   └── google_scholar_mcp/
│       ├── __init__.py          # 包初始化
│       ├── __main__.py          # 命令行入口
│       └── server.py            # 核心 MCP 服务器（832 行）
├── pyproject.toml               # 项目配置（uv 管理）
├── uv.lock                      # 依赖锁定文件（79 个包）
├── Dockerfile                   # Docker 配置（Python 3.13）
├── docker-compose.yml           # Docker Compose 配置
├── .dockerignore                # Docker 忽略规则
├── env.example                  # 环境变量示例
├── LICENCE                      # MIT 许可证
└── README.md                    # 本文档
```

**核心功能集中在** `src/google_scholar_mcp/server.py`：
- 学术搜索功能
- BibTeX 补全功能
- 自动 API 选择（ScrapingDog → SerpAPI → scholarly）
- MCP 服务器实现

## 🚀 快速开始

### 1. 安装依赖（使用 uv）

```bash
# 使用 uv 安装依赖（推荐，比 pip 快）
uv sync
```

如果没有 uv，先安装：
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. 配置 API Keys（可选但推荐）

```bash
# 复制配置文件
cp env.example .env

# 编辑 .env 文件，填入你的实际 API Keys
nano .env
```

**获取 API Keys：**
- 📍 **ScrapingDog**：https://www.scrapingdog.com/（优先级1）
- 📍 **SerpAPI**：https://serpapi.com/dashboard（优先级2）
- 📍 **scholarly**：完全免费（自动备选）

**安全性说明：**
- ✅ `env.example` - 示例配置（可提交到 Git）
- ⚠️ `.env` - 实际配置（**不要提交到 Git**）
- ✅ `.env` 已添加到 `.gitignore`

### 3. 本地运行

```bash
# 方法 1：直接运行
python -m google_scholar_mcp

# 方法 2：使用 uv 运行
uv run python -m google_scholar_mcp
```

## 🐳 Docker 部署

### 快速启动

```bash
# 1. 编辑环境变量
cp env.example .env
nano .env  # 填入你的 API keys

# 2. 启动容器
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 停止容器
docker-compose down
```

### 手动构建

```bash
# 构建镜像
docker build -t google-scholar-mcp:latest .

# 运行容器
docker run -d \
  --name google-scholar-mcp \
  -e SCRAPINGDOG_API_KEY=your_key \
  -e SERP_API_KEY=your_key \
  google-scholar-mcp:latest

# 查看日志
docker logs -f google-scholar-mcp
```

## 📋 API 优先级

系统会自动选择最佳 API：

```
1. ScrapingDog API (最快，有 PDF 链接)
   ↓ 失败或无 Key
2. SerpAPI (快速，稳定)
   ↓ 失败或无 Key
3. scholarly 库 (完全免费，自动备选)
```

## 📦 使用示例

### 在 Claude/Cursor 中使用

#### 例子 1：搜索论文
```
用户：帮我搜索 5 篇关于 "machine learning" 的论文
AI：调用 search_google_scholar(query="machine learning", num_results=5)
```

#### 例子 2：获取 BibTeX
```
用户：补全这篇论文的 BibTeX：Attention Is All You Need
AI：调用 search_paper_by_title(paper_title="Attention Is All You Need")
→ 返回完整 BibTeX 格式
```

#### 例子 3：年份过滤
```
用户：搜索 2020-2023 年间关于 transformer 的论文
AI：调用 search_google_scholar(query="transformer", year_start=2020, year_end=2023)
```

## 🔧 MCP 工具列表

| 工具名 | 说明 | 返回 |
|--------|------|------|
| `search_google_scholar` | 学术搜索（关键词/DOI/标题） | 论文列表 |
| `search_paper_by_title` | BibTeX 补全 | BibTeX + RIS 格式 |
| `search_google_scholar_by_author` | 按作者搜索 | 论文列表 |
| `search_google_scholar_advanced` | 高级搜索（年份/作者过滤） | 论文列表 |
| `get_author_profile` | 获取作者资料 | 作者信息 |
| `get_citation_info` | 获取引用信息 | 完整引用数据 |

## ⚙️ 配置到 Claude Desktop / Cursor

### 🎯 三种部署方式

#### 方式 1️⃣：Docker - 直接输入 Key（最简单 ⭐⭐⭐）

**最简洁直接**的方式，所有配置信息在一个地方。

**Claude Desktop 配置：**
编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "SCRAPINGDOG_API_KEY=your_actual_scrapingdog_key",
        "-e", "SERP_API_KEY=your_actual_serpapi_key",
        "google-scholar-mcp-server-google-scholar-mcp:latest"
      ]
    }
  }
}
```

**Cursor 配置：**
编辑 `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "SCRAPINGDOG_API_KEY=your_actual_scrapingdog_key",
        "-e", "SERP_API_KEY=your_actual_serpapi_key",
        "google-scholar-mcp-server-google-scholar-mcp:latest"
      ]
    }
  }
}
```

**关键参数说明：**
- `run` - 运行容器
- `--rm` - 运行后自动删除容器
- `-i` - **交互模式**（重要！保持 stdin 打开，让客户端可以与容器通信）
- `-e KEY=VALUE` - 设置环境变量（重复多次设置多个变量）
- `google-scholar-mcp-server-google-scholar-mcp:latest` - Docker 镜像名称

**优点：**
- ✅ 简单直接
- ✅ 所有配置在一个地方
- ✅ 快速启动
- ✅ 本地使用无安全顾虑

**缺点：**
- ❌ Key 暴露在配置文件中（本地使用没问题，但不要分享或提交到 Git）

---

#### 方式 2️⃣：本地部署（推荐用于开发 ⭐⭐）

直接运行本地代码，最简单快速的方式。

**Claude Desktop 配置：**
```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "uv",
      "args": [
        "run",
        "--project", "/Users/liuyue/tools/Google-Scholar-MCP-Server",
        "python", "-m", "google_scholar_mcp"
      ],
      "env": {
        "SCRAPINGDOG_API_KEY": "your_actual_scrapingdog_key",
        "SERP_API_KEY": "your_actual_serpapi_key"
      }
    }
  }
}
```

**Cursor 配置：**
```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "uv",
      "args": [
        "run",
        "--project", "/Users/liuyue/tools/Google-Scholar-MCP-Server",
        "python", "-m", "google_scholar_mcp"
      ],
      "env": {
        "SCRAPINGDOG_API_KEY": "your_actual_scrapingdog_key",
        "SERP_API_KEY": "your_actual_serpapi_key"
      }
    }
  }
}
```

**Windows 配置：**
```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "uv",
      "args": [
        "run",
        "--project", "C:\\path\\to\\Google-Scholar-MCP-Server",
        "python", "-m", "google_scholar_mcp"
      ],
      "env": {
        "SCRAPINGDOG_API_KEY": "your_actual_scrapingdog_key",
        "SERP_API_KEY": "your_actual_serpapi_key"
      }
    }
  }
}
```

**优点：**
- ✅ 简单快速
- ✅ 易于调试
- ✅ 无需手动启动容器
- ✅ 代码变更立即生效

---

#### 方式 3️⃣：Docker - 使用 .env 文件（最安全 ⭐）

如果想用 Docker 但保持 Key 安全，使用 .env 文件分离配置。

**Claude Desktop 配置：**
```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--env-file", "/Users/liuyue/tools/Google-Scholar-MCP-Server/.env",
        "google-scholar-mcp-server-google-scholar-mcp:latest"
      ]
    }
  }
}
```

**Cursor 配置：**
```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--env-file", "/Users/liuyue/tools/Google-Scholar-MCP-Server/.env",
        "google-scholar-mcp-server-google-scholar-mcp:latest"
      ]
    }
  }
}
```

**注意：** 需要 .env 文件包含：
```env
SCRAPINGDOG_API_KEY=your_actual_key
SERP_API_KEY=your_actual_key
```

**优点：**
- ✅ 环境隔离
- ✅ Key 分离在 .env 文件
- ✅ 不会意外提交 Key
- ✅ 可重复性高
- ✅ 最安全

---

### 📝 配置文件位置

**Claude Desktop：**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

**Cursor：**
- macOS: `~/.cursor/mcp.json`
- Windows: `%USERPROFILE%\.cursor\mcp.json`

---

### 🚀 设置步骤

1. **打开配置文件**
   - Claude Desktop: `~/Library/Application Support/Claude/`
   - Cursor: 在 Cursor 中找到 `~/.cursor/mcp.json`

2. **选择部署方式** - 推荐顺序：
   - 🥇 **方式 1️⃣**（最简单）- Docker 直接输入 key
   - 🥈 **方式 2️⃣**（推荐开发）- 本地部署
   - 🥉 **方式 3️⃣**（最安全）- Docker + .env

3. **填入实际配置**
   - 替换 `your_actual_scrapingdog_key` 为你的真实 key
   - 替换 `your_actual_serpapi_key` 为你的真实 key
   - Windows 用户记得修改路径

4. **保存文件**
   - Claude Desktop: 直接保存
   - Cursor: 直接保存

5. **重启客户端**
   - 重启 Claude Desktop 或 Cursor

6. **验证** - 应该能在工具列表中看到 `google-scholar` ✅

---

### 🧪 快速测试

**测试 Docker 直接输入方式：**
```bash
docker run --rm -i \
  -e SCRAPINGDOG_API_KEY=68f7e36631dee34ec17cc68e \
  -e SERP_API_KEY=39df2078c6ca4a05643a71d9c6c021e151b94bb1de3e45bae32ca1f56a266f04 \
  google-scholar-mcp-server-google-scholar-mcp:latest
```

**测试本地部署方式：**
```bash
uv run --project /Users/liuyue/tools/Google-Scholar-MCP-Server python -m google_scholar_mcp
```

**测试 Docker .env 方式：**
```bash
docker run --rm -i --env-file /Users/liuyue/tools/Google-Scholar-MCP-Server/.env \
  google-scholar-mcp-server-google-scholar-mcp:latest
```

所有方式应该都显示初始化日志，然后阻塞等待输入。

---

### ⚠️ 常见问题

**Q: 工具在 Claude/Cursor 中不出现？**

A: 检查以下几点：
1. JSON 格式是否正确（使用 JSON 验证工具检查）
2. Docker 镜像名称是否正确：`docker images | grep google-scholar`
3. 是否重启了客户端
4. Claude Desktop 日志：`~/Library/Logs/Claude/`
5. Cursor 日志：在 Cursor 中打开 Output 查看 MCP 相关信息

**Q: Docker 镜像名称是什么？**

A: 查看你的镜像：
```bash
docker images | grep google-scholar
```

可能是：
- `google-scholar-mcp-server-google-scholar-mcp:latest` （完整名称）
- `google-scholar-mcp:latest` （简化名称）

**Q: 可以同时配置多个 MCP 服务吗？**

A: 可以，在 `mcpServers` 中添加多个服务器：
```json
{
  "mcpServers": {
    "google-scholar": { ... },
    "pdf-reader": { ... },
    "other-service": { ... }
  }
}
```

**Q: Key 安全吗？**

A:
- 方式 1️⃣ - 本地使用没问题，但不要分享配置文件
- 方式 2️⃣ - 和方式 1️⃣ 一样（Key 在配置文件中）
- 方式 3️⃣ - 最安全（Key 在 .env 文件中，可以 .gitignore）

---

### 📚 相关文档

- `README.md` - 项目主文档（当前文件）
- `docker-compose.yml` - Docker Compose 配置

## 📊 返回数据格式

### 搜索结果示例

```json
{
  "title": "Attention Is All You Need",
  "authors": "A Vaswani, N Shazeer, N Parmar, ...",
  "year": "2017",
  "venue": "Advances in Neural Information Processing Systems",
  "abstract": "The dominant sequence transduction models...",
  "citations": 95847,
  "url": "https://arxiv.org/abs/1706.03762",
  "pdf_link": "https://arxiv.org/pdf/1706.03762.pdf",
  "source": "ScrapingDog"
}
```

### BibTeX 结果示例

```bibtex
@inproceedings{Vaswani2017,
  title = {Attention Is All You Need},
  author = {A Vaswani, N Shazeer, N Parmar, J Uszkoreit, L Jones, AN Gomez, Ł Kaiser, I Polosukhin},
  year = {2017},
  booktitle = {Advances in Neural Information Processing Systems},
  volume = {30},
  url = {https://arxiv.org/abs/1706.03762}
}
```

## 📝 依赖

使用 `uv` 管理，依赖项定义在 `pyproject.toml`：

- `mcp>=1.4.1` - MCP 协议支持
- `scholarly>=1.7.0` - Google Scholar 抓取（备用）
- `requests>=2.31.0` - HTTP 请求
- `google-search-results>=2.4.2` - SerpAPI 支持

## 🌐 API 提供商

### ScrapingDog
- 文档：https://docs.scrapingdog.com/google-scholar-api
- 特点：速度快，返回 PDF 链接
- 优先级：1（最高）

### SerpAPI
- 文档：https://serpapi.com/docs/google-scholar-api
- 特点：稳定可靠
- 优先级：2（次高）

### scholarly
- 文档：https://scholarly.readthedocs.io/
- 特点：完全免费，无需 API Key
- 优先级：3（备选）

## 📚 使用场景

### 场景 1：写论文查文献
```
用户：帮我找 5 篇 2020 年后关于 "deep learning" 的论文
```

### 场景 2：快速补全 BibTeX
```
用户：补全这篇论文的 BibTeX：BERT Pre-training
```

### 场景 3：查询特定 DOI
```
用户：查询 DOI 10.1038/nature14539 的论文信息
```

## ⚠️ 注意事项

1. **Google Scholar 没有官方 API**
   - ScrapingDog 和 SerpAPI 是第三方服务
   - scholarly 是开源抓取库

2. **自动故障转移**
   - 系统会自动选择可用的 API
   - 确保至少安装了 scholarly 库作为备用

3. **Docker 环境**
   - 基于 Python 3.13-slim
   - 包含 poppler-utils 用于 PDF 处理
   - 自动从 `.env` 加载配置

## 🤝 贡献

欢迎提交 Pull Request！

## 📄 许可

MIT License

---

**简洁、高效、标准结构** ✨

采用与 PDF MCP 一致的最佳实践，使用 uv 依赖管理，Docker 完全支持。
