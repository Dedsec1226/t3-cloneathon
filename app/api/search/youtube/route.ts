export const runtime = 'edge';

import { streamText, tool } from 'ai';
import { t3 } from '@/ai/providers';
import { NextRequest } from 'next/server';
import { serverEnv } from '@/env/server';
import { z } from 'zod';
import { Exa } from 'exa-js';

interface VideoResult {
  videoId: string;
  url: string;
  details?: any;
  captions?: string;
  timestamps?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model } = body;

    console.log('YouTube Search API Request received');

    // Default to GPT-4o for YouTube search
    const selectedModel = model || 't3-4o';
    
    // Convert messages to the correct format
    const coreMessages = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }));

    // YouTube search system prompt
    const systemPrompt = `You are T3 Chat with YouTube search capabilities. You help users find relevant YouTube videos and provide insights about video content, transcripts, and key timestamps.

Use YouTube search when users ask about:
- Video tutorials or educational content
- Entertainment, music, or entertainment videos
- How-to guides or demonstrations
- Reviews or commentary
- Recent videos on specific topics
- Content from specific creators

Always provide useful context about the videos found including titles, creators, timestamps for key topics, and relevant excerpts from captions when available.`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...coreMessages
    ];

    // Get the model from our custom provider
    const languageModel = t3.languageModel(selectedModel);

    // Stream the response with YouTube search tools
    const result = await streamText({
      model: languageModel,
      messages: finalMessages,
      tools: {
        youtube_search: tool({
          description: 'Search YouTube videos using Exa AI and get detailed video information.',
          parameters: z.object({
            query: z.string().describe('The search query for YouTube videos'),
          }),
          execute: async ({ query }: { query: string }) => {
            try {
              const exa = new Exa(serverEnv.EXA_API_KEY as string);

              console.log('YouTube search query:', query);

              // Simple search to get YouTube URLs only
              const searchResult = await exa.search(query, {
                type: 'keyword',
                numResults: 10,
                includeDomains: ['youtube.com'],
              });

              // Process results
              const processedResults = await Promise.all(
                searchResult.results.map(async (result): Promise<VideoResult | null> => {
                  const videoIdMatch = result.url.match(
                    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
                  );
                  const videoId = videoIdMatch?.[1];

                  if (!videoId) return null;

                  // Base result
                  const baseResult: VideoResult = {
                    videoId,
                    url: result.url,
                  };

                  try {
                    // Fetch detailed info from our endpoints
                    const [detailsResponse, captionsResponse, timestampsResponse] = await Promise.all([
                      fetch(`${serverEnv.YT_ENDPOINT}/video-data`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          url: result.url,
                        }),
                      }).then((res) => (res.ok ? res.json() : null)),
                      fetch(`${serverEnv.YT_ENDPOINT}/video-captions`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          url: result.url,
                        }),
                      }).then((res) => (res.ok ? res.text() : null)),
                      fetch(`${serverEnv.YT_ENDPOINT}/video-timestamps`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          url: result.url,
                        }),
                      }).then((res) => (res.ok ? res.json() : null)),
                    ]);

                    // Return combined data
                    return {
                      ...baseResult,
                      details: detailsResponse || undefined,
                      captions: captionsResponse || undefined,
                      timestamps: timestampsResponse || undefined,
                    };
                  } catch (error) {
                    console.error(`Error fetching details for video ${videoId}:`, error);
                    return baseResult;
                  }
                }),
              );

              // Filter out null results
              const validResults = processedResults.filter(
                (result): result is VideoResult => result !== null,
              );

              return {
                results: validResults,
              };
            } catch (error) {
              console.error('YouTube search error:', error);
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
    console.error('YouTube Search API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process YouTube search request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 