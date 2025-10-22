# Google Scholar MCP 服务器

🔍 支持多平台的 Google Scholar MCP 服务器，专注于学术搜索和 BibTeX 引用补全。采用 uv 依赖管理和标准 Python 包结构。

**[English](README.md)** | **[中文文档](README_ZH.md)** (当前页面)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Q5Q81N7WMO)

## ✨ 核心功能

- 📚 **学术搜索** - 按标题、DOI、关键词搜索论文
- 📖 **BibTeX 补全** - 从论文标题自动生成完整 BibTeX 条目
- 👥 **作者信息** - 获取作者资料和发表历史
- 🔗 **多源 API** - ScrapingDog → scholarly (自动降级)
- 🐳 **Docker 就绪** - 生产级容器化部署
- ⚡ **功能完整** - 返回 25+ 个字段，包括完整摘要、所有 PDF、引用数

## 📂 项目结构

```
src/
├── google_scholar_mcp/
│   ├── __init__.py              # 包初始化
│   ├── __main__.py              # CLI 入口
│   └── server.py                # 核心 MCP 服务器 (968 行)
├── Dockerfile                   # Docker 镜像
├── docker-compose.yml           # Docker Compose 配置
├── pyproject.toml               # 项目配置 (uv)
├── uv.lock                      # 依赖锁定文件
├── env.example                  # 环境变量示例
├── RELEASE_NOTES.md             # 发布说明
└── README.md / README_ZH.md     # 文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 如果没有 uv，先安装
curl -LsSf https://astral.sh/uv/install.sh | sh

# 安装依赖
uv sync
```

### 2. 配置 API Keys (可选)

```bash
# 复制配置文件
cp env.example .env

# 编辑并填入你的 API keys
nano .env
```

**获取 API Keys：**
- **ScrapingDog** (推荐): https://www.scrapingdog.com/
- **scholarly** (免费): 内置，无需 Key

### 3. 本地运行

```bash
# 直接运行
python -m google_scholar_mcp

# 或使用 uv
uv run python -m google_scholar_mcp
```

## 🐳 Docker 部署

### 使用 docker-compose (推荐)

```bash
# 配置环境
cp env.example .env
nano .env  # 填入 API keys

# 启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 手动 Docker

```bash
# 构建镜像
docker build -t google-scholar-mcp:latest .

# 运行容器
docker run -d \
  --name google-scholar-mcp \
  -e SCRAPINGDOG_API_KEY=your_key \
  google-scholar-mcp:latest

# 查看日志
docker logs -f google-scholar-mcp
```

## 🔌 配置到 Claude Desktop / Cursor

### 配置方式

#### 方式 1️⃣：Docker 直接输入 Key (最简单 ⭐⭐⭐)

**Claude Desktop** - 编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "SCRAPINGDOG_API_KEY=your_key",
        "google-scholar-mcp:latest"
      ]
    }
  }
}
```

**Cursor** - 编辑 `~/.cursor/mcp.json` (配置相同)

#### 方式 2️⃣：本地部署 (推荐开发 ⭐⭐)

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "uv",
      "args": [
        "run",
        "--project", "/path/to/Google-Scholar-MCP-Server",
        "python", "-m", "google_scholar_mcp"
      ],
      "env": {
        "SCRAPINGDOG_API_KEY": "your_key",
        "SERP_API_KEY": "your_key"
      }
    }
  }
}
```

#### 方式 3️⃣：Docker + .env 文件 (最安全 ⭐)

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "--env-file", "/path/to/.env",
        "google-scholar-mcp:latest"
      ]
    }
  }
}
```

**关键参数说明：**
- `--rm` - 运行后自动删除容器
- `-i` - **交互模式** (保持 stdin 打开，用于 MCP 通信)
- `-e KEY=VALUE` - 设置环境变量

## 📚 API 工具列表

| 工具 | 说明 | 返回 |
|------|------|------|
| `search_google_scholar` | 按关键词/DOI/标题搜索 | 论文列表 |
| `search_paper_by_title` | BibTeX 补全 | BibTeX + 完整数据 |
| `search_google_scholar_by_author` | 按作者搜索 | 论文列表 |
| `search_google_scholar_advanced` | 高级搜索 (年份/作者过滤) | 论文列表 |
| `get_author_profile` | 获取作者信息 | 作者数据 |
| `get_citation_info` | 获取引用信息 | 引用数据 |

## 📋 API 优先级

系统自动选择最佳 API：

```
1. ScrapingDog API (最快，包含 PDF 链接)
   ↓ 失败或无 Key
2. scholarly 库 (完全免费)
```

## 📊 响应数据示例

### 搜索结果

```json
{
  "title": "Attention Is All You Need",
  "authors": {
    "display": "A Vaswani, N Shazeer, ...",
    "list": [
      {"name": "Ashish Vaswani", "profile_link": "...", "author_id": "..."}
    ]
  },
  "year": "2017",
  "venue": "NeurIPS",
  "abstract": "完整摘要 (不截断)...",
  "citations": {
    "count": 95847,
    "total_text": "Cited by 95847",
    "link": "..."
  },
  "links": {
    "paper": "https://...",
    "pdf": "https://...",
    "pdf_all": ["..."]
  },
  "metadata": {
    "source": "ScrapingDog",
    "has_pdf": true
  }
}
```

### BibTeX 示例

```bibtex
@article{vaswani_2017,
  author = {A Vaswani, N Shazeer, ...},
  title = {Attention Is All You Need},
  journal = {Advances in Neural Information Processing Systems},
  year = {2017},
  url = {https://...},
  abstract = {完整摘要...}
}
```

## 🔧 配置

### 环境变量

```bash
SCRAPINGDOG_API_KEY     # ScrapingDog API 密钥 (优先级 1)
```

### 安全性

- ✅ `env.example` - 可以提交到 Git
- ⚠️ `.env` - 不要提交 (已在 .gitignore 中)
- ✅ API 密钥只从环境变量读取

## 📖 使用示例

### 在 Claude/Cursor 中

```
用户：搜索 2020-2023 年间关于 "transformer" 的论文
AI：调用 search_google_scholar(query="transformer", year_start=2020, year_end=2023)
```

```
用户：补全 "Attention Is All You Need" 的 BibTeX
AI：调用 search_paper_by_title(paper_title="Attention Is All You Need")
→ 返回完整 BibTeX 条目
```

## ⚠️ 故障排查

### Q: Claude/Cursor 中看不到工具？

**A:** 检查以下几点：
1. JSON 格式是否正确 (使用 JSON 验证工具)
2. Docker 镜像名称：`docker images | grep google-scholar`
3. 是否重启了 Claude/Cursor
4. 查看日志：
   - Claude: `~/Library/Logs/Claude/`
   - Cursor: Output 面板 → MCP

### Q: Docker 镜像名称是什么？

**A:**
```bash
docker images | grep google-scholar
```

可能是：
- `google-scholar-mcp:latest`
- `google-scholar-mcp-server-google-scholar-mcp:latest`

### Q: API 返回空结果？

**A:**
1. 检查 API 密钥是否正确
2. 尝试另一个 API 方法
3. 检查网络连接
4. 某些查询可能确实没有结果

## 📦 依赖

由 `uv` 在 `pyproject.toml` 中管理：

- `mcp>=1.4.1` - MCP 协议
- `scholarly>=1.7.0` - Google Scholar 抓取
- `requests>=2.31.0` - HTTP 客户端
- `python-dotenv>=1.0.0` - 环境加载

## 🌐 API 提供商

### ScrapingDog
- 文档: https://docs.scrapingdog.com/google-scholar-api
- 特点: 速度快，包含 PDF 链接
- 优先级: 1 (最高)

### scholarly
- 文档: https://scholarly.readthedocs.io/
- 特点: 完全免费
- 优先级: 2 (备选)

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Pull Request！

---

**简洁 • 高效 • 标准结构** ✨

查看 [RELEASE_NOTES.md](RELEASE_NOTES.md) 了解版本历史和改进。
