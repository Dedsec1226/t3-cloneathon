export const runtime = 'edge';

import { streamText, tool } from 'ai';
import { t3 } from '@/ai/providers';
import { NextRequest } from 'next/server';
import { serverEnv } from '@/env/server';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model } = body;

    console.log('Analytics API Request received');

    // Default to Claude Sonnet for analytics
    const selectedModel = model || 't3-claude-3-5-sonnet';
    
    // Convert messages to the correct format
    const coreMessages = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }));

    // Analytics system prompt
    const systemPrompt = `You are T3 Chat with advanced data analysis capabilities. You specialize in:

- Statistical analysis and data interpretation
- Creating charts and visualizations 
- Financial market analysis (stocks, crypto, forex)
- Data-driven insights and trends
- Mathematical calculations and modeling
- Performance metrics and KPIs
- Comparative analysis

When users ask about data analysis, market information, or request charts, use the appropriate tools to provide comprehensive analysis with visualizations when helpful.

Always explain your analytical approach and provide context for your findings.`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...coreMessages
    ];

    // Get the model from our custom provider
    const languageModel = t3.languageModel(selectedModel);

    // Stream the response with analytics tools
    const result = await streamText({
      model: languageModel,
      messages: finalMessages,
      tools: {
        stock_chart: tool({
          description: 'Generate and analyze stock price charts with technical indicators.',
          parameters: z.object({
            symbol: z.string().describe('Stock symbol (e.g., AAPL, TSLA)'),
            timeframe: z.enum(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']).describe('Time period for the chart'),
            indicators: z.array(z.enum(['sma', 'ema', 'rsi', 'macd', 'bb', 'volume'])).optional().describe('Technical indicators to include'),
          }),
          execute: async ({ symbol, timeframe, indicators = [] }) => {
            try {
              console.log(`Generating stock chart for ${symbol} with timeframe ${timeframe}`);
              
              // This would typically fetch real stock data and generate charts
              // For now, return a structured response that the frontend can handle
              return {
                symbol: symbol.toUpperCase(),
                timeframe,
                indicators,
                message: `Stock chart analysis for ${symbol.toUpperCase()} over ${timeframe} timeframe`,
                // In a real implementation, this would include actual chart data
                chartData: {
                  prices: [],
                  timestamps: [],
                  volume: [],
                  technicalIndicators: indicators.reduce((acc, indicator) => {
                    acc[indicator] = [];
                    return acc;
                  }, {} as Record<string, number[]>)
                }
              };
            } catch (error) {
              console.error('Stock chart error:', error);
              throw error;
            }
          },
        }),
        code_interpreter: tool({
          description: 'Execute Python code for data analysis, calculations, and visualizations.',
          parameters: z.object({
            code: z.string().describe('Python code to execute for analysis'),
          }),
          execute: async ({ code }) => {
            try {
              console.log('Executing data analysis code');
              
              // This would typically execute Python code in a sandboxed environment
              // For now, return a structured response
              return {
                executed: true,
                code,
                output: "Data analysis completed successfully",
                // In a real implementation, this would include actual execution results
                results: {
                  type: 'analysis',
                  message: 'Code execution simulated - would run actual analysis in production'
                }
              };
            } catch (error) {
              console.error('Code execution error:', error);
              throw error;
            }
          },
        }),
      },
      maxSteps: 3,
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
    console.error('Analytics API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process analytics request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 