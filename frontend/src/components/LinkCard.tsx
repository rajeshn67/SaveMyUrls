import { useState } from 'react';
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

  const normalizedUrl = /^https?:\/\//i.test(url.url) ? url.url : `https://${url.url}`;

  let siteDomain = '';
  try {
    siteDomain = new globalThis.URL(normalizedUrl).hostname.replace(/^www\./, '');
  } catch {
    siteDomain = (url.domain || '').replace(/^www\./, '');
  }

  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(siteDomain || url.url)}`;
  const previewSrc = url.thumbnail || faviconUrl;

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
    <Card className="group w-[190px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-28 overflow-hidden bg-slate-100">
        <img
          src={previewSrc}
          alt={`${siteDomain || 'site'} preview`}
          className="h-full w-full object-cover"
          onError={(event) => {
            if (event.currentTarget.src !== faviconUrl) {
              event.currentTarget.src = faviconUrl;
            }
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />

        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#f3bf42] shadow-sm transition hover:bg-white"
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute left-3 bottom-3 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-sm">
          <img
            src={faviconUrl}
            alt={`${url.domain || 'site'} favicon`}
            className="h-7 w-7 rounded-full border border-slate-200 bg-white object-cover"
          />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
            {siteDomain || url.domain || 'site'}
          </span>
        </div>
      </div>

      <CardContent className="space-y-2 px-3 pb-3 pt-3">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-slate-900">
            <a href={url.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
              {url.title}
            </a>
          </h3>
          {url.description ? (
            <p className="line-clamp-2 text-[11px] leading-5 text-slate-500">
              {url.description}
            </p>
          ) : (
            <p className="text-[11px] leading-5 text-slate-400">No description available</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="secondary" className="rounded-full bg-[#edf3ff] px-2 py-0.5 text-[10px] font-semibold text-[#156fe6]">
            {url.category || 'Uncategorized'}
          </Badge>
          <span className="text-[10px] text-slate-500">{getDisplayDate()}</span>
        </div>

        <div className="flex items-center justify-between gap-1 border-t border-slate-100 pt-2">
          <div className="text-[10px] text-slate-500">{url.tags?.length ? `${url.tags.length} tags` : 'No tags'}</div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-slate-500 hover:bg-slate-100">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="h-7 w-7 rounded-xl text-slate-500 hover:bg-slate-100">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl text-slate-500 hover:bg-slate-100">
                  ⋯
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(url.url)}>
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(url.url, '_blank')}>
                  Open in New Tab
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleFavorite} className="text-red-600">
                  {isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
