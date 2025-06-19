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

    console.log('X Search API Request received');

    // Default to GPT-4o for X search
    const selectedModel = model || 't3-4o';
    
    // Convert messages to the correct format
    const coreMessages = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }));

    // X search system prompt
    const systemPrompt = `You are T3 Chat with X (Twitter) search capabilities. You help users find relevant tweets, trending topics, and real-time social media discussions.

Use X search when users ask about:
- Current events and breaking news
- Public opinion and social sentiment
- Trending topics and hashtags
- Real-time reactions to events
- Social media discussions
- Public figures' latest posts
- Viral content and memes

Always provide context about the timeline, engagement metrics when available, and summarize key themes from the social media discussions found.`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...coreMessages
    ];

    // Get the model from our custom provider
    const languageModel = t3.languageModel(selectedModel);

    // Stream the response with X search tools
    const result = await streamText({
      model: languageModel,
      messages: finalMessages,
      tools: {
        x_search: tool({
          description: 'Search X (Twitter) for posts and content.',
          parameters: z.object({
            query: z.string().describe('The search query'),
            startDate: z.string().describe('Start date in YYYY-MM-DD format'),
            endDate: z.string().describe('End date in YYYY-MM-DD format'),
            xHandles: z.array(z.string()).optional().describe('Optional specific X handles to search'),
            maxResults: z.number().default(15).describe('Maximum number of results to return'),
          }),
          execute: async ({
            query,
            startDate,
            endDate,
            xHandles,
            maxResults = 15,
          }: {
            query: string;
            startDate: string;
            endDate: string;
            xHandles?: string[];
            maxResults?: number;
          }) => {
            try {
              console.log('X search query:', query);
              console.log('Date range:', startDate, 'to', endDate);
              console.log('X handles:', xHandles);

              // Use Tavily API to search for X content
              const apiKey = serverEnv.TAVILY_API_KEY;
              const tvly = tavily({ apiKey });

              console.log("X search parameters:", { query, startDate, endDate, xHandles });

              const data = await tvly.search(query, {
                maxResults: maxResults,
                searchDepth: 'basic',
                topic: 'general',
                includeDomains: ["x.com", "twitter.com"],
                includeRawContent: "text",
              });

              console.log("X search response received");

              // Process results for better display
              const processedResults = data.results.map((result: any) => ({
                url: result.url,
                title: result.title,
                content: result.content || '',
                published_date: result.publishedDate,
              }));

              return {
                content: `Found ${processedResults.length} X posts related to "${query}"`,
                citations: processedResults,
                sources: processedResults,
                query: query,
                dateRange: `${startDate} to ${endDate}`,
                handles: xHandles || []
              };
            } catch (error) {
              console.error('X search error:', error);
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
    console.error('X Search API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process X search request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 