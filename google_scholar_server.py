from typing import Any, List, Dict, Optional, Union
import asyncio
import logging
from mcp.server.fastmcp import FastMCP
from google_scholar_web_search import google_scholar_search, advanced_google_scholar_search

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize FastMCP server for PubMed and Google Scholar
mcp = FastMCP("scholar_pubmed")

@mcp.tool()
async def search_google_scholar_key_words(query: str, num_results: int = 5) -> List[Dict[str, Any]]:
    logging.info(f"Searching Google Scholar for articles with query: {query}, num_results: {num_results}")
    """
    Search for articles on Google Scholar using key words.

    Args:
        query: Search query string
        num_results: Number of results to return (default: 5)

    Returns:
        List of dictionaries containing article information
    """
    try:
        results = await asyncio.to_thread(google_scholar_search, query, num_results)
        return results
    except Exception as e:
        return [{"error": f"An error occurred while searching Google Scholar: {str(e)}"}]

@mcp.tool()
async def search_google_scholar_advanced(query: str, author: Optional[str] = None, year_range: Optional[tuple] = None, num_results: int = 5) -> List[Dict[str, Any]]:
    logging.info(f"Performing advanced search with parameters: {locals()}")
    """
    Search for articles on Google Scholar using advanced filters.

    Args:
        query: General search query
        author: Author name
        year_range: tuple containing (start_year, end_year)
        num_results: Number of results to return (default: 5)

    Returns:
        List of dictionaries containing article information
    """
    try:
        results = await asyncio.to_thread(
            advanced_google_scholar_search,
            query, author, year_range, num_results
        )
        return results
    except Exception as e:
        return [{"error": f"An error occurred while performing advanced search on Google Scholar: {str(e)}"}]

