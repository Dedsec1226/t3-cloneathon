// Using Node.js runtime due to @tavily/core requiring Node.js modules (http, https)
export const runtime = 'nodejs';

import { streamText, tool, generateObject } from 'ai';
import { t3 } from '@/ai/providers';
import { NextRequest } from 'next/server';
import { serverEnv } from '@/env/server';
import { tavily } from '@tavily/core';
import { z } from 'zod';

interface SearchResult {
  url: string;
  title: string;
  content: string;
  published_date?: string;
}

interface SearchImage {
  url: string;
  description: string;
}

interface MultiSearchResponse {
  searches: Array<{
    query: string;
    results: SearchResult[];
    images: SearchImage[];
  }>;
  synthesizedReport?: string | null;
  hasContent?: boolean;
}

function sanitizeUrl(url: string): string {
  return url.replace(/\s+/g, '%20');
}

async function isValidImageUrl(url: string): Promise<{ valid: boolean; redirectedUrl?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (compatible; ImageValidator/1.0)'
      },
      redirect: 'follow'
    });

    clearTimeout(timeout);

    const redirectedUrl = response.redirected ? response.url : undefined;
    
    if (!response.ok) {
      return { valid: false };
    }

    const contentType = response.headers.get('content-type') || '';
    const isImage = contentType.startsWith('image/');
    
    return { valid: isImage, redirectedUrl };
  } catch (error) {
    return { valid: false };
  }
}

const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

const deduplicateByDomainAndUrl = <T extends { url: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${extractDomain(item.url)}-${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// Only track active requests to prevent duplicate network calls for identical simultaneous requests
const activeRequests = new Map<string, Promise<Response>>();

// Basic rate limiting - prevent abuse
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Cleanup old rate limit counters
setInterval(() => {
  const now = Date.now();
  for (const [key, count] of requestCounts.entries()) {
    if (now > count.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Run cleanup every minute

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model } = body;

    const lastMessage = messages?.slice(-1)[0];
    const messageContent = lastMessage?.content || lastMessage?.parts?.[0]?.text || '';
    
    // Create a unique request key based on the exact message content and timing
    // This prevents duplicate simultaneous requests but allows each new question to be processed
    const requestKey = JSON.stringify({ 
      content: messageContent.trim(),
      model: model || 't3-4o',
      messagesLength: messages?.length || 0,
      timestamp: Math.floor(Date.now() / 1000) // Round to nearest second to allow very brief deduplication
    });
    
    // Only prevent duplicate simultaneous requests (within same second)
    if (activeRequests.has(requestKey)) {
      console.log('Identical request already in progress, returning existing promise');
      return await activeRequests.get(requestKey)!;
    }

    // Simple rate limiting - max 10 requests per minute to be more lenient for follow-up questions
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const rateLimitKey = `${clientIP}-${Math.floor(Date.now() / 60000)}`; // Per minute window
    const now = Date.now();
    const rateLimitWindow = 60000; // 1 minute
    
    let requestCount = requestCounts.get(rateLimitKey);
    if (!requestCount || now > requestCount.resetTime) {
      requestCount = { count: 1, resetTime: now + rateLimitWindow };
    } else {
      requestCount.count++;
    }
    
    if (requestCount.count > 10) {
      console.log('Rate limit exceeded, blocking request');
      return new Response(JSON.stringify({ error: 'Too many requests. Please wait a moment before asking another question.' }), { 
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    requestCounts.set(rateLimitKey, requestCount);

    console.log('Web Search API Request received');
    console.log('Query:', messageContent);
    console.log('Request count this minute:', requestCount.count);

    // Default to t3-4o if no model specified
    const selectedModel = model || 't3-4o';
    
    // Convert messages to the correct format
    const coreMessages = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }));

    // Enhanced system prompt for ChatGPT-like source compilation behavior
    const systemPrompt = `T3 Chat with real-time web search capabilities.

TODAY'S DATE: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}
CURRENT YEAR: ${new Date().getFullYear()}
CURRENT TIME: ${new Date().toLocaleTimeString("en-US", { timeZoneName: "short" })}

You have access to real-time web search and should prioritize current, up-to-date information from ${new Date().getFullYear()}.

IMPORTANT: When using web_search:
1. FIRST, display the synthesizedReport exactly as provided - this shows users the compilation of sources found (like ChatGPT does)
2. THEN provide your comprehensive answer based on that information
3. Always include [Source](URL) citations in your final response
4. Use 1-3 focused search queries for best results
5. For date/time questions, always use the current date information provided above
6. For current events, search for the latest ${new Date().getFullYear()} information

The synthesizedReport contains a textual compilation of all sources found and should be shown to users before your analysis.`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...coreMessages
    ];

    // Get the model from our custom provider
    const languageModel = t3.languageModel(selectedModel);
    
        // Stream the response with ChatGPT-like behavior
    const result = await streamText({
      model: languageModel,
      messages: finalMessages,
      maxTokens: 512, // Optimized for faster streaming
      temperature: 0.7,
      maxSteps: 1, // Prevent multiple tool calls
      toolChoice: 'auto', // Allow model to choose when to use web search
      // Add timeout for faster responses with OpenAI models
      ...(selectedModel.includes('gpt') && {
        timeout: 10000,
      }),
      // Throttle Gemini models for natural ChatGPT-like streaming
      ...(selectedModel.includes('gemini') && {
        experimental_streamingChunks: false,
      }),
      tools: {
        web_search: tool({
          description: 'Search the web for current information. Use this tool first to gather data, then provide a comprehensive textual response synthesizing the findings.',
          parameters: z.object({
            queries: z.array(z.string().describe('Array of 1-3 search queries to look up on the web. Make queries specific and focused.')),
            maxResults: z.array(z.number().describe('Array of maximum number of results to return per query. Default is 8.')),
            topics: z.array(z.enum(['general', 'news', 'finance']).describe('Array of topic types to search for. Default is general.')),
            searchDepth: z.array(z.enum(['basic', 'advanced']).describe('Array of search depths to use. Default is basic.')),
          }),
          execute: async ({
            queries,
            maxResults,
            topics,
            searchDepth,
          }: {
            queries: string[];
            maxResults: number[];
            topics: ('general' | 'news' | 'finance')[];
            searchDepth: ('basic' | 'advanced')[];
          }) => {
            try {
              const apiKey = serverEnv.TAVILY_API_KEY;
              const tvly = tavily({ apiKey });

              console.log('Web Search Queries:', queries);

              // Execute searches in parallel
              const searchPromises = queries.map(async (query, index) => {
                const data = await tvly.search(query, {
                  topic: topics[index] || topics[0] || 'general',
                  days: topics[index] === 'news' ? 7 : undefined,
                  maxResults: maxResults[index] || maxResults[0] || 8,
                  searchDepth: searchDepth[index] || searchDepth[0] || 'basic',
                  includeAnswer: true,
                  includeImages: true,
                  includeImageDescriptions: true,
                  includeRawContent: 'text',
                  maxTokens: 6000,
                });

                return {
                  query,
                  results: deduplicateByDomainAndUrl(data.results).map((obj: any) => ({
                    url: obj.url,
                    title: obj.title,
                    content: obj.content,
                    published_date: topics[index] === 'news' ? obj.published_date : undefined,
                  })),
                  images: await Promise.all(
                    deduplicateByDomainAndUrl(data.images).map(
                      async ({ url, description }: { url: string; description?: string }) => {
                        try {
                          const sanitizedUrl = sanitizeUrl(url);
                          const imageValidation = await isValidImageUrl(sanitizedUrl);
                          return imageValidation.valid
                            ? {
                              url: imageValidation.redirectedUrl || sanitizedUrl,
                              description: description ?? '',
                            }
                            : null;
                        } catch {
                          return null;
                        }
                      },
                    ),
                  ).then((results) =>
                    results.filter(
                      (image): image is { url: string; description: string } =>
                        image !== null &&
                        typeof image === 'object' &&
                        typeof image.description === 'string' &&
                        image.description !== '',
                    ),
                  ),
                };
              });

              const searchResults = await Promise.all(searchPromises);

              // **ENHANCED: Create ChatGPT-like textual compilation of sources**
              const totalResults = searchResults.reduce((total, search) => total + search.results.length, 0);
              
              let synthesizedReport = null;
              if (totalResults > 0) {
                // Create a comprehensive compilation of all sources
                const sourceCompilations = searchResults.map((search, searchIndex) => {
                  if (search.results.length === 0) return null;
                  
                  const sourceTexts = search.results.map((result, resultIndex) => {
                    // Extract key information from each source
                    const truncatedContent = result.content.length > 400 
                      ? result.content.substring(0, 400) + "..."
                      : result.content;
                    
                    return `**${result.title}** (${new URL(result.url).hostname})
${truncatedContent}`;
                  }).join('\n\n');
                  
                  return `### Query: "${search.query}"
${sourceTexts}`;
                }).filter(Boolean);

                synthesizedReport = `## 📊 Information Gathered from ${totalResults} Sources

${sourceCompilations.join('\n\n---\n\n')}

---

*This compilation represents the key information found across all searched sources. The AI will now analyze this information to provide a comprehensive response.*`;
              }

              return {
                searches: searchResults,
                synthesizedReport,
                hasContent: searchResults.some(search => search.results.length > 0)
              };
            } catch (error) {
              console.error('Web search tool error:', error);
              return {
                searches: [],
                synthesizedReport: 'Error occurred during web search',
                hasContent: false
              };
            }
          },
        }),
      },
    });
    
    // Create the response with proper streaming headers
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
        'X-Accel-Buffering': 'no',
      },
    });
    
  } catch (error) {
    console.error('Web Search API Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
        }
      }
    );
  }
} 