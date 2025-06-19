// /app/api/chat/route.ts
// Using Node.js runtime due to @daytonaio/sdk requiring fs module
export const runtime = 'nodejs';

import { generateTitleFromUserMessage, getGroupConfig } from '@/app/actions';
import { serverEnv } from '@/env/server';
import { openai, OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import { Daytona, SandboxTargetRegion } from '@daytonaio/sdk';
import { tavily } from '@tavily/core';
import {
    convertToCoreMessages,
    smoothStream,
    streamText,
    tool,
    generateObject,
    NoSuchToolError,
    appendResponseMessages,
    CoreToolMessage,
    CoreAssistantMessage,
    createDataStream
} from 'ai';
import Exa from 'exa-js';
import { z } from 'zod';
import MemoryClient from 'mem0ai';
import { extremeSearchTool } from '@/ai/extreme-search';
import { t3 } from '@/ai/providers';
// import { getUser } from "@/lib/auth-utils";
// import { createStreamId, 
//     getChatById, 
//     getMessagesByChatId, 
//     getStreamIdsByChatId, 
//     saveChat, 
//     saveMessages,
// } from '@/lib/db/queries';
// import { ChatSDKError } from '@/lib/errors';
// import {
//     createResumableStreamContext,
//     type ResumableStreamContext,
// } from 'resumable-stream';
import { after } from 'next/server';
import { differenceInSeconds } from 'date-fns';
// import { Chat } from '@/lib/db/schema';
// import { auth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { geolocation } from "@vercel/functions";
import { getTweet } from 'react-tweet/api';

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

function getTrailingMessageId({
    messages,
}: {
    messages: Array<ResponseMessage>;
}): string | null { 
    const trailingMessage = messages.at(-1);

    if (!trailingMessage) return null;

    return trailingMessage.id;
}


let globalStreamContext: any | null = null;

function getStreamContext() {
    return null; // Simplified - no resumable streams
}


// Add currency symbol mapping at the top of the file
const CURRENCY_SYMBOLS = {
    USD: '$',   // US Dollar
    EUR: '€',   // Euro
    GBP: '£',   // British Pound
    JPY: '¥',   // Japanese Yen
    CNY: '¥',   // Chinese Yuan
    INR: '₹',   // Indian Rupee
    RUB: '₽',   // Russian Ruble
    KRW: '₩',   // South Korean Won
    BTC: '₿',   // Bitcoin
    THB: '฿',   // Thai Baht
    BRL: 'R$',  // Brazilian Real
    PHP: '₱',   // Philippine Peso
    ILS: '₪',   // Israeli Shekel
    TRY: '₺',   // Turkish Lira
    NGN: '₦',   // Nigerian Naira
    VND: '₫',   // Vietnamese Dong
    ARS: '$',   // Argentine Peso
    ZAR: 'R',   // South African Rand
    AUD: 'A$',  // Australian Dollar
    CAD: 'C$',  // Canadian Dollar
    SGD: 'S$',  // Singapore Dollar
    HKD: 'HK$', // Hong Kong Dollar
    NZD: 'NZ$', // New Zealand Dollar
    MXN: 'Mex$' // Mexican Peso
} as const;



interface VideoDetails {
    title?: string;
    author_name?: string;
    author_url?: string;
    thumbnail_url?: string;
    type?: string;
    provider_name?: string;
    provider_url?: string;
}

interface VideoResult {
    videoId: string;
    url: string;
    details?: VideoDetails;
    captions?: string;
    timestamps?: string[];
    views?: string;
    likes?: string;
    summary?: string;
}

function sanitizeUrl(url: string): string {
    return url.replace(/\s+/g, '%20');
}

async function isValidImageUrl(url: string): Promise<{ valid: boolean; redirectedUrl?: string }> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'HEAD',
            signal: controller.signal,
            headers: {
                'Accept': 'image/*',
                'User-Agent': 'Mozilla/5.0 (compatible; ImageValidator/1.0)'
            },
            redirect: 'follow' // Ensure redirects are followed
        });

        clearTimeout(timeout);

        // Log response details for debugging
        console.log(`Image validation [${url}]: status=${response.status}, content-type=${response.headers.get('content-type')}`);

        // Capture redirected URL if applicable
        const redirectedUrl = response.redirected ? response.url : undefined;

        // Check if we got redirected (for logging purposes)
        if (response.redirected) {
            console.log(`Image was redirected from ${url} to ${redirectedUrl}`);
        }

        // Handle specific response codes
        if (response.status === 404) {
            console.log(`Image not found (404): ${url}`);
            return { valid: false };
        }

        if (response.status === 403) {
            console.log(`Access forbidden (403) - likely CORS issue: ${url}`);

            // Try to use proxy instead of whitelisting domains
            try {
                // Attempt to handle CORS blocked images by trying to access via proxy
                const controller = new AbortController();
                const proxyTimeout = setTimeout(() => controller.abort(), 5000);

                const proxyResponse = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`, {
                    method: 'HEAD',
                    signal: controller.signal
                });

                clearTimeout(proxyTimeout);

                if (proxyResponse.ok) {
                    const contentType = proxyResponse.headers.get('content-type');
                    const proxyRedirectedUrl = proxyResponse.headers.get('x-final-url') || undefined;

                    if (contentType && contentType.startsWith('image/')) {
                        console.log(`Proxy validation successful for ${url}`);
                        return {
                            valid: true,
                            redirectedUrl: proxyRedirectedUrl || redirectedUrl
                        };
                    }
                }
            } catch (proxyError) {
                console.error(`Proxy validation failed for ${url}:`, proxyError);
            }
            return { valid: false };
        }

        if (response.status >= 400) {
            console.log(`Image request failed with status ${response.status}: ${url}`);
            return { valid: false };
        }

        // Check content type to ensure it's actually an image
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            console.log(`Invalid content type for image: ${contentType}, url: ${url}`);
            return { valid: false };
        }

        return { valid: true, redirectedUrl };
    } catch (error) {
        // Check if error is related to CORS
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (errorMsg.includes('CORS') || errorMsg.includes('blocked by CORS policy')) {
            console.error(`CORS error for ${url}:`, errorMsg);

            // Try to use proxy instead of whitelisting domains
            try {
                // Attempt to handle CORS blocked images by trying to access via proxy
                const controller = new AbortController();
                const proxyTimeout = setTimeout(() => controller.abort(), 5000);

                const proxyResponse = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`, {
                    method: 'HEAD',
                    signal: controller.signal
                });

                clearTimeout(proxyTimeout);

                if (proxyResponse.ok) {
                    const contentType = proxyResponse.headers.get('content-type');
                    const proxyRedirectedUrl = proxyResponse.headers.get('x-final-url') || undefined;

                    if (contentType && contentType.startsWith('image/')) {
                        console.log(`Proxy validation successful for ${url}`);
                        return { valid: true, redirectedUrl: proxyRedirectedUrl };
                    }
                }
            } catch (proxyError) {
                console.error(`Proxy validation failed for ${url}:`, proxyError);
            }
        }

        // Log the specific error
        console.error(`Image validation error for ${url}:`, errorMsg);
        return { valid: false };
    }
}


const extractDomain = (url: string): string => {
    const urlPattern = /^https?:\/\/([^/?#]+)(?:[/?#]|$)/i;
    return url.match(urlPattern)?.[1] || url;
};

const deduplicateByDomainAndUrl = <T extends { url: string }>(items: T[]): T[] => {
    const seenDomains = new Set<string>();
    const seenUrls = new Set<string>();

    return items.filter(item => {
        const domain = extractDomain(item.url);
        const isNewUrl = !seenUrls.has(item.url);
        const isNewDomain = !seenDomains.has(domain);

        if (isNewUrl && isNewDomain) {
            seenUrls.add(item.url);
            seenDomains.add(domain);
            return true;
        }
        return false;
    });
};

// Initialize Exa client
const exa = new Exa(serverEnv.EXA_API_KEY);

// Add interface for Exa search results
interface ExaResult {
    title: string;
    url: string;
    publishedDate?: string;
    author?: string;
    score?: number;
    id: string;
    image?: string;
    favicon?: string;
    text: string;
    highlights?: string[];
    highlightScores?: number[];
    summary?: string;
    subpages?: ExaResult[];
    extras?: {
        links: any[];
    };
}

// Modify the POST function to use the new handler
export async function POST(req: Request) {
    const { messages, model, group, timezone, id, selectedVisibilityType } = await req.json();
    const { latitude, longitude } = geolocation(req);
    
    // Simplified security - basic validation only
    console.log("Processing request...");

    console.log("--------------------------------");
    console.log("Location: ", latitude, longitude);
    console.log("--------------------------------");

    // const user = await getUser();
    const streamId = "stream-" + uuidv4();
    const user = null; // Simplified for now

    console.log("User not found - simplified mode");

    const { tools: activeTools, instructions } = await getGroupConfig(group);

    console.log("--------------------------------");
    console.log("Messages: ", messages);
    console.log("--------------------------------");
    console.log("Running with model: ", model.trim());
    console.log("Group: ", group);
    console.log("Group type: ", typeof group);
    console.log("Group is null: ", group === null);
    console.log("Group is undefined: ", group === undefined);
    console.log("Active Tools: ", activeTools);
    console.log("Instructions Preview: ", instructions.substring(0, 200) + "...");
    console.log("Timezone: ", timezone);
    
    // **DEBUG: Add specific logging for web and extreme modes**
    if (group === 'web') {
        console.log("🔍 WEB SEARCH MODE DETECTED");
        console.log("Active tools for web:", activeTools);
        console.log("Tool choice will be: required");
    }
    
    if (group === 'extreme') {
        console.log("🚀 EXTREME MODE DETECTED"); 
        console.log("Active tools for extreme:", activeTools);
        console.log("Tool choice will be: required");
        console.log("Max steps will be: 2");
        
        // **CORRECTED: Validate that the model supports web search for extreme mode**
        // Extreme mode uses web search tools, so only web-compatible models should be allowed
        const modelSupportsWeb = model.includes('gemini') || model.includes('t3-4o') || model.includes('t3-gpt') || model.includes('multimodal-best');
        if (!modelSupportsWeb) {
            console.error("🚨 EXTREME MODE ERROR: Model doesn't support web search");
            return new Response(
                JSON.stringify({ 
                    error: "Extreme mode requires a model with web search capabilities. Please switch to GPT-4o, Gemini, or another web-compatible model." 
                }), 
                { 
                    status: 400, 
                    headers: { 'Content-Type': 'application/json' } 
                }
            );
        }
    }

    const stream = createDataStream({
        execute: async (dataStream) => {
            // Model fallback for extreme mode if primary model fails
            let selectedModelForExecution = model;
            
            const result = streamText({
                model: t3.languageModel(selectedModelForExecution),
                messages: convertToCoreMessages(messages),
                // Optimized temperature settings for speed and quality
                ...(model.includes('t3-claude-3-5-haiku') || model.includes('t3-fast') ? {
                    temperature: 0.3, // Lower temp for speed on Haiku
                } : model.includes('t3-claude') ? {
                    temperature: 0.7, // Balanced for quality Claude models
                    topP: 0.9,
                } : model.includes('t3-o3-mini') ? {
                    temperature: 0, // Deterministic for reasoning models
                } : {
                    temperature: 0, // Conservative default
                }),
                maxSteps: 1, // Single step for all modes to prevent duplicate tool calls
                maxRetries: 3, // Increased retries for API stability
                experimental_activeTools: [...activeTools],
                system: instructions + `\n\n🗓️ CURRENT DATE & TIME: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", weekday: "long" })} - CURRENT YEAR: ${new Date().getFullYear()}\n\nThe user's location is ${latitude}, ${longitude}.`,
                toolChoice: group === 'extreme' ? 'required' : 
                           group === 'web' ? 'required' : 'auto', // Force tool usage for extreme and web modes
                // **EXTREME MODE: Simplified approach for reliability**
                ...(group === 'extreme' ? {
                    experimental_continueSteps: false, // Disable continuation for stability
                } : {}),
                experimental_transform: smoothStream({
                    chunking: 'word',
                    delayInMs: group === 'extreme' ? 100 : 0, // Slight delay for extreme mode to prevent racing
                }),
                providerOptions: {
                    google: {
                        // Speed optimizations for Gemini models
                        candidateCount: 1, // Disable n-best search for faster generation
                        
                        // Model-specific speed optimizations
                        ...(model.includes('t3-gemini-2-5-flash') || model.includes('t3-fast-flash') ? {
                            // Flash optimizations for max speed (~280 t/s)
                            maxOutputTokens: 1024,
                            stopSequences: ['</analysis>', '</thinking>', '</response>'],
                            safetySettings: [
                                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
                            ]
                        } : {}),
                        
                        ...(model.includes('t3-gemini-2-5-pro') || model.includes('t3-gemini-1-5-pro') ? {
                            // Pro optimizations for balanced speed (~140 t/s)
                            maxOutputTokens: 2048,
                            stopSequences: ['</analysis>', '</thinking>'],
                            safetySettings: [
                                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
                                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
                                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
                                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' }
                            ]
                        } : {}),
                        
                        ...(model.includes('t3-gemini-1-5-ultra') ? {
                            // Ultra optimizations - focus on quality but still optimize (~70 t/s)
                            maxOutputTokens: 4096,
                            stopSequences: ['</deep_analysis>', '</thinking>'],
                            safetySettings: [
                                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
                            ]
                        } : {}),
                        
                        // Thinking configuration with optimized budget for Gemini 2.5+
                        thinkingConfig: {
                            includeThoughts: model.includes('t3-gemini-2-5') ? true : false,
                            thinkingBudget: model.includes('t3-gemini-2-5-flash') ? 6000 : 
                                          model.includes('t3-gemini-2-5-pro') ? 8000 : 10000,
                        },
                        
                        // Headers for latest features and speed
                        headers: {
                            'x-goog-api-client': 'gl-node/latest ai-sdk/5.0',
                        }
                    },
                    openai: {
                        ...(model === 't3-o3-mini' ? {
                            reasoningEffort: 'low',
                            strictSchemas: true,
                        } : {}),
                        ...(model === 't3-4o' ? {
                            parallelToolCalls: false,
                            strictSchemas: true,
                        } : {}),
                    } as OpenAIResponsesProviderOptions,
                    xai: {
                        ...(group === "chat" ? {
                            search_parameters: {
                                mode: "auto",
                                return_citations: true
                            }
                        } : {}),
                        ...(model === 't3-grok-3' ? {
                            reasoningEffort: 'low',
                        } : {}),
                    },
                    anthropic: {
                        // Add anthropic-version header for latest features
                        headers: {
                            'anthropic-version': '2023-06-01',
                            // Token-efficient tool use for 14% token savings
                            'anthropic-beta': 'token-efficient-tool-use-2025-03-13,fine-grained-tool-streaming-2025-05-14'
                        },
                        // Enable prompt caching for long contexts (79% latency reduction on subsequent calls)
                        cacheControl: { type: 'ephemeral' },
                        // Add timeout configuration for API stability
                        timeout: group === 'extreme' ? 120000 : 60000, // 2 minutes for extreme mode, 1 minute for others
                        // Thinking configuration with reduced budget for faster TTFT
                        ...(model === 't3-claude-4-sonnet' || model === 't3-claude-4-opus' ? {
                            thinking: { 
                                type: 'enabled', 
                                budgetTokens: group === 'extreme' ? 6000 : 4000  // Optimized for extreme mode
                            },
                        } : {}),
                        // Speed optimizations
                        ...(model.includes('t3-claude-3-5-haiku') ? {
                            // Haiku-specific optimizations for max speed
                            maxTokens: 512,  // Optimized for fastest streaming (per latency playbook)
                            stopSequences: ['</thinking>']  // Stop early when reasoning complete
                        } : {}),
                        ...(model.includes('t3-claude-3-5-sonnet') || model === 't3-claude-4-sonnet' ? {
                            // Sonnet optimizations for balanced speed/quality
                            maxTokens: group === 'extreme' ? 4096 : 512,  // Higher tokens for extreme mode
                            stopSequences: ['</analysis>', '</thinking>']
                        } : {}),
                        ...(model.includes('t3-claude-3-opus') || model === 't3-claude-4-opus' ? {
                            // Opus optimizations - focus on quality but still optimize
                            maxTokens: group === 'extreme' ? 4096 : 512,  // Higher tokens for extreme mode
                            stopSequences: ['</deep_analysis>', '</thinking>']
                        } : {}),
                        // Global max tokens for all Claude models
                        ...(model.includes('t3-claude') ? {
                            maxTokens: group === 'extreme' ? 4096 : 1024,  // Reasonable limits for all Claude models
                        } : {})
                    },
                },
                tools: (() => {
                    // Create filtered tools object based on active tools for extreme mode
                    const baseTools = {
                    stock_chart: tool({
                        description: 'Get stock data and news for given stock symbols.',
                        parameters: z.object({
                            title: z.string().describe('The title of the chart.'),
                            news_queries: z.array(z.string()).describe('The news queries to search for.'),
                            icon: z
                                .enum(['stock', 'date', 'calculation', 'default'])
                                .describe('The icon to display for the chart.'),
                            stock_symbols: z.array(z.string()).describe('The stock symbols to display for the chart.'),
                            currency_symbols: z.array(z.string()).describe('The currency symbols for each stock/asset in the chart. Available symbols: ' + Object.keys(CURRENCY_SYMBOLS).join(', ') + '. Defaults to USD if not provided.'),
                            interval: z.enum(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']).describe('The interval of the chart. default is 1y.'),
                        }),
                        execute: async ({ title, icon, stock_symbols, currency_symbols, interval, news_queries }: { title: string; icon: string; stock_symbols: string[]; currency_symbols?: string[]; interval: string; news_queries: string[] }) => {
                            console.log('Title:', title);
                            console.log('Icon:', icon);
                            console.log('Stock symbols:', stock_symbols);
                            console.log('Currency symbols:', currency_symbols);
                            console.log('Interval:', interval);
                            console.log('News queries:', news_queries);

                            // Format currency symbols with actual symbols
                            const formattedCurrencySymbols = (currency_symbols || stock_symbols.map(() => 'USD')).map(currency => {
                                const symbol = CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS];
                                return symbol || currency; // Fallback to currency code if symbol not found
                            });

                            interface NewsResult {
                                title: string;
                                url: string;
                                content: string;
                                published_date?: string;
                                category: string;
                                query: string;
                            }

                            interface NewsGroup {
                                query: string;
                                topic: string;
                                results: NewsResult[];
                            }

                            let news_results: NewsGroup[] = [];

                            const tvly = tavily({ apiKey: serverEnv.TAVILY_API_KEY });

                            // Gather all news search promises to execute in parallel
                            const searchPromises = [];
                            for (const query of news_queries) {
                                // Add finance and news topic searches for each query
                                searchPromises.push({
                                    query,
                                    topic: 'finance',
                                    promise: tvly.search(query, {
                                        topic: 'finance',
                                        days: 7,
                                        maxResults: 3,
                                        searchDepth: 'advanced',
                                    })
                                });

                                searchPromises.push({
                                    query,
                                    topic: 'news',
                                    promise: tvly.search(query, {
                                        topic: 'news',
                                        days: 7,
                                        maxResults: 3,
                                        searchDepth: 'advanced',
                                    })
                                });
                            }

                            // Execute all searches in parallel
                            const searchResults = await Promise.all(
                                searchPromises.map(({ promise }) => promise.catch(err => ({
                                    results: [],
                                    error: err.message
                                })))
                            );

                            // Process results and deduplicate
                            const urlSet = new Set();
                            searchPromises.forEach(({ query, topic }, index) => {
                                const result = searchResults[index];
                                if (!result.results) return;

                                const processedResults = result.results
                                    .filter(item => {
                                        // Skip if we've already included this URL
                                        if (urlSet.has(item.url)) return false;
                                        urlSet.add(item.url);
                                        return true;
                                    })
                                    .map(item => ({
                                        title: item.title,
                                        url: item.url,
                                        content: item.content.slice(0, 30000),
                                        published_date: item.publishedDate,
                                        category: topic,
                                        query: query
                                    }));

                                if (processedResults.length > 0) {
                                    news_results.push({
                                        query,
                                        topic,
                                        results: processedResults
                                    });
                                }
                            });

                            // Perform Exa search for financial reports
                            const exaResults: NewsGroup[] = [];
                            try {
                                // Run Exa search for each stock symbol
                                const exaSearchPromises = stock_symbols.map(symbol =>
                                    exa.searchAndContents(
                                        `${symbol} financial report analysis`,
                                        {
                                            text: true,
                                            category: "financial report",
                                            livecrawl: "always",
                                            type: "auto",
                                            numResults: 10,
                                            summary: {
                                                query: "all important information relevent to the important for investors"
                                            }
                                        }
                                    ).catch(error => {
                                        console.error(`Exa search error for ${symbol}:`, error);
                                        return { results: [] };
                                    })
                                );

                                const exaSearchResults = await Promise.all(exaSearchPromises);

                                // Process Exa results
                                const exaUrlSet = new Set();
                                exaSearchResults.forEach((result, index) => {
                                    if (!result.results || result.results.length === 0) return;

                                    const stockSymbol = stock_symbols[index];
                                    const processedResults = result.results
                                        .filter(item => {
                                            if (exaUrlSet.has(item.url)) return false;
                                            exaUrlSet.add(item.url);
                                            return true;
                                        })
                                        .map(item => ({
                                            title: item.title || "",
                                            url: item.url,
                                            content: item.summary || "",
                                            published_date: item.publishedDate,
                                            category: "financial",
                                            query: stockSymbol
                                        }));

                                    if (processedResults.length > 0) {
                                        exaResults.push({
                                            query: stockSymbol,
                                            topic: "financial",
                                            results: processedResults
                                        });
                                    }
                                });

                                // Complete missing titles for financial reports
                                for (const group of exaResults) {
                                    for (let i = 0; i < group.results.length; i++) {
                                        const result = group.results[i];
                                        if (!result.title || result.title.trim() === "") {
                                            try {
                                                const { object } = await generateObject({
                                                    model: openai.chat("gpt-4.1-nano"),
                                                    prompt: `Complete the following financial report with an appropriate title. The report is about ${group.query} and contains this content: ${result.content.substring(0, 500)}...`,
                                                    schema: z.object({
                                                        title: z.string().describe("A descriptive title for the financial report")
                                                    }),
                                                });
                                                group.results[i].title = object.title;
                                            } catch (error) {
                                                console.error(`Error generating title for ${group.query} report:`, error);
                                                group.results[i].title = `${group.query} Financial Report`;
                                            }
                                        }
                                    }
                                }

                                // Merge Exa results with news results
                                news_results = [...news_results, ...exaResults];
                            } catch (error) {
                                console.error("Error fetching Exa financial reports:", error);
                            }

                            const code = `
import yfinance as yf
import matplotlib.pyplot as plt
import pandas as pd
from datetime import datetime

${stock_symbols.map(symbol =>
                                `${symbol.toLowerCase().replace('.', '')} = yf.download('${symbol}', period='${interval}', interval='1d')`).join('\n')}

# Create the plot
plt.figure(figsize=(10, 6))
${stock_symbols.map(symbol => `
# Convert datetime64 index to strings to make it serializable
${symbol.toLowerCase().replace('.', '')}.index = ${symbol.toLowerCase().replace('.', '')}.index.strftime('%Y-%m-%d')
plt.plot(${symbol.toLowerCase().replace('.', '')}.index, ${symbol.toLowerCase().replace('.', '')}['Close'], label='${symbol} ${formattedCurrencySymbols[stock_symbols.indexOf(symbol)]}', color='blue')
`).join('\n')}

# Customize the chart
plt.title('${title}')
plt.xlabel('Date')
plt.ylabel('Closing Price')
plt.legend()
plt.grid(True)
plt.show()`

                            console.log('Code:', code);

                            const daytona = new Daytona({
                                apiKey: serverEnv.DAYTONA_API_KEY,
                                target: SandboxTargetRegion.US,
                            })
                            const sandbox = await daytona.create({
                                image: "scira-analysis:1749316515",
                                language: 'python',
                                resources: {
                                    cpu: 2,
                                    memory: 5,
                                    disk: 10,
                                },
                                autoStopInterval: 0
                            })

                            const execution = await sandbox.process.codeRun(code);
                            let message = '';

                            if (execution.result === execution.artifacts?.stdout) {
                                message += execution.result;
                            } else if (execution.result && execution.result !== execution.artifacts?.stdout) {
                                message += execution.result;
                            } else if (execution.artifacts?.stdout && execution.artifacts?.stdout !== execution.result) {
                                message += execution.artifacts.stdout;
                            } else {
                                message += execution.result;
                            }

                            console.log("execution exit code: ", execution.exitCode)
                            console.log("execution result: ", execution.result)

                            console.log("Chart details: ", execution.artifacts?.charts)
                            if (execution.artifacts?.charts) {
                                console.log("showing chart")
                                execution.artifacts.charts[0].elements.map((element: any) => {
                                    console.log(element.points);
                                });
                            }

                            if (execution.artifacts?.charts === undefined) {
                                console.log("No chart found");
                            }

                            await sandbox.delete();

                            // map the chart to the correct format for the frontend and remove the png property
                            const chart = execution.artifacts?.charts?.[0] ?? undefined;
                            const chartData = chart ? {
                                type: chart.type,
                                title: chart.title,
                                elements: chart.elements,
                                png: undefined
                            } : undefined;

                            return {
                                message: message.trim(),
                                chart: chartData,
                                currency_symbols: formattedCurrencySymbols,
                                news_results: news_results
                            };
                        },
                    }),
                    currency_converter: tool({
                        description: 'Convert currency from one to another using yfinance',
                        parameters: z.object({
                            from: z.string().describe('The source currency code.'),
                            to: z.string().describe('The target currency code.'),
                            amount: z.number().describe('The amount to convert. Default is 1.'),
                        }),
                        execute: async ({ from, to, amount }: { from: string; to: string; amount: number }) => {
                            const code = `
import yfinance as yf

# Get exchange rates for both directions
from_currency = '${from}'
to_currency = '${to}'
amount = ${amount}

# Forward conversion (from -> to)
currency_pair_forward = f'{from_currency}{to_currency}=X'
data_forward = yf.Ticker(currency_pair_forward).history(period='1d')
rate_forward = data_forward['Close'].iloc[-1]
converted_amount = rate_forward * amount

# Reverse conversion (to -> from)  
currency_pair_reverse = f'{to_currency}{from_currency}=X'
data_reverse = yf.Ticker(currency_pair_reverse).history(period='1d')
rate_reverse = data_reverse['Close'].iloc[-1]

print(f"Forward rate: {rate_forward}")
print(f"Reverse rate: {rate_reverse}")
print(f"Converted amount: {converted_amount}")
`;
                            console.log('Currency pair:', from, to);

                            const daytona = new Daytona({
                                apiKey: serverEnv.DAYTONA_API_KEY,
                                target: SandboxTargetRegion.US,
                            })
                            const sandbox = await daytona.create({
                                image: "scira-analysis:1749316515",
                                language: 'python',
                                resources: {
                                    cpu: 2,
                                    memory: 5,
                                    disk: 10,
                                },
                                autoStopInterval: 0
                            })

                            const execution = await sandbox.process.codeRun(code);
                            let message = '';

                            if (execution.result === execution.artifacts?.stdout) {
                                message += execution.result;
                            } else if (execution.result && execution.result !== execution.artifacts?.stdout) {
                                message += execution.result;
                            } else if (execution.artifacts?.stdout && execution.artifacts?.stdout !== execution.result) {
                                message += execution.artifacts.stdout;
                            } else {
                                message += execution.result;
                            }

                            await sandbox.delete();

                            // Parse the output to extract rates
                            const lines = message.split('\n');
                            let forwardRate = null;
                            let reverseRate = null;
                            let convertedAmount = null;

                            for (const line of lines) {
                                if (line.includes('Forward rate:')) {
                                    forwardRate = parseFloat(line.split(': ')[1]);
                                }
                                if (line.includes('Reverse rate:')) {
                                    reverseRate = parseFloat(line.split(': ')[1]);
                                }
                                if (line.includes('Converted amount:')) {
                                    convertedAmount = parseFloat(line.split(': ')[1]);
                                }
                            }

                            return { 
                                rate: convertedAmount || message.trim(),
                                forwardRate: forwardRate,
                                reverseRate: reverseRate,
                                fromCurrency: from,
                                toCurrency: to,
                                amount: amount,
                                convertedAmount: convertedAmount
                            };
                        },
                    }),
                    x_search: tool({
                        description: 'Search X (formerly Twitter) posts using xAI Live Search.',
                        parameters: z.object({
                            query: z.string().describe('The search query for X posts'),
                            startDate: z.string().describe('The start date of the search in the format YYYY-MM-DD (default to 7 days ago if not specified)'),
                            endDate: z.string().describe('The end date of the search in the format YYYY-MM-DD (default to today if not specified)'),
                            xHandles: z.array(z.string()).optional().describe('Optional list of X handles/usernames to search from (without @ symbol). Only include if user explicitly mentions specific handles like "@elonmusk" or "@openai"'),
                            maxResults: z.number().optional().default(15).describe('Maximum number of search results to return (default 15)'),
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
                                const searchParameters: any = {
                                    mode: "on",
                                    from_date: startDate,
                                    to_date: endDate,
                                    max_search_results: maxResults < 5 ? 5 : maxResults,
                                    return_citations: true,
                                    sources: [
                                        xHandles && xHandles.length > 0 
                                            ? { type: "x", x_handles: xHandles, safe_search: false }
                                            : { type: "x" , safe_search: false }
                                    ]
                                };

                                console.log("[X search parameters]: ", searchParameters);
                                console.log("[X search handles]: ", xHandles);
        
                                const response = await fetch('https://api.x.ai/v1/chat/completions', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${serverEnv.XAI_API_KEY}`,
                                    },
                                    body: JSON.stringify({
                                        model: 'grok-3-mini',
                                        temperature: 0.5,
                                        messages: [
                                            {
                                                role: 'system',
                                                content: `You are a helpful assistant that searches for X posts and returns the results in a structured format. You will be given a search query and a list of X handles to search from. You will then search for the posts and return the results in a structured format. You will also cite the sources in the format [Source No.]. Go very deep in the search and return the most relevant results.`
                                            },
                                            {
                                                role: 'user',
                                                content: `${query}.`
                                            }
                                        ],
                                        search_parameters: searchParameters,
                                    }),
                                });
        
                                if (!response.ok) {
                                    throw new Error(`xAI API error: ${response.status} ${response.statusText}`);
                                }
        
                                const data = await response.json();

                                console.log("[X search data]: ", data);
                                
                                // Transform citations into sources with tweet text
                                const sources = [];
                                const citations = data.citations || [];
                                
                                if (citations.length > 0) {
                                                                // Extract tweet IDs and fetch tweet data using react-tweet
                            const tweetFetchPromises = citations
                                .filter((url: any) => typeof url === 'string' && url.includes('x.com'))
                                .map(async (url: string) => {
                                    try {
                                        // Extract tweet ID from URL
                                        const match = url.match(/\/status\/(\d+)/);
                                        if (!match) return null;
                                        
                                        const tweetId = match[1];
                                        
                                        // Fetch tweet data using react-tweet API
                                        const tweetData = await getTweet(tweetId);
                                        if (!tweetData) return null;
                                        
                                        const text = tweetData.text;
                                        if (!text) return null;
                                        
                                        return {
                                            text: text,
                                            link: url
                                        };
                                    } catch (error) {
                                        console.error(`Error fetching tweet data for ${url}:`, error);
                                        return null;
                                    }
                                });
                                    
                                    // Wait for all tweet fetches to complete
                                    const tweetResults = await Promise.all(tweetFetchPromises);
                                    
                                    // Filter out null results and add to sources
                                    sources.push(...tweetResults.filter(result => result !== null));
                                }
                                
                                return {
                                    content: data.choices[0]?.message?.content || '',
                                    citations: citations,
                                    sources: sources,
                                    query,
                                    dateRange: `${startDate} to ${endDate}`,
                                    handles: xHandles || [],
                                };
                            } catch (error) {
                                console.error('X search error:', error);
                                throw error;
                            }
                        },
                    }),
                    text_translate: tool({
                        description: "Translate text from one language to another.",
                        parameters: z.object({
                            text: z.string().describe("The text to translate."),
                            to: z.string().describe("The language to translate to (e.g., French)."),
                        }),
                        execute: async ({ text, to }: { text: string; to: string }) => {
                            const { object: translation } = await generateObject({
                                model: t3.languageModel(model),
                                system: `You are a helpful assistant that translates text from one language to another.`,
                                prompt: `Translate the following text to ${to} language: ${text}`,
                                schema: z.object({
                                    translatedText: z.string(),
                                    detectedLanguage: z.string(),
                                }),
                            });
                            console.log(translation);
                            return {
                                translatedText: translation.translatedText,
                                detectedLanguage: translation.detectedLanguage,
                            };
                        },
                    }),
                    web_search: tool({
                        description: 'Search the web for information with 5-10 queries, max results and search depth.',
                        parameters: z.object({
                            queries: z.array(z.string().describe('Array of search queries to look up on the web. Default is 5 to 10 queries.')),
                            maxResults: z.array(
                                z.number().describe('Array of maximum number of results to return per query. Default is 10.'),
                            ),
                            topics: z.array(
                                z.enum(['general', 'news', 'finance']).describe('Array of topic types to search for. Default is general.'),
                            ),
                            searchDepth: z.array(
                                z.enum(['basic', 'advanced']).describe('Array of search depths to use. Default is basic. Use advanced for more detailed results.'),
                            ),
                            include_domains: z
                                .array(z.string())
                                .describe('A list of domains to include in all search results. Default is an empty list.'),
                            exclude_domains: z
                                .array(z.string())
                                .describe('A list of domains to exclude from all search results. Default is an empty list.'),
                        }),
                        execute: async ({
                            queries,
                            maxResults,
                            topics,
                            searchDepth,
                            include_domains,
                            exclude_domains,
                        }: {
                            queries: string[];
                            maxResults: number[];
                            topics: ('general' | 'news' | 'finance')[];
                            searchDepth: ('basic' | 'advanced')[];
                            include_domains?: string[];
                            exclude_domains?: string[];
                        }) => {
                            const apiKey = serverEnv.TAVILY_API_KEY;
                            const tvly = tavily({ apiKey });
                            const includeImageDescriptions = true;

                            console.log('Queries:', queries);
                            console.log('Max Results:', maxResults);
                            console.log('Topics:', topics);
                            console.log('Search Depths:', searchDepth);
                            console.log('Include Domains:', include_domains);
                            console.log('Exclude Domains:', exclude_domains);

                            // Execute searches in parallel
                            const searchPromises = queries.map(async (query, index) => {
                                const data = await tvly.search(query, {
                                    topic: topics[index] || topics[0] || 'general',
                                    days: topics[index] === 'news' ? 7 : undefined,
                                    maxResults: maxResults[index] || maxResults[0] || 10,
                                    searchDepth: searchDepth[index] || searchDepth[0] || 'basic',
                                    includeAnswer: true,
                                    includeImages: true,
                                    includeImageDescriptions: includeImageDescriptions,
                                    excludeDomains: exclude_domains || undefined,
                                    includeDomains: include_domains || undefined,
                                });

                                // Add annotation for query completion
                                dataStream.writeMessageAnnotation({
                                    type: 'query_completion',
                                    data: {
                                        query,
                                        index,
                                        total: queries.length,
                                        status: 'completed',
                                        resultsCount: data.results.length,
                                        imagesCount: data.images.length
                                    }
                                });

                                return {
                                    query,
                                    results: deduplicateByDomainAndUrl(data.results).map((obj: any) => ({
                                        url: obj.url,
                                        title: obj.title,
                                        content: obj.content,
                                        published_date: topics[index] === 'news' ? obj.published_date : undefined,
                                    })),
                                    images: includeImageDescriptions
                                        ? await Promise.all(
                                            deduplicateByDomainAndUrl(data.images).map(
                                                async ({ url, description }: { url: string; description?: string }) => {
                                                    const sanitizedUrl = sanitizeUrl(url);
                                                    const imageValidation = await isValidImageUrl(sanitizedUrl);
                                                    return imageValidation.valid
                                                        ? {
                                                            url: imageValidation.redirectedUrl || sanitizedUrl,
                                                            description: description ?? '',
                                                        }
                                                        : null;
                                                },
                                            ),
                                        ).then((results) =>
                                            results.filter(
                                                (image): image is { url: string; description: string } =>
                                                    image !== null &&
                                                    typeof image === 'object' &&
                                                    typeof image.description === 'string' &&
                                                    image.description !== '',
                                            ),
                                        )
                                        : await Promise.all(
                                            deduplicateByDomainAndUrl(data.images).map(async ({ url }: { url: string }) => {
                                                const sanitizedUrl = sanitizeUrl(url);
                                                const imageValidation = await isValidImageUrl(sanitizedUrl);
                                                return imageValidation.valid ? (imageValidation.redirectedUrl || sanitizedUrl) : null;
                                            }),
                                        ).then((results) => results.filter((url) => url !== null) as string[]),
                                };
                            });

                            const searchResults = await Promise.all(searchPromises);

                            // Add synthesis step - compile all information like ChatGPT
                            // SKIP SYNTHESIS IN EXTREME MODE - let extreme search handle final comprehensive report
                            let synthesizedReport = '';
                            if (group !== 'extreme') {
                                try {
                                    // Collect all content for synthesis
                                    const allContent = searchResults.flatMap(search => 
                                        search.results.map(result => ({
                                            title: result.title,
                                            content: result.content,
                                            url: result.url,
                                            query: search.query
                                        }))
                                    );

                                    // Only synthesize if we have content
                                    if (allContent.length > 0) {
                                        const contentForSynthesis = allContent
                                            .slice(0, 15) // Limit to top 15 results for synthesis
                                            .map(item => `**${item.title}**\n${item.content.slice(0, 800)}`)
                                            .join('\n\n---\n\n');

                                        // Add annotation for synthesis start
                                        dataStream.writeMessageAnnotation({
                                            type: 'synthesis',
                                            data: {
                                                status: 'starting',
                                                message: 'Compiling and analyzing collected information...'
                                            }
                                        });

                                        const { object } = await generateObject({
                                            model: t3.languageModel(model),
                                            system: `You are an expert research analyst. Your task is to synthesize and compile information from multiple web sources into a comprehensive, well-structured report.

SYNTHESIS GUIDELINES:
1. **Comprehensive Analysis**: Analyze all provided sources and create a cohesive narrative
2. **Structure**: Organize information with clear headings and subheadings
3. **Key Insights**: Highlight the most important findings and insights
4. **Cross-Reference**: Connect related information from different sources
5. **Balanced Perspective**: Present multiple viewpoints when available
6. **Factual Accuracy**: Stick to information from the sources
7. **Clear Writing**: Use clear, engaging prose that's easy to understand
8. **Source Integration**: Seamlessly weave information from multiple sources
9. **Actionable Information**: Include practical takeaways when relevant
10. **Current Context**: Emphasize recent developments and current state

Create a comprehensive report that goes beyond just listing facts - provide analysis, context, and insights that would be valuable to someone seeking to understand this topic thoroughly.`,
                                            prompt: `Based on the following web search results for queries: "${queries.join(', ')}", create a comprehensive, well-structured report that synthesizes all the information:

${contentForSynthesis}

Create a detailed analysis that compiles, connects, and contextualizes this information into a coherent, insightful report.`,
                                            schema: z.object({
                                                synthesizedReport: z.string().describe("A comprehensive, well-structured report that synthesizes all the collected information into a cohesive analysis with insights, context, and key findings"),
                                                keyPoints: z.array(z.string()).describe("3-5 key insights or findings from the synthesis"),
                                                summary: z.string().describe("A concise summary of the main conclusions")
                                            }),
                                        });

                                        synthesizedReport = object.synthesizedReport;

                                        // Add annotation for synthesis completion
                                        dataStream.writeMessageAnnotation({
                                            type: 'synthesis',
                                            data: {
                                                status: 'completed',
                                                message: 'Information synthesis completed',
                                                keyPoints: object.keyPoints,
                                                summary: object.summary
                                            }
                                        });
                                    }
                                } catch (error) {
                                    console.error('Error during information synthesis:', error);
                                    dataStream.writeMessageAnnotation({
                                        type: 'synthesis',
                                        data: {
                                            status: 'error',
                                            message: 'Failed to synthesize information, showing raw results'
                                        }
                                    });
                                }
                            } else {
                                // In extreme mode, skip synthesis and let extreme search handle the final report
                                console.log('⚡ Extreme mode: Skipping web search synthesis - will be handled by extreme search');
                            }

                            return {
                                searches: searchResults,
                                synthesizedReport: synthesizedReport || null,
                                hasContent: searchResults.some(search => search.results.length > 0)
                            };
                        },
                    }),
                    movie_or_tv_search: tool({
                        description: 'Search for a movie or TV show using TMDB API',
                        parameters: z.object({
                            query: z.string().describe('The search query for movies/TV shows'),
                        }),
                        execute: async ({ query }: { query: string }) => {
                            const TMDB_API_KEY = serverEnv.TMDB_API_KEY;
                            const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

                            try {
                                // First do a multi-search to get the top result
                                const searchResponse = await fetch(
                                    `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=en-US&page=1&include_adult=false`,
                                    {
                                        method: 'GET',
                                        headers: {
                                            Authorization: `Bearer ${TMDB_API_KEY}`,
                                            accept: 'application/json',
                                        },
                                    },
                                );

                                // catch error if the response is not ok
                                if (!searchResponse.ok) {
                                    console.error('TMDB search error:', searchResponse.statusText);
                                    return { result: null };
                                }

                                const searchResults = await searchResponse.json();

                                // Get the first movie or TV show result
                                const firstResult = searchResults.results.find(
                                    (result: any) => result.media_type === 'movie' || result.media_type === 'tv',
                                );

                                if (!firstResult) {
                                    return { result: null };
                                }

                                // Get detailed information for the media
                                const detailsResponse = await fetch(
                                    `${TMDB_BASE_URL}/${firstResult.media_type}/${firstResult.id}?language=en-US`,
                                    {
                                        headers: {
                                            Authorization: `Bearer ${TMDB_API_KEY}`,
                                            accept: 'application/json',
                                        },
                                    },
                                );

                                const details = await detailsResponse.json();

                                // Get additional credits information
                                const creditsResponse = await fetch(
                                    `${TMDB_BASE_URL}/${firstResult.media_type}/${firstResult.id}/credits?language=en-US`,
                                    {
                                        headers: {
                                            Authorization: `Bearer ${TMDB_API_KEY}`,
                                            accept: 'application/json',
                                        },
                                    },
                                );

                                const credits = await creditsResponse.json();

                                // Format the result
                                const result = {
                                    ...details,
                                    media_type: firstResult.media_type,
                                    credits: {
                                        cast:
                                            credits.cast?.slice(0, 8).map((person: any) => ({
                                                ...person,
                                                profile_path: person.profile_path
                                                    ? `https://image.tmdb.org/t/p/original${person.profile_path}`
                                                    : null,
                                            })) || [],
                                        director: credits.crew?.find((person: any) => person.job === 'Director')?.name,
                                        writer: credits.crew?.find(
                                            (person: any) => person.job === 'Screenplay' || person.job === 'Writer',
                                        )?.name,
                                    },
                                    poster_path: details.poster_path
                                        ? `https://image.tmdb.org/t/p/original${details.poster_path}`
                                        : null,
                                    backdrop_path: details.backdrop_path
                                        ? `https://image.tmdb.org/t/p/original${details.backdrop_path}`
                                        : null,
                                };

                                return { result };
                            } catch (error) {
                                console.error('TMDB search error:', error);
                                throw error;
                            }
                        },
                    }),
                    trending_movies: tool({
                        description: 'Get trending movies from TMDB',
                        parameters: z.object({}),
                        execute: async () => {
                            const TMDB_API_KEY = serverEnv.TMDB_API_KEY;
                            const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

                            try {
                                const response = await fetch(`${TMDB_BASE_URL}/trending/movie/day?language=en-US`, {
                                    headers: {
                                        Authorization: `Bearer ${TMDB_API_KEY}`,
                                        accept: 'application/json',
                                    },
                                });

                                const data = await response.json();
                                const results = data.results.map((movie: any) => ({
                                    ...movie,
                                    poster_path: movie.poster_path
                                        ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
                                        : null,
                                    backdrop_path: movie.backdrop_path
                                        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
                                        : null,
                                }));

                                return { results };
                            } catch (error) {
                                console.error('Trending movies error:', error);
                                throw error;
                            }
                        },
                    }),
                    trending_tv: tool({
                        description: 'Get trending TV shows from TMDB',
                        parameters: z.object({}),
                        execute: async () => {
                            const TMDB_API_KEY = serverEnv.TMDB_API_KEY;
                            const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

                            try {
                                const response = await fetch(`${TMDB_BASE_URL}/trending/tv/day?language=en-US`, {
                                    headers: {
                                        Authorization: `Bearer ${TMDB_API_KEY}`,
                                        accept: 'application/json',
                                    },
                                });

                                const data = await response.json();
                                const results = data.results.map((show: any) => ({
                                    ...show,
                                    poster_path: show.poster_path
                                        ? `https://image.tmdb.org/t/p/original${show.poster_path}`
                                        : null,
                                    backdrop_path: show.backdrop_path
                                        ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
                                        : null,
                                }));

                                return { results };
                            } catch (error) {
                                console.error('Trending TV shows error:', error);
                                throw error;
                            }
                        },
                    }),
                    academic_search: tool({
                        description: 'Search academic papers and research with up-to-date information.',
                        parameters: z.object({
                            query: z.string().describe('The search query'),
                        }),
                        execute: async ({ query }: { query: string }) => {
                            try {
                                const exa = new Exa(serverEnv.EXA_API_KEY as string);

                                console.log('Enhanced Academic search query:', query);

                                // Add current year to get recent research
                                const currentYear = new Date().getFullYear();
                                const enhancedQuery = `${query} ${currentYear} ${currentYear - 1} recent latest`;

                                // Search academic papers with content summary and recent information
                                const result = await exa.searchAndContents(enhancedQuery, {
                                    type: 'auto',
                                    numResults: 25,
                                    category: 'research paper',
                                    livecrawl: 'always', // Always get the most current version
                                    startPublishedDate: `${currentYear - 3}-01-01`, // Only papers from last 3 years for recent info
                                    text: {
                                        maxCharacters: 2000, // Get more content for better summaries
                                        includeHtmlTags: false
                                    },
                                    summary: {
                                        query: 'Abstract and key findings of the research paper, including methodology, results, and conclusions',
                                    },
                                });

                                // Also search for recent web sources for current developments
                                const webResult = await exa.searchAndContents(`${query} research news developments ${currentYear}`, {
                                    type: 'auto',
                                    numResults: 10,
                                    livecrawl: 'always',
                                    startPublishedDate: `${currentYear - 1}-01-01`, // Recent web sources
                                    text: {
                                        maxCharacters: 1500,
                                        includeHtmlTags: false
                                    },
                                    summary: {
                                        query: 'Recent developments and current information about this topic',
                                    },
                                });

                                // Process and clean academic results
                                const processedAcademicResults = result.results.reduce<typeof result.results>((acc, paper) => {
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
                                        text: paper.text || '', // Include full text for comprehensive analysis
                                        publishedDate: paper.publishedDate || ''
                                    });

                                    return acc;
                                }, []);

                                // Process web sources for current information
                                const processedWebResults = webResult.results.reduce<typeof webResult.results>((acc, source) => {
                                    if (acc.some((s) => s.url === source.url) || !source.summary) return acc;

                                    const cleanSummary = source.summary.replace(/^Summary:\s*/i, '');
                                    const cleanTitle = source.title?.replace(/\s\[.*?\]$/, '');

                                    acc.push({
                                        ...source,
                                        title: cleanTitle || '',
                                        summary: cleanSummary,
                                        text: source.text || '',
                                        publishedDate: source.publishedDate || ''
                                    });

                                    return acc;
                                }, []);

                                // Combine results - academic papers first, then current sources
                                const combinedResults = [
                                    ...processedAcademicResults,
                                    ...processedWebResults
                                ];

                                return {
                                    results: combinedResults,
                                    academicCount: processedAcademicResults.length,
                                    currentSourcesCount: processedWebResults.length,
                                    totalCount: combinedResults.length
                                };
                            } catch (error) {
                                console.error('Enhanced Academic search error:', error);
                                throw error;
                            }
                        },
                    }),
                    youtube_search: tool({
                        description: 'Search YouTube videos using Google YouTube Data API and get detailed video information.',
                        parameters: z.object({
                            query: z.string().describe('The search query for YouTube videos'),
                        }),
                        execute: async ({ query, }: { query: string; }) => {
                            try {
                                // Check if YouTube API key is available
                                if (!serverEnv.YT_ENDPOINT) {
                                    console.error('YouTube API key not configured');
                                    throw new Error('YouTube API key not configured');
                                }

                                const youtubeApiKey = serverEnv.YT_ENDPOINT;

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
                    retrieve: tool({
                        description: 'Retrieve the full content from a URL using Exa AI, including text, title, summary, images, and more.',
                        parameters: z.object({
                            url: z.string().describe('The URL to retrieve the information from.'),
                            include_summary: z.boolean().describe('Whether to include a summary of the content. Default is true.'),
                            live_crawl: z.enum(['never', 'auto', 'always']).describe('Whether to crawl the page immediately. Options: never, auto, always. Default is "always".'),
                        }),
                        execute: async ({
                            url,
                            include_summary = true,
                            live_crawl = 'always'
                        }: {
                            url: string;
                            include_summary?: boolean;
                            live_crawl?: 'never' | 'auto' | 'always';
                        }) => {
                            try {
                                const exa = new Exa(serverEnv.EXA_API_KEY as string);

                                console.log(`Retrieving content from ${url} with Exa AI, summary: ${include_summary}, livecrawl: ${live_crawl}`);

                                const start = Date.now();

                                const result = await exa.getContents(
                                    [url],
                                    {
                                        text: true,
                                        summary: include_summary ? true : undefined,
                                        livecrawl: live_crawl
                                    }
                                );

                                // Check if there are results
                                if (!result.results || result.results.length === 0) {
                                    console.error('Exa AI error: No content retrieved');
                                    return { error: 'Failed to retrieve content', results: [] };
                                }

                                return {
                                    base_url: url,
                                    results: result.results.map((item) => {
                                        // Type assertion to access potentially missing properties
                                        const typedItem = item as any;
                                        return {
                                            url: item.url,
                                            content: typedItem.text || typedItem.summary || '',
                                            title: typedItem.title || item.url.split('/').pop() || 'Retrieved Content',
                                            description: typedItem.summary || `Content retrieved from ${item.url}`,
                                            author: typedItem.author || undefined,
                                            publishedDate: typedItem.publishedDate || undefined,
                                            image: typedItem.image || undefined,
                                            favicon: typedItem.favicon || undefined,
                                            language: 'en',
                                        };
                                    }),
                                    response_time: (Date.now() - start) / 1000
                                };
                            } catch (error) {
                                console.error('Exa AI error:', error);
                                return { error: error instanceof Error ? error.message : 'Failed to retrieve content', results: [] };
                            }
                        },
                    }),
                    code_interpreter: tool({
                        description: 'Write and execute Python code.',
                        parameters: z.object({
                            title: z.string().describe('The title of the code snippet.'),
                            code: z
                                .string()
                                .describe(
                                    'The Python code to execute. put the variables in the end of the code to print them. do not use the print function.',
                                ),
                            icon: z
                                .enum(['stock', 'date', 'calculation', 'default'])
                                .describe('The icon to display for the code snippet.'),
                        }),
                        execute: async ({ code, title, icon }: { code: string; title: string; icon: string }) => {
                            console.log('Code:', code);
                            console.log('Title:', title);
                            console.log('Icon:', icon);

                            const daytona = new Daytona({
                                apiKey: serverEnv.DAYTONA_API_KEY,
                                target: SandboxTargetRegion.US,
                            })
                            const sandbox = await daytona.create({
                                image: "scira-analysis:1749316515",
                                language: 'python',
                                resources: {
                                    cpu: 4,
                                    memory: 8,
                                    disk: 10,
                                },
                                timeout: 300,
                            })

                            const execution = await sandbox.process.codeRun(code);

                            console.log('Execution:', execution.result);
                            console.log('Execution:', execution.artifacts?.stdout);

                            let message = '';

                            if (execution.artifacts?.stdout === execution.result) {
                                message += execution.result;
                            }
                            else if (execution.result && execution.result !== execution.artifacts?.stdout) {
                                message += execution.result;
                            }
                            else if (execution.artifacts?.stdout && execution.artifacts?.stdout !== execution.result) {
                                message += execution.artifacts.stdout;
                            }
                            else {
                                message += execution.result;
                            }

                            if (execution.artifacts?.charts) {
                                console.log('Chart:', execution.artifacts.charts[0]);
                            }

                            let chart;

                            if (execution.artifacts?.charts) {
                                chart = execution.artifacts.charts[0];
                            }

                            // map the chart to the correct format for the frontend and remove the png property
                            const chartData = chart ? {
                                type: chart.type,
                                title: chart.title,
                                elements: chart.elements,
                                png: undefined
                            } : undefined;

                            await sandbox.delete();

                            return {
                                message: message.trim(),
                                chart: chartData,
                            };
                        },
                    }),

                    datetime: tool({
                        description: 'Get the current date and time in the user\'s timezone or a specific timezone if requested',
                        parameters: z.object({
                            location: z.string().optional().describe('The location/timezone to get time for (e.g., "India", "London", "New York", "Tokyo")')
                        }),
                        execute: async ({ location }: { location?: string }) => {
                            try {
                                // Get the current UTC time
                                const now = new Date();
                                
                                // Map location to timezone
                                let targetTimezone = timezone; // Default to user's timezone
                                
                                if (location) {
                                    const locationLower = location.toLowerCase();
                                    // Map common location names to timezones
                                    const timezoneMap: Record<string, string> = {
                                        'india': 'Asia/Kolkata',
                                        'delhi': 'Asia/Kolkata',
                                        'mumbai': 'Asia/Kolkata',
                                        'london': 'Europe/London',
                                        'uk': 'Europe/London',
                                        'new york': 'America/New_York',
                                        'nyc': 'America/New_York',
                                        'tokyo': 'Asia/Tokyo',
                                        'japan': 'Asia/Tokyo',
                                        'paris': 'Europe/Paris',
                                        'france': 'Europe/Paris',
                                        'berlin': 'Europe/Berlin',
                                        'germany': 'Europe/Berlin',
                                        'sydney': 'Australia/Sydney',
                                        'australia': 'Australia/Sydney',
                                        'china': 'Asia/Shanghai',
                                        'beijing': 'Asia/Shanghai',
                                        'singapore': 'Asia/Singapore',
                                        'dubai': 'Asia/Dubai',
                                        'uae': 'Asia/Dubai',
                                        'los angeles': 'America/Los_Angeles',
                                        'california': 'America/Los_Angeles',
                                        'chicago': 'America/Chicago',
                                        'texas': 'America/Chicago'
                                    };
                                    
                                    targetTimezone = timezoneMap[locationLower] || targetTimezone;
                                }

                                // Format date and time using the target timezone
                                return {
                                    timestamp: now.getTime(),
                                    iso: now.toISOString(),
                                    timezone: targetTimezone,
                                    location: location || 'User timezone',
                                    formatted: {
                                        date: new Intl.DateTimeFormat('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            timeZone: targetTimezone
                                        }).format(now),
                                        time: new Intl.DateTimeFormat('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: true,
                                            timeZone: targetTimezone
                                        }).format(now),
                                        dateShort: new Intl.DateTimeFormat('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                            timeZone: targetTimezone
                                        }).format(now),
                                        timeShort: new Intl.DateTimeFormat('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true,
                                            timeZone: targetTimezone
                                        }).format(now),
                                        // Add additional useful formats
                                        full: new Intl.DateTimeFormat('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            hour12: true,
                                            timeZone: targetTimezone
                                        }).format(now),
                                        iso_local: new Intl.DateTimeFormat('sv-SE', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            timeZone: targetTimezone
                                        }).format(now).replace(' ', 'T')
                                    }
                                };
                            } catch (error) {
                                console.error('Datetime error:', error);
                                throw error;
                            }
                        },
                    }),
                    mcp_search: tool({
                        description: 'Search for mcp servers and get the information about them',
                        parameters: z.object({
                            query: z.string().describe('The query to search for'),
                        }),
                        execute: async ({ query }: { query: string }) => {
                            try {
                                // Call the Smithery Registry API
                                const response = await fetch(
                                    `https://registry.smithery.ai/servers?q=${encodeURIComponent(query)}`,
                                    {
                                        headers: {
                                            'Authorization': `Bearer ${serverEnv.SMITHERY_API_KEY}`,
                                            'Content-Type': 'application/json',
                                        },
                                    }
                                );

                                if (!response.ok) {
                                    throw new Error(`Smithery API error: ${response.status} ${response.statusText}`);
                                }

                                const data = await response.json();

                                // Get detailed information for each server
                                const detailedServers = await Promise.all(
                                    data.servers.map(async (server: any) => {
                                        const detailResponse = await fetch(
                                            `https://registry.smithery.ai/servers/${encodeURIComponent(server.qualifiedName)}`,
                                            {
                                                headers: {
                                                    'Authorization': `Bearer ${serverEnv.SMITHERY_API_KEY}`,
                                                    'Content-Type': 'application/json',
                                                },
                                            }
                                        );

                                        if (!detailResponse.ok) {
                                            console.warn(`Failed to fetch details for ${server.qualifiedName}`);
                                            return server;
                                        }

                                        const details = await detailResponse.json();
                                        return {
                                            ...server,
                                            deploymentUrl: details.deploymentUrl,
                                            connections: details.connections,
                                        };
                                    })
                                );

                                return {
                                    servers: detailedServers,
                                    pagination: data.pagination,
                                    query: query
                                };
                            } catch (error) {
                                console.error('Smithery search error:', error);
                                return {
                                    error: error instanceof Error ? error.message : 'Unknown error',
                                    query: query
                                };
                            }
                        },
                    }),
                    extreme_search: extremeSearchTool(dataStream, model),
                    memory_manager: tool({
                        description: 'Manage user memories - store, search, and retrieve personal information.',
                        parameters: z.object({
                            action: z.enum(['add', 'search', 'get_all']).describe('Action to perform: add (store new memory), search (find memories), get_all (retrieve all memories)'),
                            query: z.string().describe('For add: the memory content to store. For search: the search query to find relevant memories. For get_all: optional filter query'),
                            metadata: z.object({
                                category: z.string().optional().describe('Memory category (personal, work, preferences, etc.)'),
                                tags: z.array(z.string()).optional().describe('Tags for the memory'),
                            }).optional().describe('Additional metadata for the memory'),
                        }),
                        execute: async ({ action, query, metadata }: { action: 'add' | 'search' | 'get_all'; query: string; metadata?: { category?: string; tags?: string[] } }) => {
                            try {
                                const memory = new MemoryClient({
                                    apiKey: serverEnv.MEM0_API_KEY!,
                                });

                                // Generate a simple user ID for demo (in production, use actual user ID)
                                const userId = 'demo-user-' + Buffer.from('demo').toString('base64').slice(0, 8);

                                if (action === 'add') {
                                    const result = await memory.add([{ role: 'user', content: query }], { 
                                        user_id: userId,
                                        metadata: metadata || {}
                                    });
                                    
                                    return {
                                        success: true,
                                        action: 'add',
                                        memory: result,
                                        message: 'Memory stored successfully'
                                    };
                                } else if (action === 'search') {
                                    const results = await memory.search(query, { 
                                        user_id: userId,
                                        limit: 10
                                    });
                                    
                                    return {
                                        success: true,
                                        action: 'search',
                                        results: results,
                                        message: `Found ${results.length} relevant memories`
                                    };
                                } else if (action === 'get_all') {
                                    const allMemories = await memory.getAll({ 
                                        user_id: userId,
                                        limit: 20
                                    });
                                    
                                    return {
                                        success: true,
                                        action: 'get_all',
                                        results: allMemories,
                                        message: `Retrieved ${allMemories.length} memories`
                                    };
                                }
                            } catch (error) {
                                console.error('Memory manager error:', error);
                                return {
                                    success: false,
                                    action,
                                    error: error instanceof Error ? error.message : 'Unknown error',
                                    message: 'Failed to perform memory operation'
                                };
                            }
                        },
                    }),
                    reddit_search: tool({
                        description: 'Search Reddit content using Tavily API.',
                        parameters: z.object({
                            query: z.string().describe('The exact search query from the user.'),
                            maxResults: z.number().describe('Maximum number of results to return. Default is 20.'),
                            timeRange: z.enum(['day', 'week', 'month', 'year']).describe('Time range for Reddit search.'),
                        }),
                        execute: async ({
                            query,
                            maxResults = 20,
                            timeRange = 'week',
                        }: {
                            query: string;
                            maxResults?: number;
                            timeRange?: 'day' | 'week' | 'month' | 'year';
                        }) => {
                            const apiKey = serverEnv.TAVILY_API_KEY;
                            const tvly = tavily({ apiKey });

                            console.log('Reddit search query:', query);
                            console.log('Max results:', maxResults);
                            console.log('Time range:', timeRange);

                            try {
                                const data = await tvly.search(query, {
                                    maxResults: maxResults,
                                    timeRange: timeRange,
                                    includeRawContent: "text",
                                    searchDepth: 'basic',
                                    topic: 'general',
                                    includeDomains: ["reddit.com"],
                                });

                                console.log("data", data);

                                // Process results for better display
                                const processedResults = data.results.map(result => {
                                    // Extract Reddit post metadata
                                    const isRedditPost = result.url.includes('/comments/');
                                    const subreddit = isRedditPost ?
                                        result.url.match(/reddit\.com\/r\/([^/]+)/)?.[1] || 'unknown' :
                                        'unknown';

                                    // Don't attempt to parse comments - treat content as a single snippet
                                    // The Tavily API already returns short content snippets
                                    return {
                                        url: result.url,
                                        title: result.title,
                                        content: result.content || '',
                                        score: result.score,
                                        published_date: result.publishedDate,
                                        subreddit,
                                        isRedditPost,
                                        // Keep original content as a single comment/snippet
                                        comments: result.content ? [result.content] : []
                                    };
                                });

                                return {
                                    query,
                                    results: processedResults,
                                    timeRange,
                                };
                            } catch (error) {
                                console.error('Reddit search error:', error);
                                throw error;
                            }
                        },
                    }),
                    };
                    
                    // Filter tools based on activeTools for extreme mode - exclude web_search completely
                    if (group === 'extreme') {
                        const filteredTools: any = {};
                        activeTools.forEach((toolName: string) => {
                            if (baseTools[toolName as keyof typeof baseTools]) {
                                filteredTools[toolName] = baseTools[toolName as keyof typeof baseTools];
                            }
                        });
                        console.log('🚀 EXTREME MODE: Filtered tools to only:', Object.keys(filteredTools));
                        return filteredTools;
                    }
                    
                    // For non-extreme modes, return all tools
                    return baseTools;
                })(),
                // experimental_repairToolCall disabled
                onChunk(event) {
                    if (event.chunk.type === 'tool-call') {
                        console.log('Called Tool: ', event.chunk.toolName);
                        
                        // Add thinking annotations for different tools - ChatGPT style
                        const toolName = event.chunk.toolName;
                        let thinkingMessage = '';
                        
                        switch (toolName) {
                            case 'web_search':
                                thinkingMessage = '🔍 Let me search the web for relevant information...';
                                break;
                            case 'stock_chart':
                                thinkingMessage = '📈 I\'ll analyze stock data and generate a chart for you...';
                                break;
                            case 'code_interpreter':
                                thinkingMessage = '💻 Running some calculations to help answer your question...';
                                break;
                            case 'movie_or_tv_search':
                                thinkingMessage = '🎬 Searching movie and TV databases...';
                                break;
                            case 'academic_search':
                                thinkingMessage = '📚 Looking up academic papers and research...';
                                break;
                            case 'youtube_search':
                                thinkingMessage = '📺 Searching YouTube for relevant videos...';
                                break;
                            case 'x_search':
                                thinkingMessage = '🐦 Searching X (Twitter) for recent posts...';
                                break;
                            case 'reddit_search':
                                thinkingMessage = '🔍 Browsing Reddit for community discussions...';
                                break;
                            case 'retrieve':
                                thinkingMessage = '📄 Fetching content from the specified URL...';
                                break;
                            case 'currency_converter':
                                thinkingMessage = '💱 Converting currencies with live exchange rates...';
                                break;
                            case 'datetime':
                                thinkingMessage = '🕐 Getting current date and time information...';
                                break;
                            case 'extreme_search':
                                thinkingMessage = '🚀 Initiating comprehensive research mode...';
                                break;
                            case 'text_translate':
                                thinkingMessage = '🌐 Translating text to the requested language...';
                                break;
                            case 'trending_movies':
                                thinkingMessage = '🎥 Fetching trending movies from TMDB...';
                                break;
                            case 'trending_tv':
                                thinkingMessage = '📺 Fetching trending TV shows from TMDB...';
                                break;
                            default:
                                thinkingMessage = `🔧 Using ${toolName} to help with your request...`;
                        }

                        // Send thinking annotation
                        dataStream.writeMessageAnnotation({
                            type: "thinking",
                            content: thinkingMessage
                        });
                    }
                    
                    // **EXTREME MODE: Suppress text streaming until tool completes**
                    if (group === 'extreme' && event.chunk.type === 'text-delta') {
                        // Allow text streaming in extreme mode - suppression was causing issues
                        // console.log('🚫 Suppressing text streaming for extreme mode until tool completes');
                        // return; // Don't stream text chunks in extreme mode
                    }
                },
                onStepFinish(event) {
                    if (event.warnings) {
                        console.log('Warnings: ', event.warnings);
                    }
                },
                onFinish: async (event) => {
                    console.log('Finished:', event.finishReason);
                },
                onError(event) {
                    console.log('Error: ', event.error);
                },
            });

            result.consumeStream()

            result.mergeIntoDataStream(dataStream, {
                sendReasoning: true
            });
        },
        onError(error) {
            console.log('Error: ', error);
            
            // Enhanced error handling for extreme mode
            if (group === 'extreme') {
                console.error("🚨 EXTREME MODE ERROR: API connection failed");
                if (error instanceof Error && error.message.includes('Rate Limit')) {
                    return 'Rate limit reached in Extreme Mode. Please try again later or switch to a different model.';
                }
                if (error instanceof Error && error.message.includes('Cannot connect')) {
                    return 'Extreme mode encountered API connectivity issues. Try switching to Gemini 2.5 Flash or GPT 4o for better stability.';
                }
                return 'Extreme mode encountered an error. Try switching to a more stable model like Gemini 2.5 Flash.';
            }
            
            if (error instanceof Error && error.message.includes('Rate Limit')) {
                return 'Oops, you have reached the rate limit! Please try again later.';
            }
            return 'Oops, an error occurred!';
        },
    })
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Accel-Buffering': 'no', // Disable nginx buffering
                'Connection': 'keep-alive'
            }
        });
}

// GET function removed - simplified version