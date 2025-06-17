import { 
  wrapLanguageModel, 
  customProvider, 
  extractReasoningMiddleware,
} from "ai";

import { openai } from "@ai-sdk/openai";

import { groq } from "@ai-sdk/groq";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from '@ai-sdk/google';

const middleware = extractReasoningMiddleware({
  tagName: 'think',
});

export const t3 = customProvider({
  languageModels: {
      // Default and core models
      't3-default': google("gemini-2.5-flash"),
      
      // OpenAI models - Real models only
      't3-4o': openai('gpt-4o'),
      't3-4o-mini': openai('gpt-4o-mini'),
      't3-o1': openai('o1'),
      't3-o1-mini': openai('o1-mini'),
      't3-o3-mini': openai('o3-mini'), // Latest reasoning model 2025
      't3-gpt-4-turbo': openai('gpt-4-turbo'),
      
      // Anthropic models - Real models only
      't3-claude-3-5-sonnet': anthropic('claude-3-5-sonnet-20241022'),
      't3-claude-3-5-haiku': anthropic('claude-3-5-haiku-20241022'),
      't3-claude-3-opus': anthropic('claude-3-opus-20240229'),
      
      // Anthropic shortcuts for easy access
      't3-anthropic': anthropic('claude-3-5-sonnet-20241022'),
      't3-anthropic-best': anthropic('claude-3-opus-20240229'),
      
      // Google models - Real models only  
      't3-gemini-2-5-flash': google('gemini-2.5-flash'),
      't3-gemini-2-0-flash': google('gemini-2.0-flash'),
      't3-gemini-1-5-flash': google('gemini-1.5-flash'),
      't3-gemini-1-5-pro': google('gemini-1.5-pro'),
      't3-google': google('gemini-2.5-flash'),
      't3-google-pro': google('gemini-1.5-pro'),
      
      // Reasoning specialists
      't3-reasoning-best': anthropic('claude-3-5-sonnet-20241022'),
      't3-reasoning-fast': openai('o3-mini'),
      't3-reasoning-deep': openai('o1'),
      
      // Vision specialists
      't3-vision-best': anthropic('claude-3-opus-20240229'),
      't3-vision-fast': google('gemini-2.0-flash'),
      
      // Coding specialists
      't3-code-best': anthropic('claude-3-5-sonnet-20241022'),
      't3-code-fast': openai('gpt-4o-mini'),
      't3-code-reasoning': anthropic('claude-3-5-sonnet-20241022'),
      
      // Fast models for quick tasks
      't3-fast': openai('gpt-4o-mini'),
      't3-fast-haiku': anthropic('claude-3-5-haiku-20241022'),
      't3-fast-flash': google('gemini-2.5-flash'),
      
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
