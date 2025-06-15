import { 
  wrapLanguageModel, 
  customProvider, 
  extractReasoningMiddleware,
} from "ai";

import { openai } from "@ai-sdk/openai";
import { xai } from "@ai-sdk/xai";
import { groq } from "@ai-sdk/groq";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from '@ai-sdk/google';

const middleware = extractReasoningMiddleware({
  tagName: 'think',
});

export const t3 = customProvider({
  languageModels: {
      't3-default': xai("grok-3-mini"),
      't3-grok-3': xai('grok-3'),
      't3-vision': xai('grok-2-vision-1212'),
      't3-4o': openai.responses('gpt-4o'),
      't3-o4-mini': openai.responses('o4-mini-2025-04-16'),
      't3-qwq': wrapLanguageModel({
          model: groq('qwen-qwq-32b'),
          middleware,
      }),
      't3-google': google('gemini-2.5-flash-preview-05-20'),
      't3-google-pro': google('gemini-2.5-pro-preview-06-05'),
      't3-anthropic': anthropic('claude-sonnet-4-20250514'),
      't3-anthropic-thinking': anthropic('claude-sonnet-4-20250514'),
      't3-llama-4': groq('meta-llama/llama-4-maverick-17b-128e-instruct', {
          parallelToolCalls: false,
      }),
  }
})
