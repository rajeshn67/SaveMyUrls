import { useState } from 'react';
import { urlsAPI } from '../services/api';
import { URL } from '../store/urlsSlice';
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
    <Card className="overflow-hidden rounded-3xl border-slate-200 bg-white shadow-none transition hover:shadow-md">
      <div className="relative h-52 bg-gradient-to-br from-slate-200 to-slate-300">
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-[#f3bf42] shadow"
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>

      <CardContent className="space-y-3 pt-4">
        <p className="text-xs text-slate-500">{url.domain || 'Unknown Domain'}</p>
        <h3 className="line-clamp-2 text-[30px] font-medium leading-tight text-slate-900">
          <a href={url.url} target="_blank" rel="noopener noreferrer">
            {url.title}
          </a>
        </h3>

        {url.description && (
          <p className="line-clamp-2 text-sm text-slate-500">
            {url.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full bg-[#edf3ff] text-[#156fe6]">
            {url.category}
          </Badge>
          <span className="text-xs text-slate-500">{getDisplayDate()}</span>
        </div>

        <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-2">
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 text-slate-400" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
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
