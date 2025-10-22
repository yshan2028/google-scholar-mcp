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

### Claude Desktop (macOS)

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`:

#### 方案 1️⃣：使用 uv 管理（推荐 ⭐）

最可靠和最快速的方式，使用 `uv.lock` 确保依赖版本一致：

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "uv",
      "args": ["run", "--project", "/Users/liuyue/tools/Google-Scholar-MCP-Server", "python", "-m", "google_scholar_mcp"],
      "env": {
        "SCRAPINGDOG_API_KEY": "your_actual_scrapingdog_key",
        "SERP_API_KEY": "your_actual_serpapi_key"
      }
    }
  }
}
```

#### 方案 2️⃣：使用 Python 直接运行

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "/Users/liuyue/.pyenv/shims/python3",
      "args": ["-m", "google_scholar_mcp"],
      "env": {
        "SCRAPINGDOG_API_KEY": "your_actual_scrapingdog_key",
        "SERP_API_KEY": "your_actual_serpapi_key",
        "PYTHONPATH": "/Users/liuyue/tools/Google-Scholar-MCP-Server/src"
      }
    }
  }
}
```

**注意：** 需要确保依赖已安装（`uv sync` 或 `pip install -r requirements.txt`）

### Windows

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "uv",
      "args": ["run", "--project", "C:\\path\\to\\Google-Scholar-MCP-Server", "python", "-m", "google_scholar_mcp"],
      "env": {
        "SCRAPINGDOG_API_KEY": "your_actual_scrapingdog_key",
        "SERP_API_KEY": "your_actual_serpapi_key"
      }
    }
  }
}
```

将 `C:\path\to\Google-Scholar-MCP-Server` 替换为实际路径。

### Cursor

在 Cursor 设置中添加 MCP 服务器：
1. 打开 Settings → MCP
2. 点击 "Add MCP Server"
3. 选择 "Local"
4. 使用上述配置

### Docker 方式（可选）

如果你使用 Docker 部署：

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "docker",
      "args": ["run", "--rm", "-e", "SCRAPINGDOG_API_KEY=your_actual_key", "-e", "SERP_API_KEY=your_actual_key", "google-scholar-mcp:latest"]
    }
  }
}
```

### 验证配置

重启 Claude Desktop 后，应该能在工具列表中看到 `google-scholar` 工具可用。

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
