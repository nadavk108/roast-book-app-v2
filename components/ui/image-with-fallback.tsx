import React, { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { getStorageImageUrl, refreshStorageUrl } from "@/lib/storage";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackEmoji?: string;
  fallbackClassName?: string;
  showRefreshButton?: boolean;
  onRefresh?: () => void;
}

export function ImageWithFallback({
  src,
  alt,
  fallbackEmoji = "🖼️",
  fallbackClassName = "bg-muted",
  showRefreshButton = false,
  onRefresh,
  className,
  ...props
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(() => getStorageImageUrl(src) || src);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Try to refresh the URL
    const refreshedUrl = refreshStorageUrl(src);
    if (refreshedUrl) {
      setCurrentSrc(refreshedUrl + `?t=${Date.now()}`); // Cache bust
      setHasError(false);
    }
    
    if (onRefresh) {
      onRefresh();
    }
    
    setTimeout(() => setIsRefreshing(false), 500);
  }, [src, onRefresh]);

  if (hasError || !currentSrc) {
    return (
      <div 
        className={`flex flex-col items-center justify-center gap-3 ${fallbackClassName} ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="text-4xl">{fallbackEmoji}</span>
        {showRefreshButton && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Image
          </button>
        )}
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
