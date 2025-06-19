// extremeSearch(researchPrompt)
// --> Plan research using LLM to generate a structured research plan
// ----> Break research into components with discrete search queries
// ----> For each search query, search web and collect sources
// ----> Use structured source collection to provide comprehensive research results
// ----> Return all collected sources and research data to the user

import Exa from "exa-js";
import { Daytona, SandboxTargetRegion } from '@daytonaio/sdk';
import { DataStreamWriter, generateObject, generateText, tool } from "ai";
import { z } from "zod";
import { serverEnv } from "@/env/server";
import { t3 } from "@/ai/providers";

export const SYSTEM_PROMPT = `You are an expert researcher conducting real-time web research. 

TODAY'S DATE: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
CURRENT YEAR: ${new Date().getFullYear()}

Follow these instructions when responding:
  - You MUST search for and prioritize CURRENT ${new Date().getFullYear()} information and latest developments
  - Focus on recent news, current data, and up-to-date information - avoid outdated sources from 2023 or earlier
  - You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news
  - The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct
  - Be highly organized
  - Suggest solutions that I didn't think about
  - Be proactive and anticipate my needs
  - Treat me as an expert in all subject matter
  - Mistakes erode my trust, so be accurate and thorough
  - Provide detailed explanations, I'm comfortable with lots of detail
  - Value good arguments over authorities, the source is irrelevant
  - Consider new technologies and contrarian ideas, not just the conventional wisdom
  - You may use high levels of speculation or prediction, just flag it for me
  - You must provide links to sources used. Ideally these are inline e.g. [this documentation](https://documentation.com/this)
  - CRITICAL: Always prioritize current, real-time web information over historical data
  `;

const pythonLibsAvailable = [
    "pandas",
    "numpy",
    "scipy",
    "keras",
    "seaborn",
    "matplotlib",
    "transformers",
    "scikit-learn"
]

const daytona = new Daytona({
    apiKey: serverEnv.DAYTONA_API_KEY,
    target: SandboxTargetRegion.US,
});

const runCode = async (code: string, installLibs: string[] = []) => {
    const sandbox = await daytona.create({
        language: 'python',
        resources: {
            cpu: 4,
            memory: 8,
            disk: 10,
        },
        autoStopInterval: 0
    })

    if (installLibs.length > 0) {
        await sandbox.process.executeCommand(`pip install ${installLibs.join(" ")}`);
    }

    const result = await sandbox.process.codeRun(code, undefined, 0);
    sandbox.delete();
    return result;
}

export const exa = new Exa(serverEnv.EXA_API_KEY);

type SearchResult = {
    title: string;
    url: string;
    content: string;
    publishedDate: string;
    favicon: string;
};

export type Research = {
    text: string;
    toolResults: any[];
    sources: SearchResult[];
    charts: any[];
};

enum SearchCategory {
    NEWS = "news",
    COMPANY = "company",
    RESEARCH_PAPER = "research paper",
    GITHUB = "github",
    FINANCIAL_REPORT = "financial report",
}

const searchWeb = async (
    query: string,
    category?: SearchCategory
): Promise<SearchResult[]> => {
    try {
        // Enhance query based on category and prioritize current information
        let enhancedQuery = category ? `${query} ${category}` : query;
        
        // Add current year emphasis to get latest information
        if (!enhancedQuery.includes(new Date().getFullYear().toString()) && !enhancedQuery.includes('latest') && !enhancedQuery.includes('current')) {
            enhancedQuery = `${enhancedQuery} ${new Date().getFullYear()} latest current`;
        }
        
        const { results } = await exa.searchAndContents(enhancedQuery, {
            numResults: 2, // Reduced to 2 for rate limit optimization
            type: "auto", 
            text: {
                maxCharacters: 800, // Reduced content per result for faster processing
                includeHtmlTags: false
            },
            livecrawl: "always", // Always use live crawl for current information
            startPublishedDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0], // Only search from last year onwards
        });
        return results.map((r) => ({
            title: r.title,
            url: r.url,
            content: r.text || "",
            publishedDate: r.publishedDate || "",
            favicon: r.favicon || "",
        })) as SearchResult[];
    } catch (error) {
        console.error(`Search failed for query "${query}":`, error);
        // Return empty results on search failure
        return [];
    }
};

const getContents = async (links: string[]) => {
    try {
        const result = await exa.getContents(
            links,
            {
                        text: {
                maxCharacters: 1500,
                includeHtmlTags: false
            },
                livecrawl: "always",
            },
        )
        return result.results.map(r => ({
            title: r.title,
            url: r.url,
            content: r.text,
            publishedDate: r.publishedDate,
            favicon: r.favicon,
        }));
    } catch (error) {
        console.error(`Failed to get contents for links:`, error);
        // Return empty results on failure
        return [];
    }
}


const extremeSearch = async (
    prompt: string,
    dataStream: DataStreamWriter,
    selectedModel: string = "t3-default",
): Promise<Research> => {
    dataStream.writeMessageAnnotation({
        status: { title: "Beginning autonomous research" },
    });

    // add sleep for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Track all sources we've found
    const allSources: SearchResult[] = [];

    dataStream.writeMessageAnnotation({
        status: { title: "Planning research" },
    });

    // plan out the research with fallback
    let plan;
    try {
        const result = await generateObject({
            model: t3.languageModel(selectedModel),
            schema: z.object({
                plan: z.array(
                    z.object({
                        title: z.string().min(10).max(70).describe("A title for the research topic"),
                        todos: z.array(z.string()).min(1).max(1).describe("Exactly 1 specific, focused search query for the given title"),
                    })
                ).min(2).max(3),
            }),
            prompt: `
Create a comprehensive research plan for: ${prompt}

TODAY'S DATE: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
CURRENT YEAR: ${new Date().getFullYear()}

REQUIREMENTS:
- Generate 2-3 research sections covering the most essential aspects only
- Each section should have 1 focused search query
- Focus on authoritative sources and key concepts
- Target 2-3 total search actions for efficient coverage (rate limit optimization)
- Make each search query unique and concise (avoid duplicates)
- Cover core concepts and practical applications
- Keep searches highly focused and specific
- Prioritize quality over quantity - fewer, better searches

SEARCH QUERY STYLE:
- Be specific and technical
- Include measurement units, specific terms, CURRENT YEAR (${new Date().getFullYear()})
- Use terms like "latest", "current", "${new Date().getFullYear()}", "recent developments"
- Avoid outdated years like 2023 or earlier - focus on ${new Date().getFullYear()} and current information
- Vary between broad concepts and detailed specifics
- Target different types of sources (academic, news, technical)
- CRITICAL: Always search for current, up-to-date information`,
        });
        plan = result.object;
    } catch (error) {
        console.error("Failed to generate research plan with AI, using fallback:", error);
        
        // Fallback plan generation - create a basic plan based on the prompt
        plan = {
            plan: [
                {
                    title: `Core concepts and fundamentals of ${prompt}`,
                    todos: [`${prompt} definition fundamentals basics`]
                },
                {
                    title: `Current research and developments in ${prompt}`,
                    todos: [`${prompt} latest research ${new Date().getFullYear()} current developments`]
                },
                {
                    title: `Applications and practical aspects of ${prompt}`,
                    todos: [`${prompt} applications real world examples uses`]
                }
            ]
        };
        
        dataStream.writeMessageAnnotation({
            status: { title: "Using fallback research plan due to API connectivity issues" },
        });
    }

    console.log(plan.plan);

    // calculate the total number of todos
    const totalTodos = plan.plan.reduce((acc, curr) => acc + curr.todos.length, 0);
    console.log(`Total todos: ${totalTodos}`);

    dataStream.writeMessageAnnotation({
        status: { title: "Research plan ready, starting up research agent" },
        plan: plan.plan
    });

    // Add explicit instruction annotations
    dataStream.writeMessageAnnotation({
        status: { title: `Starting systematic research execution - ${totalTodos} searches planned` },
    });

    let toolResults: any[] = [];
    let text = "";

    // Create the autonomous research agent with tools - with fallback
    try {
        const result = await generateText({
            model: t3.languageModel(selectedModel),
            maxSteps: Math.min(totalTodos, 4), // Limit to number of planned searches
            system: `TODAY IS ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} - SEARCH FOR CURRENT ${new Date().getFullYear()} INFORMATION

Execute ALL ${totalTodos} searches using webSearch tool:

${plan.plan.map((item, idx) => `${idx + 1}. "${item.todos[0]}"`).join('\n')}

CRITICAL SEARCH REQUIREMENTS:
- Focus on CURRENT ${new Date().getFullYear()} information and latest developments
- Use terms like "latest", "current", "${new Date().getFullYear()}", "recent" in queries
- Avoid searching for outdated information from 2023 or earlier years
- Complete all ${totalTodos} searches systematically
- Use categories: research paper, news, company
- STOP immediately after completing all ${totalTodos} searches - do not call additional tools`,
            prompt,
            temperature: 0,
            toolChoice: 'required', // Ensure searches are executed
            tools: {
            codeRunner: {
                description: 'Run Python code in a sandbox',
                parameters: z.object({
                    title: z.string().describe('The title of what you are running the code for'),
                    code: z.string().describe('The Python code to run with proper syntax and imports'),
                }),
                execute: async ({ title, code }) => {
                    console.log("Running code:", code);
                    // check if the code has any imports other than the pythonLibsAvailable
                    // and then install the missing libraries
                    const imports = code.match(/import\s+([\w\s,]+)/);
                    const importLibs = imports ? imports[1].split(',').map((lib: string) => lib.trim()) : [];
                    const missingLibs = importLibs.filter((lib: string) => !pythonLibsAvailable.includes(lib));

                    dataStream.writeMessageAnnotation({
                        status: { type: "code", title: title, code: code },
                    });
                    const response = await runCode(code, missingLibs);

                    // Extract chart data if present, and if so then map and remove the png with chart.png
                    const charts = response.artifacts?.charts?.map(chart => {
                        if (chart.png) {
                            const { png, ...chartWithoutPng } = chart;
                            return chartWithoutPng;
                        }
                        return chart;
                    }) || [];

                    console.log("Charts:", response.artifacts?.charts);

                    dataStream.writeMessageAnnotation({
                        status: {
                            type: "result",
                            title: title,
                            code: code,
                            result: response.result,
                            charts: charts
                        },
                    });

                    return {
                        result: response.result,
                        charts: charts
                    };
                },
            },
            webSearch: {
                description: 'Search the web for information on a topic',
                parameters: z.object({
                    query: z.string().describe('The search query to achieve the todo').max(100),
                    category: z.nativeEnum(SearchCategory).optional().describe('The category of the search if relevant'),
                }),
                execute: async ({ query, category }, { toolCallId }) => {
                    console.log("Web search query:", query);
                    console.log("Category:", category);

                    // Add thinking annotation - ChatGPT style
                    dataStream.writeMessageAnnotation({
                        type: "thinking",
                        content: `🔍 Searching for information about "${query}"${category ? ` in ${category} sources` : ''}...`
                    });

                    dataStream.writeMessageAnnotation({
                        status: { title: `Searching the web for "${query}"` },
                    });

                    // Add a query annotation to display in the UI
                    // Use a consistent format for query annotations
                    dataStream.writeMessageAnnotation({
                        type: "search_query",
                        queryId: toolCallId,
                        query: query,
                    });

                    let results = await searchWeb(query, category);
                    console.log(`Found ${results.length} results for query "${query}"`);

                    // Add thinking annotation about results found
                    dataStream.writeMessageAnnotation({
                        type: "thinking",
                        content: `📊 Found ${results.length} relevant sources. Analyzing content...`
                    });

                    // Add these sources to our total collection
                    allSources.push(...results);

                    results.forEach(async (source) => {
                        dataStream.writeMessageAnnotation({
                            type: "source",
                            queryId: toolCallId,
                            source: { title: source.title, url: source.url },
                        });
                    });

                    // Get full content for the top results
                    if (results.length > 0) {
                        try {
                            dataStream.writeMessageAnnotation({
                                status: { title: `Reading content from search results for "${query}"` },
                            });

                            // Get the URLs from the results
                            const urls = results.map(r => r.url);

                            // Get the full content using getContents
                            const contentsResults = await getContents(urls);

                            // For each content result, add a content annotation
                            contentsResults.forEach((content) => {
                                dataStream.writeMessageAnnotation({
                                    type: "content",
                                    queryId: toolCallId,
                                    content: {
                                        title: content.title,
                                        url: content.url,
                                        text: content.content.slice(0, 300) + "...", // Truncate for annotation
                                        full: content.content
                                    }
                                });
                            });

                            // Update results with full content, handling potential null values
                            // if the content is empty, use the original result
                            results = contentsResults.map(content => ({
                                title: content.title || "",
                                url: content.url,
                                content: content.content || results.find(r => r.url === content.url)?.content || "",
                                publishedDate: content.publishedDate || "",
                                favicon: content.favicon || ""
                            })) as SearchResult[];
                        } catch (error) {
                            console.error("Error fetching content:", error);
                        }
                    }

                    return results.map(r => ({
                        title: r.title,
                        url: r.url,
                        content: r.content,
                        publishedDate: r.publishedDate
                    }));
                },
            },
        },
        onStepFinish: (step) => {
            console.log("Step finished:", step.finishReason);
            console.log("Step:", step.stepType);
            if (step.toolResults) {
                toolResults.push(...step.toolResults);
                
                // Add progress annotation
                const completedSearches = toolResults.filter(r => r.toolName === "webSearch").length;
                dataStream.writeMessageAnnotation({
                    type: "thinking",
                    content: `✅ Search ${completedSearches}/${totalTodos} complete`
                });
            }
        },
    });
    text = result.text;
    } catch (error) {
        console.error("Failed to execute research agent, using direct search fallback:", error);
        
        dataStream.writeMessageAnnotation({
            status: { title: "Using direct search fallback due to API connectivity issues" },
        });
        
        // Fallback: Execute searches directly without AI agent
        for (const item of plan.plan) {
            for (const query of item.todos) {
                try {
                    dataStream.writeMessageAnnotation({
                        status: { title: `Direct search for "${query}"` },
                    });
                    
                    const results = await searchWeb(query);
                    allSources.push(...results);
                    
                    dataStream.writeMessageAnnotation({
                        type: "thinking",
                        content: `✅ Found ${results.length} sources for "${query}"`
                    });
                } catch (searchError) {
                    console.error(`Failed to search for "${query}":`, searchError);
                    dataStream.writeMessageAnnotation({
                        type: "thinking",
                        content: `❌ Search failed for "${query}"`
                    });
                }
            }
        }
        
        text = "Research completed using direct search fallback due to connectivity issues.";
    }

    dataStream.writeMessageAnnotation({
        status: { title: "Synthesizing research findings..." },
    });

    // Add thinking annotation for synthesis
    dataStream.writeMessageAnnotation({
        type: "thinking",
        content: `🧠 Analyzing ${allSources.length} sources and compiling comprehensive research report...`
    });

    // Get unique sources - enhanced deduplication to prevent duplicates
    const uniqueSources = allSources.reduce((acc: SearchResult[], current) => {
        // Check for duplicates by URL and title to prevent same content being added multiple times
        const isDuplicate = acc.some(existing => 
            existing.url === current.url || 
            (existing.title === current.title && existing.title.length > 10)
        );
        if (!isDuplicate) {
            acc.push(current);
        }
        return acc;
    }, []);

    console.log(`Total sources found: ${allSources.length}, Unique sources: ${uniqueSources.length}`);

    // Enhanced synthesis to prevent code duplication
    let synthesizedReport = "";
    dataStream.writeMessageAnnotation({
        status: { title: "Synthesizing comprehensive research report" },
    });

    try {
        const result = await generateText({
            model: t3.languageModel(selectedModel),
            system: SYSTEM_PROMPT + `

CRITICAL SYNTHESIS INSTRUCTIONS:
- You are now in the SYNTHESIS PHASE of extreme research
- Compile ALL collected sources into a comprehensive, well-structured research report
- Use markdown formatting with clear headers, subheaders, and bullet points
- Include inline citations with [source title](url) format
- Provide executive summary, key findings, detailed analysis, and conclusions
- Be thorough but concise - this is the final deliverable
- Synthesize information across sources to identify patterns and insights
- Present conflicting viewpoints if they exist
- Include specific data, statistics, and examples from the sources
- AVOID REPEATING OR DUPLICATING CODE BLOCKS OR SIMILAR CONTENT
- Focus on unique insights and comprehensive analysis rather than code repetition`,
            prompt: `Based on the research conducted for: "${prompt}"

SOURCES COLLECTED (${uniqueSources.length} total):
${uniqueSources.slice(0, 10).map((source, i) => `
${i + 1}. **${source.title}**
   URL: ${source.url}
   Content: ${source.content.slice(0, 1000)}${source.content.length > 1000 ? '...' : ''}
   Published: ${source.publishedDate || 'Unknown'}
`).join('\n')}

RESEARCH PLAN EXECUTED:
${plan.plan.map((item, idx) => `${idx + 1}. ${item.title}: "${item.todos[0]}"`).join('\n')}

Please synthesize this research into a comprehensive report that addresses the original query: "${prompt}"

Structure your response as a complete research report with:
1. Executive Summary
2. Key Findings
3. Detailed Analysis (with subsections as needed)
4. Sources and Evidence
5. Conclusions and Implications

Use proper markdown formatting and include inline citations. Avoid duplicating content or code blocks.`,
            temperature: 0.3,
        });
        synthesizedReport = result.text;
    } catch (error) {
        console.error("Synthesis failed, using source summary:", error);
        
        // Fallback synthesis
        synthesizedReport = `# Research Summary: ${prompt}

## Sources Found
${uniqueSources.slice(0, 5).map((source, i) => `
### ${i + 1}. [${source.title}](${source.url})
${source.content.slice(0, 500)}...
`).join('\n')}

*Note: This is a simplified summary due to synthesis processing limitations.*`;
    }

    dataStream.writeMessageAnnotation({
        status: { title: "Research synthesis completed" },
    });

    const chartResults = toolResults.filter(result =>
        result.toolName === "codeRunner" &&
        typeof result.result === 'object' &&
        result.result !== null &&
        'charts' in result.result
    );

    console.log("Chart results:", chartResults);

    const charts = chartResults.flatMap(result => (result.result as any).charts || []);

    console.log("Tool results:", toolResults);
    console.log("Charts:", charts);
    console.log("Unique sources:", uniqueSources.length);

    return {
        text: synthesizedReport, // Return the synthesized report instead of raw agent text
        toolResults,
        sources: uniqueSources.map(s => ({
            ...s,
            content: s.content.slice(0, 1500) + (s.content.length > 1500 ? "..." : "")
        })),
        charts,
    };
};

export const extremeSearchTool = (dataStream: DataStreamWriter, selectedModel: string = "t3-default") =>
    tool({
        description: "Use this tool to conduct an extreme search on a given topic.",
        parameters: z.object({
            prompt: z
                .string()
                .describe(
                    "This should take the user's exact prompt. Extract from the context but do not infer or change in any way.",
                ),
        }),
        execute: async ({ prompt }) => {
            console.log({ prompt });

            const research = await extremeSearch(prompt, dataStream, selectedModel);

            return {
                research: {
                    text: research.text,
                    toolResults: research.toolResults,
                    sources: research.sources,
                    charts: research.charts,
                },
            };
        },
    }); 