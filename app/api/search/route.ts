import { t3 } from '@/ai/providers';
import { streamText, CoreMessage } from 'ai';
import { NextRequest } from 'next/server';
import { serverEnv } from '@/env/server';
import { measureTTFB } from './debug-gemini';

// Using Node.js runtime due to web search requiring Node.js modules (http, https)
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Start TTFB measurement for Gemini models
  const ttfbTracker = measureTTFB();
  
  try {
    const body = await request.json();
    const { messages, model, group, id, timezone, selectedVisibilityType } = body;

    console.log('API Request received:', { 
      model, 
      group, 
      groupType: typeof group,
      groupIsNull: group === null,
      groupIsUndefined: group === undefined,
      messagesLength: messages?.length,
      chatId: id 
    });

    // Handle web search with simplified API
    if (group === 'web') {
      console.log(`🔍 ROUTING TO WEB SEARCH: Using simplified web search API for group: ${group}`);
      
      // Use the simplified web search route - pass the already parsed body
      const { POST: webPost } = await import('./web/route');
      
      // Create a new request with the parsed body
      const newRequest = new Request(request.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(request.headers.entries())
        },
        body: JSON.stringify(body)
      });
      
      console.log(`✅ WEB SEARCH: Successfully routed to web/route.ts`);
      return await webPost(newRequest as any);
    }

    // Handle extreme mode and other complex features
    if (group === 'extreme' || group === 'academic' || group === 'youtube' || group === 'reddit' || group === 'x' || group === 'analysis') {
      console.log(`🚀 ROUTING TO COMPLEX: Using complex route logic directly for group: ${group}`);
      
      // Import and use the complex route directly to maintain chat context
      const { POST: complexPost } = await import('./route-complex');
      
      // Create a new request with the same body for the complex route
      const newRequest = new Request(request.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...Object.fromEntries(request.headers.entries())
        },
        body: JSON.stringify(body)
      });
      
      console.log(`✅ COMPLEX: Successfully routed to route-complex.ts for ${group}`);
      return await complexPost(newRequest as any);
    }

    // Log TTFB for Gemini models
    if (model?.includes('gemini')) {
      ttfbTracker.logFirstByte();
    }

    // Default to t3-4o if no model specified
    const selectedModel = model || 't3-4o';
    
    // Use the selected model or fallback to t3-4o
    const modelToUse = selectedModel;
    
    console.log(`Using model: ${modelToUse}`);

    // Convert messages to the correct format for AI SDK
    const coreMessages: CoreMessage[] = messages.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    }));

    // Add system message based on group selection
    const systemPrompt = getSystemPrompt(group);
    const finalMessages: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      ...coreMessages
    ];

    console.log('Using model:', modelToUse);
    console.log('System prompt for group:', group);

    // Check if required API keys are available
    if (modelToUse.includes('gemini') || modelToUse.includes('google')) {
      const googleApiKey = serverEnv.GOOGLE_GENERATIVE_AI_API_KEY || serverEnv.GEMINI_API_KEY;
      if (!googleApiKey) {
        console.error('Missing Google API key for model:', modelToUse);
        throw new Error('Google API key not configured. Please set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in your environment variables.');
      }
      console.log('Google API key is available');
    }

    // Get the model from our custom provider
    try {
      const languageModel = t3.languageModel(modelToUse);
      console.log('Language model created successfully for:', modelToUse);
      
      // Stream the response with ChatGPT-like behavior
      const result = await streamText({
        model: languageModel,
        messages: finalMessages,
        maxTokens: 512, // Optimized for faster streaming (per playbook)
        temperature: 0.7,
        // Optimizations for OpenAI models
        ...(modelToUse.includes('gpt') && {
          // Add timeout for faster responses
          timeout: 10000,
        }),
        // Throttle Gemini models for ChatGPT-like streaming experience
        ...(modelToUse.includes('gemini') && {
          experimental_streamingChunks: false, // Disable super-fast chunks for natural appearance
        }),
      });
      
      console.log('StreamText result created successfully');
      
      // Create the response with proper streaming headers
      const response = result.toDataStreamResponse({
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'Transfer-Encoding': 'chunked',
          'X-Accel-Buffering': 'no', // Disable nginx buffering
        },
      });
      
      return response;
    } catch (modelError) {
      console.error('Model or streaming error details:', {
        model: modelToUse,
        error: modelError,
        message: modelError instanceof Error ? modelError.message : 'Unknown error',
        stack: modelError instanceof Error ? modelError.stack : undefined
      });
      throw new Error(`Model error for ${modelToUse}: ${modelError instanceof Error ? modelError.message : 'Unknown model error'}`);
    }
  } catch (error) {
    console.error('API Error:', error);
    
    // Return a proper error response that the AI SDK can handle
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

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function getSystemPrompt(group: string | null): string {
  const basePrompt = `You are T3 Chat, an advanced AI assistant. You are helpful, informative, and engaging. Always provide accurate, well-structured responses.`;
  
  switch (group) {
    case 'web':
      return `${basePrompt} You have access to real-time web search capabilities. When users ask questions that require current information, recent data, or specific facts that might have changed, you should search the web to provide accurate, up-to-date answers. Use web search proactively for:
      - Current events and news
      - Recent data, statistics, or research
      - Real-time information (prices, weather, stock prices)
      - Specific facts about people, companies, or events
      - Any information that might have changed recently
      Always cite your sources and provide links when using web search results.`;
    case 'search':
      return `${basePrompt} You specialize in information discovery and comprehensive search results. Help users find exactly what they're looking for with detailed, relevant information.`;
    case 'academic':
      return `${basePrompt} You are an academic research specialist. Provide scholarly analysis, cite sources when possible, and help with educational content. Focus on accuracy and depth.`;
    case 'coding':
      return `${basePrompt} You are an expert programming assistant. Provide clear, well-commented code examples, explain technical concepts thoroughly, and help debug issues. Always follow best practices.`;
    case 'creative':
      return `${basePrompt} You excel at creative tasks including writing, brainstorming, storytelling, and artistic endeavors. Be imaginative and inspiring while maintaining quality.`;
    case 'analysis':
      return `${basePrompt} You specialize in data analysis, critical thinking, and detailed examination of complex topics. Break down problems systematically and provide thorough insights.`;
    case 'extreme':
      return `${basePrompt} You are in extreme research mode. You have access to advanced research tools and can perform deep, multi-step analysis. Use the extreme_search tool for comprehensive research tasks that require detailed investigation and analysis.`;
    case null:
    case undefined:
      return basePrompt;
    default:
      return `${basePrompt} You are optimized for ${group} tasks. Adapt your responses to best serve this specific domain.`;
  }
} 