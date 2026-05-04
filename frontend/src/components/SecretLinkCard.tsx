import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/store';
import { deleteVaultLink } from '../store/vaultSlice';
import { urlsAPI } from '../services/api';
import type { URL } from '../store/urlsSlice';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Copy, Eye, EyeOff, ExternalLink, Lock, Trash2 } from 'lucide-react';

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

  return (
    <Card className="w-[220px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg">
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

      <CardContent className="flex h-[170px] flex-col justify-between p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{url.title}</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className="line-clamp-2 break-all text-xs leading-5 text-slate-500">
            {isVisible ? normalizedUrl : maskedUrl}
          </p>
        </div>

        <div className="space-y-3">
          <Badge variant="secondary" className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {url.category || 'Uncategorized'}
          </Badge>

          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
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
  );
}
