# Google-Scholar MCP Server
[![smithery badge](https://smithery.ai/badge/@JackKuo666/Google-Scholar-mcp-server)](https://smithery.ai/server/@JackKuo666/Google-Scholar-mcp-server)

🔍 Enable AI assistants to search and access Google-Scholar papers through a simple MCP interface.

The Google-Scholar MCP Server provides a bridge between AI assistants and Google-Scholar's preprint repository through the Model Context Protocol (MCP). It allows AI models to search for health sciences preprints and access their content in a programmatic way.

🤝 Contribute • 📝 Report Bug

## ✨ Core Features
- 🔎 Paper Search: Query Google-Scholar papers with custom search strings or advanced search parameters ✅
- 🚀 Efficient Retrieval: Fast access to paper metadata ✅
- 📊 Metadata Access: Retrieve detailed metadata for specific papers using DOI ✅
- 📊 Research Support: Facilitate health sciences research and analysis ✅
- 📄 Paper Access: Download and read paper content 📝
- 📋 Paper Listing: View all downloaded papers 📝
- 🗃️ Local Storage: Papers are saved locally for faster access 📝
- 📝 Research Prompts: A set of specialized prompts for paper analysis 📝

## 🚀 Quick Start

### Installing via Smithery

To install Google-Scholar Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@JackKuo666/Google-Scholar-mcp-server):

#### claude

```bash
npx -y @smithery/cli@latest install @JackKuo666/Google-Scholar-mcp-server --client claude --config "{}"
```

#### Cursor

Paste the following into Settings → Cursor Settings → MCP → Add new server: 
- Mac/Linux  
```s
npx -y @smithery/cli@latest run @JackKuo666/Google-Scholar-mcp-server --client cursor --config "{}" 
```
#### Windsurf
```sh
npx -y @smithery/cli@latest install @JackKuo666/Google-Scholar-mcp-server --client windsurf --config "{}"
```
### CLine
```sh
npx -y @smithery/cli@latest install @JackKuo666/Google-Scholar-mcp-server --client cline --config "{}"
```


### Installing Manually
Install using uv:

```bash
uv tool install Google-Scholar-mcp-server
```

For development:

```bash
# Clone and set up development environment
git clone https://github.com/JackKuo666/Google-Scholar-MCP-Server.git
cd Google-Scholar-MCP-Server

# Create and activate virtual environment
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

## 📊 Usage

Start the MCP server:

```bash
python Google-Scholar_server.py
```

Once the server is running, you can use the provided MCP tools in your AI assistant or application. Here are some examples of how to use the tools:

### Example 1: Search for papers using keywords

```python
result = await mcp.use_tool("search_Google-Scholar_key_words", {
    "key_words": "COVID-19 vaccine efficacy",
    "num_results": 5
})
print(result)
```

### Example 2: Perform an advanced search

```python
result = await mcp.use_tool("search_Google-Scholar_advanced", {
    "term": "COVID-19",
    "author1": "MacLachlan",
    "start_date": "2020-01-01",
    "end_date": "2023-12-31",
    "num_results": 3
})
print(result)
```

### Example 3: Get metadata for a specific paper

```python
result = await mcp.use_tool("get_Google-Scholar_metadata", {
    "doi": "10.1101/2025.03.09.25323517"
})
print(result)
```

These examples demonstrate how to use the three main tools provided by the Google-Scholar MCP Server. Adjust the parameters as needed for your specific use case.

## 🛠 MCP Tools

The Google-Scholar MCP Server provides the following tools:

### search_Google-Scholar_key_words

Search for articles on Google-Scholar using key words.

**Parameters:**
- `key_words` (str): Search query string
- `num_results` (int, optional): Number of results to return (default: 10)

**Returns:** List of dictionaries containing article information

### search_Google-Scholar_advanced

Perform an advanced search for articles on Google-Scholar.

**Parameters:**
- `term` (str, optional): General search term
- `title` (str, optional): Search in title
- `author1` (str, optional): First author
- `author2` (str, optional): Second author
- `abstract_title` (str, optional): Search in abstract and title
- `text_abstract_title` (str, optional): Search in full text, abstract, and title
- `section` (str, optional): Section of Google-Scholar
- `start_date` (str, optional): Start date for search range (format: YYYY-MM-DD)
- `end_date` (str, optional): End date for search range (format: YYYY-MM-DD)
- `num_results` (int, optional): Number of results to return (default: 10)

**Returns:** List of dictionaries containing article information

### get_Google-Scholar_metadata

Fetch metadata for a Google-Scholar article using its DOI.

**Parameters:**
- `doi` (str): DOI of the article

**Returns:** Dictionary containing article metadata

## Usage with Claude Desktop

Add this configuration to your `claude_desktop_config.json`:

(Mac OS)

```json
{
  "mcpServers": {
    "Google-Scholar": {
      "command": "python",
      "args": ["-m", "Google-Scholar-mcp-server"]
      }
  }
}
```

(Windows version):

```json
{
  "mcpServers": {
    "Google-Scholar": {
      "command": "C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Programs\\Python\\Python311\\python.exe",
      "args": [
        "-m",
        "Google-Scholar-mcp-server"
      ]
    }
  }
}
```
Using with Cline
```json
{
  "mcpServers": {
    "Google-Scholar": {
      "command": "bash",
      "args": [
        "-c",
        "source /home/YOUR/PATH/mcp-server-Google-Scholar/.venv/bin/activate && python /home/YOUR/PATH/mcp-server-Google-Scholar/Google-Scholar_server.py"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

After restarting Claude Desktop, the following capabilities will be available:

### Searching Papers

You can ask Claude to search for papers using queries like:
```
Can you search Google-Scholar for recent papers about genomics?
```

The search will return basic information about matching papers including:

• Paper title

• Authors

• DOI


### Getting Paper Details

Once you have a DOI, you can ask for more details:
```
Can you show me the details for paper 10.1101/003541?
```

This will return:

• Full paper title

• Authors

• Publication date

• Paper abstract

• Links to available formats (PDF/HTML)



## 📝 TODO

### download_paper

Download a paper and save it locally.

### read_paper

Read the content of a downloaded paper.

### list_papers

List all downloaded papers.

### 📝 Research Prompts

The server offers specialized prompts to help analyze academic papers:

#### Paper Analysis Prompt

A comprehensive workflow for analyzing academic papers that only requires a paper ID:

```python
result = await call_prompt("deep-paper-analysis", {
    "paper_id": "2401.12345"
})
```

This prompt includes:

- Detailed instructions for using available tools (list_papers, download_paper, read_paper, search_papers)
- A systematic workflow for paper analysis
- Comprehensive analysis structure covering:
  - Executive summary
  - Research context
  - Methodology analysis
  - Results evaluation
  - Practical and theoretical implications
  - Future research directions
  - Broader impacts

## 📁 Project Structure

- `Google-Scholar_server.py`: The main MCP server implementation using FastMCP
- `Google-Scholar_web_search.py`: Contains the web scraping logic for searching Google-Scholar

## 🔧 Dependencies

- Python 3.10+
- FastMCP
- asyncio
- logging
- requests (for web scraping, used in Google-Scholar_web_search.py)
- beautifulsoup4 (for web scraping, used in Google-Scholar_web_search.py)

You can install the required dependencies using:

```bash
pip install FastMCP requests beautifulsoup4
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.


## ⚠️ Disclaimer

This tool is for research purposes only. Please respect Google-Scholar's terms of service and use this tool responsibly.

