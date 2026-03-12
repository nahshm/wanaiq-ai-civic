/**
 * @fileoverview Promise Feed Card Component
 * @module components/feed
 * 
 * Displays political promises and their status in the unified feed.
 * Shows accountability tracking for officials.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

interface Promise {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'broken';
  progress?: number;
  official_id?: string;
  official_name?: string;
  deadline?: string;
  category?: string;
  created_at: string;
  updated_at?: string;
}

interface PromiseFeedCardProps {
  promise: Promise;
  onClick?: () => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusIcon(status: Promise['status']) {
  const icons = {
    pending: Clock,
    in_progress: AlertTriangle,
    completed: CheckCircle2,
    broken: XCircle
  };
  return icons[status] || Clock;
}

function getStatusColor(status: Promise['status']) {
  const colors = {
    pending: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    in_progress: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
    broken: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
  };
  return colors[status] || colors.pending;
}

function getStatusLabel(status: Promise['status']) {
  const labels = {
    pending: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Fulfilled',
    broken: 'Broken'
  };
  return labels[status] || status;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PromiseFeedCard({ promise, onClick }: PromiseFeedCardProps) {
  const StatusIcon = getStatusIcon(promise.status);
  const statusColor = getStatusColor(promise.status);
  const statusLabel = getStatusLabel(promise.status);

  return (
    <Card 
      className="hover:border-amber-500/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        {/* Badge and timestamp */}
        <div className="flex items-center justify-between mb-2">
          <Badge 
            variant="secondary" 
            className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            Promise
          </Badge>
          <span className="text-xs text-muted-foreground">
            {promise.updated_at 
              ? `Updated ${formatDistanceToNow(new Date(promise.updated_at), { addSuffix: true })}`
              : formatDistanceToNow(new Date(promise.created_at), { addSuffix: true })
            }
          </span>
        </div>

        {/* Promise title */}
        <CardTitle className="text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          <Link to={`/pr/${promise.id}`} className="hover:underline">
            {promise.title}
          </Link>
        </CardTitle>

        {/* Official name if available */}
        {promise.official_name && (
          <div className="text-sm text-muted-foreground">
            by <Link 
              to={`/g/${promise.official_id}`} 
              className="font-semibold hover:underline"
            >
              {promise.official_name}
            </Link>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Description */}
        {promise.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {promise.description}
          </p>
        )}

        {/* Status badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusColor}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusLabel}
          </Badge>

          {promise.category && (
            <Badge variant="outline">
              {promise.category}
            </Badge>
          )}
        </div>

        {/* Progress bar for in-progress promises */}
        {promise.status === 'in_progress' && promise.progress !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold">{promise.progress}%</span>
            </div>
            <Progress value={promise.progress} className="h-2" />
          </div>
        )}

        {/* Deadline if available */}
        {promise.deadline && promise.status !== 'completed' && promise.status !== 'broken' && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Deadline: {new Date(promise.deadline).toLocaleDateString()}
            </span>
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
            <Link to={`/pr/${promise.id}`}>
              Track Promise →
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact variant for official profile pages
 */
export function PromiseFeedCardCompact({ promise }: PromiseFeedCardProps) {
  const StatusIcon = getStatusIcon(promise.status);
  const statusColor = getStatusColor(promise.status);

  return (
    <Link 
      to={`/pr/${promise.id}`}
      className="block p-3 rounded-lg border border-border hover:border-amber-500/50 hover:bg-accent/50 transition-all"
    >
      <div className="flex items-start gap-2 mb-2">
        <StatusIcon className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold line-clamp-2">{promise.title}</h4>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={`text-xs ${statusColor}`}>
          {getStatusLabel(promise.status)}
        </Badge>
        {promise.progress !== undefined && promise.status === 'in_progress' && (
          <span className="text-xs text-muted-foreground">{promise.progress}%</span>
        )}
      </div>
    </Link>
  );
}
