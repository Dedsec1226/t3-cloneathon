// Using Node.js runtime due to @tavily/core requiring Node.js modules (http, https)
export const runtime = 'nodejs';

import { streamText, tool } from 'ai';
import { t3 } from '@/ai/providers';
import { NextRequest } from 'next/server';
import { serverEnv } from '@/env/server';
import { tavily } from '@tavily/core';
import { z } from 'zod';
import { generateTitleFromUserMessage } from '@/app/actions';
import { updateChatTitleById, getChatById, createChatIfNotExists } from '@/lib/db/queries';
import { generateChatTitle } from '@/lib/chat-utils';
import { convex } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import { auth } from '@clerk/nextjs/server';

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

    // Get final URL after redirects
    const redirectedUrl = response.redirected ? response.url : undefined;

    // Check content type
    const contentType = response.headers.get('content-type');
    const isImageValid = response.ok && contentType !== null && contentType.startsWith('image/');
    
    return { valid: isImageValid, redirectedUrl };
  } catch {
    return { valid: false };
  }
}

const extractDomain = (url: string): string => {
  const urlPattern = /^https?:\/\/([^/?#]+)(?:[/?#]|$)/i;
  return url.match(urlPattern)?.[1] || url;
};

const deduplicateByDomainAndUrl = <T extends { url: string }>(items: T[]): T[] => {
  const seenDomains = new Set<string>();
  const seenUrls = new Set<string>();

  return items.filter(item => {
    const domain = extractDomain(item.url);
    const isNewUrl = !seenUrls.has(item.url);
    const isNewDomain = !seenDomains.has(domain);

    if (isNewUrl && isNewDomain) {
      seenUrls.add(item.url);
      seenDomains.add(domain);
      return true;
    }
    return false;
  });
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model, group, timezone } = body;

    console.log('Web API Request received:', {
      model,
      group,
      messagesLength: messages?.length,
      timezone
    });

    // Use default model if none specified
    const selectedModel = model || 't3-4o';
    console.log('Using model for web search:', selectedModel);

    // Convert messages to the correct format
    const coreMessages = messages.map((msg: { role: string; content: string | object }) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }));

    // Add system message for web search capabilities
    const systemPrompt = `You are T3 Chat with web search capabilities. You have access to real-time web search through Tavily. When users ask questions that require current information, you should search the web to provide accurate, up-to-date answers.

Use the web_search tool for:
- Current events and news
- Recent data, statistics, or research
- Real-time information (prices, weather, stock prices)
- Specific facts about people, companies, or events
- Any information that might have changed recently

Always search the web when the user's question requires current or specific information that you might not have in your training data.`;

    const finalMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...coreMessages
    ];

    // Get the model from our custom provider
    const languageModel = t3.languageModel(selectedModel);

    // Stream the response with web search capabilities
    const result = await streamText({
      model: languageModel,
      messages: finalMessages,
      maxTokens: 512, // Optimized for faster streaming
      temperature: 0.7,
      // Force tool usage for web search
      toolChoice: 'auto',
      // Optimizations for OpenAI models
      ...(selectedModel.includes('gpt') && {
        timeout: 10000,
      }),
      onFinish: async (event) => {
        console.log('Web route finished:', event.finishReason);
        
        // Generate title if this is the first conversation (first user message and assistant response)
        const userMessages = messages.filter((msg: { role: string }) => msg.role === 'user');
        const chatId = body.id;
        
        // Check if this is the first user message (only 1 user message in the conversation)
        if (userMessages.length === 1 && chatId && event.finishReason !== 'error') {
          try {
            console.log('🎯 GENERATING TITLE for first conversation in web chat:', chatId);
            
            const firstUserMessage = userMessages[0];
            const assistantResponse = event.text || '';
            
            console.log('Web route - Assistant response length:', assistantResponse.length);
            console.log('Web route - Assistant response preview:', assistantResponse.slice(0, 100));
            
            // Create a more comprehensive prompt for title generation
            const titlePrompt = {
              id: 'temp-id',
              role: 'user' as const,
              content: `User asked: "${firstUserMessage.content}"\nAssistant responded: "${assistantResponse.slice(0, 200)}..."`,
              parts: [{ 
                type: 'text' as const, 
                text: `User: ${firstUserMessage.content}\nAssistant: ${assistantResponse.slice(0, 200)}...`
              }]
            };
            
            console.log('Web route - Title prompt created:', titlePrompt.content);
            
            // Generate title from the conversation context using AI
            const aiTitle = await generateTitleFromUserMessage({
              message: titlePrompt
            });
            
            console.log('Web route - AI generated title:', aiTitle);
            
            // Fallback to utility function if AI generation fails
            const finalTitle = aiTitle || generateChatTitle(firstUserMessage.content);
            
            console.log('Web route - Final title to save:', finalTitle);
            
            // Create chat if it doesn't exist and update title
            await createChatIfNotExists({
              chatId: chatId,
              title: finalTitle,
              firstUserMessage: firstUserMessage.content,
              assistantResponse: assistantResponse
            });
            
            console.log('✅ Web route - Successfully created/updated chat');
          } catch (error) {
            console.error('❌ Web route - Error generating/updating chat title:', error);
            // Continue without failing the entire request
          }
        } else {
          console.log('⏭️ Web route - Skipping title generation - not first message or missing requirements');
          console.log('Web route - Conditions:', {
            userMessagesLength: userMessages.length,
            hasChatId: !!chatId,
            finishReason: event.finishReason
          });
        }
      },
      tools: {
        web_search: tool({
          description: 'Search the web for information with multiple queries, max results and search depth.',
          parameters: z.object({
            queries: z.array(z.string().describe('Array of search queries to look up on the web. Default is 3 to 5 queries.')),
            maxResults: z.array(
              z.number().describe('Array of maximum number of results to return per query. Default is 10.'),
            ),
            topics: z.array(
              z.enum(['general', 'news', 'finance']).describe('Array of topic types to search for. Default is general.'),
            ),
            searchDepth: z.array(
              z.enum(['basic', 'advanced']).describe('Array of search depths to use. Default is basic. Use advanced for more detailed results.'),
            ),
            include_domains: z
              .array(z.string())
              .describe('A list of domains to include in all search results. Default is an empty list.'),
            exclude_domains: z
              .array(z.string())
              .describe('A list of domains to exclude from all search results. Default is an empty list.'),
          }),
          execute: async ({
            queries,
            maxResults,
            topics,
            searchDepth,
            include_domains,
            exclude_domains,
          }: {
            queries: string[];
            maxResults: number[];
            topics: ('general' | 'news' | 'finance')[];
            searchDepth: ('basic' | 'advanced')[];
            include_domains?: string[];
            exclude_domains?: string[];
          }) => {
            const apiKey = serverEnv.TAVILY_API_KEY;
            const tvly = tavily({ apiKey });
            const includeImageDescriptions = true;

            console.log('Web search queries:', queries);

            // Execute searches in parallel
            const searchPromises = queries.map(async (query, index) => {
              const data = await tvly.search(query, {
                topic: topics[index] || topics[0] || 'general',
                days: topics[index] === 'news' ? 7 : undefined,
                maxResults: maxResults[index] || maxResults[0] || 10,
                searchDepth: searchDepth[index] || searchDepth[0] || 'basic',
                includeAnswer: true,
                includeImages: true,
                includeImageDescriptions: includeImageDescriptions,
                excludeDomains: exclude_domains || undefined,
                includeDomains: include_domains || undefined,
              });

              return {
                query,
                results: deduplicateByDomainAndUrl(data.results).map((obj: { url: string; title: string; content: string; published_date?: string }) => ({
                  url: obj.url,
                  title: obj.title,
                  content: obj.content,
                  published_date: topics[index] === 'news' ? obj.published_date : undefined,
                })),
                images: includeImageDescriptions
                  ? await Promise.all(
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
                  )
                  : await Promise.all(
                    deduplicateByDomainAndUrl(data.images).map(async ({ url }: { url: string }) => {
                      const sanitizedUrl = sanitizeUrl(url);
                      const imageValidation = await isValidImageUrl(sanitizedUrl);
                      return imageValidation.valid ? (imageValidation.redirectedUrl || sanitizedUrl) : null;
                    }),
                  ).then((results) => results.filter((url) => url !== null) as string[]),
              };
            });

            const searchResults = await Promise.all(searchPromises);

            // Check if we have meaningful results
            const totalResults = searchResults.reduce((sum, search) => sum + search.results.length, 0);

            if (totalResults > 0) {
              // Create a comprehensive compilation of all sources
              const sourceCompilations = searchResults.map((search) => {
                if (search.results.length === 0) return null;
                
                const sourceTexts = search.results.map((result) => {
                  // Extract key information from each source
                  const truncatedContent = result.content.length > 400 
                    ? result.content.substring(0, 400) + "..."
                    : result.content;
                  
                  return `**${result.title}**\n${truncatedContent}\nSource: ${result.url}`;
                }).join('\n\n---\n\n');

                return `## Results for: "${search.query}"\n\n${sourceTexts}`;
              }).filter(Boolean);

              if (sourceCompilations.length > 0) {
                const compiledSources = sourceCompilations.join('\n\n═══════════════════════════════════════\n\n');
                
                return {
                  searches: searchResults,
                  synthesizedReport: `# Web Search Results\n\n${compiledSources}`,
                  hasContent: true
                };
              }
            }

            return {
              searches: searchResults,
              synthesizedReport: null,
              hasContent: totalResults > 0
            };
          },
        }),
      },
    });

    // Return the streaming response
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
    console.error('Web API Error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
} 