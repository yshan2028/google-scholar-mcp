# 🚀 Google Scholar MCP Server - v2.0.0 发布

## 📦 发布内容

### ✨ 主要功能
- **Google Scholar API 集成** - 支持论文搜索、作者查询、BibTeX 条目补全
- **多源 API 支持** - ScrapingDog → SerpAPI → scholarly（三级降级）
- **完整数据返回** - 25+ 个字段，包括完整摘要、所有 PDF 链接、引用信息
- **BibTeX 生成** - 支持 18+ 个字段的完整条目生成
- **Docker 部署** - 支持本地部署和 Docker 容器化

### 🎯 核心功能特性

#### 1️⃣ 论文搜索与查询
- 按标题、DOI、关键词精确查询
- 返回完整的论文信息和元数据
- 支持分页结果

#### 2️⃣ 完整数据结构
```json
{
  "title": "论文标题",
  "abstract": "完整摘要（不截断）",
  "authors": {
    "display": "显示格式",
    "list": [{"name": "...", "profile_link": "...", "author_id": "..."}]
  },
  "publication": {"venue": "期刊/会议", "year": "年份"},
  "links": {"paper": "...", "pdf": "...", "pdf_all": [...]},
  "citations": {"count": 1000, "total_text": "Cited by 1000", "link": "..."},
  "versions": {"total": "70", "link": "...", "cluster_id": "..."},
  "metadata": {"source": "ScrapingDog", "has_pdf": true}
}
```

#### 3️⃣ BibTeX 条目生成
支持字段：
- `author`, `title`, `journal`/`booktitle`, `year`, `month`
- `volume`, `number`, `pages`, `publisher`
- `doi`, `url`, `abstract`, `note`
- `eprint`, `archivePrefix`, `primaryClass` (arXiv)

#### 4️⃣ API 优先级
1. **ScrapingDog** - 最快最稳定（推荐）
2. **SerpAPI** - 备选方案
3. **scholarly** - 免费备用

---

## 📋 项目结构

```
Google-Scholar-MCP-Server/
├── src/
│   └── google_scholar_mcp/
│       ├── __init__.py
│       ├── __main__.py
│       └── server.py (核心逻辑)
├── Dockerfile          # Docker 镜像定义
├── docker-compose.yml  # 容器编排
├── pyproject.toml      # 项目配置 (uv)
├── uv.lock             # 依赖锁定
├── README.md           # 使用文档
├── EPHEMERAL_MODE.md   # 临时容器说明
└── test_*.py           # 测试脚本
```

---

## 🚀 快速开始

### 方式 1: 本地部署 (推荐开发)

```bash
# 1. 配置 API Keys
cp env.example .env
# 编辑 .env 填入实际的 API keys:
# SCRAPINGDOG_API_KEY=your_key
# SERP_API_KEY=your_key

# 2. 安装依赖
pip install uv
uv venv
source .venv/bin/activate
uv sync

# 3. 启动服务
python -m google_scholar_mcp
```

### 方式 2: Docker 部署 (生产推荐)

```bash
# 1. 配置环境变量
export SCRAPINGDOG_API_KEY="your_key"
export SERP_API_KEY="your_key"

# 2. 启动容器
docker-compose up -d

# 3. Claude Desktop 配置
在 ~/.claude/config.json 中：
{
  "mcpServers": {
    "google-scholar": {
      "command": "docker",
      "args": ["run", "--rm", "-i",
        "-e", "SCRAPINGDOG_API_KEY=your_key",
        "-e", "SERP_API_KEY=your_key",
        "google-scholar-mcp:latest"]
    }
  }
}
```

### 方式 3: 临时容器 (一次性查询)

```bash
docker-compose --profile ephemeral up
# 查询完成后自动销毁
```

---

## 🔧 配置

### 环境变量
```bash
SCRAPINGDOG_API_KEY     # ScrapingDog API 密钥（优先）
SERP_API_KEY            # SerpAPI 密钥（备选）
```

### 获取 API Keys
- **ScrapingDog**: https://www.scrapingdog.com/
- **SerpAPI**: https://serpapi.com/

---

## 📚 使用示例

### Claude Desktop 中调用

```python
# 按标题搜索
search_paper_by_title("Attention Is All You Need")

# 按作者查询
search_author_profile("Geoffrey Hinton")

# 补全 BibTeX
get_citation_info("Your Paper Title")
```

### 返回数据示例

```json
{
  "title": "Attention Is All You Need",
  "authors": "A Vaswani, N Shazeer, ...",
  "year": "2017",
  "venue": "NeurIPS",
  "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks in an encoder-decoder configuration. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train. Our model achieves 28.4 BLEU on the WMT 2014 English-to-German translation task, improving over the existing best results, including ensembles, by over 2 BLEU. On the WMT 2014 English-to-French translation task, our model establishes a new single-model state-of-the-art BLEU score of 41.8 after training for 3.5 days on eight P100 GPUs, a small fraction of the training costs of the best models from the literature. We can benefit from larger trained models by applying code-switching to our attention mechanism.",
  "bibtex": "@article{vaswani_2017,\n  author = {A Vaswani, N Shazeer, ...},\n  title = {Attention Is All You Need},\n  journal = {Advances in neural information processing systems},\n  year = {2017},\n  url = {...},\n  abstract = {The dominant sequence...\n}\n"
}
```

---

## 🔍 主要改进（vs v1.0）

| 功能 | v1.0 | v2.0 |
|------|------|------|
| 返回字段 | ~8 个 | **25+ 个** ✓ |
| 摘要截断 | 是 | **否** ✓ |
| BibTeX 字段 | ~10 个 | **18+ 个** ✓ |
| 作者信息 | 仅显示 | **完整列表** ✓ |
| PDF 链接 | 仅首个 | **全部** ✓ |
| DOI 支持 | 无 | **有** ✓ |
| eprint 支持 | 无 | **有** ✓ |
| 依赖管理 | pip | **uv** ✓ |
| 多源 API | SerpAPI | **三级降级** ✓ |

---

## 📖 文档

- **README.md** - 完整使用指南和 API 文档
- **EPHEMERAL_MODE.md** - 临时容器部署说明
- **AUTO_CLEANUP_GUIDE.md** - 容器清理指南

---

## 🐛 已知问题 & 解决方案

### 问题 1: scholarly 触发验证码
**解决**: 默认优先使用 ScrapingDog，scholarly 作为备用免费方案

### 问题 2: Docker 容器未自动销毁
**解决**: 使用 `--profile ephemeral` 或 `docker run --rm` 启动

### 问题 3: API 返回结果为空
**解决**: 检查 API 密钥是否正确，或切换到其他 API

---

## 🔐 安全性

- ✅ API 密钥存储在 `.env` 文件（Git 忽略）
- ✅ Docker 支持从环境变量传入密钥
- ✅ 不在代码中硬编码密钥
- ✅ `.dockerignore` 排除敏感文件

---

## 📝 更新日志

### v2.0.0 (2025-10-23)
- ✨ 完整数据结构设计（25+ 字段）
- ✨ 完整摘要返回（不截断）
- ✨ 增强 BibTeX 生成（18+ 字段）
- 🔧 迁移到 `uv` 包管理
- 🐳 改进 Docker 部署流程
- 📚 完善文档和示例

---

## 🙏 致谢

感谢 ScrapingDog、SerpAPI 和 scholarly 社区的支持！

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎提交 PR 和 Issue！

---

**准备好发布了吗？🚀**

