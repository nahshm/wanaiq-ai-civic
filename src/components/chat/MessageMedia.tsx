import React, { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { GlassLightbox } from '@/components/ui/GlassLightbox';

interface MessageMediaProps {
  urls: string[];
  mediaType?: string | null;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

function isImageUrl(url: string) {
  const lower = url.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.includes(ext));
}

function getPublicUrl(path: string) {
  const { data } = supabase.storage.from('chat-media').getPublicUrl(path);
  return data.publicUrl;
}

function getFileName(path: string) {
  const parts = path.split('/');
  const full = parts[parts.length - 1];
  const underscoreIdx = full.indexOf('_');
  return underscoreIdx > 0 ? full.substring(underscoreIdx + 1) : full;
}

const MediaImage: React.FC<{ url: string; onClick: (publicUrl: string) => void }> = React.memo(({ url, onClick }) => {
  const publicUrl = useMemo(() => getPublicUrl(url), [url]);
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      className="rounded-lg overflow-hidden border max-w-xs cursor-pointer hover:opacity-90 transition-opacity relative"
      onClick={() => onClick(publicUrl)}
    >
      {!loaded && <Skeleton className="w-[280px] h-[200px]" />}
      <img
        src={publicUrl}
        alt="Attachment"
        className={`max-w-[280px] max-h-[200px] object-cover ${loaded ? '' : 'absolute opacity-0'}`}
        width={280}
        height={200}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </button>
  );
});
MediaImage.displayName = 'MediaImage';

const MediaFile: React.FC<{ url: string }> = React.memo(({ url }) => {
  const publicUrl = useMemo(() => getPublicUrl(url), [url]);
  return (
    <a
      href={publicUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors max-w-xs"
    >
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
      <span className="text-sm truncate flex-1">{getFileName(url)}</span>
      <Download className="h-4 w-4 text-muted-foreground shrink-0" />
    </a>
  );
});
MediaFile.displayName = 'MediaFile';

export function MessageMedia({ urls, mediaType }: MessageMediaProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!urls || urls.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {urls.map((url, i) => {
          const isImage = mediaType === 'image' || isImageUrl(url);
          if (isImage) {
            return <MediaImage key={i} url={url} onClick={setLightboxUrl} />;
          }
          return <MediaFile key={i} url={url} />;
        })}
      </div>

      <GlassLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </>
  );
}
