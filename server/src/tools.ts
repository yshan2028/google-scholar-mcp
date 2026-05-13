import {
    searchGoogleScholar,
    searchAuthorProfiles,
    getAuthorDetail,
    getArticleCitation,
} from "./google-scholar-search.js";

// ============================================================
// Helper: resolve API key from args or environment
// ============================================================

function getEffectiveApiKey(apiKeyArg?: string): string {
    return apiKeyArg || process.env.SCRAPINGDOG_API_KEY || '';
}

// ============================================================
// Tool 1: Scholar Search
// ============================================================

export const searchScholarTool = {
    name: "search_google_scholar",
    description: "Search Google Scholar for academic papers and research articles. Returns structured results with titles, authors, snippets, citation counts, version links, related searches, and pagination. Supports advanced filtering by author, publication year range, citation search, article versions, language, patent inclusion, and more.",
    inputSchema: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "The search query string. Supports Google Scholar syntax like author: and source: helpers. Required unless cites or cluster is provided."
            },
            apiKey: {
                type: "string",
                description: "Your Scrapingdog API key. Can also be set via SCRAPINGDOG_API_KEY environment variable."
            },
            numResults: {
                type: "number",
                description: "Number of results per page (default: 10, max: 100).",
                minimum: 1,
                maximum: 100,
                default: 10
            },
            author: {
                type: "string",
                description: "Filter results by specific author name. Appended to query as author: syntax."
            },
            startYear: {
                type: "string",
                description: "Filter results from this year onwards (e.g., '2018'). Maps to as_ylo parameter."
            },
            endYear: {
                type: "string",
                description: "Filter results up to this year (e.g., '2023'). Maps to as_yhi parameter."
            },
            cites: {
                type: "string",
                description: "Article ID to find documents that cite a given article. Cannot be used with cluster."
            },
            cluster: {
                type: "string",
                description: "Cluster ID to find all versions of an article. Cannot be used with query or cites."
            },
            scisbd: {
                type: "string",
                description: "Abstract-only results. '1' for abstract-only, '0' for all results.",
                enum: ["0", "1"]
            },
            language: {
                type: "string",
                description: "Language of results (e.g., 'en', 'es', 'fr', 'de'). Default: 'en'.",
                default: "en"
            },
            lr: {
                type: "string",
                description: "Limit search to a specific language via Google's lr parameter (e.g., 'lang_en')."
            },
            page: {
                type: "number",
                description: "Page number (0 for first page, 1 for second, etc.). Default: 0.",
                default: 0
            },
            asSdt: {
                type: "string",
                description: "Search type/filter. '0' excludes patents, '7' includes patents, '4' selects case law. Examples: '0', '7', '4', '4,33,192'."
            },
            safe: {
                type: "string",
                description: "Safe search filter. 'active' or 'off'. Default: 'off'.",
                enum: ["active", "off"],
                default: "off"
            },
            filter: {
                type: "string",
                description: "Filter similar/omitted results. '1' enables, '0' disables. Default: '1'.",
                enum: ["0", "1"],
                default: "1"
            },
            asVis: {
                type: "string",
                description: "'0' includes citations, '1' excludes them. Default: '0'.",
                enum: ["0", "1"],
                default: "0"
            },
            asRr: {
                type: "string",
                description: "'1' shows only review articles. Default: '0'.",
                enum: ["0", "1"],
                default: "0"
            },
            html: {
                type: "boolean",
                description: "Return raw HTML instead of parsed JSON. Default: false.",
                default: false
            }
        }
    }
};

export async function callSearchScholarTool(args: any) {
    try {
        const {
            query = '',
            numResults = 10,
            author = '',
            startYear,
            endYear,
            cites,
            cluster,
            scisbd,
            language,
            lr,
            page = 0,
            asSdt,
            safe,
            filter,
            asVis,
            asRr,
            html = false,
        } = args;

        const apiKey = getEffectiveApiKey(args.apiKey);
        if (!apiKey) {
            return { content: [{ type: "text", text: "Scrapingdog API key is required. Set SCRAPINGDOG_API_KEY environment variable or pass apiKey." }], isError: true };
        }

        if (!query && !cites && !cluster) {
            return { content: [{ type: "text", text: "At least one of 'query', 'cites', or 'cluster' must be provided." }], isError: true };
        }

        if (cites && cluster) {
            return { content: [{ type: "text", text: "'cites' and 'cluster' cannot be used simultaneously." }], isError: true };
        }

        if (query && cluster) {
            return { content: [{ type: "text", text: "'cluster' cannot be used together with 'query'." }], isError: true };
        }

        let searchQuery = query || '';
        if (author) {
            searchQuery += ` author:"${author}"`;
        }

        const results = await searchGoogleScholar({
            apiKey,
            query: searchQuery.trim(),
            results: numResults,
            cites,
            cluster,
            as_ylo: startYear,
            as_yhi: endYear,
            scisbd,
            language,
            lr,
            page: String(page),
            as_sdt: asSdt,
            safe,
            filter,
            as_vis: asVis,
            as_rr: asRr,
            html,
        });

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    query,
                    filters: { author: author || "none", yearRange: startYear || endYear ? `${startYear || 'any'}-${endYear || 'any'}` : "none", cites: cites || "none", cluster: cluster || "none" },
                    totalResults: results.scholar_results.length,
                    results: results.scholar_results,
                    relatedSearches: results.related_searches,
                    pagination: results.pagination,
                }, null, 2)
            }]
        };
    } catch (error) {
        return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
    }
}

// ============================================================
// Tool 2: Author Profiles Search
// ============================================================

export const searchAuthorProfilesTool = {
    name: "search_author_profiles",
    description: "Search for Google Scholar author profiles by name. Returns a list of matching authors with their affiliations, email verification status, total citations, and research interests. Useful for discovering academic researchers in a specific field.",
    inputSchema: {
        type: "object",
        properties: {
            authorName: {
                type: "string",
                description: "The author name to search for (e.g., 'machine learning'). Supports label: syntax for interest-based search (e.g., 'label:machine_learning')."
            },
            apiKey: {
                type: "string",
                description: "Your Scrapingdog API key. Can also be set via SCRAPINGDOG_API_KEY environment variable."
            },
            afterAuthor: {
                type: "string",
                description: "Pagination token to fetch the next page of results. Use the next_page_token from the previous response."
            },
            beforeAuthor: {
                type: "string",
                description: "Pagination token to retrieve results from the previous page."
            }
        },
        required: ["authorName"]
    }
};

export async function callSearchAuthorProfilesTool(args: any) {
    try {
        const { authorName, afterAuthor, beforeAuthor } = args;

        const apiKey = getEffectiveApiKey(args.apiKey);
        if (!apiKey) {
            return { content: [{ type: "text", text: "Scrapingdog API key is required. Set SCRAPINGDOG_API_KEY environment variable or pass apiKey." }], isError: true };
        }

        if (!authorName) {
            return { content: [{ type: "text", text: "authorName is required." }], isError: true };
        }

        const results = await searchAuthorProfiles({
            apiKey,
            mauthors: authorName,
            afterAuthor,
            beforeAuthor,
        });

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    query: authorName,
                    totalProfiles: results.profiles?.length ?? 0,
                    pagination: results.pagination,
                    profiles: results.profiles ?? [],
                }, null, 2)
            }]
        };
    } catch (error) {
        return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
    }
}

// ============================================================
// Tool 3: Author Detail
// ============================================================

export const getAuthorDetailTool = {
    name: "get_author_detail",
    description: "Get detailed information about a specific Google Scholar author profile by their author ID. Returns the author's profile info (name, affiliations, interests), publication list with citation counts, yearly citation statistics (h-index, i10-index), co-authors, and public access article availability. Use search_author_profiles first to find the author_id.",
    inputSchema: {
        type: "object",
        properties: {
            authorId: {
                type: "string",
                description: "The Google Scholar author ID (e.g., 'LSsXyncAAAAJ'). Found in the URL of an author's profile page (scholar.google.com/citations?user=AUTHOR_ID)."
            },
            apiKey: {
                type: "string",
                description: "Your Scrapingdog API key. Can also be set via SCRAPINGDOG_API_KEY environment variable."
            },
            numResults: {
                type: "number",
                description: "Number of article results to return (default: 20).",
                minimum: 1,
                maximum: 100,
                default: 20
            },
            language: {
                type: "string",
                description: "Language of results (e.g., 'en', 'es', 'fr', 'de'). Default: 'en'.",
                default: "en"
            },
            sortBy: {
                type: "string",
                description: "Sort articles by 'title' or 'pubdate' (publication date). Default: by relevance.",
                enum: ["title", "pubdate"]
            },
            viewOp: {
                type: "string",
                description: "'view_citation' displays citation details (requires citationId). 'list_colleagues' shows all co-authors.",
                enum: ["view_citation", "list_colleagues"]
            },
            citationId: {
                type: "string",
                description: "Article citation ID (e.g., 'LSsXyncAAAAJ:2osOgNQ5qMEC'). Required when viewOp is 'view_citation'."
            }
        },
        required: ["authorId"]
    }
};

export async function callGetAuthorDetailTool(args: any) {
    try {
        const { authorId, numResults = 20, language, sortBy, viewOp, citationId } = args;

        const apiKey = getEffectiveApiKey(args.apiKey);
        if (!apiKey) {
            return { content: [{ type: "text", text: "Scrapingdog API key is required. Set SCRAPINGDOG_API_KEY environment variable or pass apiKey." }], isError: true };
        }

        if (!authorId) {
            return { content: [{ type: "text", text: "authorId is required." }], isError: true };
        }

        if (viewOp === 'view_citation' && !citationId) {
            return { content: [{ type: "text", text: "citationId is required when viewOp is 'view_citation'." }], isError: true };
        }

        const results = await getAuthorDetail({
            apiKey,
            authorId,
            results: numResults,
            language,
            viewOp,
            sort: sortBy,
            citationId,
        });

        const cited_by = results.cited_by?.table ?? [];
        const citations = cited_by.find(e => 'citations' in e)?.citations;
        const h_index = cited_by.find(e => 'h_index' in e)?.h_index;
        const i10_index = cited_by.find(e => 'i10_index' in e)?.i10_index;

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    author: results.author,
                    totalArticles: results.articles.length,
                    articles: results.articles,
                    citationStats: {
                        citations: citations ?? { all: 0, since_2019: 0 },
                        h_index: h_index ?? { all: 0, since_2019: 0 },
                        i10_index: i10_index ?? { all: 0, since_2019: 0 },
                    },
                    publicAccess: results.public_access,
                    coAuthors: results.co_authors,
                    pagination: results.pagination,
                }, null, 2)
            }]
        };
    } catch (error) {
        return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
    }
}

// ============================================================
// Tool 4: Article Citation
// ============================================================

export const getArticleCitationTool = {
    name: "get_article_citation",
    description: "Get citation metadata (formatted in multiple citation styles) and downloadable citation links (BibTeX, EndNote, RefMan, RefWorks) for a specific Google Scholar article. Use the article ID from search_google_scholar results.",
    inputSchema: {
        type: "object",
        properties: {
            articleId: {
                type: "string",
                description: "The Google Scholar article ID (e.g., 'FDc6HiktlqEJ'). Found in the 'id' field of search_google_scholar results."
            },
            apiKey: {
                type: "string",
                description: "Your Scrapingdog API key. Can also be set via SCRAPINGDOG_API_KEY environment variable."
            },
            language: {
                type: "string",
                description: "Language of results (e.g., 'en', 'es', 'fr', 'de'). Default: 'en'.",
                default: "en"
            }
        },
        required: ["articleId"]
    }
};

export async function callGetArticleCitationTool(args: any) {
    try {
        const { articleId, language } = args;

        const apiKey = getEffectiveApiKey(args.apiKey);
        if (!apiKey) {
            return { content: [{ type: "text", text: "Scrapingdog API key is required. Set SCRAPINGDOG_API_KEY environment variable or pass apiKey." }], isError: true };
        }

        if (!articleId) {
            return { content: [{ type: "text", text: "articleId is required." }], isError: true };
        }

        const results = await getArticleCitation({
            apiKey,
            query: articleId,
            language,
        });

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    articleId,
                    citations: results.citations,
                    downloadLinks: results.links,
                }, null, 2)
            }]
        };
    } catch (error) {
        return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }], isError: true };
    }
}

// ============================================================
// Export all tools for server registration
// ============================================================

export const googleScholarTools = [
    searchScholarTool,
    searchAuthorProfilesTool,
    getAuthorDetailTool,
    getArticleCitationTool,
];
