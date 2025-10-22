# Google Scholar MCP Server

🔍 支持多平台的 Google Scholar MCP 服务器，专注于学术搜索和 BibTeX 引用补全。

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

简洁高效，只需一个 Python 文件：

```
google-scholar-mcp/
├── google_scholar_server_api.py   ⭐ 核心服务器（所有功能都在这里）
├── pyproject.toml                 # 依赖配置（使用 uv）
├── uv.lock                        # 依赖锁定文件
├── env.example                    # 环境变量示例
├── README.md                      # 文档
├── QUICK_START.md                 # 快速开始
└── test_simple.py                 # 简单测试脚本
```

**核心就是 `google_scholar_server_api.py` 这一个文件，包含：**
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

### 2. 配置 API Keys（可选）

```bash
# 复制配置文件
cp env.example .env

# 编辑 .env 文件，填入你的实际 API Keys
# 注意：.env 文件已在 .gitignore 中，不会被提交到 Git
nano .env
```

**安全性说明：**
- ✅ `env.example` - 示例配置（包含占位符，可以提交到 Git）
- ⚠️ `.env` - 实际配置（包含真实 keys，**不要提交到 Git**）
- ✅ `docker-compose.yml` - 使用环境变量占位符，安全
- `.env` 已添加到 `.gitignore`，不会被意外提交

**配置 API Keys 的方式：**

1. **本地开发**：编辑 `.env` 文件
   ```bash
   SCRAPINGDOG_API_KEY=your_actual_key
   SERP_API_KEY=your_actual_key
   ```

2. **Docker 部署**：创建 `.env` 后，docker-compose 会自动加载
   ```bash
   docker-compose up -d
   ```

3. **生产环境**：使用密钥管理系统（推荐）
   ```bash
   # 方法 1：环境变量
   export SCRAPINGDOG_API_KEY=your_key
   export SERP_API_KEY=your_key
   docker-compose up -d
   
   # 方法 2：Docker secrets (Swarm/Kubernetes)
   # 参考 DOCKER.md 中的生产部署示例
   ```

**已配置的 Keys：**
- ✅ **ScrapingDog API**: `your_scrapingdog_key_here` （优先级1）
- ✅ **SerpAPI**: `your_serpapi_key_here` （优先级2）
- ⚠️ 如无 Key，自动使用 scholarly 库（免费但较慢）

### 3. 运行服务器

```bash
python google_scholar_server_api.py
```

## 🐳 Docker 部署（可选）

### 快速启动（使用 docker-compose）

```bash
# 1. 复制环境变量
cp env.example .env

# 2. 启动容器
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 停止容器
docker-compose down
```

### 手动构建 Docker 镜像

```bash
# 构建镜像
docker build -t google-scholar-mcp:latest .

# 运行容器
docker run -d \
  --name google-scholar-mcp \
  -e SCRAPINGDOG_API_KEY=your_scrapingdog_key_here \
  -e SERP_API_KEY=your_serpapi_key_here \
  google-scholar-mcp:latest

# 查看日志
docker logs -f google-scholar-mcp

# 停止容器
docker stop google-scholar-mcp
```

**优点：**
- 无需本地安装 Python
- 环境隔离，避免依赖冲突
- 易于部署到服务器或云平台
- 支持 Kubernetes 等容器编排

## 📋 API 优先级

系统会自动选择最佳 API：

```
ScrapingDog API (最快) 
    ↓ 失败或无 Key
SerpAPI (快速)
    ↓ 失败或无 Key  
scholarly 库 (免费但较慢)
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
用户：帮我补全这篇论文的 BibTeX：Attention Is All You Need
AI：调用 search_paper_by_title(paper_title="Attention Is All You Need")
→ 返回完整 BibTeX 格式
```

#### 例子 3：年份过滤
```
用户：搜索 2020-2023 年间关于 transformer 的论文
AI：调用 search_google_scholar(query="transformer", year_start=2020, year_end=2023)
```

## 🔧 MCP 工具列表

### 主要工具

| 工具名 | 说明 | 返回 |
|--------|------|------|
| `search_google_scholar` | 学术搜索（支持关键词/DOI/标题） | 论文列表 |
| `search_paper_by_title` | BibTeX 补全 | BibTeX + RIS 格式 |
| `get_citation_info` | 获取引用信息 | 完整引用数据 |

### 额外工具

| 工具名 | 说明 |
|--------|------|
| `search_google_scholar_advanced` | 高级搜索（作者/年份过滤） |
| `search_google_scholar_by_author` | 按作者搜索 |
| `get_author_profile` | 获取作者资料 |

## ⚙️ 配置到 Claude Desktop / Cursor

### Claude Desktop (macOS)

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "python",
      "args": ["/Users/你的用户名/tools/Google-Scholar-MCP-Server/google_scholar_server_api.py"],
      "env": {
        "SCRAPINGDOG_API_KEY": "your_scrapingdog_key_here",
        "SERP_API_KEY": "your_serpapi_key_here"
      }
    }
  }
}
```

### Cursor

在 Cursor 设置中添加 MCP 服务器（Settings → MCP）

### Windows

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "C:\\Python\\python.exe",
      "args": [
        "C:\\Users\\你的用户名\\Google-Scholar-MCP-Server\\google_scholar_server_api.py"
      ],
      "env": {
        "SCRAPINGDOG_API_KEY": "your_scrapingdog_key_here",
        "SERP_API_KEY": "your_serpapi_key_here"
      }
    }
  }
}
```

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
  url = {https://arxiv.org/abs/1706.03762},
}
```

## 🧪 测试

运行测试脚本：

```bash
python test_simple.py
```

## 📝 依赖

使用 `uv` 管理，依赖项定义在 `pyproject.toml`：

- `mcp>=1.4.1` - MCP 协议支持
- `scholarly>=1.7.0` - Google Scholar 抓取（备用）
- `requests>=2.31.0` - HTTP 请求
- `google-search-results>=2.4.2` - SerpAPI 支持

## 🌐 API 提供商

### ScrapingDog
- 文档: https://docs.scrapingdog.com/google-scholar-api
- 特点: 速度快，返回 PDF 链接
- Key: ✅ 已配置

### SerpAPI
- 文档: https://serpapi.com/docs/google-scholar-api
- 特点: 稳定可靠
- Key: ✅ 已配置

### scholarly
- 文档: https://scholarly.readthedocs.io/
- 特点: 完全免费，无需 API Key

## 📚 使用场景

### 场景 1：写论文查文献
```
问：帮我找 5 篇 2020 年后关于 "deep learning" 的论文
```

### 场景 2：快速补全 BibTeX
```
问：补全这篇论文的 BibTeX：BERT Pre-training
```

### 场景 3：查询特定 DOI
```
问：查询 DOI 10.1038/nature14539 的论文信息
```

## ⚠️ 注意事项

1. **Google Scholar 没有官方 API**
   - ScrapingDog 和 SerpAPI 是第三方服务
   - scholarly 是开源抓取库

2. **自动故障转移**
   - 系统会自动选择可用的 API
   - 确保至少安装了 scholarly 库作为备用

## 🤝 贡献

欢迎提交 Pull Request！

## 📄 许可

MIT License

---

**简洁、高效、支持多平台** 🚀
