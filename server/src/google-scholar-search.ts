import axios from 'axios';

// ============================================================
// Shared response types
// ============================================================

export interface InlineLinks {
    versions?: {
        total: string;
        link: string;
        cluster_id: string;
    };
    cited_by?: {
        total: string;
        link: string;
        cites_id: string;
    };
    related_pages_link?: string;
}

export interface ScholarResult {
    title: string;
    title_link: string;
    id: string;
    displayed_link: string;
    snippet: string;
    type?: string;
    inline_links: InlineLinks;
    resources?: Array<{ title: string; type: string; link: string }>;
}

export interface RelatedSearch {
    title: string;
    link: string;
}

export interface PaginationPage {
    [key: string]: string;
}

export interface Pagination {
    current: number;
    page_no: PaginationPage;
}

export interface ScrapingdogPagination {
    current: number;
    page_no: PaginationPage;
}

// ============================================================
// Tool 1: Scholar Search (google_scholar)
// ============================================================

export interface ScholarSearchResponse {
    related_searches: RelatedSearch[];
    scholar_results: ScholarResult[];
    pagination: Pagination;
    scrapingdog_pagination: ScrapingdogPagination;
}

export interface ScholarSearchOptions {
    apiKey: string;
    query?: string;
    cites?: string;
    cluster?: string;
    as_ylo?: string;
    as_yhi?: string;
    scisbd?: string;
    language?: string;
    lr?: string;
    page?: string;
    results?: number;
    as_sdt?: string;
    safe?: string;
    filter?: string;
    as_vis?: string;
    as_rr?: string;
    html?: boolean;
}

export async function searchGoogleScholar(options: ScholarSearchOptions): Promise<ScholarSearchResponse> {
    const {
        apiKey,
        query,
        results = 10,
        cites,
        cluster,
        as_ylo,
        as_yhi,
        scisbd,
        language,
        lr,
        page = "0",
        as_sdt,
        safe,
        filter,
        as_vis,
        as_rr,
        html = false,
    } = options;

    if (!apiKey) {
        throw new Error("Scrapingdog API key is required");
    }

    if (!query && !cites && !cluster) {
        throw new Error("At least one of 'query', 'cites', or 'cluster' must be provided");
    }

    const params: Record<string, string | number | boolean> = {
        api_key: apiKey,
        results,
        page,
        html,
    };

    if (query) params.query = query;
    if (cites) params.cites = cites;
    if (cluster) params.cluster = cluster;
    if (as_ylo) params.as_ylo = as_ylo;
    if (as_yhi) params.as_yhi = as_yhi;
    if (scisbd) params.scisbd = scisbd;
    if (language) params.language = language;
    if (lr) params.lr = lr;
    if (as_sdt) params.as_sdt = as_sdt;
    if (safe) params.safe = safe;
    if (filter) params.filter = filter;
    if (as_vis) params.as_vis = as_vis;
    if (as_rr) params.as_rr = as_rr;

    try {
        const response = await axios.get<ScholarSearchResponse>(
            'https://api.scrapingdog.com/google_scholar',
            { params }
        );
        return response.data;
    } catch (error) {
        throw apiError(error, 'Scholar Search');
    }
}

// ============================================================
// Tool 2: Author Profiles Search (google_scholar/profiles)
// ============================================================

export interface ProfileInterest {
    title: string;
    link: string;
    scrapingdog_link: string;
}

export interface AuthorProfile {
    title: string;
    link: string;
    scrapingdog_link: string;
    author_id: string;
    affiliations: string;
    email: string;
    cited_by: number;
    thumbnail: string;
    interests: ProfileInterest[];
}

export interface ProfileSearchResponse {
    profiles: AuthorProfile[];
    pagination: {
        next: string | null;
        next_page_token: string | null;
        previous: string | null;
        previous_page_token: string | null;
    };
}

export interface ProfileSearchOptions {
    apiKey: string;
    mauthors: string;
    afterAuthor?: string;
    beforeAuthor?: string;
}

export async function searchAuthorProfiles(options: ProfileSearchOptions): Promise<ProfileSearchResponse> {
    const { apiKey, mauthors, afterAuthor, beforeAuthor } = options;

    if (!apiKey) {
        throw new Error("Scrapingdog API key is required");
    }

    if (!mauthors) {
        throw new Error("mauthors (author name search) is required");
    }

    const params: Record<string, string> = {
        api_key: apiKey,
        mauthors,
    };

    if (afterAuthor) params.after_author = afterAuthor;
    if (beforeAuthor) params.before_author = beforeAuthor;

    try {
        const response = await axios.get<ProfileSearchResponse>(
            'https://api.scrapingdog.com/google_scholar/profiles',
            { params }
        );
        return response.data;
    } catch (error) {
        throw apiError(error, 'Author Profiles Search');
    }
}

// ============================================================
// Tool 3: Author Detail (google_scholar/author)
// ============================================================

export interface AuthorInterest {
    title: string;
    link: string;
}

export interface AuthorInfo {
    name: string;
    affiliations: string;
    email: string;
    interests: AuthorInterest[];
    thumbnail: string;
}

export interface ArticleCitedBy {
    value: string;
    link: string;
    scrapingdog_link: string;
    citation_id: string;
}

export interface AuthorArticle {
    title: string;
    link: string;
    citation_id: string;
    authors: string;
    publication: string;
    cited_by: ArticleCitedBy;
    year: string;
}

export interface AuthorCitationStats {
    all: number;
    since_2019: number;
}

export interface HIndexStat {
    all: number;
    since_2019: number;
}

export interface I10IndexStat {
    all: number;
    since_2019: number;
}

export type CitedByTableEntry =
    | { citations: AuthorCitationStats; h_index?: never; i10_index?: never }
    | { citations?: never; h_index: HIndexStat; i10_index?: never }
    | { citations?: never; h_index?: never; i10_index: I10IndexStat };

export interface PublicAccess {
    link: string;
    available: string;
    not_available: string;
}

export interface CoAuthor {
    name: string;
    link: string;
    scrapingdog_link: string;
    author_id: string;
    affiliations: string;
    emails: string;
}

export interface AuthorDetailResponse {
    author: AuthorInfo;
    articles: AuthorArticle[];
    cited_by: {
        table: CitedByTableEntry[];
        graph: Array<{ year: string; citations: string }>;
    };
    public_access: PublicAccess;
    co_authors: CoAuthor[];
    pagination: {
        next: string | null;
    };
}

export interface AuthorDetailOptions {
    apiKey: string;
    authorId: string;
    results?: number;
    language?: string;
    viewOp?: 'view_citation' | 'list_colleagues';
    sort?: 'title' | 'pubdate';
    citationId?: string;
}

export async function getAuthorDetail(options: AuthorDetailOptions): Promise<AuthorDetailResponse> {
    const { apiKey, authorId, results, language, viewOp, sort, citationId } = options;

    if (!apiKey) {
        throw new Error("Scrapingdog API key is required");
    }

    if (!authorId) {
        throw new Error("authorId is required");
    }

    const params: Record<string, string | number> = {
        api_key: apiKey,
        author_id: authorId,
    };

    if (results !== undefined) params.results = results;
    if (language) params.language = language;
    if (viewOp) params.view_op = viewOp;
    if (sort) params.sort = sort;
    if (citationId) params.citation_id = citationId;

    try {
        const response = await axios.get<AuthorDetailResponse>(
            'https://api.scrapingdog.com/google_scholar/author',
            { params }
        );
        return response.data;
    } catch (error) {
        throw apiError(error, 'Author Detail');
    }
}

// ============================================================
// Tool 4: Article Citation (google_scholar/cite)
// ============================================================

export interface CitationFormat {
    title: string;
    snippet: string;
}

export interface CitationLink {
    name: string;
    link: string;
}

export interface ArticleCitationResponse {
    citations: CitationFormat[];
    links: CitationLink[];
}

export interface ArticleCitationOptions {
    apiKey: string;
    query: string;
    language?: string;
}

export async function getArticleCitation(options: ArticleCitationOptions): Promise<ArticleCitationResponse> {
    const { apiKey, query, language } = options;

    if (!apiKey) {
        throw new Error("Scrapingdog API key is required");
    }

    if (!query) {
        throw new Error("query (article ID) is required");
    }

    const params: Record<string, string> = {
        api_key: apiKey,
        query,
    };

    if (language) params.language = language;

    try {
        const response = await axios.get<ArticleCitationResponse>(
            'https://api.scrapingdog.com/google_scholar/cite',
            { params }
        );
        return response.data;
    } catch (error) {
        throw apiError(error, 'Article Citation');
    }
}

// ============================================================
// Shared error handler
// ============================================================

function apiError(error: unknown, context: string): Error {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        if (status === 401 || status === 403) {
            return new Error(`${context} failed: API authentication failed (${status}): ${message}`);
        }
        if (status === 429) {
            return new Error(`${context} failed: API rate limit exceeded. Please wait and try again.`);
        }
        return new Error(`${context} failed (${status}): ${message}`);
    }
    return new Error(`${context} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
