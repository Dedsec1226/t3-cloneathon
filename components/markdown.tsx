// KaTeX CSS loaded dynamically when LaTeX is detected

import { Geist_Mono } from 'next/font/google';
// Dynamic import for syntax highlighter - only load when needed
import { useTheme } from 'next-themes';
import Link from 'next/link';
// Dynamic LaTeX import
const LaTeX = lazy(() => import('react-latex-next'));
import Marked, { ReactRenderer } from 'marked-react';
import React, { useCallback, useMemo, useState, lazy, Suspense, useRef } from 'react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from '@/lib/utils';
import { Check, Copy, WrapText, ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';

// Lazy load syntax highlighter to reduce initial bundle
const SyntaxHighlighter = lazy(() => 
  import('react-syntax-highlighter').then(module => ({ 
    default: module.Prism 
  }))
);

// Import the dark theme directly
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MarkdownRendererProps {
  content: string;
}

interface CitationLink {
  text: string;
  link: string;
}

// Citation source configuration
interface CitationSourceConfig {
  name: string;
  pattern: RegExp;
  urlGenerator: (title: string, source: string) => string | null;
}

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  preload: true,
  display: 'swap',
});

const citationSources: CitationSourceConfig[] = [
  {
    name: 'Wikipedia',
    pattern: /Wikipedia/i,
    urlGenerator: (title: string, source: string) => {
      const searchTerm = `${title} ${source.replace(/\s+[-–—]\s+Wikipedia/i, '')}`.trim();
      return `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm.replace(/\s+/g, '_'))}`;
    }
  },
  {
    name: 'arXiv',
    pattern: /arXiv:(\d+\.\d+)/i,
    urlGenerator: (title: string, source: string) => {
      const match = source.match(/arXiv:(\d+\.\d+)/i);
      return match ? `https://arxiv.org/abs/${match[1]}` : null;
    }
  },
  {
    name: 'GitHub',
    pattern: /github\.com\/[^\/]+\/[^\/\s]+/i,
    urlGenerator: (title: string, source: string) => {
      const match = source.match(/(https?:\/\/github\.com\/[^\/]+\/[^\/\s]+)/i);
      return match ? match[1] : null;
    }
  },
  {
    name: 'DOI',
    pattern: /doi:(\S+)/i,
    urlGenerator: (title: string, source: string) => {
      const match = source.match(/doi:(\S+)/i);
      return match ? `https://doi.org/${match[1]}` : null;
    }
  }
];

// Helper function to process citations
const processCitation = (title: string, source: string): { text: string, url: string } | null => {
  for (const citationSource of citationSources) {
    if (citationSource.pattern.test(source)) {
      const url = citationSource.urlGenerator(title, source);
      if (url) {
        return {
          text: `${title} - ${source}`,
          url
        };
      }
    }
  }
  return null;
};

const isValidUrl = (str: string) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const preprocessLaTeX = (content: string) => {
  // Handle all LaTeX delimiters properly
  let processedContent = content;

  // Find and preserve complete LaTeX blocks as-is
  const latexBlocks: string[] = [];
  
  // For block equations ($$...$$ and \[...\])
  const blockRegexes = [
    /(\$\$[\s\S]*?\$\$)/g,
    /(\\\[[\s\S]*?\\\])/g
  ];
  
  blockRegexes.forEach(regex => {
    processedContent = processedContent.replace(regex, (match) => {
      const id = latexBlocks.length;
      latexBlocks.push(match);
      return `___LATEX_BLOCK_${id}___`;
    });
  });

  // For inline equations ($...$ and \(...\)) - avoiding currency values
  const inlineRegexes = [
    /(\$(?!\s*\d+[.,\s]*\d*\s*$)(?:[^\$]|\\.)*?\$)/g,
    /(\\\([\s\S]*?\\\))/g
  ];
  
  const inlines: string[] = [];
  
  inlineRegexes.forEach(regex => {
    processedContent = processedContent.replace(regex, (match) => {
      const id = inlines.length;
      inlines.push(match);
      return `___LATEX_INLINE_${id}___`;
    });
  });

  // Now restore the LaTeX blocks after other processing
  processedContent = processedContent.replace(/___LATEX_BLOCK_(\d+)___/g, (_, id) => {
    return latexBlocks[parseInt(id)];
  });

  processedContent = processedContent.replace(/___LATEX_INLINE_(\d+)___/g, (_, id) => {
    return inlines[parseInt(id)];
  });

  return processedContent;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Preprocess content to find and normalize citation links before passing to marked
  // Table row counter for zebra striping (using ref to avoid re-renders)
  const tableRowCounterRef = useRef(0);

  const [processedContent, extractedCitations, latexBlocks] = useMemo(() => {
    const citations: CitationLink[] = [];
    
    // First, extract and protect LaTeX blocks
    const latexBlocks: Array<{id: string, content: string, isBlock: boolean}> = [];
    let modifiedContent = content;
    
    // Extract block equations first (they need to be standalone)
    const blockPatterns = [
      { pattern: /\\\[([\s\S]*?)\\\]/g, isBlock: true },
      { pattern: /\$\$([\s\S]*?)\$\$/g, isBlock: true }
    ];
    
    blockPatterns.forEach(({pattern, isBlock}) => {
      modifiedContent = modifiedContent.replace(pattern, (match) => {
        const id = `LATEX_${latexBlocks.length}_${Date.now()}`;
        latexBlocks.push({ id, content: match, isBlock });
        return `\n\n${id}\n\n`; // Ensure block equations are on their own lines
      });
    });
    
    // Extract inline equations
    const inlinePatterns = [
      { pattern: /\\\(([\s\S]*?)\\\)/g, isBlock: false },
      { pattern: /\$(?!\s*\d+[.,\s]*\d*\s*$)(?:[^\$]|\\.)*?\$(?!\d)/g, isBlock: false }
    ];
    
    inlinePatterns.forEach(({pattern, isBlock}) => {
      modifiedContent = modifiedContent.replace(pattern, (match) => {
        const id = `LATEX_${latexBlocks.length}_${Date.now()}`;
        latexBlocks.push({ id, content: match, isBlock });
        return id;
      });
    });
    
    // Now process citations (LaTeX is already protected)
    // Process standard markdown links
    const stdLinkRegex = /\[([^\]]+)\]\(((?:\([^()]*\)|[^()])*)\)/g;
    modifiedContent = modifiedContent.replace(stdLinkRegex, (match, text, url) => {
      citations.push({ text, link: url });
      return `[${text}](${url})`;
    });
    
    // Process references followed by URLs
    const refWithUrlRegex = /(?:\[(?:(?:\[?(PDF|DOC|HTML)\]?\s+)?([^\]]+))\]|\b([^.!?\n]+?(?:\s+[-–—]\s+\w+|\s+\([^)]+\)))\b)(?:\s*(?:\(|\[\s*|\s+))(https?:\/\/[^\s)]+)(?:\s*[)\]]|\s|$)/g;
    modifiedContent = modifiedContent.replace(refWithUrlRegex, (match, docType, bracketText, plainText, url) => {
      const text = bracketText || plainText;
      const fullText = (docType ? `[${docType}] ` : '') + text;
      const cleanUrl = url.replace(/[.,;:]+$/, '');
      
      citations.push({ text: fullText.trim(), link: cleanUrl });
      return `[${fullText.trim()}](${cleanUrl})`;
    });
    
    // Process quoted paper titles
    const quotedTitleRegex = /"([^"]+)"(?:\s+([^.!?\n]+?)(?:\s+[-–—]\s+(?:[A-Z][a-z]+(?:\.[a-z]+)?|\w+:\S+)))/g;
    modifiedContent = modifiedContent.replace(quotedTitleRegex, (match, title, source) => {
      const citation = processCitation(title, source);
      if (citation) {
        citations.push({ text: citation.text.trim(), link: citation.url });
        return `[${citation.text.trim()}](${citation.url})`;
      }
      return match;
    });
    
    // Process raw URLs to documents
    const rawUrlRegex = /(https?:\/\/[^\s]+\.(?:pdf|doc|docx|ppt|pptx|xls|xlsx))\b/gi;
    modifiedContent = modifiedContent.replace(rawUrlRegex, (match, url) => {
      const filename = url.split('/').pop() || url;
      const alreadyLinked = citations.some(citation => citation.link === url);
      if (!alreadyLinked) {
        citations.push({ text: filename, link: url });
      }
      return match;
    });
    
    return [modifiedContent, citations, latexBlocks];
  }, [content]);
  
  const citationLinks = extractedCitations;

  interface CodeBlockProps {
    language: string | undefined;
    children: string;
  }

  const CodeBlock: React.FC<CodeBlockProps> = ({ language, children }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [isWrapped, setIsWrapped] = useState(false);
    const { theme } = useTheme();

    const handleCopy = useCallback(async () => {
      await navigator.clipboard.writeText(children);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }, [children]);

    const toggleWrap = useCallback(() => {
      setIsWrapped(prev => !prev);
    }, []);

    return (
      <div className="group my-5 relative">
        <div className="rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xs syntax-highlighter">
          <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
            <div className="px-2 py-0.5 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {language || 'text'}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={toggleWrap}
                className={`
                  px-2 py-1
                  rounded text-xs font-medium
                  transition-all duration-200
                  ${isWrapped ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'}
                  hover:bg-neutral-200 dark:hover:bg-neutral-700
                  flex items-center gap-1.5
                `}
                aria-label="Toggle line wrapping"
              >
                {isWrapped ? (
                  <>
                    <ArrowLeftRight className="h-3 w-3" />
                    <span className="hidden sm:inline">Unwrap</span>
                  </>
                ) : (
                  <>
                    <WrapText className="h-3 w-3" />
                    <span className="hidden sm:inline">Wrap</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCopy}
                className={`
                  px-2 py-1
                  rounded text-xs font-medium
                  transition-all duration-200
                  ${isCopied ? 'text-primary dark:text-primary' : 'text-neutral-500 dark:text-neutral-400'}
                  hover:bg-neutral-200 dark:hover:bg-neutral-700
                  flex items-center gap-1.5
                `}
                aria-label="Copy code"
              >
                {isCopied ? (
                  <>
                    <Check className="h-3 w-3" />
                    <span className="hidden sm:inline">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <Suspense fallback={
            <pre className={cn(
              "overflow-x-auto p-3 rounded-b-md text-sm font-mono",
              theme === 'dark' ? 'text-neutral-100' : 'bg-gray-50 text-gray-900'
            )} style={{ backgroundColor: theme === 'dark' ? '#1f1b23' : undefined }}>
              <code>{children}</code>
            </pre>
          }>
            <SyntaxHighlighter
              language={language || 'text'}
              style={theme === 'dark' ? atomDark : undefined}
              customStyle={{
                margin: 0,
                padding: '1rem',
                backgroundColor: theme === 'dark' ? '#1f1b23' : '#f8f9fa',
                borderRadius: 0,
                borderBottomLeftRadius: '0.375rem',
                borderBottomRightRadius: '0.375rem',
                fontFamily: geistMono.style.fontFamily,
                fontSize: '14px',
                lineHeight: '1.5',
              }}
              showLineNumbers={false}
              wrapLongLines={isWrapped}
              codeTagProps={{
                style: {
                  fontFamily: geistMono.style.fontFamily, 
                  fontSize: '14px',
                  whiteSpace: isWrapped ? 'pre-wrap' : 'pre',
                  overflowWrap: isWrapped ? 'break-word' : 'normal',
                  wordBreak: isWrapped ? 'break-word' : 'keep-all'
                }
              }}
            >
              {children}
            </SyntaxHighlighter>
          </Suspense>
        </div>
      </div>
    );
  };

  CodeBlock.displayName = 'CodeBlock';

  const LinkPreview = ({ href, title }: { href: string, title?: string }) => {
    const domain = new URL(href).hostname;

    return (
      <div className="flex flex-col bg-white dark:bg-neutral-800 text-xs m-0">
        <div className="flex items-center h-6 space-x-1.5 px-2 pt-2 text-xs text-neutral-600 dark:text-neutral-300">
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
            alt=""
            width={12}
            height={12}
            className="rounded-sm"
            onError={(e) => {
              // Fallback to a generic icon if favicon fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <span className="truncate font-medium">{domain}</span>
        </div>
        {title && (
          <div className="px-2 pb-2 pt-1">
            <h3 className="font-normal text-sm m-0 text-neutral-700 dark:text-neutral-200 line-clamp-3">
              {title}
            </h3>
          </div>
        )}
      </div>
    );
  };

  const renderHoverCard = (href: string, text: React.ReactNode, isCitation: boolean = false, citationText?: string) => {
    // Temporarily disable HoverCard to prevent infinite loops
    return (
      <Link
        key={generateKey()}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={isCitation
          ? "cursor-pointer text-xs no-underline text-[#ff8c37] dark:text-[#ff9f57] py-0.5 px-1.25 m-0! bg-[#ff8c37]/10 dark:bg-[#ff9f57]/10 rounded-sm font-medium inline-flex items-center -translate-y-[1px] leading-none hover:bg-[#ff8c37]/20 dark:hover:bg-[#ff9f57]/20 focus:outline-none focus:ring-1 focus:ring-[#ff8c37] align-baseline"
          : "text-primary bg-primary/10 dark:text-primary-light no-underline hover:underline font-medium"}
      >
        {text}
      </Link>
    );
  };

  // Simple counter-based key generation
  let keyCounter = 0;
  const generateKey = () => `key-${++keyCounter}`;

  const renderCitation = (index: number, citationText: string, href: string) => {
    return (
      <span className="inline-flex items-baseline relative whitespace-normal" key={generateKey()}>
        {renderHoverCard(href, index + 1, true, citationText)}
      </span>
    );
  };

  const renderer: Partial<ReactRenderer> = useMemo(() => ({
    text(text: string) {
      // Check if this text contains any LaTeX placeholders
      const latexPattern = /LATEX_(\d+)_\d+/g;
      const matches = [...text.matchAll(latexPattern)];
      
      if (matches.length === 0) {
        return text;
      }
      
      // If the entire text is just one LaTeX placeholder
      if (matches.length === 1 && text.trim() === matches[0][0]) {
        const latexBlock = latexBlocks.find(block => block.id === text.trim());
        if (latexBlock) {
          if (latexBlock.isBlock) {
            return (
              <div className="my-6 text-center" key={generateKey()}>
                <LaTeX
                  delimiters={[
                    { left: '$$', right: '$$', display: true },
                    { left: '\\[', right: '\\]', display: true }
                  ]}
                  strict={false}
                >
                  {latexBlock.content}
                </LaTeX>
              </div>
            );
          } else {
            return (
              <LaTeX
                delimiters={[
                  { left: '$', right: '$', display: false },
                  { left: '\\(', right: '\\)', display: false }
                ]}
                strict={false}
                key={generateKey()}
              >
                {latexBlock.content}
              </LaTeX>
            );
          }
        }
      }
      
      // If text contains LaTeX placeholders mixed with other content
      if (matches.length > 0) {
        const parts = [];
        let lastIndex = 0;
        const fragmentKey = generateKey(); // Generate a unique key for this fragment
        
        matches.forEach((match, index) => {
          // Add text before the LaTeX placeholder
          if (match.index! > lastIndex) {
            parts.push(<span key={`text-before-${fragmentKey}-${index}`}>{text.slice(lastIndex, match.index)}</span>);
          }
          
          // Add the LaTeX component
          const latexBlock = latexBlocks.find(block => block.id === match[0]);
          if (latexBlock) {
            parts.push(
              <LaTeX
                key={`latex-${fragmentKey}-${index}`}
                delimiters={[
                  { left: '$', right: '$', display: false },
                  { left: '\\(', right: '\\)', display: false }
                ]}
                strict={false}
              >
                {latexBlock.content}
              </LaTeX>
            );
          } else {
            parts.push(<span key={`fallback-${fragmentKey}-${index}`}>{match[0]}</span>); // fallback to placeholder text
          }
          
          lastIndex = match.index! + match[0].length;
        });
        
        // Add any remaining text after the last LaTeX placeholder
        if (lastIndex < text.length) {
          parts.push(<span key={`text-after-${fragmentKey}`}>{text.slice(lastIndex)}</span>);
        }
        
        return <React.Fragment key={fragmentKey}>{parts}</React.Fragment>;
      }
      
      return text;
    },
    paragraph(children) {
      // Check if the paragraph contains only a LaTeX block placeholder
      if (typeof children === 'string') {
        const latexMatch = children.match(/^LATEX_(\d+)_\d+$/);
        if (latexMatch) {
          const latexBlock = latexBlocks.find(block => block.id === children);
          if (latexBlock && latexBlock.isBlock) {
            // Render block equations outside of paragraph tags to avoid div inside p
            return (
              <div className="my-6 text-center" key={generateKey()}>
                <LaTeX
                  delimiters={[
                    { left: '$$', right: '$$', display: true },
                    { left: '\\[', right: '\\]', display: true }
                  ]}
                  strict={false}
                >
                  {latexBlock.content}
                </LaTeX>
              </div>
            );
          }
        }
      }
      
      // Check if children contains any block-level elements that shouldn't be in a paragraph
      if (React.Children.count(children) > 0) {
        const hasBlockElements = React.Children.toArray(children).some(child => {
          if (React.isValidElement(child)) {
            // Check if this is a div or other block element
            return typeof child.type === 'string' && ['div', 'table', 'figure'].includes(child.type);
          }
          return false;
        });
        
        if (hasBlockElements) {
          // Return children without wrapping in paragraph to avoid nesting issues
          return <div key={generateKey()} className="my-5">{children}</div>;
        }
      }
      
      return <p key={generateKey()} className="my-5 leading-relaxed text-neutral-700 dark:text-neutral-300">{children}</p>;
    },
    code(children, language) {
      return <CodeBlock language={language} key={generateKey()}>{String(children)}</CodeBlock>;
    },
    link(href, text) {
      const citationIndex = citationLinks.findIndex(link => link.link === href);
      if (citationIndex !== -1) {
        // For citations, show the citation text in the hover card
        const citationText = citationLinks[citationIndex].text;
        return renderCitation(citationIndex, citationText, href);
      }
      return isValidUrl(href)
        ? renderHoverCard(href, text)
        : <a key={generateKey()} href={href} className="text-primary dark:text-primary-light hover:underline font-medium">{text}</a>;
    },
    heading(children, level) {
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      const sizeClasses = {
        1: "text-2xl md:text-3xl font-extrabold mt-4 mb-4",
        2: "text-xl md:text-2xl font-bold mt-4 mb-3",
        3: "text-lg md:text-xl font-semibold mt-4 mb-3",
        4: "text-base md:text-lg font-medium mt-4 mb-2",
        5: "text-sm md:text-base font-medium mt-4 mb-2",
        6: "text-xs md:text-sm font-medium mt-4 mb-2",
      }[level] || "";

      return (
        <HeadingTag key={generateKey()} className={`${sizeClasses} text-neutral-900 dark:text-neutral-50 tracking-tight`}>
          {children}
        </HeadingTag>
      );
    },
    list(children, ordered) {
      const ListTag = ordered ? 'ol' : 'ul';
      return (
        <ListTag key={generateKey()} className={`my-5 pl-6 space-y-2 text-neutral-700 dark:text-neutral-300 ${ordered ? 'list-decimal' : 'list-disc'}`}>
          {children}
        </ListTag>
      );
    },
    listItem(children) {
      return <li key={generateKey()} className="pl-1 leading-relaxed">{children}</li>;
    },
    blockquote(children) {
      return (
        <blockquote key={generateKey()} className="my-6 border-l-4 border-primary/30 dark:border-primary/20 pl-4 py-1 text-neutral-700 dark:text-neutral-300 italic bg-neutral-50 dark:bg-neutral-900/50 rounded-r-md">
          {children}
        </blockquote>
      );
    },
    table(children) {
      // Reset row counter for each table
      tableRowCounterRef.current = 0;
      return (
        <div key={generateKey()} className="w-full my-6">
          <div className="overflow-hidden rounded border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse m-0!">
                {children}
              </table>
            </div>
          </div>
        </div>
      );
    },
    tableRow(children) {
      const currentRow = tableRowCounterRef.current;
      tableRowCounterRef.current += 1;
      
      // Skip zebra striping for header rows
      const isEvenRow = currentRow > 0 && currentRow % 2 === 0;
      
      return (
        <tr key={generateKey()} className={cn(
          "border-b border-neutral-200 dark:border-neutral-700 last:border-b-0",
          "hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors duration-200",
          isEvenRow && "bg-neutral-50/50 dark:bg-neutral-800/30"
        )}>
          {children}
        </tr>
      );
    },
    tableCell(children, flags) {
      const alignClass = flags.align 
        ? `text-${flags.align}` 
        : 'text-left';
      const isHeader = flags.header;

      return isHeader ? (
        <th key={generateKey()} className={cn(
          "px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-neutral-50",
          "bg-neutral-100 dark:bg-neutral-800",
          "border-b border-neutral-200 dark:border-neutral-700",
          "break-words",
          alignClass
        )}>
          <div className="font-medium">
            {children}
          </div>
        </th>
      ) : (
        <td key={generateKey()} className={cn(
          "px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300",
          "border-r border-neutral-100 dark:border-neutral-800 last:border-r-0",
          "break-words",
          alignClass
        )}>
          <div className="leading-relaxed">
            {children}
          </div>
        </td>
      );
    },
    tableHeader(children) {
      return (
        <thead key={generateKey()}>
          {children}
        </thead>
      );
    },
    tableBody(children) {
      return (
        <tbody key={generateKey()}>
          {children}
        </tbody>
      );
    },
  }), [citationLinks, latexBlocks, processedContent]);

  return (
    <div className="mt-3 markdown-body prose prose-neutral dark:prose-invert max-w-none dark:text-neutral-200 font-sans">
      <Marked renderer={renderer}>
        {processedContent}
      </Marked>
    </div>
  );
};

export const CopyButton = ({ text }: { text: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        if (!navigator.clipboard) {
          return;
        }
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success("Copied to clipboard");
      }}
      className="h-8 px-2 text-xs rounded-full"
    >
      {isCopied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
};

export { MarkdownRenderer, preprocessLaTeX }; 