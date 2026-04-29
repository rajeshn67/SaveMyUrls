import { useEffect, useState } from 'react';
import { urlsAPI } from '../services/api';
import type { URL } from '../store/urlsSlice';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Pencil, Trash2, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface LinkCardProps {
  url: URL;
  onRefresh: () => void;
}

export default function LinkCard({ url, onRefresh }: LinkCardProps) {
  const [isFavorite, setIsFavorite] = useState(url.isFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const normalizedUrl = /^https?:\/\//i.test(url.url) ? url.url : `https://${url.url}`;
  
  let siteDomain = '';
  try {
    siteDomain = new globalThis.URL(normalizedUrl).hostname.replace(/^www\./, '');
  } catch {
    siteDomain = (url.domain || '').replace(/^www\./, '');
  }

  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(siteDomain || url.url)}`;

  const toggleFavorite = async () => {
    setIsLoading(true);
    try {
      await urlsAPI.toggleFavorite(url._id);
      setIsFavorite(!isFavorite);
      onRefresh();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this link?')) {
      try {
        await urlsAPI.deleteUrl(url._id);
        onRefresh();
      } catch (error) {
        console.error('Failed to delete link:', error);
      }
    }
  };

  const getDisplayDate = () => {
    const date = new Date(url.createdAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <Card className="h-[164px] w-[156px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-[72px] overflow-hidden bg-gradient-to-br from-[#eef6ff] via-[#f5f0ff] to-[#f0faff]">
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className="absolute right-2.5 top-2.5 rounded-full bg-white/90 p-1.5 text-[#f3bf42] shadow hover:bg-white"
        >
          <Star className={`h-3 w-3 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={faviconUrl}
            alt={`${siteDomain || 'site'} favicon`}
            className="h-14 w-14 rounded object-contain"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        </div>
      </div>

      <CardContent className="space-y-1.5 px-2.5 pb-2 pt-2">
        <div className="flex items-center gap-1.5">
          <img
            src={faviconUrl}
            alt={`${url.domain || 'site'} favicon`}
            className="h-3 w-3 rounded-full border border-slate-200 bg-white object-cover flex-shrink-0"
          />
          <span className="max-w-[94px] truncate text-[9px] uppercase tracking-[0.08em] text-slate-500">
            {url.domain || 'site'}
          </span>
        </div>

        <h3 className="line-clamp-1 text-[11px] font-semibold leading-tight text-slate-900">
          <a href={url.url} target="_blank" rel="noopener noreferrer">
            {url.title}
          </a>
        </h3>

        {url.description && (
          <p className="line-clamp-1 text-[10px] text-slate-500">
            {url.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="secondary" className="rounded-full bg-[#edf3ff] px-1.5 py-0.5 text-[9px] font-medium text-[#156fe6]">
            {url.category}
          </Badge>
          <span className="text-[9px] text-slate-500">{getDisplayDate()}</span>
        </div>

        <div className="flex items-center justify-end gap-0.5 border-t border-slate-100 pt-1">
          <Button variant="ghost" size="icon" className="h-5 w-5">
            <Pencil className="h-3 w-3 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="h-5 w-5">
            <Trash2 className="h-3 w-3 text-slate-400" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 text-xs">
                ⋯
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(url.url)}
              >
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(url.url, '_blank')}
              >
                Open in New Tab
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleFavorite}
                className="text-red-600"
              >
                {isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
