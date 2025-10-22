"""
Google Scholar MCP Server with Multiple API Support
支持多种 API 访问 Google Scholar：ScrapingDog、scholarly
提供稳定可靠的学术搜索服务
"""

from typing import Any, List, Dict, Optional
import asyncio
import logging
import os
import requests
from mcp.server.fastmcp import FastMCP

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize FastMCP server
mcp = FastMCP("google-scholar-api")

# 备用：使用 scholarly 库
try:
    from scholarly import scholarly
    SCHOLARLY_AVAILABLE = True
except ImportError:
    SCHOLARLY_AVAILABLE = False
    logging.warning("Scholarly library not available. Please install: pip install scholarly")


def get_scrapingdog_api_key() -> Optional[str]:
    """从环境变量获取 ScrapingDog API 密钥"""
    return os.environ.get("SCRAPINGDOG_API_KEY")


async def search_with_scrapingdog(
    query: str, 
    num_results: int = 10, 
    language: str = "en",
    year_start: Optional[int] = None,
    year_end: Optional[int] = None
) -> List[Dict[str, Any]]:
    """
    使用 ScrapingDog API 搜索 Google Scholar
    参考文档: https://docs.scrapingdog.com/google-scholar-api
    
    Args:
        query: 搜索关键词
        num_results: 返回结果数量
        language: 语言（默认英文）
        year_start: 起始年份（可选）
        year_end: 结束年份（可选）
    
    Returns:
        论文列表（包含完整字段）
    """
    api_key = get_scrapingdog_api_key()
    if not api_key:
        raise ValueError("SCRAPINGDOG_API_KEY not found")
    
    url = "https://api.scrapingdog.com/google_scholar/"  # 官方文档中 URL 末尾有 /
    params = {
        "api_key": api_key,
        "query": query,  # ScrapingDog 使用 'query' 参数
        "language": language,
        "page": 0,
        "results": num_results
    }
    
    # 添加年份过滤（如果提供）
    if year_start:
        params["as_ylo"] = str(year_start)
    if year_end:
        params["as_yhi"] = str(year_end)
    
    try:
        response = await asyncio.to_thread(requests.get, url, params=params, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            # 检查 API 错误响应
            if 'error' in data or 'errors' in data:
                error_msg = data.get('error') or data.get('errors', 'Unknown error')
                logging.warning(f"ScrapingDog API error: {error_msg}")
                raise ValueError(f"ScrapingDog API returned error: {error_msg}")
            
            # 解析 ScrapingDog 返回的数据（根据官方文档）
            results = []
            # ScrapingDog 返回的字段名是 'scholar_results' 而不是 'organic_results'
            scholar_results = data.get('scholar_results', [])
            
            if not scholar_results:
                logging.warning("ScrapingDog returned empty results")
                raise ValueError("No results from ScrapingDog")
            
            for item in scholar_results[:num_results]:
                # 提取作者和年份（从 displayed_link）
                displayed_link = item.get('displayed_link', '')
                authors, year, venue = parse_displayed_link(displayed_link)
                
                # 提取引用次数（从字符串 "Cited by 1683" 中提取数字）
                citations = 0
                cited_by_text = item.get('inline_links', {}).get('cited_by', {}).get('total', '')
                if cited_by_text and isinstance(cited_by_text, str):
                    import re
                    match = re.search(r'\d+', cited_by_text)
                    if match:
                        citations = int(match.group())
                
                # 提取所有 PDF 链接
                pdf_links = []
                resources = item.get('resources', [])
                for resource in resources:
                    if resource.get('type') == 'PDF':
                        pdf_links.append(resource.get('link', ''))
                
                # 构建完整的结果结构（包含所有字段，不截断摘要）
                # 提取完整的引用信息
                cited_by_info = item.get('inline_links', {}).get('cited_by', {})
                cited_by_text = cited_by_info.get('total', 'N/A')
                
                # 提取版本信息
                versions_info = item.get('inline_links', {}).get('versions', {})
                cluster_id = versions_info.get('cluster_id', 'N/A')
                
                # 提取完整的作者列表（包括个人资料链接）
                authors_list = []
                for author in item.get('authors', []):
                    if isinstance(author, dict):
                        authors_list.append({
                            'name': author.get('name', 'N/A'),
                            'profile_link': author.get('link', 'N/A'),
                            'author_id': author.get('author_id', 'N/A')
                        })
                
                result_data = {
                    # 基础信息
                    'title': item.get('title', 'N/A'),
                    'id': item.get('id', 'N/A'),
                    'type': item.get('type', ''),
                    
                    # 作者信息（完整）
                    'authors': {
                        'display': authors,  # 显示格式
                        'list': authors_list  # 完整列表含个人资料
                    },
                    
                    # 摘要（完整，不截断）
                    'abstract': item.get('snippet', 'N/A'),
                    'snippet': item.get('snippet', 'N/A'),
                    'abstract_length': len(item.get('snippet', '')) if item.get('snippet') else 0,
                    
                    # 发表信息
                    'publication': {
                        'venue': venue,
                        'year': year
                    },
                    'displayed_link': item.get('displayed_link', 'N/A'),
                    
                    # 链接信息（完整）
                    'links': {
                        'paper': item.get('title_link', 'N/A'),
                        'pdf': pdf_links[0] if pdf_links else 'N/A',
                        'pdf_all': pdf_links,
                        'displayed_link': item.get('displayed_link', 'N/A')
                    },
                    
                    # 引用信息
                    'citations': {
                        'count': citations,
                        'total_text': cited_by_text,
                        'link': cited_by_info.get('link', 'N/A')
                    },
                    
                    # 版本信息
                    'versions': {
                        'total': versions_info.get('total', 'N/A'),
                        'link': versions_info.get('link', 'N/A'),
                        'cluster_id': cluster_id
                    },
                    
                    # 元数据
                    'metadata': {
                        'source': 'ScrapingDog',
                        'has_pdf': len(pdf_links) > 0,
                        'type_info': item.get('type', 'article')
                    }
                }
                results.append(result_data)
            
            return results
        else:
            raise Exception(f"ScrapingDog API request failed with status code: {response.status_code}")
            
    except Exception as e:
        logging.error(f"ScrapingDog API error: {str(e)}")
        raise


def parse_displayed_link(displayed_link: str) -> tuple:
    """
    解析 displayed_link 字段以提取作者、年份和期刊/会议
    例如: "A Vaswani, N Shazeer - Advances in neural information processing systems, 2017"
    
    Returns:
        (authors, year, venue)
    """
    if not displayed_link or displayed_link == 'N/A':
        return ('N/A', 'N/A', 'N/A')
    
    try:
        # 使用正则表达式解析
        import re
        
        # 尝试匹配格式: "作者 - 期刊/会议, 年份 - 来源"
        # 或: "作者 - 年份 - 来源"
        parts = displayed_link.split(' - ')
        
        if len(parts) >= 2:
            authors = parts[0].strip()
            
            # 提取年份（4位数字）
            year = 'N/A'
            venue = 'N/A'
            
            remaining = ' - '.join(parts[1:])
            year_match = re.search(r'\b(19|20)\d{2}\b', remaining)
            
            if year_match:
                year = year_match.group()
                # 提取期刊/会议（年份之前的部分）
                venue_match = remaining[:year_match.start()].strip().rstrip(',').strip()
                if venue_match:
                    venue = venue_match
            else:
                # 如果没有年份，第二部分可能是期刊/会议
                venue = parts[1].strip()
            
            return (authors, year, venue)
        else:
            return (displayed_link, 'N/A', 'N/A')
            
    except Exception as e:
        logging.warning(f"Failed to parse displayed_link: {e}")
        return (displayed_link, 'N/A', 'N/A')


@mcp.tool()
async def search_google_scholar(
    query: str, 
    num_results: int = 5,
    use_api: bool = True,
    language: str = "en"
) -> List[Dict[str, Any]]:
    """
    使用 Google Scholar 搜索学术论文
    智能选择最佳 API：ScrapingDog -> scholarly
    
    Args:
        query: 搜索关键词
        num_results: 返回结果数量 (默认: 5)
        use_api: 是否使用 API (需要 API key)，否则使用 scholarly 库
        language: 语言代码 (默认: en)
    
    Returns:
        包含论文信息的字典列表
    """
    logging.info(f"Searching Google Scholar for: {query}, num_results: {num_results}, use_api: {use_api}")
    
    if use_api:
        # 优先尝试 ScrapingDog API（如果有 API Key）
        scrapingdog_key = get_scrapingdog_api_key()
        if scrapingdog_key:
            try:
                logging.info("Using ScrapingDog API for search")
                results = await search_with_scrapingdog(query, num_results, language)
                logging.info(f"✅ ScrapingDog API returned {len(results)} results")
                return results
            except Exception as e:
                logging.warning(f"ScrapingDog API failed: {str(e)}, trying scholarly...")
    
    # 最后备用：使用 scholarly 库（免费）
    if SCHOLARLY_AVAILABLE:
        try:
            logging.info("Using scholarly library for search (free fallback)")
            search_query = scholarly.search_pubs(query)
            results = []
            
            count = 0
            for pub in search_query:
                if count >= num_results:
                    break
                
                bib = pub.get('bib', {})
                result_data = {
                    'title': bib.get('title', 'N/A'),
                    'authors': bib.get('author', 'N/A'),
                    'year': bib.get('pub_year', 'N/A'),
                    'venue': bib.get('venue', 'N/A'),
                    'abstract': bib.get('abstract', 'N/A'),
                    'citations': pub.get('num_citations', 0),
                    'url': pub.get('pub_url', 'N/A'),
                    'source': 'scholarly'
                }
                results.append(result_data)
                count += 1
            
            logging.info(f"✅ scholarly library returned {len(results)} results")
            return results
            
        except Exception as e:
            error_str = str(e).lower()
            if 'captcha' in error_str or 'chrome' in error_str or 'firefox' in error_str or 'geckodriver' in error_str:
                logging.error(f"⚠️  scholarly library blocked by Google Scholar captcha/bot detection. Error: {str(e)}")
                return [{"error": "Google Scholar 已启用反爬虫机制。请使用 ScrapingDog API。"}]
            else:
                logging.error(f"Scholarly search failed: {str(e)}")
                return [{"error": f"All search methods failed. Last error: {str(e)}"}]
    
    return [{"error": "No search method available. Please install required libraries or configure API keys."}]


@mcp.tool()
async def search_google_scholar_by_author(
    author_name: str,
    query: Optional[str] = None,
    num_results: int = 5
) -> List[Dict[str, Any]]:
    """
    按作者搜索 Google Scholar 论文
    
    Args:
        author_name: 作者姓名
        query: 可选的关键词查询
        num_results: 返回结果数量 (默认: 5)
    
    Returns:
        包含论文信息的字典列表
    """
    logging.info(f"Searching papers by author: {author_name}, query: {query}")
    
    if not SCHOLARLY_AVAILABLE:
        return [{"error": "Scholarly library not available"}]
    
    try:
        # 构建搜索查询
        if query:
            search_str = f"{query} author:{author_name}"
        else:
            search_str = f"author:{author_name}"
        
        search_query = scholarly.search_pubs(search_str)
        results = []
        
        count = 0
        for pub in search_query:
            if count >= num_results:
                break
            
            bib = pub.get('bib', {})
            result_data = {
                'title': bib.get('title', 'N/A'),
                'authors': bib.get('author', 'N/A'),
                'year': bib.get('pub_year', 'N/A'),
                'venue': bib.get('venue', 'N/A'),
                'abstract': bib.get('abstract', 'N/A'),
                'citations': pub.get('num_citations', 0),
                'url': pub.get('pub_url', 'N/A')
            }
            results.append(result_data)
            count += 1
            
        return results
        
    except Exception as e:
        logging.error(f"Author search failed: {str(e)}")
        return [{"error": f"Author search failed: {str(e)}"}]


@mcp.tool()
async def get_author_profile(author_name: str) -> Dict[str, Any]:
    """
    获取作者的详细信息和主页
    
    Args:
        author_name: 作者姓名
    
    Returns:
        包含作者信息的字典
    """
    logging.info(f"Retrieving profile for author: {author_name}")
    
    if not SCHOLARLY_AVAILABLE:
        return {"error": "Scholarly library not available"}
    
    try:
        search_query = scholarly.search_author(author_name)
        author = await asyncio.to_thread(next, search_query)
        filled_author = await asyncio.to_thread(scholarly.fill, author)
        
        # 提取相关信息
        author_info = {
            "name": filled_author.get("name", "N/A"),
            "affiliation": filled_author.get("affiliation", "N/A"),
            "interests": filled_author.get("interests", []),
            "citedby": filled_author.get("citedby", 0),
            "citedby5y": filled_author.get("citedby5y", 0),
            "hindex": filled_author.get("hindex", 0),
            "hindex5y": filled_author.get("hindex5y", 0),
            "i10index": filled_author.get("i10index", 0),
            "i10index5y": filled_author.get("i10index5y", 0),
            "email": filled_author.get("email_domain", "N/A"),
            "homepage": filled_author.get("homepage", "N/A"),
            "top_publications": [
                {
                    "title": pub.get("bib", {}).get("title", "N/A"),
                    "year": pub.get("bib", {}).get("pub_year", "N/A"),
                    "citations": pub.get("num_citations", 0),
                    "venue": pub.get("bib", {}).get("venue", "N/A")
                }
                for pub in filled_author.get("publications", [])[:10]
            ]
        }
        
        return author_info
        
    except Exception as e:
        logging.error(f"Failed to retrieve author profile: {str(e)}")
        return {"error": f"Failed to retrieve author profile: {str(e)}"}


@mcp.tool()
async def search_google_scholar_advanced(
    query: str,
    author: Optional[str] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    num_results: int = 5
) -> List[Dict[str, Any]]:
    """
    高级搜索 Google Scholar（支持年份和作者过滤）
    优先使用 ScrapingDog API，支持年份参数
    
    Args:
        query: 搜索关键词
        author: 作者名（可选）
        year_start: 起始年份（可选，ScrapingDog as_ylo参数）
        year_end: 结束年份（可选，ScrapingDog as_yhi参数）
        num_results: 返回结果数量 (默认: 5)
    
    Returns:
        包含论文信息的字典列表
    """
    logging.info(f"Advanced search - query: {query}, author: {author}, years: {year_start}-{year_end}")
    
    # 优先尝试 ScrapingDog API（支持年份参数）
    scrapingdog_key = get_scrapingdog_api_key()
    if scrapingdog_key:
        try:
            logging.info("Using ScrapingDog API for advanced search")
            
            # 构建查询（添加作者过滤）
            search_query = query
            if author:
                search_query += f" author:{author}"
            
            # ScrapingDog 原生支持年份过滤（as_ylo, as_yhi）
            results = await search_with_scrapingdog(
                search_query, 
                num_results, 
                language="en",
                year_start=year_start,
                year_end=year_end
            )
            
            logging.info(f"✅ ScrapingDog advanced search returned {len(results)} results")
            return results
            
        except Exception as e:
            logging.warning(f"ScrapingDog advanced search failed: {str(e)}, trying scholarly...")
    
    # 备用：使用 scholarly 库
    if SCHOLARLY_AVAILABLE:
        try:
            logging.info("Using scholarly library for advanced search")
            # 构建搜索查询
            search_str = query
            if author:
                search_str += f" author:{author}"
            
            search_query = scholarly.search_pubs(search_str)
            results = []
            
            count = 0
            for pub in search_query:
                if count >= num_results:
                    break
                
                bib = pub.get('bib', {})
                
                # 年份过滤（scholarly 需要手动过滤）
                pub_year = bib.get('pub_year')
                if pub_year:
                    try:
                        pub_year_int = int(pub_year)
                        if year_start and pub_year_int < year_start:
                            continue
                        if year_end and pub_year_int > year_end:
                            continue
                    except (ValueError, TypeError):
                        pass
                
                result_data = {
                    'title': bib.get('title', 'N/A'),
                    'authors': bib.get('author', 'N/A'),
                    'year': pub_year or 'N/A',
                    'venue': bib.get('venue', 'N/A'),
                    'abstract': bib.get('abstract', 'N/A'),
                    'citations': pub.get('num_citations', 0),
                    'url': pub.get('pub_url', 'N/A'),
                    'source': 'scholarly'
                }
                results.append(result_data)
                count += 1
                
            return results
            
        except Exception as e:
            logging.error(f"Advanced search failed: {str(e)}")
            return [{"error": f"Advanced search failed: {str(e)}"}]
    
    return [{"error": "No search method available"}]


@mcp.tool()
async def search_google_scholar_key_words(query: str, num_results: int = 5) -> List[Dict[str, Any]]:
    """
    【兼容性别名】搜索 Google Scholar（原版工具名）
    实际调用 search_google_scholar
    
    Args:
        query: 搜索关键词
        num_results: 返回结果数量 (默认: 5)
    
    Returns:
        包含论文信息的字典列表
    """
    logging.info(f"[Compatibility] search_google_scholar_key_words called, forwarding to search_google_scholar")
    return await search_google_scholar(query, num_results, use_api=True)


@mcp.tool()
async def get_author_info(author_name: str) -> Dict[str, Any]:
    """
    【兼容性别名】获取作者信息（原版工具名）
    实际调用 get_author_profile
    
    Args:
        author_name: 作者姓名
    
    Returns:
        包含作者信息的字典
    """
    logging.info(f"[Compatibility] get_author_info called, forwarding to get_author_profile")
    return await get_author_profile(author_name)


@mcp.tool()
async def search_paper_by_title(paper_title: str) -> Dict[str, Any]:
    """
    通过论文标题精确搜索并返回完整引用信息（用于补全文献条目）
    
    Args:
        paper_title: 论文标题
    
    Returns:
        包含完整引用信息的字典，包括 BibTeX 格式
    """
    logging.info(f"Searching paper by exact title: {paper_title}")
    
    # 先尝试使用 ScrapingDog API（返回更完整的数据）
    scrapingdog_key = get_scrapingdog_api_key()
    if scrapingdog_key:
        try:
            logging.info("Using ScrapingDog API to search by title")
            results = await search_with_scrapingdog(paper_title, num_results=1, language="en")
            
            if results and len(results) > 0:
                paper = results[0]
                
                # 构建完整的引用信息
                citation_data = {
                    "title": paper.get('title', 'N/A'),
                    "authors": paper.get('authors', 'N/A'),
                    "year": paper.get('year', 'N/A'),
                    "abstract": paper.get('snippet', 'N/A'),
                    "citations": paper.get('citations', 0),
                    "url": paper.get('url', 'N/A'),
                    "pdf_link": paper.get('pdf_link', 'N/A'),
                    "source": "ScrapingDog"
                }
                
                # 尝试使用 scholarly 补充更详细的信息
                if SCHOLARLY_AVAILABLE:
                    try:
                        search_query = scholarly.search_pubs(paper_title)
                        scholarly_paper = await asyncio.to_thread(next, search_query)
                        
                        bib = scholarly_paper.get('bib', {})
                        citation_data.update({
                            "venue": bib.get('venue', citation_data.get('venue', 'N/A')),
                            "publisher": bib.get('publisher', 'N/A'),
                            "volume": bib.get('volume', 'N/A'),
                            "number": bib.get('number', 'N/A'),
                            "pages": bib.get('pages', 'N/A'),
                            "abstract_full": bib.get('abstract', citation_data.get('abstract', 'N/A')),
                            "eprint_url": scholarly_paper.get('eprint_url', 'N/A'),
                            "pub_url": scholarly_paper.get('pub_url', citation_data.get('url', 'N/A')),
                        })
                        
                        # 生成 BibTeX
                        citation_data["bibtex"] = generate_bibtex(citation_data)
                        
                    except Exception as e:
                        logging.warning(f"Failed to get additional info from scholarly: {str(e)}")
                        citation_data["bibtex"] = generate_bibtex(citation_data)
                else:
                    citation_data["bibtex"] = generate_bibtex(citation_data)
                
                return citation_data
                
        except Exception as e:
            logging.warning(f"ScrapingDog search failed: {str(e)}, trying scholarly...")
    
    # 使用 scholarly 库
    if SCHOLARLY_AVAILABLE:
        try:
            logging.info("Using scholarly library to search by title")
            search_query = scholarly.search_pubs(paper_title)
            paper = await asyncio.to_thread(next, search_query)
            
            bib = paper.get('bib', {})
            
            citation_data = {
                "title": bib.get('title', 'N/A'),
                "authors": bib.get('author', 'N/A'),
                "year": bib.get('pub_year', 'N/A'),
                "venue": bib.get('venue', 'N/A'),
                "publisher": bib.get('publisher', 'N/A'),
                "volume": bib.get('volume', 'N/A'),
                "number": bib.get('number', 'N/A'),
                "pages": bib.get('pages', 'N/A'),
                "abstract": bib.get('abstract', 'N/A'),
                "citations": paper.get('num_citations', 0),
                "url": paper.get('pub_url', 'N/A'),
                "eprint_url": paper.get('eprint_url', 'N/A'),
                "source": "scholarly"
            }
            
            # 生成 BibTeX
            citation_data["bibtex"] = generate_bibtex(citation_data)
            
            # 生成 RIS 格式
            citation_data["ris"] = generate_ris(citation_data)
            
            return citation_data
            
        except Exception as e:
            logging.error(f"Failed to search by title: {str(e)}")
            return {"error": f"Failed to find paper: {str(e)}"}
    
    return {"error": "No search method available"}


def generate_bibtex(citation_data: Dict[str, Any]) -> str:
    """
    生成完整的 BibTeX 格式引用（包含所有字段，摘要不截断）
    """
    # 生成 cite key (使用第一个作者姓氏 + 年份)
    authors = citation_data.get('authors', 'Unknown')
    year = citation_data.get('year', 'N/A')
    
    # 提取第一个作者的姓氏
    if isinstance(authors, str) and authors != 'N/A':
        first_author = authors.split(',')[0].strip().split()[-1]
    else:
        first_author = 'Unknown'
    
    cite_key = f"{first_author}_{year}".replace(' ', '_').lower()
    
    # 判断类型（文章还是会议论文）
    venue = citation_data.get('venue', '')
    entry_type = 'inproceedings' if 'conference' in venue.lower() or 'proceedings' in venue.lower() else 'article'
    
    # 如果有 eprint，优先使用 @article
    if citation_data.get('eprint') or citation_data.get('eprint_url'):
        entry_type = 'article'
    
    bibtex = f"@{entry_type}{{{cite_key},\n"
    
    # 基础字段（必须）
    bibtex += f"  author = {{{citation_data.get('authors', 'N/A')}}},\n"
    bibtex += f"  title = {{{citation_data.get('title', 'N/A')}}},\n"
    
    # 发表信息
    if citation_data.get('venue', 'N/A') != 'N/A':
        if entry_type == 'article':
            bibtex += f"  journal = {{{citation_data.get('venue')}}},\n"
        else:
            bibtex += f"  booktitle = {{{citation_data.get('venue')}}},\n"
    
    bibtex += f"  year = {{{year}}},\n"
    
    # 可选字段
    if citation_data.get('month', 'N/A') != 'N/A':
        bibtex += f"  month = {{{citation_data.get('month')}}},\n"
    
    if citation_data.get('volume', 'N/A') != 'N/A':
        bibtex += f"  volume = {{{citation_data.get('volume')}}},\n"
    
    if citation_data.get('number', 'N/A') != 'N/A':
        bibtex += f"  number = {{{citation_data.get('number')}}},\n"
    
    if citation_data.get('pages', 'N/A') != 'N/A':
        bibtex += f"  pages = {{{citation_data.get('pages')}}},\n"
    
    if citation_data.get('publisher', 'N/A') != 'N/A':
        bibtex += f"  publisher = {{{citation_data.get('publisher')}}},\n"
    
    # arXiv 相关字段
    if citation_data.get('eprint', 'N/A') != 'N/A':
        bibtex += f"  eprint = {{{citation_data.get('eprint')}}},\n"
    
    if citation_data.get('archivePrefix', 'N/A') != 'N/A':
        bibtex += f"  archivePrefix = {{{citation_data.get('archivePrefix')}}},\n"
    
    if citation_data.get('primaryClass', 'N/A') != 'N/A':
        bibtex += f"  primaryClass = {{{citation_data.get('primaryClass')}}},\n"
    
    # DOI
    if citation_data.get('doi', 'N/A') != 'N/A':
        bibtex += f"  doi = {{{citation_data.get('doi')}}},\n"
    
    # URL
    if citation_data.get('url', 'N/A') != 'N/A':
        bibtex += f"  url = {{{citation_data.get('url')}}},\n"
    
    # 完整摘要（不截断）
    abstract = citation_data.get('abstract', 'N/A')
    if abstract and abstract != 'N/A':
        # 对摘要进行简单转义处理
        abstract_escaped = abstract.replace('{', '\\{').replace('}', '\\}')
        bibtex += f"  abstract = {{{abstract_escaped}}},\n"
    
    # 备注（关键词等）
    if citation_data.get('note', 'N/A') != 'N/A':
        bibtex += f"  note = {{{citation_data.get('note')}}},\n"
    
    bibtex += "}\n"
    
    return bibtex


def generate_ris(citation_data: Dict[str, Any]) -> str:
    """
    生成 RIS 格式的引用
    """
    venue = citation_data.get('venue', '')
    ty = 'CONF' if 'conference' in venue.lower() or 'proceedings' in venue.lower() else 'JOUR'
    
    ris = f"TY  - {ty}\n"
    ris += f"TI  - {citation_data.get('title', 'N/A')}\n"
    
    # 处理作者
    authors = citation_data.get('authors', 'N/A')
    if isinstance(authors, str) and authors != 'N/A':
        for author in authors.split(','):
            ris += f"AU  - {author.strip()}\n"
    
    ris += f"PY  - {citation_data.get('year', 'N/A')}\n"
    
    if citation_data.get('venue', 'N/A') != 'N/A':
        if ty == 'JOUR':
            ris += f"JO  - {citation_data.get('venue')}\n"
        else:
            ris += f"T2  - {citation_data.get('venue')}\n"
    
    if citation_data.get('volume', 'N/A') != 'N/A':
        ris += f"VL  - {citation_data.get('volume')}\n"
    
    if citation_data.get('number', 'N/A') != 'N/A':
        ris += f"IS  - {citation_data.get('number')}\n"
    
    if citation_data.get('pages', 'N/A') != 'N/A':
        ris += f"SP  - {citation_data.get('pages')}\n"
    
    if citation_data.get('abstract', 'N/A') != 'N/A':
        ris += f"AB  - {citation_data.get('abstract')}\n"
    
    if citation_data.get('url', 'N/A') != 'N/A':
        ris += f"UR  - {citation_data.get('url')}\n"
    
    ris += "ER  - \n"
    
    return ris


@mcp.tool()
async def get_citation_info(paper_title: str) -> Dict[str, Any]:
    """
    获取论文的引用信息
    
    Args:
        paper_title: 论文标题
    
    Returns:
        包含引用信息的字典
    """
    logging.info(f"Getting citation info for: {paper_title}")
    
    if not SCHOLARLY_AVAILABLE:
        return {"error": "Scholarly library not available"}
    
    try:
        search_query = scholarly.search_pubs(paper_title)
        paper = await asyncio.to_thread(next, search_query)
        filled_paper = await asyncio.to_thread(scholarly.fill, paper)
        
        bib = filled_paper.get('bib', {})
        citation_info = {
            "title": bib.get('title', 'N/A'),
            "authors": bib.get('author', 'N/A'),
            "year": bib.get('pub_year', 'N/A'),
            "venue": bib.get('venue', 'N/A'),
            "citations": filled_paper.get('num_citations', 0),
            "url": filled_paper.get('pub_url', 'N/A'),
            "eprint_url": filled_paper.get('eprint_url', 'N/A'),
            "abstract": bib.get('abstract', 'N/A')
        }
        
        return citation_info
        
    except Exception as e:
        logging.error(f"Failed to get citation info: {str(e)}")
        return {"error": f"Failed to get citation info: {str(e)}"}


def main():
    """Entry point for setuptools and Docker"""
    # 环境检查
    logging.info("=" * 60)
    logging.info("Google Scholar MCP Server - Environment Check")
    logging.info("=" * 60)
    
    # 检查 ScrapingDog API
    scrapingdog_key = get_scrapingdog_api_key()
    if scrapingdog_key:
        logging.info(f"✅ SCRAPINGDOG_API_KEY found: {scrapingdog_key[:10]}... (优先使用)")
    else:
        logging.info("⚠️  SCRAPINGDOG_API_KEY not configured")
    
    # 检查库可用性
    if SCHOLARLY_AVAILABLE:
        logging.info("✅ Scholarly library available (免费备用)")
    else:
        logging.warning("⚠️  Scholarly library not available")
    
    # 显示 API 优先级
    logging.info("")
    logging.info("API 优先级顺序:")
    logging.info("  1. ScrapingDog API (最快最稳定)")
    logging.info("  2. scholarly 库 (免费但较慢)")
    logging.info("")
    
    # 启动服务器
    logging.info("=" * 60)
    logging.info("🚀 Starting Google Scholar MCP Server...")
    logging.info("=" * 60)
    mcp.run()


if __name__ == "__main__":
    main()

