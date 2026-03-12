import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import rehypeExternalLinks from 'rehype-external-links';
import DOMPurify from 'dompurify';
import { AlertTriangle } from 'lucide-react';

interface ContentRendererProps {
    content: string;
    className?: string;
    truncate?: boolean;
    maxLength?: number;
}

/**
 * Detects content type based on patterns
 */
const detectContentType = (content: string): 'html' | 'markdown' | 'text' => {
    // Check for HTML tags
    if (/<[a-z][\s\S]*>/i.test(content)) {
        return 'html';
    }

    // Check for markdown patterns
    if (/(\*\*|__|```|\[.*\]\(.*\)|^#{1,6}\s|^\s*[-*+]\s)/m.test(content)) {
        return 'markdown';
    }

    return 'text';
};

/**
 * Safely renders user-generated content with proper formatting
 * Handles HTML, Markdown, and plain text with sanitization
 */
export const ContentRenderer: React.FC<ContentRendererProps> = React.memo(({
    content,
    className = '',
    truncate = false,
    maxLength = 300
}) => {
    const processedContent = useMemo(() => {
        try {
            if (!content) return null;

            const type = detectContentType(content);
            let processed = content;

            // Handle escaped newlines first (common issue)
            processed = processed.replace(/\\n/g, '\n');

            // Truncate if needed (before processing to avoid breaking tags)
            if (truncate) {
                const plainText = processed.replace(/<[^>]*>/g, '').replace(/[*_`~]/g, '');
                if (plainText.length > maxLength) {
                    processed = plainText.slice(0, maxLength) + '...';
                    // Force plain text rendering for truncated content
                    return { type: 'text' as const, content: processed };
                }
            }

            return { type, content: processed };
        } catch (error) {
            console.error('Content processing error:', error);
            return { type: 'text' as const, content: content.slice(0, 200) + '...' };
        }
    }, [content, truncate, maxLength]);

    // Error fallback UI
    if (!processedContent?.content) {
        return (
            <div className={`text-muted-foreground text-sm italic ${className}`}>
                <AlertTriangle className="inline w-4 h-4 mr-1" />
                Content unavailable
            </div>
        );
    }

    // Render based on content type
    if (processedContent.type === 'html') {
        const sanitized = DOMPurify.sanitize(processedContent.content, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'code', 'pre'],
            ALLOWED_ATTR: ['href', 'class', 'target', 'rel'],
            ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
        });

        return (
            <div
                className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
                dangerouslySetInnerHTML={{ __html: sanitized }}
            />
        );
    }

    if (processedContent.type === 'markdown' || processedContent.type === 'text') {
        return (
            <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[
                        rehypeSanitize,
                        [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]
                    ]}
                    components={{
                        // Custom link rendering for internal routes
                        a: ({ node, href, children, ...props }) => {
                            const isInternal = href?.startsWith('/');
                            if (isInternal) {
                                return (
                                    <a href={href} className="text-primary underline hover:text-primary/80" {...props}>
                                        {children}
                                    </a>
                                );
                            }
                            return <a href={href} {...props}>{children}</a>;
                        }
                    }}
                >
                    {processedContent.content}
                </ReactMarkdown>
            </div>
        );
    }

    return null;
});

ContentRenderer.displayName = 'ContentRenderer';
