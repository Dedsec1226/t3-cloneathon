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

    // Optimized shorter system prompt for faster processing
    const systemPrompt = `T3 Chat with real-time web search. Use web_search tool first for current info: news, time queries, prices, events, recent data. The tool will provide a synthesized report that compiles all search results - use this comprehensive analysis as your primary source and build upon it. Include [Source](URL) citations. Make 1-3 focused queries.`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...coreMessages
    ];

    // Get the model from our custom provider
    const languageModel = t3.languageModel(selectedModel);
    
    // Create the response promise
    const responsePromise = (async () => {
      try {
        // Stream the response with ChatGPT-like behavior
        const result = await streamText({
      model: languageModel,
      messages: finalMessages,
      maxTokens: 512, // Optimized for faster streaming (per latency playbook)
      temperature: 0.7,
      maxSteps: 1, // Prevent multiple tool calls - only allow 1 step
      maxToolRoundtrips: 1, // Limit to 1 tool execution to prevent duplicates
      toolChoice: 'required', // Force web search tool usage
      // Add timeout for faster responses with OpenAI models
      ...(selectedModel.includes('gpt') && {
        timeout: 10000,
      }),
      // Throttle Gemini models for natural ChatGPT-like streaming
      ...(selectedModel.includes('gemini') && {
        experimental_streamingChunks: false, // Disable super-fast chunks
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
                // Force fresh results for real-time queries
                includeRawContent: 'text',
                // Optimize for comprehensive content
                maxTokens: 6000, // Increased for better content compilation
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
                      const sanitizedUrl = sanitizeUrl(url);
                      const imageValidation = await isValidImageUrl(sanitizedUrl);
                      return imageValidation.valid
                        ? {
                          url: imageValidation.redirectedUrl || sanitizedUrl,
                          description: description ?? '',
                        }
                        : null;
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

            // **NEW: Add synthesis step - compile all information like ChatGPT**
            let synthesizedReport = '';
            try {
                // Collect all content for synthesis
                const allContent = searchResults.flatMap(search => 
                    search.results.map(result => ({
                        title: result.title,
                        content: result.content,
                        url: result.url,
                        query: search.query
                    }))
                );

                // Only synthesize if we have content
                if (allContent.length > 0) {
                    const contentForSynthesis = allContent
                        .slice(0, 12) // Limit to top 12 results for synthesis
                        .map(item => `**${item.title}**\n${item.content.slice(0, 600)}`)
                        .join('\n\n---\n\n');

                    const { object } = await generateObject({
                        model: languageModel,
                        system: `You are a helpful AI assistant. Based on web search results, provide a natural, conversational response that directly answers the user's question.

RESPONSE GUIDELINES:
1. **Natural Language**: Write in a conversational, ChatGPT-like style
2. **Direct Answers**: Directly address what the user is asking about
3. **Synthesize Information**: Combine information from multiple sources naturally
4. **Current Information**: Focus on the most recent and relevant information
5. **Clear Structure**: Use natural paragraph breaks, not formal headings
6. **Factual Accuracy**: Only use information from the provided sources
7. **Conversational Tone**: Write as if you're having a natural conversation
8. **Helpful Context**: Provide useful background and context naturally

Write a helpful, informative response that feels like a natural conversation rather than a formal report.`,
                        prompt: `Based on the following web search results for queries: "${queries.join(', ')}", provide a natural, helpful response that answers the user's question:

${contentForSynthesis}

Please synthesize this information into a conversational response that directly addresses what the user is looking for.`,
                        schema: z.object({
                            synthesizedReport: z.string().describe("A natural, conversational response that synthesizes the web search information to directly answer the user's question in a ChatGPT-like style"),
                            keyPoints: z.array(z.string()).describe("3-5 main takeaways from the search results"),
                            summary: z.string().describe("A brief summary of the key information found")
                        }),
                    });

                    synthesizedReport = object.synthesizedReport;
                }
            } catch (error) {
                console.error('Error during information synthesis:', error);
            }

            return {
                searches: searchResults,
                synthesizedReport: synthesizedReport || null,
                hasContent: searchResults.some(search => search.results.length > 0)
            };
          },
        }),
      },
    });
    
    // Create the response with proper streaming headers
    const response = result.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
        'X-Accel-Buffering': 'no',
      },
    });
    
    return response;
      } catch (error) {
        throw error;
      }
    })();
    
    // Track the active request
    activeRequests.set(requestKey, responsePromise);
    
    // Clean up active request after completion
    responsePromise.finally(() => {
      activeRequests.delete(requestKey);
    });
    
    const finalResponse = await responsePromise;
    return finalResponse;
    
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