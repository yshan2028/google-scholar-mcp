# Google Scholar MCP Server

An MCP (Model Context Protocol) server for searching Google Scholar. Provides academic paper search, author profiles, article citation data, and downloadable citation formats via Scrapingdog API.

## Features

- Search academic papers by keyword, title, or author
- Search for Google Scholar author profiles by name
- Get detailed author information including publications, h-index, and i10-index
- Retrieve citation metadata (BibTeX, EndNote, RefMan, RefWorks) for any article
- Supports advanced filters: year range, citation search, cluster search, language, patent inclusion, and more
- Docker-ready for easy deployment

## Prerequisites

- Node.js >= 18
- Docker (for containerized deployment)
- A [Scrapingdog API key](https://app.scrapingdog.com/dashboard)

## Quick Start

### Local Development

```bash
cd server
npm install
npm run build
SCRAPINGDOG_API_KEY=your_key npm start
```

The server starts on **port 3005** by default. Set `PORT` env var to change.

### Docker

```bash
docker build -t google-scholar-mcp -f server/Dockerfile .
docker run --rm -e SCRAPINGDOG_API_KEY=your_key google-scholar-mcp
```

Or with docker-compose:

```bash
# Copy and edit environment
cp .env.example .env
# Add your SCRAPINGDOG_API_KEY to .env

docker-compose up -d
docker-compose logs -f
docker-compose down
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `search_google_scholar` | Search Google Scholar for papers by keyword, DOI, or title. Supports filters: author, year range, citation search, cluster search, language, patents, review-only. |
| `search_author_profiles` | Find Google Scholar author profiles by name. Returns affiliations, email verification status, total citations, and research interests. |
| `get_author_detail` | Get detailed info for a specific author by their Google Scholar ID. Returns profile, publications with citation counts, h-index, i10-index, yearly stats, co-authors, and public access articles. |
| `get_article_citation` | Get citation metadata in multiple formats (MLA, APA, Chicago, BibTeX, etc.) and downloadable citation links (BibTeX, EndNote, RefMan, RefWorks). |

## API Key

All tools accept an `apiKey` argument. You can also set `SCRAPINGDOG_API_KEY` as an environment variable — it will be used automatically if no `apiKey` is provided.

Get your key at: https://app.scrapingdog.com/dashboard

## Example Usage

```
# Search papers
search_google_scholar(query="transformer architecture", numResults=5, startYear="2020")

# Find authors
search_author_profiles(authorName="Geoffrey Hinton")

# Get author details (use author_id from search_author_profiles)
get_author_detail(authorId="u-6AAAAAYAAJ")

# Get citations
get_article_citation(articleId="FDc6HiktlqEJ")
```

## Cursor / Claude Desktop Integration

### Method 1: Docker (recommended)

Add to your Cursor settings JSON (`Cmd+,`):

```json
"mcpServers": {
  "google-scholar": {
    "command": "docker",
    "args": [
      "run", "--rm", "-e", "SCRAPINGDOG_API_KEY=your_key",
      "google-scholar-mcp"
    ]
  }
}
```

### Method 2: Direct

```json
"mcpServers": {
  "google-scholar": {
    "command": "node",
    "args": ["/path/to/server/build/index.js"],
    "env": {
      "SCRAPINGDOG_API_KEY": "your_key"
    }
  }
}
```

## License

MIT
