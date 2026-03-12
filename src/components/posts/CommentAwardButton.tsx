import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Award, ThumbsUp, Lightbulb, Search, Wrench, Palette, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { CommentAward } from '@/types';

interface CommentAwardButtonProps {
  commentId: string;
  onAward?: (commentId: string, awardId: string) => Promise<void>;
  onRemoveAward?: (commentId: string, awardId: string) => Promise<void>;
  availableAwards?: CommentAward[];
  userRole?: 'citizen' | 'official' | 'expert' | 'journalist' | 'admin';
  size?: 'sm' | 'md';
}

const awardIcons = {
  'helpful': ThumbsUp,
  'insightful': Lightbulb,
  'well-researched': Search,
  'constructive': Wrench,
  'creative': Palette,
  'fact-check': CheckCircle,
};

const awardColors = {
  'helpful': 'text-green-600 hover:text-green-700',
  'insightful': 'text-blue-600 hover:text-blue-700',
  'well-researched': 'text-purple-600 hover:text-purple-700',
  'constructive': 'text-orange-600 hover:text-orange-700',
  'creative': 'text-pink-600 hover:text-pink-700',
  'fact-check': 'text-cyan-600 hover:text-cyan-700',
};

export const CommentAwardButton = ({
  commentId,
  onAward,
  onRemoveAward,
  availableAwards = [],
  userRole = 'citizen',
  size = 'sm'
}: CommentAwardButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Default awards if none provided
  const defaultAwards: CommentAward[] = [
    {
      id: 'helpful',
      name: 'helpful',
      displayName: 'Helpful',
      description: 'Provides useful information or assistance',
      icon: 'thumbs-up',
      color: '#16a34a',
      backgroundColor: '#dcfce7',
      points: 5,
      category: 'helpful',
      isEnabled: true,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'insightful',
      name: 'insightful',
      displayName: 'Insightful',
      description: 'Offers deep understanding or unique perspective',
      icon: 'lightbulb',
      color: '#2563eb',
      backgroundColor: '#dbeafe',
      points: 10,
      category: 'insightful',
      isEnabled: true,
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'well-researched',
      name: 'well-researched',
      displayName: 'Well-Researched',
      description: 'Backed by thorough research and evidence',
      icon: 'search',
      color: '#7c3aed',
      backgroundColor: '#ede9fe',
      points: 15,
      category: 'civic',
      isEnabled: true,
      sortOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'constructive',
      name: 'constructive',
      displayName: 'Constructive',
      description: 'Offers helpful criticism or suggestions',
      icon: 'wrench',
      color: '#ea580c',
      backgroundColor: '#fed7aa',
      points: 8,
      category: 'helpful',
      isEnabled: true,
      sortOrder: 4,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'creative',
      name: 'creative',
      displayName: 'Creative',
      description: 'Shows originality and innovative thinking',
      icon: 'palette',
      color: '#db2777',
      backgroundColor: '#fce7f3',
      points: 12,
      category: 'creative',
      isEnabled: true,
      sortOrder: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'fact-check',
      name: 'fact-check',
      displayName: 'Fact-Check',
      description: 'Verified information with credible sources',
      icon: 'check-circle',
      color: '#0891b2',
      backgroundColor: '#cffafe',
      points: 20,
      category: 'civic',
      isEnabled: true,
      sortOrder: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const awards = availableAwards.length > 0 ? availableAwards : defaultAwards;

  const handleAward = async (awardId: string) => {
    if (!onAward) return;

    setIsLoading(true);
    try {
      await onAward(commentId, awardId);
      toast({
        title: "Award Assigned",
        description: "The comment has been awarded successfully.",
      });
    } catch (error) {
      console.error('Error assigning award:', error);
      toast({
        title: "Error",
        description: "Failed to assign award. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAward = async (awardId: string) => {
    if (!onRemoveAward) return;

    setIsLoading(true);
    try {
      await onRemoveAward(commentId, awardId);
      toast({
        title: "Award Removed",
        description: "The award has been removed successfully.",
      });
    } catch (error) {
      console.error('Error removing award:', error);
      toast({
        title: "Error",
        description: "Failed to remove award. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Only show award button for users with sufficient permissions
  const canAward = ['official', 'expert', 'journalist', 'admin'].includes(userRole);

  if (!canAward) return null;

  const sizeClasses = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`${sizeClasses} text-muted-foreground hover:text-foreground`}
                disabled={isLoading}
              >
                <Award className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Award this comment</p>
          </TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
            Award Comment
          </div>
          {awards.map((award) => {
            const Icon = awardIcons[award.name as keyof typeof awardIcons] || Award;
            const colorClass = awardColors[award.name as keyof typeof awardColors] || 'text-gray-600';

            return (
              <DropdownMenuItem
                key={award.id}
                onClick={() => handleAward(award.id)}
                className="flex items-center gap-2 cursor-pointer"
                disabled={isLoading}
              >
                <Icon className={`h-4 w-4 ${colorClass}`} />
                <div className="flex-1">
                  <div className="font-medium">{award.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    +{award.points} points • {award.description}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};
