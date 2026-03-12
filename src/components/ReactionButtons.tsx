import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ThumbsUp, Laugh, Angry, Frown, AlertCircle } from 'lucide-react';

interface ReactionButtonsProps {
  onReaction: (reaction: string) => void;
}

const ReactionButtons: React.FC<ReactionButtonsProps> = ({ onReaction }) => {
  const reactions = [
    { emoji: '❤️', icon: Heart, name: 'heart', color: 'text-red-500' },
    { emoji: '👍', icon: ThumbsUp, name: 'thumbs_up', color: 'text-blue-500' },
    { emoji: '😂', icon: Laugh, name: 'laugh', color: 'text-yellow-500' },
    { emoji: '😠', icon: Angry, name: 'angry', color: 'text-red-600' },
    { emoji: '😢', icon: Frown, name: 'sad', color: 'text-blue-400' },
    { emoji: '😮', icon: AlertCircle, name: 'surprised', color: 'text-purple-500' },
  ];

  return (
    <div className="reaction-buttons">
      <h3 className="text-white text-lg font-semibold mb-3">React</h3>
      <div className="grid grid-cols-3 gap-2">
        {reactions.map((reaction) => (
          <Button
            key={reaction.name}
            onClick={() => onReaction(reaction.name)}
            variant="outline"
            size="sm"
            className="flex flex-col items-center space-y-1 h-auto py-3 bg-black/20 border-white/10 hover:bg-white/10 text-white"
          >
            <span className="text-2xl">{reaction.emoji}</span>
            <span className="text-xs opacity-75 capitalize">{reaction.name.replace('_', ' ')}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ReactionButtons;
