import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

export interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  target?: string; // data-tour attribute value
  placement?: 'right' | 'left' | 'bottom' | 'center';
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface PageTourProps {
  /** Unique key for localStorage persistence, e.g. 'dashboard-tour' */
  tourKey: string;
  steps: TourStep[];
  userId?: string;
}

export const PageTour: React.FC<PageTourProps> = ({ tourKey, steps, userId }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId || steps.length === 0) return;
    const done = localStorage.getItem(tourKey) === 'true';
    if (!done) {
      setStep(0);
      setOpen(true);
    }
  }, [tourKey, userId, steps.length]);

  const current = steps[step];

  const measureTarget = useCallback(() => {
    if (!current?.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${current.target}"]`);
    if (!el || (el as HTMLElement).offsetParent === null || el.getBoundingClientRect().width === 0) {
      setTargetRect(null);
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const top = Math.max(0, rect.top);
      const left = Math.max(0, rect.left);
      const width = Math.min(rect.right, vw) - left;
      const height = Math.min(rect.bottom, vh) - top;
      setTargetRect({ top, left, width: Math.max(0, width), height: Math.max(0, height) });
    });
  }, [current]);

  useEffect(() => {
    if (!open) return;
    measureTarget();
    const handleResize = () => measureTarget();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [open, step, measureTarget]);

  const completeTour = useCallback(() => {
    localStorage.setItem(tourKey, 'true');
    setOpen(false);
  }, [tourKey]);

  if (!open || !current) return null;

  const isLast = step === steps.length - 1;
  const isCentered = !current.target || !targetRect;
  const padding = 8;

  const clampTop = (rawTop: number): number => {
    const tooltipH = tooltipRef.current?.offsetHeight || 280;
    return Math.min(Math.max(16, rawTop), window.innerHeight - tooltipH - 16);
  };

  const centerStyle: React.CSSProperties = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

  const getTooltipStyle = (): React.CSSProperties => {
    if (isCentered) return centerStyle;

    const r = targetRect!;
    const preferred = current.placement || 'right';
    const tooltipWidth = 340;
    const tooltipH = tooltipRef.current?.offsetHeight || 280;
    const gap = 16;
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const spaceRight = vw - (r.left + r.width);
    const spaceLeft = r.left;
    const spaceBelow = vh - (r.top + r.height);

    const canFit = (side: string) => {
      if (side === 'right') return spaceRight >= tooltipWidth + gap + margin;
      if (side === 'left') return spaceLeft >= tooltipWidth + gap + margin;
      if (side === 'bottom') return spaceBelow >= tooltipH + gap + margin;
      return true;
    };

    // Resolve placement: preferred → bottom → center
    let resolved = preferred;
    if (!canFit(preferred)) {
      resolved = canFit('bottom') ? 'bottom' : 'center';
    }

    switch (resolved) {
      case 'right':
        return {
          position: 'fixed',
          top: clampTop(r.top + r.height / 2 - 100),
          left: Math.min(r.left + r.width + gap, vw - tooltipWidth - margin),
          maxWidth: `min(${tooltipWidth}px, calc(100vw - ${r.left + r.width + gap + margin}px))`,
        };
      case 'left':
        return {
          position: 'fixed',
          top: clampTop(r.top + r.height / 2 - 100),
          right: `calc(100vw - ${r.left - gap}px)`,
          maxWidth: `min(${tooltipWidth}px, ${r.left - gap - margin}px)`,
        };
      case 'bottom':
        return {
          position: 'fixed',
          top: clampTop(r.top + r.height + gap),
          left: Math.max(margin, Math.min(r.left + r.width / 2 - tooltipWidth / 2, vw - tooltipWidth - margin)),
          maxWidth: tooltipWidth,
        };
      default:
        return centerStyle;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 transition-opacity duration-300"
        onClick={completeTour}
      />

      {!isCentered && targetRect && (
        <div
          className="absolute rounded-lg border-2 border-primary/50 transition-all duration-300 ease-in-out pointer-events-none"
          style={{
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
            zIndex: 1,
          }}
        />
      )}

      <div
        ref={tooltipRef}
        className="z-[2] w-[340px] rounded-xl border border-border bg-popover p-5 shadow-2xl transition-all duration-300"
        style={getTooltipStyle()}
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mx-auto">
          {current.icon}
        </div>
        <h3 className="text-lg font-bold text-popover-foreground text-center mb-2">
          {current.title}
        </h3>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-4">
          {current.description}
        </p>
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={completeTour}>
            Skip Tour
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={completeTour}>
                Get Started
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
