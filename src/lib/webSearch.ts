export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
  source: string;
  publishedDate?: string;
}

/**
 * Heuristic classifier to determine whether a user prompt likely requires
 * live external web information (e.g. current events, latest versions, real-world facts).
 */
export function requiresLiveWebSearch(query: string): boolean {
  const q = query.toLowerCase();

  const liveIndicators = [
    'latest',
    'current',
    'news',
    'today',
    'recent',
    'update',
    'release',
    'version',
    'who won',
    'weather',
    'price',
    'stock',
    'live',
    '2024',
    '2025',
    '2026',
    'schedule',
    'happening',
    'newest',
    'google',
    'microsoft',
    'openai',
    'nvidia',
    'python',
    'javascript',
    'react',
    'trending',
  ];

  return liveIndicators.some((word) => q.includes(word));
}

/**
 * Searches Wikipedia's official MediaWiki search API.
 * High reliability, zero rate limits, authoritative results.
 */
async function searchWikipedia(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&format=json&origin=*`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EduTrack-AI-Agent/1.0 (academic-edu-bot@university.edu)',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const items = data?.query?.search;
      if (Array.isArray(items)) {
        for (const item of items.slice(0, 3)) {
          const cleanSnippet = (item.snippet || '')
            .replace(/<[^>]+>/g, '')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, '&')
            .trim();

          const pageTitle = item.title;
          const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(
            pageTitle.replace(/\s+/g, '_')
          )}`;

          if (cleanSnippet.length > 20) {
            results.push({
              title: pageTitle,
              snippet: cleanSnippet,
              url: pageUrl,
              source: 'Wikipedia (Authoritative Knowledge)',
              publishedDate: item.timestamp
                ? new Date(item.timestamp).toLocaleDateString()
                : undefined,
            });
          }
        }
      }
    }
  } catch {
    // Continue to next search provider
  }
  return results;
}

/**
 * Searches DuckDuckGo HTML for real-time web results.
 */
async function searchDuckDuckGoHtml(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);

    const bodyParams = new URLSearchParams({ q: query, b: '' });
    const res = await fetch('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      body: bodyParams.toString(),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const html = await res.text();
      const snippetMatches = [
        ...html.matchAll(
          /<a class="result__url" href="([^"]+)">[\s\S]*?<\/a>[\s\S]*?<a class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/g
        ),
      ];

      for (let i = 0; i < Math.min(snippetMatches.length, 3); i++) {
        const match = snippetMatches[i];
        let rawUrl = match[1] || '';
        if (rawUrl.startsWith('//duckduckgo.com/l/?uddg=')) {
          const encoded = rawUrl.split('uddg=')[1]?.split('&')[0];
          if (encoded) rawUrl = decodeURIComponent(encoded);
        } else if (rawUrl.startsWith('//')) {
          rawUrl = `https:${rawUrl}`;
        }

        const rawSnippet = match[2]
          ?.replace(/<[^>]+>/g, '')
          ?.replace(/&amp;/g, '&')
          ?.replace(/&quot;/g, '"')
          ?.replace(/&#39;/g, "'")
          ?.replace(/&lt;/g, '<')
          ?.replace(/&gt;/g, '>')
          ?.trim();

        if (rawSnippet && rawUrl && rawSnippet.length > 20) {
          try {
            const parsedUrl = new URL(rawUrl);
            results.push({
              title: parsedUrl.hostname.replace(/^www\./, ''),
              snippet: rawSnippet,
              url: rawUrl,
              source: parsedUrl.hostname,
            });
          } catch {
            // Ignore malformed URL
          }
        }
      }
    }
  } catch {
    // Continue
  }
  return results;
}

/**
 * Searches DuckDuckGo Instant Answer API.
 */
async function searchDuckDuckGoInstant(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  try {
    const endpoint = `https://api.duckduckgo.com/?q=${encodeURIComponent(
      query
    )}&format=json&no_html=1&skip_disambig=1`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EduTrack-AI/1.0 (Mozilla/5.0 compatible)',
      },
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data.AbstractText && data.AbstractURL) {
        results.push({
          title: data.Heading || query,
          snippet: data.AbstractText,
          url: data.AbstractURL,
          source: data.AbstractSource || 'DuckDuckGo Instant',
        });
      }
    }
  } catch {
    // Continue
  }
  return results;
}

/**
 * Searches Brave Search API if an optional BRAVE_SEARCH_API_KEY is configured.
 */
async function searchBrave(query: string, apiKey: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=4`,
      {
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': apiKey,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const webResults = data.web?.results || [];
      return webResults.map((r: { title: string; description: string; url: string }) => ({
        title: r.title,
        snippet: r.description,
        url: r.url,
        source: new URL(r.url).hostname,
      }));
    }
  } catch {
    // Fall back
  }
  return [];
}

/**
 * Unified live web search service combining Wikipedia and multi-engine web search.
 * Returns up to maxResults high-confidence authoritative search results.
 */
export async function executeLiveWebSearch(
  query: string,
  maxResults = 4
): Promise<SearchResult[]> {
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;
  if (braveKey && braveKey.trim() !== '') {
    const braveResults = await searchBrave(query, braveKey);
    if (braveResults.length > 0) return braveResults.slice(0, maxResults);
  }

  // Parallel fetch: Wikipedia + DuckDuckGo HTML + DuckDuckGo Instant
  const [wikiResults, htmlResults, instantResults] = await Promise.all([
    searchWikipedia(query),
    searchDuckDuckGoHtml(query),
    searchDuckDuckGoInstant(query),
  ]);

  const combined: SearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const r of [...wikiResults, ...htmlResults, ...instantResults]) {
    if (r.url && !seenUrls.has(r.url) && r.snippet.length > 15) {
      seenUrls.add(r.url);
      combined.push(r);
    }
    if (combined.length >= maxResults) break;
  }

  return combined;
}
