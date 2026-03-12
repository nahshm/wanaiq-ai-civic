/**
 * @fileoverview Project Feed Card Component
 * @module components/feed
 * 
 * Compact card for displaying project submissions in the unified feed.
 * Shows key project info with visual distinction from regular posts.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, MapPin, TrendingUp, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  location: string;
  county?: string;
  constituency?: string;
  ward?: string;
  budget?: number;
  completion_percentage?: number;
  submitted_by?: string;
  created_at: string;
  media_urls?: string[];
}

interface ProjectFeedCardProps {
  project: Project;
  onClick?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProjectFeedCard({ project, onClick }: ProjectFeedCardProps) {
  const statusColors: Record<string, string> = {
    planning: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    active: 'bg-civic-green/10 text-civic-green dark:text-civic-green border-civic-green/20',
    'in-progress': 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    stalled: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    pending: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20'
  };

  const statusColor = statusColors[project.status] || statusColors.pending;

  return (
    <Card 
      className="hover:border-civic-green/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        {/* Badge and timestamp */}
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant="secondary" 
            className="bg-civic-green/10 text-civic-green border-civic-green/20"
          >
            <Building2 className="h-3 w-3 mr-1" />
            Project
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Project title */}
        <CardTitle className="text-lg group-hover:text-civic-green transition-colors">
          <Link to={`/p/${project.id}`} className="hover:underline">
            {project.name}
          </Link>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        {/* Media Preview */}
        {(() => {
          if (!project.media_urls || project.media_urls.length === 0) return null;

          // Find first image
          const image = project.media_urls.find(url => 
            /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
          );
          
          // If no image, check for video
          const video = !image ? project.media_urls.find(url => 
            /\.(mp4|webm|ogg)$/i.test(url)
          ) : null;

          if (!image && !video) return null;

          return (
            <div className="relative rounded-lg overflow-hidden border border-border h-64 w-full bg-black/5 group">
              {/* Blurred Background Layer for layout filling */}
              <div className="absolute inset-0 z-0 opacity-60">
                {image ? (
                  <img 
                    src={image} 
                    alt="" 
                    className="w-full h-full object-cover blur-2xl scale-110"
                    aria-hidden="true"
                  />
                ) : (
                  <video 
                    src={video}
                    className="w-full h-full object-cover blur-2xl scale-110"
                    muted
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Foreground Content - Contain to show full image */}
              <div className="absolute inset-0 z-10 flex items-center justify-center p-1">
                {image ? (
                  <img 
                    src={image} 
                    alt={project.name} 
                    className="h-full w-auto max-w-full object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                ) : (
                  <video 
                    src={video}
                    className="h-full w-auto max-w-full object-contain drop-shadow-md rounded-sm"
                    controls={false}
                    muted
                  />
                )}
              </div>
            </div>
          );
        })()}

        {/* Project metadata */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Location */}
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{project.location || project.ward || project.constituency || project.county}</span>
          </div>

          {/* Status */}
          <Badge variant="outline" className={statusColor}>
            {project.status.replace('-', ' ').replace('_', ' ')}
          </Badge>

          {/* Completion percentage if available */}
          {project.completion_percentage !== undefined && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{project.completion_percentage}% complete</span>
            </div>
          )}
        </div>

        {/* Budget if available */}
        {project.budget && (
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold">Budget:</span>{' '}
            KES {project.budget.toLocaleString()}
          </div>
        )}

        {/* Action button */}
        <div className="flex items-center justify-end pt-2">
          <Button 
            asChild 
            variant="ghost" 
            size="sm"
            className="group-hover:bg-accent"
          >
            <Link to={`/p/${project.id}`}>
              View Details →
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact variant for smaller displays or sidebars
 */
export function ProjectFeedCardCompact({ project }: ProjectFeedCardProps) {
  return (
    <Link 
      to={`/p/${project.id}`}
      className="block p-3 rounded-lg border border-border hover:border-civic-green/50 hover:bg-accent/50 transition-all"
    >
      <div className="flex items-start gap-2 mb-2">
        <Building2 className="h-4 w-4 text-civic-green flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold line-clamp-1">{project.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{project.location}</span>
        <Badge variant="outline" className="text-xs">
          {project.status}
        </Badge>
      </div>
    </Link>
  );
}
