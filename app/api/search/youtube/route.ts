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
  views?: string;
  likes?: string;
  summary?: string;
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
          description: 'Search YouTube videos using Google YouTube Data API and get detailed video information.',
          parameters: z.object({
            query: z.string().describe('The search query for YouTube videos'),
          }),
          execute: async ({ query }: { query: string }) => {
            try {
              // Check if YouTube API key is available
              if (!serverEnv.YT_ENDPOINT) {
                console.error('YouTube API key not configured');
                throw new Error('YouTube API key not configured');
              }

              const youtubeApiKey = serverEnv.YT_ENDPOINT;

              console.log('YouTube search query:', query);

              // Search for videos using YouTube Data API
              const searchResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?key=${youtubeApiKey}&part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=10&order=relevance`,
                {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                  },
                }
              );

              if (!searchResponse.ok) {
                const errorText = await searchResponse.text();
                console.error('YouTube API search error:', errorText);
                throw new Error(`YouTube API error: ${searchResponse.status} - ${errorText}`);
              }

              const searchData = await searchResponse.json();

              if (!searchData.items || searchData.items.length === 0) {
                return {
                  results: [],
                };
              }

              // Extract video IDs for additional details
              const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

              // Get additional video details (statistics, content details)
              const detailsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?key=${youtubeApiKey}&part=snippet,statistics,contentDetails&id=${videoIds}`,
                {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/json',
                  },
                }
              );

              let videoDetails: any = {};
              if (detailsResponse.ok) {
                const detailsData = await detailsResponse.json();
                videoDetails = detailsData.items.reduce((acc: any, item: any) => {
                  acc[item.id] = item;
                  return acc;
                }, {});
              }

              // Process results
              const processedResults: VideoResult[] = searchData.items.map((item: any) => {
                const videoId = item.id.videoId;
                const snippet = item.snippet;
                const details = videoDetails[videoId];
                const statistics = details?.statistics;

                // Format duration from ISO 8601 to readable format
                const formatDuration = (duration: string) => {
                  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                  if (!match) return duration;
                  const hours = match[1] ? parseInt(match[1]) : 0;
                  const minutes = match[2] ? parseInt(match[2]) : 0;
                  const seconds = match[3] ? parseInt(match[3]) : 0;
                  
                  if (hours > 0) {
                    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                  } else {
                    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
                  }
                };

                // Format view count
                const formatViewCount = (viewCount: string) => {
                  const num = parseInt(viewCount);
                  if (num >= 1000000) {
                    return `${(num / 1000000).toFixed(1)}M views`;
                  } else if (num >= 1000) {
                    return `${(num / 1000).toFixed(1)}K views`;
                  } else {
                    return `${num} views`;
                  }
                };

                const baseResult: VideoResult = {
                  videoId,
                  url: `https://www.youtube.com/watch?v=${videoId}`,
                  details: {
                    title: snippet.title,
                    author_name: snippet.channelTitle,
                    author_url: `https://www.youtube.com/channel/${snippet.channelId}`,
                    thumbnail_url: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
                    type: 'video',
                    provider_name: 'YouTube',
                    provider_url: 'https://www.youtube.com',
                  },
                  views: statistics ? formatViewCount(statistics.viewCount) : undefined,
                  likes: statistics?.likeCount ? `${parseInt(statistics.likeCount).toLocaleString()} likes` : undefined,
                  summary: `${snippet.description?.substring(0, 200)}${snippet.description?.length > 200 ? '...' : ''}`,
                  timestamps: details?.contentDetails?.duration ? [formatDuration(details.contentDetails.duration)] : undefined,
                };

                return baseResult;
              });

              return {
                results: processedResults,
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