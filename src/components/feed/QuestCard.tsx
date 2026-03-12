import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface QuestCardProps {
  quest: {
    id: string;
    title: string;
    description: string;
    category: 'reporting' | 'attendance' | 'engagement' | 'content' | 'learning';
    points: number;
    available_in_community?: string;
  };
  userProgress?: {
    progress: number;
    status: 'not_started' | 'in_progress' | 'completed';
  };
  onStartQuest?: (questId: string) => void;
}

const categoryIcons = {
  reporting: Target,
  attendance: TrendingUp,
  engagement: Award,
  content: Award,
  learning: Award,
};

const categoryColors = {
  reporting: 'from-amber-500 to-yellow-500',
  attendance: 'from-blue-500 to-cyan-500',
  engagement: 'from-purple-500 to-pink-500',
  content: 'from-green-500 to-emerald-500',
  learning: 'from-orange-500 to-red-500',
};

export const QuestCard = ({ quest, userProgress, onStartQuest }: QuestCardProps) => {
  const Icon = categoryIcons[quest.category];
  const gradientColor = categoryColors[quest.category];
  const progress = userProgress?.progress || 0;
  const isCompleted = userProgress?.status === 'completed';
  const isInProgress = userProgress?.status === 'in_progress';

  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl",
        "bg-gradient-to-br from-amber-50/50 to-yellow-50/50 dark:from-amber-950/20 dark:to-yellow-950/20",
        "border-amber-400/50 hover:border-amber-500"
      )}
    >
      {/* Gold accent bar - responsive */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        `bg-gradient-to-r ${gradientColor}`
      )} />

      <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
        {/* Top row - responsive flex */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          {/* Icon and Badge */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl",
              `bg-gradient-to-br ${gradientColor}`,
              "shadow-lg"
            )}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            
            <Badge 
              variant="outline" 
              className="bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-800 dark:text-amber-200 font-semibold px-2 py-0.5 text-xs sm:text-sm"
            >
              🎯 QUEST AVAILABLE
            </Badge>
          </div>

          {/* Status badge - only show if in progress or completed */}
          {(isInProgress || isCompleted) && (
            <Badge 
              variant="secondary"
              className={cn(
                "text-xs font-medium px-2 py-1",
                isCompleted && "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
                isInProgress && "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
              )}
            >
              {isCompleted ? '✓ Completed' : '⏱️ In Progress'}
            </Badge>
          )}
        </div>

        {/* Title - responsive text size */}
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mt-3 leading-tight">
          {quest.title}
        </h3>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
        {/* Description - responsive */}
        <p className="text-sm sm:text-base text-muted-foreground line-clamp-2">
          {quest.description}
        </p>

        {/* Progress bar - always responsive */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium text-muted-foreground">
              Progress
            </span>
            <span className="font-bold text-foreground">
              {progress}%
            </span>
          </div>
          
          <div className="relative h-2 sm:h-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
            <div 
              className={cn(
                "absolute top-0 left-0 h-full transition-all duration-500",
                `bg-gradient-to-r ${gradientColor}`,
                "rounded-full"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Rewards - responsive grid */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 text-amber-700 dark:text-amber-300 font-medium">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{quest.points} XP</span>
          </div>
        </div>

        {/* Actions - responsive layout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
          <Button
            onClick={() => onStartQuest?.(quest.id)}
            className={cn(
              "flex-1 sm:flex-initial font-semibold text-sm sm:text-base",
              `bg-gradient-to-r ${gradientColor}`,
              "hover:opacity-90 transition-opacity",
              "text-white shadow-md hover:shadow-lg",
              "h-10 sm:h-11 px-6"
            )}
            disabled={isCompleted}
          >
            {isCompleted ? '✓ Completed' : isInProgress ? 'Continue Quest' : 'Start Quest'}
          </Button>

          {quest.available_in_community && (
            <Link
              to={`/c/${quest.available_in_community}`}
              className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors text-center sm:text-left"
            >
              Available in <span className="font-semibold text-civic-blue">c/{quest.available_in_community}</span>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
