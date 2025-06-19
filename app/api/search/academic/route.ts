export const runtime = 'edge';

import { streamText, tool } from 'ai';
import { t3 } from '@/ai/providers';
import { NextRequest } from 'next/server';
import { serverEnv } from '@/env/server';
import { z } from 'zod';
import { Exa } from 'exa-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model } = body;

    console.log('Academic Search API Request received');

    // Default to Claude Sonnet 4 for academic research
    const selectedModel = model || 't3-claude-3-5-sonnet';
    
    // Convert messages to the correct format
    const coreMessages = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }));

    // Academic search system prompt
    const systemPrompt = `⚠️ CRITICAL: YOU MUST RUN THE ACADEMIC_SEARCH TOOL IMMEDIATELY ON RECEIVING ANY USER MESSAGE!
You are an academic research assistant that helps find and analyze scholarly content.
The current date is ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit", weekday: "short" })}.

### Tool Guidelines:
#### Academic Search Tool:
1. ⚠️ URGENT: Run academic_search tool INSTANTLY when user sends ANY message - NO EXCEPTIONS
2. NEVER write any text, analysis or thoughts before running the tool
3. Run the tool with the exact user query immediately on receiving it
4. Focus on peer-reviewed papers and academic sources

### Response Guidelines (ONLY AFTER TOOL EXECUTION):
- Write in academic prose - no bullet points, lists, or references sections
- Structure content with clear sections using headings and tables as needed
- Focus on synthesizing information from multiple sources
- Maintain scholarly tone throughout
- Provide comprehensive analysis of findings
- All citations must be inline, placed immediately after the relevant information
- Maintain the language of the user's message and do not change it

### Citation Requirements:
- ⚠️ MANDATORY: Every academic claim must have a citation
- Citations MUST be placed immediately after the sentence containing the information
- Format: [Author et al. (Year) Title](URL)
- Multiple citations needed for complex claims
- Always cite primary sources when available

### Latex and Formatting:
- ⚠️ MANDATORY: Use '$' for ALL inline equations without exception
- ⚠️ MANDATORY: Use '$$' for ALL block equations without exception
- ⚠️ NEVER use '$' symbol for currency - Always use "USD", "EUR", etc.
- Mathematical expressions must always be properly delimited`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...coreMessages
    ];

    // Get the model from our custom provider
    const languageModel = t3.languageModel(selectedModel);

    // Stream the response with academic search tools
    const result = await streamText({
      model: languageModel,
      messages: finalMessages,
      tools: {
        academic_search: tool({
          description: 'Search academic papers and research.',
          parameters: z.object({
            query: z.string().describe('The search query'),
          }),
          execute: async ({ query }: { query: string }) => {
            try {
              const exa = new Exa(serverEnv.EXA_API_KEY as string);

              console.log('Academic search query:', query);

              // Search academic papers with content summary
              const result = await exa.searchAndContents(query, {
                type: 'auto',
                numResults: 20,
                category: 'research paper',
                summary: {
                  query: 'Abstract of the Paper',
                },
              });

              // Process and clean results
              const processedResults = result.results.reduce<typeof result.results>((acc, paper) => {
                // Skip if URL already exists or if no summary available
                if (acc.some((p) => p.url === paper.url) || !paper.summary) return acc;

                // Clean up summary (remove "Summary:" prefix if exists)
                const cleanSummary = paper.summary.replace(/^Summary:\s*/i, '');

                // Clean up title (remove [...] suffixes)
                const cleanTitle = paper.title?.replace(/\s\[.*?\]$/, '');

                acc.push({
                  ...paper,
                  title: cleanTitle || '',
                  summary: cleanSummary,
                });

                return acc;
              }, []);

              return {
                results: processedResults,
              };
            } catch (error) {
              console.error('Academic search error:', error);
              throw error;
            }
          },
        }),
      },
      maxSteps: 2,
      temperature: 0.3,
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
    console.error('Academic Search API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process academic search request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 