import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { updateUrl, deleteUrl } from '../store/urlsSlice';
import { urlsAPI } from '../services/api';
import type { URL } from '../store/urlsSlice';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CalendarDays, Pencil, Trash2, Star, Link, Pin, Copy, ExternalLink, Lock, MoreHorizontal, Tag } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
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
  const [showVaultDialog, setShowVaultDialog] = useState(false);
  const [vaultPassword, setVaultPassword] = useState('');
  const [vaultError, setVaultError] = useState('');
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
  const descriptionText = url.description?.trim() || `Saved from ${siteDomain || url.domain || 'this website'}. Add a description to make this resource easier to find later.`;

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

  const openVaultDialog = () => {
    setVaultPassword('');
    setVaultError('');
    setShowVaultDialog(true);
  };

  const moveToVault = async () => {
    const password = vaultPassword.trim();
    if (!password) {
      setVaultError('Vault password is required');
      return;
    }

    setIsLoading(true);
    setVaultError('');
    try {
      await urlsAPI.toggleSecret(url._id, password);
      dispatch(deleteUrl(url._id));
      onRefresh?.();
      setShowVaultDialog(false);
      setVaultPassword('');
    } catch (error: any) {
      setVaultError(error.response?.data?.error || 'Failed to move link to vault');
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
    <>
      <Card className="group w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
        <div className={`relative overflow-hidden bg-slate-100 ${isComfortable ? 'h-28' : 'h-24'}`}>
        <img
          src={previewSrc}
          alt={`${siteDomain || 'site'} preview`}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          onError={(event) => {
            if (event.currentTarget.src !== faviconUrl) {
              event.currentTarget.src = faviconUrl;
            }
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-slate-950/5 to-transparent" />

        <div className="absolute left-3 top-3 flex max-w-[calc(100%-72px)] items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
          <img
            src={faviconUrl}
            alt={`${url.domain || 'site'} favicon`}
            className="h-5 w-5 rounded-full border border-slate-200 bg-white object-cover"
          />
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">
            {siteDomain || url.domain || 'site'}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleFavorite}
          disabled={isLoading}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#f3bf42] shadow-sm transition hover:scale-105 hover:bg-white"
          aria-label={url.isFavorite ? 'Remove favorite' : 'Mark favorite'}
        >
          <Star className={`h-4 w-4 ${url.isFavorite ? 'fill-current' : ''}`} />
        </button>

        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="line-clamp-1 text-base font-semibold leading-tight text-white drop-shadow">
            {url.title}
          </h3>
          <a
            href={normalizedUrl}
            target={openInNewTab ? '_blank' : undefined}
            rel={openInNewTab ? 'noopener noreferrer' : undefined}
            className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-medium text-white/85 transition hover:text-white"
          >
            <span className="truncate">{normalizedUrl.replace(/^https?:\/\//i, '')}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        </div>
      </div>

      <CardContent className={`flex flex-col justify-between p-3 ${isComfortable ? 'min-h-[178px]' : 'min-h-[154px]'}`}>
        <div className="space-y-2">
          {cardSettings.showDescriptions ? (
            <div className="rounded-xl bg-slate-50 px-2.5 py-1.5">
              <p className={`text-xs leading-5 ${url.description ? 'text-slate-600' : 'text-slate-400'} ${isComfortable ? 'line-clamp-3' : 'line-clamp-2'}`}>
                {descriptionText}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="rounded-full bg-[#edf3ff] px-2.5 py-1 text-[11px] font-semibold text-[#156fe6]">
              <Tag className="h-3 w-3" />
              {url.category || 'Uncategorized'}
            </Badge>
            {url.isPinned ? (
              <Badge variant="secondary" className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
              <CalendarDays className="h-3 w-3" />
              {getDisplayDate()}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          <div className="min-w-0 text-xs text-slate-500">{url.tags?.length ? `${url.tags.length} tags` : 'No tags yet'}</div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600"
              onClick={() => openInNewTab ? window.open(normalizedUrl, '_blank') : window.location.assign(normalizedUrl)}
              aria-label="Open link"
            >
              <Link className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-slate-500 hover:bg-blue-50 hover:text-blue-600"
              onClick={() => onEdit?.(url)}
              aria-label="Edit link"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete link">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100" aria-label="More actions">
                  <MoreHorizontal className="h-4 w-4" />
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
                <DropdownMenuItem onClick={openVaultDialog}>
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

      <Dialog open={showVaultDialog} onOpenChange={setShowVaultDialog}>
        <DialogContent className="rounded-2xl border-slate-200 sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Move to Private Vault</DialogTitle>
            <DialogDescription>
              Enter your vault password to hide this link from the main library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`vault-password-${url._id}`}>Vault Password</Label>
            <Input
              id={`vault-password-${url._id}`}
              type="password"
              value={vaultPassword}
              onChange={(event) => {
                setVaultPassword(event.target.value);
                setVaultError('');
              }}
              className="h-11 border-slate-300"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  moveToVault();
                }
              }}
            />
            {vaultError ? <p className="text-sm text-red-500">{vaultError}</p> : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowVaultDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#156fe6] hover:bg-[#0f64d8]"
              onClick={moveToVault}
              disabled={isLoading || !vaultPassword.trim()}
            >
              {isLoading ? 'Moving...' : 'Move Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
