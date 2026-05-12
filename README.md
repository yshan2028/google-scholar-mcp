# Google Scholar MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue)](https://www.python.org/downloads/)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/Q5Q81N7WMO)

**[English](README.md)** | **[中文文档](README_ZH.md)**

An MCP server for academic paper search and BibTeX citation completion using Google Scholar. Supports multiple APIs with automatic fallback (ScrapingDog → scholarly).

## Features

- 📚 Search papers by title, DOI, or keywords
- 📖 Generate complete BibTeX entries with 18+ fields
- 👥 Get author profiles and publication history
- 🔗 Multiple API sources with automatic fallback
- ⚡ Returns 25+ fields including full abstracts and all PDF links
- 🐳 Production-ready Docker support

## Quick Start

### Installation

```bash
# Install uv if needed
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install dependencies
uv sync
```

### Configuration

```bash
# Copy example config
cp env.example .env

# Edit and add your API keys
nano .env
```

**Get API Keys:**
- [ScrapingDog](https://www.scrapingdog.com/) (recommended)
- scholarly (built-in, free)

### Run Locally

```bash
# Direct run
python -m google_scholar_mcp

# Or with uv
uv run python -m google_scholar_mcp
```

## Docker

### Build and Run

```bash
docker build -t google-scholar-mcp .
docker run --rm -it \
  -e SCRAPINGDOG_API_KEY=your_key \
  google-scholar-mcp
```

### Using docker-compose

```bash
cp env.example .env
nano .env

docker-compose up -d
docker-compose logs -f
docker-compose down
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `search_google_scholar` | Search papers by keyword/DOI/title |
| `search_paper_by_title` | Get BibTeX entry for a paper |
| `search_google_scholar_by_author` | Search papers by author |
| `search_google_scholar_advanced` | Advanced search with filters |
| `get_author_profile` | Get author information |
| `get_citation_info` | Get citation details |

## Configuration

See [CONFIGURATION.md](CONFIGURATION.md) for detailed setup instructions for:
- Claude Desktop / Cursor integration (3 methods)
- Docker configuration options
- Environment variables
- Troubleshooting

## Examples

### Search Papers

```
User: Find papers about "transformer" from 2020-2023
MCP: Calls search_google_scholar(query="transformer", year_start=2020, year_end=2023)
```

### Get BibTeX

```
User: Generate BibTeX for "Attention Is All You Need"
MCP: Calls search_paper_by_title(paper_title="Attention Is All You Need")
→ Returns complete BibTeX entry with 18+ fields
```

## Response Format

### Paper Search Result

```json
{
  "title": "Attention Is All You Need",
  "authors": {
    "display": "A Vaswani, N Shazeer, ...",
    "list": [{"name": "...", "profile_link": "...", "author_id": "..."}]
  },
  "year": "2017",
  "venue": "NeurIPS",
  "abstract": "Full abstract text (not truncated)...",
  "citations": {"count": 95847, "link": "..."},
  "links": {"paper": "...", "pdf": "...", "pdf_all": [...]},
  "metadata": {"source": "ScrapingDog", "has_pdf": true}
}
```

### BibTeX Entry

```bibtex
@article{vaswani_2017,
  author = {A Vaswani, N Shazeer, ...},
  title = {Attention Is All You Need},
  journal = {Advances in Neural Information Processing Systems},
  year = {2017},
  url = {https://...},
  abstract = {Full abstract...}
}
```