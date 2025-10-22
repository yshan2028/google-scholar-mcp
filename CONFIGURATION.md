# Configuration Guide

Detailed setup instructions for Google Scholar MCP Server.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Claude Desktop / Cursor Integration](#claude-desktop--cursor-integration)
- [Docker Configuration](#docker-configuration)
- [Troubleshooting](#troubleshooting)

## Environment Variables

### SCRAPINGDOG_API_KEY

- **Type**: String
- **Priority**: 1 (highest)
- **Required**: No (but recommended)
- **Description**: API key for ScrapingDog service
- **Get Key**: https://www.scrapingdog.com/

### Optional

If no API key is provided, the system will automatically use the `scholarly` library, which is completely free but may be slower and might encounter rate limiting from Google Scholar.

## Claude Desktop / Cursor Integration

### Method 1: Docker with Direct Keys (Simplest)

This method is quickest for local development but stores keys in the config file.

**Claude Desktop** - Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "SCRAPINGDOG_API_KEY=your_actual_key_here",
        "google-scholar-mcp:latest"
      ]
    }
  }
}
```

**Cursor** - Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "google-scholar": {
      "command": "docker",
      "args": [
        "run",
        "--rm",
        "-i",
        "-e", "SCRAPINGDOG_API_KEY=your_actual_key_here",
        "google-scholar-mcp:latest"
      ]
    }
  }
}
```

**Key Parameters Explained:**
- `--rm` - Automatically remove container on exit
- `-i` - Interactive mode (required for MCP communication via stdio)
- `-e KEY=VALUE` - Set environment variables (repeat for multiple variables)
- `google-scholar-mcp:latest` - Docker image name

### Method 2: Local Deployment (Recommended for Development)

This method is best for development, allowing easy debugging and code changes.

**Claude Desktop**:

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
        "SCRAPINGDOG_API_KEY": "your_actual_key_here"
      }
    }
  }
}
```

**Cursor**:

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
        "SCRAPINGDOG_API_KEY": "your_actual_key_here"
      }
    }
  }
}
```

**Windows Path Example:**

Replace `/path/to/Google-Scholar-MCP-Server` with your actual path:
```
C:\Users\YourName\Projects\Google-Scholar-MCP-Server
```

### Method 3: Docker with .env File (Most Secure)

This method separates keys into a .env file and is best for production.

**Setup:**

1. Create `.env` file in the project directory:
```bash
cp env.example .env
nano .env
```

2. Edit `claude_desktop_config.json`:

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

**Notes:**
- The `.env` file is in `.gitignore` and will not be committed
- Path must be absolute (full path from root)
- Only works if Docker can access the .env file

## Docker Configuration

### Building the Image

```bash
docker build -t google-scholar-mcp:latest .
```

### Running Manually

```bash
docker run --rm -it \
  -e SCRAPINGDOG_API_KEY=your_key \
  google-scholar-mcp:latest
```

### Using docker-compose

```bash
# Start
docker-compose up -d

# View logs
docker-compose logs -f google-scholar-mcp

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

### Finding Your Docker Image Name

```bash
docker images | grep google-scholar
```

Output might show:
- `google-scholar-mcp:latest`
- `google-scholar-mcp-server-google-scholar-mcp:latest`

Use the actual name in your configuration.

## Troubleshooting

### Issue: Tool doesn't appear in Claude/Cursor

**Solutions:**
1. Verify JSON syntax is correct (use [jsonlint.com](https://www.jsonlint.com/))
2. Check Docker image exists: `docker images | grep google-scholar`
3. Restart Claude Desktop or Cursor
4. Check logs:
   - Claude Desktop: `~/Library/Logs/Claude/`
   - Cursor: View Output panel, look for MCP section

### Issue: Connection refused / Cannot reach API

**Solutions:**
1. Verify API keys are correct
2. Check internet connection
3. Try another API method (system tries ScrapingDog → scholarly)
4. Some queries may legitimately have no results

### Issue: Docker image not found

**Solution:**
```bash
# Rebuild the image
docker build -t google-scholar-mcp:latest .

# Then update config with correct image name
docker images | grep google-scholar
```

### Issue: API returns empty results

**Possible causes:**
1. Query is too specific (try simpler keywords)
2. Paper doesn't exist in Google Scholar
3. Temporary API issue (try again in a moment)

### Issue: "Permission denied" when using .env file

**Solution:**
1. Verify file exists: `ls -la .env`
2. Make sure path in config is absolute (not relative)
3. For Docker, ensure the .env file is readable:
   ```bash
   chmod 644 .env
   ```

## Configuration Comparison

| Aspect | Method 1 | Method 2 | Method 3 |
|--------|----------|----------|----------|
| Setup Time | 5 min | 5 min | 10 min |
| Security | ⚠️ Medium | ⚠️ Medium | ✅ High |
| Development | Good | ✅ Best | OK |
| Production | OK | ⚠️ Medium | ✅ Best |
| Key Storage | Config file | Config file | .env file |
| Debugging | Medium | ✅ Best | Hard |

## Best Practices

1. **For local development:** Use Method 2 (local deployment)
2. **For production:** Use Method 3 (Docker + .env)
3. **For testing:** Use Method 1 (Docker direct keys)
4. **Never commit .env files** - Always add to `.gitignore`
5. **Always use absolute paths** - Relative paths in Docker configs may fail
6. **Restart after config changes** - Always restart Claude/Cursor after editing config files

## Multiple MCP Servers

You can configure multiple MCP servers in the same config file:

```json
{
  "mcpServers": {
    "google-scholar": { ... },
    "pdf-reader": { ... },
    "other-service": { ... }
  }
}
```

## Getting Help

If you encounter issues:
1. Check this configuration guide
2. Verify your API keys are correct
3. Review Docker logs: `docker logs google-scholar-mcp`
4. Check Claude/Cursor logs for MCP errors
5. Ensure all required files exist (.env, Docker image, etc.)
