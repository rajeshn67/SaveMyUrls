import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { updateUrl, deleteUrl } from '../store/urlsSlice';
import { urlsAPI } from '../services/api';
import type { URL } from '../store/urlsSlice';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Pencil, Trash2, Star, Link, Pin, Copy, ExternalLink, Lock, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface LinkCardProps {
  url: URL;
  onRefresh?: () => void;
  onEdit?: (url: URL) => void;
}

const readCardSettings = () => {
  if (typeof window === 'undefined') {
    return {
      confirmBeforeDelete: true,
      copyFormat: 'url',
      dashboardDensity: 'compact',
      openLinksInNewTab: true,
      showDescriptions: true,
    };
  }

  try {
    const settings = JSON.parse(localStorage.getItem('savemyurls.settings') || '{}');
    return {
      confirmBeforeDelete: settings.confirmBeforeDelete !== false,
      copyFormat: settings.copyFormat || 'url',
      dashboardDensity: settings.dashboardDensity || 'compact',
      openLinksInNewTab: settings.openLinksInNewTab !== false,
      showDescriptions: settings.showDescriptions !== false,
    };
  } catch {
    return {
      confirmBeforeDelete: true,
      copyFormat: 'url',
      dashboardDensity: 'compact',
      openLinksInNewTab: true,
      showDescriptions: true,
    };
  }
};

export default function LinkCard({ url, onRefresh, onEdit }: LinkCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);
  const cardSettings = readCardSettings();
  const openInNewTab = cardSettings.openLinksInNewTab;
  const isComfortable = cardSettings.dashboardDensity === 'comfortable';

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
      dispatch(updateUrl({ ...url, isFavorite: !url.isFavorite }));
      onRefresh?.();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePin = async () => {
    setIsLoading(true);
    try {
      await urlsAPI.togglePin(url._id);
      dispatch(updateUrl({ ...url, isPinned: !url.isPinned, pinnedAt: !url.isPinned ? new Date().toISOString() : undefined }));
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const moveToVault = async () => {
    const password = window.prompt('Enter Vault Password');
    if (!password) return;

    setIsLoading(true);
    try {
      await urlsAPI.toggleSecret(url._id, password);
      dispatch(deleteUrl(url._id));
      onRefresh?.();
    } catch (error: any) {
      window.alert(error.response?.data?.error || 'Failed to move link to vault');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (cardSettings.confirmBeforeDelete && !window.confirm('Are you sure you want to delete this link?')) {
      return;
    }

    try {
      await urlsAPI.deleteUrl(url._id);
      dispatch(deleteUrl(url._id));
      onRefresh?.();
    } catch (error) {
      console.error('Failed to delete link:', error);
    }
  };

  const handleCopy = () => {
    const text = cardSettings.copyFormat === 'markdown'
      ? `[${url.title}](${normalizedUrl})`
      : normalizedUrl;
    navigator.clipboard.writeText(text);
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
    <Card className={`group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${isComfortable ? 'w-[220px]' : 'w-[180px]'}`}>
      <div className={`relative overflow-hidden bg-slate-100 ${isComfortable ? 'h-28' : 'h-20'}`}>
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

        <div className="absolute left-2.5 bottom-2.5 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
          <img
            src={faviconUrl}
            alt={`${url.domain || 'site'} favicon`}
            className="h-6 w-6 rounded-full border border-slate-200 bg-white object-cover"
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
            {siteDomain || url.domain || 'site'}
          </span>
        </div>
      </div>

      <CardContent className={`flex flex-col justify-between px-2.5 pb-2 pt-2 ${isComfortable ? 'h-[170px]' : 'h-[140px]'}`}>
        <div className="space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 line-clamp-1 text-sm font-semibold leading-snug text-slate-900">
              <a
                href={normalizedUrl}
                target={openInNewTab ? '_blank' : undefined}
                rel={openInNewTab ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-2 hover:text-blue-600"
              >
                <span className="truncate">{url.title}</span>
                <Link className="h-3.5 w-3.5 text-slate-400" />
              </a>
            </h3>
            <button
              type="button"
              onClick={toggleFavorite}
              disabled={isLoading}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#f3bf42] shadow-sm transition hover:bg-slate-50"
            >
              <Star className={`h-4 w-4 ${url.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
          {cardSettings.showDescriptions ? (
            <div className="min-h-[40px]">
              {url.description ? (
              <p className="line-clamp-2 text-[11px] leading-5 text-slate-500">
                {url.description}
              </p>
              ) : (
              <p className="text-[11px] leading-5 text-slate-400">No description available</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="secondary" className="rounded-full bg-[#edf3ff] px-2 py-0.5 text-[10px] font-semibold text-[#156fe6]">
            {url.category || 'Uncategorized'}
          </Badge>
          {url.isPinned && (
            <Badge variant="secondary" className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700">
              <Pin className="h-3 w-3" />
            </Badge>
          )}
          <span className="text-[10px] text-slate-500">{getDisplayDate()}</span>
        </div>

        <div className="flex items-center justify-between gap-1 border-t border-slate-100 pt-1">
          <div className="text-[10px] text-slate-500">{url.tags?.length ? `${url.tags.length} tags` : 'No tags'}</div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-xl text-slate-500 hover:bg-slate-100"
              onClick={() => onEdit?.(url)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={handleDelete} className="h-6 w-6 rounded-xl text-slate-500 hover:bg-slate-100">
              <Trash2 className="h-3 w-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 rounded-xl text-slate-500 hover:bg-slate-100">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  {cardSettings.copyFormat === 'markdown' ? 'Copy Markdown' : 'Copy Link'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openInNewTab ? window.open(normalizedUrl, '_blank') : window.location.assign(normalizedUrl)}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {openInNewTab ? 'Open in New Tab' : 'Open Link'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={togglePin}>
                  <Pin className="mr-2 h-4 w-4" />
                  {url.isPinned ? 'Unpin from Top' : 'Pin to Top'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={moveToVault}>
                  <Lock className="mr-2 h-4 w-4" />
                  Move to Vault
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleFavorite} className="text-red-600">
                  <Star className="mr-2 h-4 w-4" />
                  {url.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
