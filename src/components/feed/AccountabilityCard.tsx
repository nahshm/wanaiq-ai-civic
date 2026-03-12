import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertTriangle, ExternalLink, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AccountabilityCardProps {
  update: {
    id: string;
    type: 'promise' | 'project';
    title: string;
    status: 'completed' | 'in_progress' | 'delayed';
    official_name?: string;
    official_position?: string;
    evidence_images?: string[];
    budget?: number;
    timeline_months?: number;
    community?: string;
    description?: string;
  };
  onTrack?: (updateId: string) => void;
  onViewDetails?: (updateId: string) => void;
}

const statusConfig = {
  completed: {
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-400',
    label: 'Completed',
  },
  in_progress: {
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-400',
    label: 'In Progress',
  },
  delayed: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-400',
    label: 'Delayed',
  },
};

export const AccountabilityCard = ({ update, onTrack, onViewDetails }: AccountabilityCardProps) => {
  const [isTracked, setIsTracked] = useState(false);
  const config = statusConfig[update.status];
  const StatusIcon = config.icon;

  const handleTrack = () => {
    setIsTracked(!isTracked);
    onTrack?.(update.id);
  };

  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-l-4 transition-all duration-300 hover:shadow-xl",
        "bg-gradient-to-br from-orange-50/30 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/20",
        "border-orange-500 hover:border-orange-600"
      )}
    >
      {/* Orange accent indicator */}
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-500 to-amber-500" />

      <CardHeader className="pb-3 pt-4 px-4 sm:px-6">
        {/* Top badge and status - responsive */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <Badge 
            variant="outline" 
            className="bg-orange-100 dark:bg-orange-900/30 border-orange-400 text-orange-800 dark:text-orange-200 font-semibold px-2 py-0.5 text-xs sm:text-sm w-fit"
          >
            🔶 ACCOUNTABILITY UPDATE
          </Badge>

          <Badge 
            variant="secondary"
            className={cn(
              "text-xs font-medium px-2 py-1 w-fit",
              config.bg,
              config.color
            )}
          >
            <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {config.label}
          </Badge>
        </div>

        {/* Title - responsive */}
        <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground mt-3 leading-tight flex items-start gap-2">
          <span className="text-lg sm:text-xl">{update.status === 'completed' ? '✓' : update.status === 'delayed' ? '⚠️' : '⏱️'}</span>
          <span className="flex-1">{update.title}</span>
        </h3>

        {/* Official info - responsive */}
        {update.official_name && (
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-2">
            <span className="font-medium text-foreground">{update.official_name}</span>
            {update.official_position && (
              <>
                <span className="hidden sm:inline">•</span>
                <span className="text-civic-blue font-medium">{update.official_position}</span>
              </>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
        {/* Description - responsive */}
        {update.description && (
          <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 sm:line-clamp-3">
            {update.description}
          </p>
        )}

        {/* Evidence images - responsive grid */}
        {update.evidence_images && update.evidence_images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
            {update.evidence_images.slice(0, 4).map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-orange-400 transition-colors group cursor-pointer"
              >
                <img
                  src={image}
                  alt={`Evidence ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {index === 0 && update.evidence_images.length > 1 && (
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                    <Badge className="bg-black/60 text-white text-xs px-1.5 py-0.5">
                      Before
                    </Badge>
                  </div>
                )}
                {index === 1 && update.evidence_images.length > 1 && (
                  <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
                    <Badge className="bg-green-600 text-white text-xs px-1.5 py-0.5">
                      After
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats - responsive grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 py-3 border-t border-border">
          {update.budget && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm sm:text-base font-bold text-foreground">
                Ksh {(update.budget / 1000000).toFixed(1)}M
              </p>
            </div>
          )}
          {update.timeline_months && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Timeline</p>
              <p className="text-sm sm:text-base font-bold text-foreground">
                {update.timeline_months} {update.timeline_months === 1 ? 'month' : 'months'}
              </p>
            </div>
          )}
        </div>

        {/* Actions - responsive layout */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
          <Button
            onClick={() => onViewDetails?.(update.id)}
            variant="default"
            className="flex-1 sm:flex-initial bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm sm:text-base h-10 sm:h-11 px-6"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">View Full Report</span>
            <span className="sm:hidden">View Report</span>
          </Button>

          <Button
            onClick={handleTrack}
            variant="outline"
            className={cn(
              "flex-1 sm:flex-initial font-medium text-sm sm:text-base h-10 sm:h-11 px-6",
              isTracked && "bg-orange-100 dark:bg-orange-900/30 border-orange-400 text-orange-700 dark:text-orange-300"
            )}
          >
            <Bookmark className={cn("w-4 h-4 mr-2", isTracked && "fill-current")} />
            <span className="hidden sm:inline">{isTracked ? 'Tracking' : 'Track Similar'}</span>
            <span className="sm:hidden">{isTracked ? 'Tracked' : 'Track'}</span>
          </Button>
        </div>

        {/* Community link - responsive */}
        {update.community && (
          <Link
            to={`/c/${update.community}`}
            className="block text-xs sm:text-sm text-center sm:text-left text-muted-foreground hover:text-foreground transition-colors"
          >
            From <span className="font-semibold text-civic-blue">c/{update.community}</span>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};
