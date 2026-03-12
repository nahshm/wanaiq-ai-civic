import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, ThumbsUp, Lightbulb, Search, Wrench, Palette, CheckCircle } from 'lucide-react';
import type { CommentAward } from '@/types';

interface CommentAwardDisplayProps {
  awards?: CommentAward[];
  size?: 'sm' | 'md';
}

const getAwardIcon = (awardName: string) => {
  switch (awardName.toLowerCase()) {
    case 'helpful':
      return ThumbsUp;
    case 'insightful':
      return Lightbulb;
    case 'well-researched':
      return Search;
    case 'constructive':
      return Wrench;
    case 'creative':
      return Palette;
    case 'fact-check':
      return CheckCircle;
    default:
      return Award;
  }
};

const getAwardColor = (awardName: string) => {
  switch (awardName.toLowerCase()) {
    case 'helpful':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'insightful':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'well-researched':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'constructive':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'creative':
      return 'bg-pink-100 text-pink-800 border-pink-200';
    case 'fact-check':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const CommentAwardDisplay = ({ awards = [], size = 'sm' }: CommentAwardDisplayProps) => {
  if (!awards || awards.length === 0) return null;

  const sizeClasses = size === 'sm' ? 'h-4 w-4 text-xs' : 'h-5 w-5 text-sm';

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1 mt-1">
        {awards.map((award) => {
          const Icon = getAwardIcon(award.name);
          const colorClass = getAwardColor(award.name);

          return (
            <Tooltip key={award.id}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`${colorClass} ${sizeClasses} px-1.5 py-0.5 cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  <Icon className="mr-1" />
                  {award.points}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{award.displayName}</p>
                  <p className="text-xs text-muted-foreground">{award.description}</p>
                  {award.assignedBy && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Awarded by {award.assignedBy.displayName}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
