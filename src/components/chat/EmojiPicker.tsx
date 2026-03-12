import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: '😀 Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '🤪', '😎', '🤩', '🥳', '😏', '😒', '😞', '😢', '😭', '😤', '🤯', '😱', '🤔', '🤫'],
  },
  {
    name: '👋 Gestures',
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '🤜', '✊', '👊', '🤞', '✌️', '🤟', '👋', '🫡', '💪', '🙏', '☝️', '👆', '👇', '👈', '👉'],
  },
  {
    name: '❤️ Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💗', '💖', '💘', '💝'],
  },
  {
    name: '🎉 Activities',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '⚽', '🏀', '🎮', '🎯', '🎵', '🎶', '🎤', '🎬', '📸', '🔥'],
  },
  {
    name: '🔧 Objects',
    emojis: ['💡', '📌', '📎', '✏️', '📝', '📅', '📊', '💻', '📱', '⏰', '🔑', '🔒', '🔔', '📣', '💰', '⭐'],
  },
  {
    name: '🇰🇪 Symbols',
    emojis: ['✅', '❌', '⚠️', '❓', '❗', '💯', '♻️', '🚀', '⚡', '🌍', '🇰🇪', '🏛️', '⚖️', '🕊️', '🤝', '📢'],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EmojiPicker({ onSelect, trigger, open, onOpenChange }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button type="button" variant="ghost" size="icon" className="h-9 w-9">
            <Smile className="h-5 w-5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="end" side="top">
        {/* Category tabs */}
        <div className="flex gap-0.5 mb-2 border-b pb-1.5 overflow-x-auto">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <Button
              key={cat.name}
              variant="ghost"
              size="sm"
              className={cn('h-7 px-2 text-xs shrink-0', activeCategory === i && 'bg-accent')}
              onClick={() => setActiveCategory(i)}
            >
              {cat.emojis[0]}
            </Button>
          ))}
        </div>
        <div className="text-xs font-medium text-muted-foreground mb-1.5">
          {EMOJI_CATEGORIES[activeCategory].name}
        </div>
        <div className="grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-lg hover:bg-accent"
              onClick={() => onSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
