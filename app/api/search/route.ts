import { t3 } from '@/ai/providers';
import { streamText, CoreMessage } from 'ai';
import { NextRequest } from 'next/server';
import { serverEnv } from '@/env/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model, group, id, timezone, selectedVisibilityType } = body;

    console.log('API Request received:', { 
      model, 
      group, 
      messagesCount: messages?.length,
      chatId: id 
    });

    // Default to t3-gemini-2-5-flash if no model specified
    const selectedModel = model || 't3-gemini-2-5-flash';
    
    // Use the selected model or fallback to t3-gemini-2-5-flash
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
      
      // Stream the response
      const result = await streamText({
        model: languageModel,
        messages: finalMessages,
        maxTokens: 4000,
        temperature: 0.7,
      });
      
      console.log('StreamText result created successfully');
      
      // Create the response with proper headers
      const response = result.toDataStreamResponse({
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
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
    case null:
    case undefined:
      return basePrompt;
    default:
      return `${basePrompt} You are optimized for ${group} tasks. Adapt your responses to best serve this specific domain.`;
  }
} 