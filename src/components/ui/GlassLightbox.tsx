import React, { useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlassLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export function GlassLightbox({ src, alt = 'Image', onClose }: GlassLightboxProps) {
  const [zoom, setZoom] = React.useState(1);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 3));
    if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5));
  }, [onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Reset zoom when image changes
  useEffect(() => { setZoom(1); }, [src]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          key="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[999] flex items-center justify-center"
          onClick={onClose}
          style={{
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Glass container */}
          <motion.div
            key="lightbox-panel"
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.88, opacity: 0, y: 24 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="relative max-w-[92vw] max-h-[90vh] flex flex-col items-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Glass frame */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            />

            {/* Top control bar */}
            <div
              className="relative flex items-center justify-between w-full px-4 py-3 rounded-t-2xl gap-4"
              style={{
                background: 'rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span className="text-xs text-white/50 truncate max-w-[200px]">{alt}</span>

              <div className="flex items-center gap-1 ml-auto">
                {/* Zoom out */}
                <button
                  onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom out (−)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* Zoom level */}
                <span className="text-xs text-white/40 w-10 text-center select-none">
                  {Math.round(zoom * 100)}%
                </span>

                {/* Zoom in */}
                <button
                  onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Zoom in (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Download */}
                <a
                  href={src}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Download"
                  onClick={e => e.stopPropagation()}
                >
                  <Download className="w-4 h-4" />
                </a>

                <div className="w-px h-4 bg-white/10 mx-1" />

                {/* Close */}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image area */}
            <div className="relative overflow-auto rounded-b-2xl"
              style={{ maxHeight: 'calc(90vh - 52px)', maxWidth: '92vw' }}
            >
              <motion.img
                src={src}
                alt={alt}
                animate={{ scale: zoom }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="block rounded-b-2xl select-none"
                style={{
                  maxWidth: '88vw',
                  maxHeight: 'calc(88vh - 52px)',
                  objectFit: 'contain',
                  transformOrigin: 'center center',
                  cursor: zoom > 1 ? 'zoom-out' : 'zoom-in',
                }}
                onClick={() => setZoom(z => z > 1 ? 1 : 2)}
                draggable={false}
              />
            </div>
          </motion.div>

          {/* Hint */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 text-xs text-white/30 pointer-events-none select-none"
          >
            Click image to zoom · ESC to close
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
