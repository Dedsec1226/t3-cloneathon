import { 
  wrapLanguageModel, 
  customProvider, 
  extractReasoningMiddleware,
} from "ai";

import { openai } from "@ai-sdk/openai";

import { groq } from "@ai-sdk/groq";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from '@ai-sdk/google';
import { xai } from '@ai-sdk/xai';

const middleware = extractReasoningMiddleware({
  tagName: 'think',
});

export const t3 = customProvider({
  languageModels: {
      // Default and core models (optimized for ChatGPT-like streaming)
      't3-default': google("gemini-2.5-flash"),
      
      // OpenAI models - Real models only (timeout configured at streamText level)
      't3-4o': openai('gpt-4o'),
      't3-4o-mini': openai('gpt-4o-mini'),
      't3-o1': openai('o1'),
      't3-o1-mini': openai('o1-mini'),
      't3-o3-mini': openai('o3-mini'), // Latest reasoning model 2025
      't3-gpt-4-turbo': openai('gpt-4-turbo'),
      
      // Anthropic models - Optimized for speed (headers configured at provider level)
      't3-claude-4-sonnet': anthropic('claude-3-5-sonnet-20241022'), // ~45 t/s - balanced Q&A & agents
      't3-claude-4-opus': anthropic('claude-3-opus-20240229'), // ~25 t/s - deep reasoning
      't3-claude-3-5-sonnet': anthropic('claude-3-5-sonnet-20241022'), // Legacy support
      't3-claude-3-5-haiku': anthropic('claude-3-5-haiku-20241022'), // ~75 t/s - real-time chat & RAG
      't3-claude-3-opus': anthropic('claude-3-opus-20240229'), // Legacy support
      
      // Anthropic shortcuts for easy access - speed optimized
      't3-anthropic': anthropic('claude-3-5-sonnet-20241022'), // Balanced default
      't3-anthropic-best': anthropic('claude-3-opus-20240229'), // Quality focused
      't3-anthropic-fast': anthropic('claude-3-5-haiku-20241022'), // Speed focused (~75 t/s)
      
      // xAI models - Grok models
      't3-grok-3': xai('grok-3'),
      't3-grok-3-mini': xai('grok-3-mini'),
      't3-grok': xai('grok-3'),
      
      // Google models - Speed optimized (candidateCount/maxTokens configured at provider level)
      // SPEED TIER 1: Flash models (~280 t/s, 0.32s TTFT) - Real-time chat & RAG
      't3-gemini-2-5-flash': google('gemini-2.5-flash', {
        structuredOutputs: false,
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
      }), // FASTEST: ~280 t/s
      't3-gemini-2-0-flash': google('gemini-2.5-flash', {
        structuredOutputs: false,
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
      }), // Using 2.5 Flash for better performance
      't3-gemini-1-5-flash': google('gemini-1.5-flash', {
        structuredOutputs: false,
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
      }), // Legacy speed
      
      // SPEED TIER 2: Pro models (~140 t/s, 0.9s TTFT) - Balanced Q&A
      't3-gemini-1-5-pro': google('gemini-1.5-pro', {
        structuredOutputs: false,
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
      }), // Balanced: ~140 t/s
      't3-google': google('gemini-2.5-flash'), // Speed-first default (~280 t/s)
      't3-google-pro': google('gemini-1.5-pro'), // Balanced quality (~140 t/s)
      
      // Reasoning specialists
      't3-reasoning-best': anthropic('claude-3-5-sonnet-20241022'),
      't3-reasoning-fast': openai('o3-mini'),
      't3-reasoning-deep': openai('o1'),
      
      // Vision specialists
      't3-vision-best': anthropic('claude-3-opus-20240229'),
      't3-vision-fast': google('gemini-2.5-flash'),
      
      // Coding specialists
      't3-code-best': anthropic('claude-3-5-sonnet-20241022'),
      't3-code-fast': openai('gpt-4o-mini'),
      't3-code-reasoning': anthropic('claude-3-5-sonnet-20241022'),
      
      // Fast models for quick tasks - speed optimized
      't3-fast': google('gemini-2.5-flash'), // ~280 t/s - FASTEST overall (Gemini Flash)
      't3-fast-haiku': anthropic('claude-3-5-haiku-20241022'), // ~75 t/s - Anthropic alternative
      't3-fast-openai': openai('gpt-4o-mini'), // OpenAI alternative
      't3-fast-flash': google('gemini-2.5-flash'), // ~280 t/s - Google speed champion
      
      // Multimodal powerhouses
      't3-multimodal-best': anthropic('claude-3-opus-20240229'),
      't3-multimodal-google': google('gemini-1.5-pro'),
      't3-multimodal-openai': openai('gpt-4o'),
  },
  imageModels: {
      // OpenAI image generation - real models
      't3-dall-e-3': openai.image('dall-e-3'),
      't3-dall-e-2': openai.image('dall-e-2'),
      
      // Image generation shortcuts
      't3-image-best': openai.image('dall-e-3'),
      't3-image-fast': openai.image('dall-e-2'),
  }
})
