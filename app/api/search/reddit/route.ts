export const runtime = 'edge';

import { streamText, tool } from 'ai';
import { t3 } from '@/ai/providers';
import { NextRequest } from 'next/server';
import { serverEnv } from '@/env/server';
import { z } from 'zod';
import { tavily } from '@tavily/core';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model } = body;

    console.log('Reddit Search API Request received');

    // Default to GPT-4o for Reddit search
    const selectedModel = model || 't3-4o';
    
    // Convert messages to the correct format
    const coreMessages = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }));

    // Reddit search system prompt
    const systemPrompt = `You are T3 Chat with Reddit search capabilities. You help users find relevant Reddit discussions, community opinions, and user-generated content.

Use Reddit search when users ask about:
- Community opinions and discussions
- User experiences and reviews
- Troubleshooting and technical help
- Recommendations from real users
- Current trends and viral content
- Specific subreddit discussions
- Questions that benefit from crowd-sourced answers

Always provide context about the subreddit source, discussion quality, and summarize key points from the community discussions found.`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...coreMessages
    ];

    // Get the model from our custom provider
    const languageModel = t3.languageModel(selectedModel);

    // Stream the response with Reddit search tools
    const result = await streamText({
      model: languageModel,
      messages: finalMessages,
      tools: {
        reddit_search: tool({
          description: 'Search Reddit content using Tavily API.',
          parameters: z.object({
            query: z.string().describe('The exact search query from the user.'),
            maxResults: z.number().describe('Maximum number of results to return. Default is 20.'),
            timeRange: z.enum(['day', 'week', 'month', 'year']).describe('Time range for Reddit search.'),
          }),
          execute: async ({
            query,
            maxResults = 20,
            timeRange = 'week',
          }: {
            query: string;
            maxResults?: number;
            timeRange?: 'day' | 'week' | 'month' | 'year';
          }) => {
            const apiKey = serverEnv.TAVILY_API_KEY;
            const tvly = tavily({ apiKey });

            console.log('Reddit search query:', query);
            console.log('Max results:', maxResults);
            console.log('Time range:', timeRange);

            try {
              const data = await tvly.search(query, {
                maxResults: maxResults,
                timeRange: timeRange,
                includeRawContent: "text",
                searchDepth: 'basic',
                topic: 'general',
                includeDomains: ["reddit.com"],
              });

              console.log("Reddit search data:", data);

              // Process results for better display
              const processedResults = data.results.map(result => {
                // Extract Reddit post metadata
                const isRedditPost = result.url.includes('/comments/');
                const subreddit = isRedditPost ?
                  result.url.match(/reddit\.com\/r\/([^/]+)/)?.[1] || 'unknown' :
                  'unknown';

                // Don't attempt to parse comments - treat content as a single snippet
                // The Tavily API already returns short content snippets
                return {
                  url: result.url,
                  title: result.title,
                  content: result.content || '',
                  score: result.score,
                  published_date: result.publishedDate,
                  subreddit,
                  isRedditPost,
                  // Keep original content as a single comment/snippet
                  comments: result.content ? [result.content] : []
                };
              });

              return {
                query,
                results: processedResults,
                timeRange,
              };
            } catch (error) {
              console.error('Reddit search error:', error);
              throw error;
            }
          },
        }),
      },
      maxSteps: 2,
      temperature: 0.7,
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
    console.error('Reddit Search API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process Reddit search request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 