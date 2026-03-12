import React from 'react';

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({ content, className }: MessageContentProps) {
  if (!content) return null;

  const parts = content.split(URL_REGEX);

  return (
    <p className={className || 'text-foreground leading-relaxed break-words whitespace-pre-wrap'}>
      {parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
          // Reset regex lastIndex since we're reusing it
          URL_REGEX.lastIndex = 0;
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 break-all"
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </p>
  );
}
