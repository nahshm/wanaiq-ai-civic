/**
 * @fileoverview Receipt Toast Component
 * @module components/ui
 * 
 * Creates a "tracking receipt" UI for user submissions to close the
 * psychological loop. Shows tracking ID and next steps.
 * 
 * This is critical UX for building trust - users need to know their
 * actions are tracked and will have follow-up.
 */

import React from 'react';
import { CheckCircle2, Clock, Eye, MessageSquare } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface ReceiptToastProps {
  title: string;
  trackingId: string;
  nextSteps: string[];
  currentStep?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Receipt-style toast for submissions
 * 
 * Shows:
 * - Title with checkmark
 * - Tracking ID (shortened UUID)
 * - Step-by-step progress tracker
 * 
 * @example
 * ```tsx
 * toast.success(
 *   <ReceiptToast
 *     title="Project Submitted!"
 *     trackingId={project.id}
 *     nextSteps={[
 *       'Community Verification',
 *       'Admin Review',
 *       'Official Response'
 *     ]}
 *     currentStep={0}
 *   />
 * );
 * ```
 */
export function ReceiptToast({ 
  title, 
  trackingId, 
  nextSteps,
  currentStep = 0
}: ReceiptToastProps) {
  // Shorten UUID to 8 characters for display
  const shortId = trackingId.slice(0, 8).toUpperCase();

  return (
    <div className="space-y-3 min-w-[280px]">
      {/* Header with title */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-civic-green/10 flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-civic-green" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-medium">TRACKING ID:</span>
            <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
              #{shortId}
            </code>
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="space-y-1.5 pl-4 border-l-2 border-muted">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          What happens next
        </p>
        {nextSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isPending = index > currentStep;

          return (
            <div 
              key={index} 
              className={`flex items-start gap-2 text-xs ${
                isActive ? 'text-foreground' : 
                isCompleted ? 'text-muted-foreground line-through' : 
                'text-muted-foreground/60'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                isActive ? 'bg-civic-green animate-pulse' : 
                isCompleted ? 'bg-emerald-500' : 
                'bg-muted'
              }`} />
              <span className={isActive ? 'font-medium' : ''}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      <div className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
        💡 <span className="font-medium">Tip:</span> You can track this submission in your profile
      </div>
    </div>
  );
}

/**
 * Simpler version for quick confirmations
 */
export function SimpleReceiptToast({ 
  title, 
  message,
  trackingId 
}: { 
  title: string; 
  message: string;
  trackingId: string;
}) {
  const shortId = trackingId.slice(0, 8).toUpperCase();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-civic-green" />
        <p className="font-semibold text-sm">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground">{message}</p>
      <code className="text-[10px] font-mono bg-muted px-2 py-1 rounded block">
        Tracking: #{shortId}
      </code>
    </div>
  );
}

/**
 * Error receipt for failed submissions
 */
export function ErrorReceiptToast({
  title,
  error,
  retryAction
}: {
  title: string;
  error: string;
  retryAction?: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
          <span className="text-red-500">✗</span>
        </div>
        <p className="font-semibold text-sm">{title}</p>
      </div>
      <p className="text-xs text-muted-foreground">{error}</p>
      {retryAction && (
        <button
          onClick={retryAction}
          className="text-xs text-civic-green hover:underline font-medium"
        >
          Try again →
        </button>
      )}
    </div>
  );
}

/**
 * Progress tracker UI for multi-step processes
 */
export function ProgressTracker({
  steps,
  currentStep,
  completedSteps = []
}: {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
}) {
  return (
    <div className="space-y-2">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index) || index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep && !completedSteps.includes(index);

        return (
          <div 
            key={index}
            className="flex items-center gap-3"
          >
            {/* Step indicator */}
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${
              isCompleted ? 'bg-emerald-500 text-white' :
              isCurrent ? 'bg-civic-green text-white' :
              'bg-muted text-muted-foreground'
            }`}>
              {isCompleted ? '✓' : index + 1}
            </div>

            {/* Step label */}
            <div className="flex-1">
              <p className={`text-sm ${
                isCurrent ? 'font-semibold text-foreground' :
                isCompleted ? 'text-muted-foreground' :
                'text-muted-foreground/60'
              }`}>
                {step}
              </p>
            </div>

            {/* Status icon */}
            {isCurrent && (
              <Clock className="h-4 w-4 text-civic-green animate-pulse" />
            )}
            {isCompleted && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </div>
        );
      })}
    </div>
  );
}
