'use client';

import { useState, useEffect, useRef } from 'react';

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-blue-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function beautifyImageName(src: string): string {
  // Extract filename from path
  const filename = src.split('/').pop() || '';
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  // Replace dashes and underscores with spaces
  const withSpaces = nameWithoutExt.replace(/[-_]/g, ' ');
  // Capitalize each word (Title Case)
  return withSpaces
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface ZoomableImageModalProps {
  src: string | null;
  onClose: () => void;
}

export function ZoomableImageModal({ src, onClose }: ZoomableImageModalProps) {
  const [zoom, setZoom] = useState(1);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (src) {
      setZoom(1);
      setImageSize(null);
    }
  }, [src]);

  const zoomToPoint = (newZoom: number, clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = clientX - rect.left + container.scrollLeft;
    const mouseY = clientY - rect.top + container.scrollTop;

    const oldZoom = zoom;
    const clampedZoom = Math.max(0.1, Math.min(5, newZoom));

    // Calculate new scroll position to keep point under cursor
    const scale = clampedZoom / oldZoom;
    const newScrollLeft = mouseX * scale - (clientX - rect.left);
    const newScrollTop = mouseY * scale - (clientY - rect.top);

    setZoom(clampedZoom);

    requestAnimationFrame(() => {
      container.scrollLeft = newScrollLeft;
      container.scrollTop = newScrollTop;
    });
  };

  useEffect(() => {
    if (!src) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(5, z + 0.1));
      } else if (e.key === '-') {
        setZoom((z) => Math.max(0.1, z - 0.1));
      } else if (e.key === '0') {
        setZoom(1);
      }
    };

    const container = containerRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.02 : 0.02;
        zoomToPoint(zoom + delta, e.clientX, e.clientY);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    container?.addEventListener('wheel', handleWheel, { passive: false });
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      container?.removeEventListener('wheel', handleWheel);
      document.body.style.overflow = '';
    };
  }, [src, onClose, zoom]);

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      });
    }
  };

  if (!src) return null;

  const scaledWidth = imageSize ? imageSize.width * zoom : undefined;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 text-white">
        <span className="text-sm font-medium truncate">{src.split('/').pop()}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.max(0.1, z - 0.1))}
            className="p-1.5 rounded hover:bg-white/20"
            title="Zoom out (-)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-2 py-1 text-xs rounded hover:bg-white/20"
            title="Reset zoom (0)"
          >
            Reset
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(5, z + 0.1))}
            className="p-1.5 rounded hover:bg-white/20"
            title="Zoom in (+)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/20 ml-2"
            title="Close (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable image container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto"
      >
        <div
          className="flex items-center justify-center p-4"
          style={{
            minWidth: '100%',
            minHeight: '100%',
            width: scaledWidth && scaledWidth > window.innerWidth - 32 ? `${scaledWidth + 32}px` : '100%',
            height: imageSize && imageSize.height * zoom > window.innerHeight - 150 ? `${imageSize.height * zoom + 32}px` : '100%',
          }}
        >
          <img
            ref={imageRef}
            src={src}
            alt={src.split('/').pop() || 'Generated image'}
            onLoad={handleImageLoad}
            style={{
              width: scaledWidth ? `${scaledWidth}px` : 'auto',
            }}
            className="block"
            draggable={false}
          />
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 bg-black/50 text-center text-xs text-gray-400">
        Scroll to pan | Ctrl+Scroll to zoom at pointer | +/- keys to zoom | 0 to reset
      </div>
    </div>
  );
}

interface ImageGalleryProps {
  runId?: string;
  compareId?: string;
}

export function ImageGallery({ runId, compareId }: ImageGalleryProps) {
  const [images, setImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchImages() {
      setIsLoading(true);
      try {
        let url: string;
        if (compareId) {
          url = `/api/images?compareId=${compareId}`;
        } else if (runId) {
          url = `/api/images?runId=${runId}`;
        } else {
          setImages([]);
          setIsLoading(false);
          return;
        }
        const res = await fetch(url);
        const data = await res.json();
        setImages(data.images || []);
      } catch {
        setImages([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchImages();
  }, [runId, compareId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner />
      </div>
    );
  }

  if (images.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3">Visuals</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {images.map((src) => (
          <button
            key={src}
            onClick={() => setSelectedImage(src)}
            className="flex flex-col rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors bg-white"
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={src}
                alt={beautifyImageName(src)}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xs text-gray-600 px-2 py-1.5 text-center">
              {beautifyImageName(src)}
            </span>
          </button>
        ))}
      </div>

      <ZoomableImageModal
        src={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
}
