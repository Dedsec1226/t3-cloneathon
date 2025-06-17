"use client";

import React from 'react';
import { Key } from 'lucide-react';

export default function ApiKeysPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Bring your own API keys for select models. Messages sent using your API keys will not count towards your monthly limits.
          </p>
        </div>
        
        <div className="space-y-6">
          {/* Anthropic API Key */}
          <div className="space-y-4 rounded-lg border border-input p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <h3 className="font-semibold">Anthropic API Key</h3>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Used for the following models:</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Claude 3.5 Sonnet</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Claude 3.7 Sonnet</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Claude 3.7 Sonnet (Reasoning)</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Claude 4 Opus</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Claude 4 Sonnet</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Claude 4 Sonnet (Reasoning)</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <input 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" 
                  placeholder="sk-ant-..." 
                  type="password" 
                  defaultValue=""
                />
                <p className="prose prose-pink text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a 
                    href="https://console.anthropic.com/account/keys" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="no-underline hover:underline"
                  >
                    Anthropic's Console
                  </a>
                </p>
              </div>
              <div className="flex w-full justify-end gap-2">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-pink-600/90 disabled:hover:bg-primary h-9 px-4 py-2">
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-4 rounded-lg border border-input p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <h3 className="font-semibold">OpenAI API Key</h3>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Used for the following models:</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">GPT-4.5</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">o3</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">o3 Pro</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <input 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" 
                  placeholder="sk-..." 
                  type="password" 
                  defaultValue=""
                />
                <p className="prose prose-pink text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="no-underline hover:underline"
                  >
                    OpenAI's Dashboard
                  </a>
                </p>
              </div>
              <div className="flex w-full justify-end gap-2">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-pink-600/90 disabled:hover:bg-primary h-9 px-4 py-2">
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Google API Key */}
          <div className="space-y-4 rounded-lg border border-input p-4">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <h3 className="font-semibold">Google API Key</h3>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">Used for the following models:</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Gemini 2.0 Flash</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Gemini 2.0 Flash Lite</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Gemini 2.5 Flash</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Gemini 2.5 Flash (Thinking)</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Gemini 2.5 Flash Lite</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Gemini 2.5 Flash Lite (Thinking)</span>
              <span className="rounded-full bg-secondary px-2 py-1 text-xs">Gemini 2.5 Pro</span>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <input 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" 
                  placeholder="AIza..." 
                  type="password" 
                  defaultValue=""
                />
                <p className="prose prose-pink text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="no-underline hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>
              <div className="flex w-full justify-end gap-2">
                <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground shadow hover:bg-pink-600/90 disabled:hover:bg-primary h-9 px-4 py-2">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 