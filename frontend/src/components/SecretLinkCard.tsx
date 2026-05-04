import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { deleteVaultLink } from '../store/vaultSlice';
import { addUrl } from '../store/urlsSlice';
import { urlsAPI } from '../services/api';
import type { URL } from '../store/urlsSlice';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Copy, Eye, EyeOff, ExternalLink, Lock, LogOut, Trash2 } from 'lucide-react';

interface SecretLinkCardProps {
  url: URL;
}

const readVaultDisplaySettings = () => {
  if (typeof window === 'undefined') {
    return { confirmBeforeDelete: true, copyFormat: 'url', maskVaultUrls: true, openLinksInNewTab: true };
  }

  try {
    const settings = JSON.parse(localStorage.getItem('savemyurls.settings') || '{}');
    return {
      confirmBeforeDelete: settings.confirmBeforeDelete !== false,
      copyFormat: settings.copyFormat || 'url',
      maskVaultUrls: settings.maskVaultUrls !== false,
      openLinksInNewTab: settings.openLinksInNewTab !== false,
    };
  } catch {
    return { confirmBeforeDelete: true, copyFormat: 'url', maskVaultUrls: true, openLinksInNewTab: true };
  }
};

export default function SecretLinkCard({ url }: SecretLinkCardProps) {
  const dispatch = useDispatch<AppDispatch>();
  const displaySettings = readVaultDisplaySettings();
  const [isVisible, setIsVisible] = useState(!displaySettings.maskVaultUrls);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMovingOut, setIsMovingOut] = useState(false);
  const [showMoveOutDialog, setShowMoveOutDialog] = useState(false);
  const [moveOutPassword, setMoveOutPassword] = useState('');
  const [moveOutError, setMoveOutError] = useState('');

  const normalizedUrl = /^https?:\/\//i.test(url.url) ? url.url : `https://${url.url}`;
  const maskedUrl = '*'.repeat(Math.min(Math.max(url.url.length, 8), 24));

  let siteDomain = '';
  try {
    siteDomain = new globalThis.URL(normalizedUrl).hostname.replace(/^www\./, '');
  } catch {
    siteDomain = (url.domain || '').replace(/^www\./, '');
  }

  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(siteDomain || url.url)}`;
  const previewSrc = url.thumbnail || faviconUrl;

  const handleDelete = async () => {
    if (displaySettings.confirmBeforeDelete && !window.confirm('Delete this private link?')) return;

    setIsDeleting(true);
    try {
      await urlsAPI.deleteUrl(url._id);
      dispatch(deleteVaultLink(url._id));
    } catch (error) {
      console.error('Failed to delete private link:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = () => {
    const text = displaySettings.copyFormat === 'markdown'
      ? `[${url.title}](${normalizedUrl})`
      : normalizedUrl;
    navigator.clipboard.writeText(text);
  };

  const openMoveOutDialog = () => {
    setMoveOutPassword('');
    setMoveOutError('');
    setShowMoveOutDialog(true);
  };

  const handleMoveOut = async () => {
    const password = moveOutPassword.trim();
    if (!password) {
      setMoveOutError('Vault password is required');
      return;
    }

    setIsMovingOut(true);
    setMoveOutError('');
    try {
      const response = await urlsAPI.toggleSecret(url._id, password);
      dispatch(deleteVaultLink(url._id));
      dispatch(addUrl(response.data));
      setShowMoveOutDialog(false);
      setMoveOutPassword('');
    } catch (error: any) {
      setMoveOutError(error.response?.data?.error || 'Failed to move link out of vault');
    } finally {
      setIsMovingOut(false);
    }
  };

  return (
    <>
      <Card className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
        <div className="relative h-24 overflow-hidden bg-slate-100">
        <img
          src={previewSrc}
          alt={`${siteDomain || 'private site'} preview`}
          className="h-full w-full object-cover"
          onError={(event) => {
            if (event.currentTarget.src !== faviconUrl) {
              event.currentTarget.src = faviconUrl;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
        <div className="absolute left-2.5 bottom-2.5 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 shadow-sm">
          <img
            src={faviconUrl}
            alt={`${url.domain || 'site'} favicon`}
            className="h-6 w-6 rounded-full border border-slate-200 bg-white object-cover"
          />
          <span className="max-w-[120px] truncate text-[10px] font-semibold uppercase text-slate-700">
            {siteDomain || url.domain || 'site'}
          </span>
        </div>
          <div className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#156fe6] shadow-sm">
            <Lock className="h-4 w-4" />
          </div>
        </div>

        <CardContent className="flex min-h-[154px] flex-col justify-between p-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{url.title}</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting || isMovingOut}
                className="h-8 w-8 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <p className="line-clamp-2 break-all text-xs leading-5 text-slate-500">
              {isVisible ? normalizedUrl : maskedUrl}
            </p>
          </div>

          <div className="space-y-2">
            <Badge variant="secondary" className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {url.category || 'Uncategorized'}
            </Badge>

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible((value) => !value)}
                className="h-8 rounded-xl px-2 text-xs text-slate-600"
              >
                {isVisible ? <EyeOff className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                {isVisible ? 'Hide' : 'Show'}
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={openMoveOutDialog}
                  disabled={isMovingOut}
                  className="h-8 w-8 rounded-xl text-slate-500 hover:bg-blue-50 hover:text-[#156fe6]"
                  aria-label="Move out of private vault"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => displaySettings.openLinksInNewTab ? window.open(normalizedUrl, '_blank') : window.location.assign(normalizedUrl)}
                  className="h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showMoveOutDialog} onOpenChange={setShowMoveOutDialog}>
        <DialogContent className="rounded-2xl border-slate-200 sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Move Out of Private Vault</DialogTitle>
            <DialogDescription>
              Enter your vault password to return this link to the main library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor={`move-out-password-${url._id}`}>Vault Password</Label>
            <Input
              id={`move-out-password-${url._id}`}
              type="password"
              value={moveOutPassword}
              onChange={(event) => {
                setMoveOutPassword(event.target.value);
                setMoveOutError('');
              }}
              className="h-11 border-slate-300"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleMoveOut();
                }
              }}
            />
            {moveOutError ? <p className="text-sm text-red-500">{moveOutError}</p> : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowMoveOutDialog(false)}
              disabled={isMovingOut}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#156fe6] hover:bg-[#0f64d8]"
              onClick={handleMoveOut}
              disabled={isMovingOut || !moveOutPassword.trim()}
            >
              {isMovingOut ? 'Moving...' : 'Move Out'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
