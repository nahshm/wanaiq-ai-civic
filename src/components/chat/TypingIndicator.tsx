import React from 'react';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  typingUsers: { id: string; username: string }[];
  className?: string;
}

export function TypingIndicator({ typingUsers, className }: TypingIndicatorProps) {
  if (typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.username);
  let text: string;

  if (names.length === 1) {
    text = `${names[0]} is typing`;
  } else if (names.length === 2) {
    text = `${names[0]} and ${names[1]} are typing`;
  } else if (names.length === 3) {
    text = `${names[0]}, ${names[1]}, and ${names[2]} are typing`;
  } else {
    text = `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing`;
  }

  return (
    <div className={cn('flex items-center gap-2 px-4 py-1 text-xs text-muted-foreground', className)}>
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
      </div>
      <span className="italic">{text}</span>
    </div>
  );
}
