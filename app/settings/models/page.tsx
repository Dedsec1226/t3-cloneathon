"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Brain, Zap, Eye, Code, Sparkles, Rocket } from 'lucide-react';

export default function ModelsPage() {
  const modelCategories = [
    {
      name: 'Reasoning Specialists',
      icon: Brain,
      description: 'Models optimized for complex reasoning and problem-solving',
      models: [
        {
          name: 'Claude 4 Opus',
          id: 't3-claude-4-opus',
          provider: 'Anthropic',
          description: 'Most powerful Claude 4 model available',
          features: ['Advanced Reasoning', 'Long Context', 'Multimodal'],
          isNew: true
        },
        {
          name: 'Claude 4 Sonnet',
          id: 't3-claude-4-sonnet',
          provider: 'Anthropic',
          description: 'Latest Claude 4 with enhanced capabilities',
          features: ['Fast Processing', 'Code Generation', 'Analysis'],
          isNew: true
        },
        {
          name: 'Claude 3.5 Sonnet',
          id: 't3-claude-3-5-sonnet',
          provider: 'Anthropic',
          description: 'Legacy high performance model',
          features: ['Fast Processing', 'Code Generation', 'Analysis'],
          isNew: false
        },
        {
          name: 'OpenAI o3-mini',
          id: 't3-o3-mini',
          provider: 'OpenAI',
          description: 'Latest reasoning model 2025',
          features: ['Fast Reasoning', 'Mathematical', 'Logical'],
          isNew: true
        },
        {
          name: 'OpenAI o1',
          id: 't3-o1',
          provider: 'OpenAI',
          description: 'Deep reasoning capabilities',
          features: ['Deep Reasoning', 'Complex Problems', 'Scientific'],
          isNew: false
        }
      ]
    },
    {
      name: 'Vision & Multimodal',
      icon: Eye,
      description: 'Models with advanced vision and multimodal capabilities',
      models: [

        {
          name: 'GPT-4o',
          id: 't3-4o',
          provider: 'OpenAI',
          description: 'Multimodal AI with vision and reasoning',
          features: ['Text & Images', 'Vision', 'Audio'],
          isNew: false
        },
        {
          name: 'Gemini 2.5 Flash',
          id: 't3-gemini-2-5-flash',
          provider: 'Google',
          description: 'Latest fast multimodal model',
          features: ['Multimodal', 'Fast Processing', 'Advanced Vision'],
          isNew: true
        }
      ]
    },
    {
      name: 'Coding Specialists',
      icon: Code,
      description: 'Models optimized for programming and development tasks',
      models: [
        {
          name: 'Claude 4 Sonnet (Code)',
          id: 't3-claude-4-sonnet',
          provider: 'Anthropic',
          description: 'Best coding assistant with Claude 4 capabilities',
          features: ['Code Generation', 'Debugging', 'Architecture'],
          isNew: true
        },
        {
          name: 'Claude 4 Opus (Code)',
          id: 't3-claude-4-opus',
          provider: 'Anthropic',
          description: 'Most powerful coding with step-by-step reasoning',
          features: ['Code Reasoning', 'Problem Analysis', 'Optimization'],
          isNew: true
        },
        {
          name: 'GPT-4 Turbo',
          id: 't3-gpt-4-turbo',
          provider: 'OpenAI',
          description: 'Advanced coding and development support',
          features: ['Code Generation', 'Documentation', 'Testing'],
          isNew: false
        }
      ]
    },
    {
      name: 'Fast & Efficient',
      icon: Zap,
      description: 'Quick response models for everyday tasks',
      models: [
        {
          name: 'Gemini 2.5 Flash (Default)',
          id: 't3-default',
          provider: 'Google',
          description: 'Default fast model with good performance',
          features: ['Quick Response', 'General Purpose', 'Efficient'],
          isNew: false
        },
        {
          name: 'GPT-4o Mini',
          id: 't3-4o-mini',
          provider: 'OpenAI',
          description: 'Fast and cost-effective OpenAI model',
          features: ['Fast', 'Conversation', 'General Knowledge'],
          isNew: false
        },
        {
          name: 'Claude 3.5 Haiku',
          id: 't3-claude-3-5-haiku',
          provider: 'Anthropic',
          description: 'Lightning-fast Claude model',
          features: ['Ultra Fast', 'Lightweight', 'Efficient'],
          isNew: false
        },
        {
          name: 'Gemini 2.5 Flash',
          id: 't3-gemini-2-5-flash',
          provider: 'Google',
          description: 'Fastest experimental Gemini model',
          features: ['Ultra Fast', 'Experimental', 'Quick Tasks'],
          isNew: true
        }
      ]
    },
    {
      name: 'Flagship Models',
      icon: Sparkles,
      description: 'Top-tier models for the most demanding tasks',
      models: [

        {
          name: 'GPT-4o',
          id: 't3-4o',
          provider: 'OpenAI',
          description: 'OpenAI\'s flagship multimodal model',
          features: ['Multimodal', 'Advanced Reasoning', 'Vision Capable'],
          isNew: false
        },
        {
          name: 'Gemini 2.0 Flash',
          id: 't3-gemini-2-0-flash',
          provider: 'Google',
          description: 'Latest Gemini model with enhanced capabilities',
          features: ['Fast Processing', 'Advanced AI', 'Latest Generation'],
          isNew: true
        }
      ]
    }
  ];

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'Anthropic': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'OpenAI': return 'bg-green-500/10 text-green-600 border-green-500/20';

      case 'Google': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Models</h1>
        <p className="text-muted-foreground mt-2">
          Choose from our comprehensive collection of AI models - all available in your open-source T3 Chat
        </p>
      </div>

      <Separator />

      {/* Model Categories */}
      <div className="space-y-8">
        {modelCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="space-y-4">
            <div className="flex items-center gap-3">
              <category.icon className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {category.models.map((model, modelIndex) => (
                <Card key={modelIndex} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {model.name}
                          {model.isNew && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs">
                              NEW
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {model.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`w-fit text-xs ${getProviderColor(model.provider)}`}
                    >
                      {model.provider}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {model.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>

                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Model Statistics
          </CardTitle>
          <CardDescription>
            Your AI model usage overview
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">25+</div>
              <div className="text-sm text-muted-foreground">AI Models</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">5</div>
              <div className="text-sm text-muted-foreground">AI Providers</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">∞</div>
              <div className="text-sm text-muted-foreground">Usage Limit</div>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">Free</div>
              <div className="text-sm text-muted-foreground">Open Source</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 