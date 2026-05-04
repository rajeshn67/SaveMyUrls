import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Copy,
  Database,
  Download,
  EyeOff,
  LayoutGrid,
  Lock,
  RotateCcw,
  Save,
  UserRound,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { urlsAPI } from '../services/api';
import { lockVault } from '../store/vaultSlice';
import { AppDispatch, RootState } from '../store/store';

type SettingsPreferences = {
  activityAlerts: boolean;
  analyticsRange: '7' | '30' | '90';
  autoFavoriteNewLinks: boolean;
  autoLockMinutes: '5' | '15' | '30' | 'never';
  confirmBeforeDelete: boolean;
  copyFormat: 'url' | 'markdown';
  dashboardDensity: 'compact' | 'comfortable';
  defaultCategory: string;
  defaultSort: 'newest' | 'oldest' | 'title' | 'domain';
  defaultView: 'dashboard' | 'favorites' | 'categories' | 'vault';
  emailDigest: boolean;
  hideVaultCounts: boolean;
  maskVaultUrls: boolean;
  openLinksInNewTab: boolean;
  requireDescription: boolean;
  showDescriptions: boolean;
  showPinnedFirst: boolean;
};

const defaultPreferences: SettingsPreferences = {
  activityAlerts: true,
  analyticsRange: '30',
  autoFavoriteNewLinks: false,
  autoLockMinutes: '15',
  confirmBeforeDelete: true,
  copyFormat: 'url',
  dashboardDensity: 'compact',
  defaultCategory: 'General',
  defaultSort: 'newest',
  defaultView: 'dashboard',
  emailDigest: true,
  hideVaultCounts: false,
  maskVaultUrls: true,
  openLinksInNewTab: true,
  requireDescription: false,
  showDescriptions: true,
  showPinnedFirst: true,
};

const storageKey = 'savemyurls.settings';

const readPreferences = (): SettingsPreferences => {
  if (typeof window === 'undefined') return defaultPreferences;

  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? { ...defaultPreferences, ...JSON.parse(stored) } : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
};

const csvEscape = (value: string | number | boolean | undefined) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function Settings() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { urls } = useSelector((state: RootState) => state.urls);
  const { isUnlocked } = useSelector((state: RootState) => state.vault);
  const [preferences, setPreferences] = useState<SettingsPreferences>(readPreferences);
  const [status, setStatus] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [visibleLinkCount, setVisibleLinkCount] = useState(urls.length);
  const [categoryNames, setCategoryNames] = useState<string[]>([]);

  useEffect(() => {
    const fetchSettingsData = async () => {
      try {
        const response = await urlsAPI.getUrls();
        const liveUrls = response.data || [];
        setVisibleLinkCount(liveUrls.length);
        setCategoryNames(liveUrls.map((url: typeof urls[number]) => url.category).filter(Boolean));
      } catch {
        setVisibleLinkCount(urls.length);
        setCategoryNames(urls.map((url) => url.category).filter(Boolean));
      }
    };

    fetchSettingsData();
  }, [urls]);

  const categoryOptions = useMemo(() => {
    const names = categoryNames.length ? categoryNames : urls.map((url) => url.category).filter(Boolean);
    return Array.from(new Set(['General', ...names, preferences.defaultCategory]));
  }, [categoryNames, preferences.defaultCategory, urls]);

  const savePreferences = (nextPreferences: SettingsPreferences, message = 'Settings saved') => {
    setPreferences(nextPreferences);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(nextPreferences));
      window.dispatchEvent(new Event('savemyurls-settings-changed'));
    }
    setStatus(message);
  };

  const handlePreferenceChange = <Key extends keyof SettingsPreferences>(
    key: Key,
    value: SettingsPreferences[Key],
  ) => {
    savePreferences({ ...preferences, [key]: value });
  };

  const handleReset = () => {
    savePreferences(defaultPreferences, 'Settings reset');
  };

  const handleExport = async () => {
    setIsExporting(true);
    const header = ['Title', 'URL', 'Category', 'Domain', 'Favorite', 'Pinned', 'Created At'];
    try {
      const response = await urlsAPI.getUrls();
      const exportUrls = response.data || urls;
      const rows = exportUrls.map((url: typeof urls[number]) => [
        url.title,
        url.url,
        url.category,
        url.domain,
        url.isFavorite,
        url.isPinned,
        url.createdAt,
      ]);
      const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'savemyurls-links.csv';
      link.click();
      URL.revokeObjectURL(link.href);
      setStatus(`${exportUrls.length} visible links exported`);
    } catch {
      setStatus('Could not export links');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyBackup = async () => {
    try {
      const response = await urlsAPI.getUrls();
      const payload = JSON.stringify(response.data || urls, null, 2);
      await navigator.clipboard.writeText(payload);
      setStatus('JSON backup copied');
    } catch {
      setStatus('Could not copy backup');
    }
  };

  return (
    <AppShell
      title="Settings"
      subtitle="Tune how SaveMyURLs behaves across links, analytics, and vault privacy."
      showSearch={false}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3ff] text-[#156fe6]">
                <Save className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Saving Defaults</h2>
                <p className="text-sm text-slate-500">Defaults used when organizing new resources</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="defaultView">Default Start Page</Label>
                <Select
                  value={preferences.defaultView}
                  onValueChange={(value) =>
                    handlePreferenceChange('defaultView', value as SettingsPreferences['defaultView'])
                  }
                >
                  <SelectTrigger id="defaultView" className="h-10 w-full border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="favorites">Favorites</SelectItem>
                    <SelectItem value="categories">Categories</SelectItem>
                    <SelectItem value="vault">Private Vault</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="defaultCategory">Default Category</Label>
                <Input
                  id="defaultCategory"
                  list="settingsCategoryOptions"
                  value={preferences.defaultCategory}
                  onChange={(event) => handlePreferenceChange('defaultCategory', event.target.value)}
                  className="h-10 border-slate-300"
                />
                <datalist id="settingsCategoryOptions">
                  {categoryOptions.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="mt-5 grid gap-4 border-t border-slate-200 pt-4 md:grid-cols-3">
              <SettingSwitch
                id="openLinksInNewTab"
                label="Open Links In New Tab"
                checked={preferences.openLinksInNewTab}
                onCheckedChange={(checked) => handlePreferenceChange('openLinksInNewTab', checked)}
              />
              <SettingSwitch
                id="autoFavoriteNewLinks"
                label="Favorite New Links"
                checked={preferences.autoFavoriteNewLinks}
                onCheckedChange={(checked) => handlePreferenceChange('autoFavoriteNewLinks', checked)}
              />
              <SettingSwitch
                id="requireDescription"
                label="Require Description"
                checked={preferences.requireDescription}
                onCheckedChange={(checked) => handlePreferenceChange('requireDescription', checked)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
                <LayoutGrid className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Library Display</h2>
                <p className="text-sm text-slate-500">Controls used by dashboard and link cards</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="defaultSort">Default Sort</Label>
                <Select
                  value={preferences.defaultSort}
                  onValueChange={(value) =>
                    handlePreferenceChange('defaultSort', value as SettingsPreferences['defaultSort'])
                  }
                >
                  <SelectTrigger id="defaultSort" className="h-10 w-full border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="title">Title A-Z</SelectItem>
                    <SelectItem value="domain">Domain A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dashboardDensity">Card Density</Label>
                <Select
                  value={preferences.dashboardDensity}
                  onValueChange={(value) =>
                    handlePreferenceChange('dashboardDensity', value as SettingsPreferences['dashboardDensity'])
                  }
                >
                  <SelectTrigger id="dashboardDensity" className="h-10 w-full border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="comfortable">Comfortable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SettingSwitch
                id="showPinnedFirst"
                label="Pinned First"
                checked={preferences.showPinnedFirst}
                onCheckedChange={(checked) => handlePreferenceChange('showPinnedFirst', checked)}
              />
              <SettingSwitch
                id="showDescriptions"
                label="Show Descriptions"
                checked={preferences.showDescriptions}
                onCheckedChange={(checked) => handlePreferenceChange('showDescriptions', checked)}
              />
              <SettingSwitch
                id="confirmBeforeDelete"
                label="Confirm Deletes"
                checked={preferences.confirmBeforeDelete}
                onCheckedChange={(checked) => handlePreferenceChange('confirmBeforeDelete', checked)}
              />
              <div className="space-y-1.5">
                <Label htmlFor="copyFormat">Copy Format</Label>
                <Select
                  value={preferences.copyFormat}
                  onValueChange={(value) =>
                    handlePreferenceChange('copyFormat', value as SettingsPreferences['copyFormat'])
                  }
                >
                  <SelectTrigger id="copyFormat" className="h-10 w-full border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="url">Plain URL</SelectItem>
                    <SelectItem value="markdown">Markdown link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4df] text-[#a96800]">
                <EyeOff className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Analytics And Privacy</h2>
                <p className="text-sm text-slate-500">Control what your dashboard emphasizes</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="analyticsRange">Analytics Range</Label>
                <Select
                  value={preferences.analyticsRange}
                  onValueChange={(value) =>
                    handlePreferenceChange('analyticsRange', value as SettingsPreferences['analyticsRange'])
                  }
                >
                  <SelectTrigger id="analyticsRange" className="h-10 w-full border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SettingSwitch
                id="hideVaultCounts"
                label="Hide Vault Counts"
                checked={preferences.hideVaultCounts}
                onCheckedChange={(checked) => handlePreferenceChange('hideVaultCounts', checked)}
              />
              <SettingSwitch
                id="maskVaultUrls"
                label="Mask Vault URLs"
                checked={preferences.maskVaultUrls}
                onCheckedChange={(checked) => handlePreferenceChange('maskVaultUrls', checked)}
              />
            </div>
          </section>
        </div>

        <div className="grid content-start gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ecfdf3] text-[#198754]">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
                <p className="text-sm text-slate-500">Local notification preferences</p>
              </div>
            </div>
            <div className="space-y-4">
              <SettingSwitch
                id="emailDigest"
                label="Email Digest"
                checked={preferences.emailDigest}
                onCheckedChange={(checked) => handlePreferenceChange('emailDigest', checked)}
              />
              <SettingSwitch
                id="activityAlerts"
                label="Activity Alerts"
                checked={preferences.activityAlerts}
                onCheckedChange={(checked) => handlePreferenceChange('activityAlerts', checked)}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f1f5f9] text-slate-700">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Vault Behavior</h2>
                <p className="text-sm text-slate-500">{isUnlocked ? 'Unlocked' : 'Locked'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="autoLockMinutes">Auto-Lock Timer</Label>
                <Select
                  value={preferences.autoLockMinutes}
                  onValueChange={(value) =>
                    handlePreferenceChange('autoLockMinutes', value as SettingsPreferences['autoLockMinutes'])
                  }
                >
                  <SelectTrigger id="autoLockMinutes" className="h-10 w-full border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!isUnlocked}
                onClick={() => {
                  dispatch(lockVault());
                  setStatus('Vault locked');
                }}
              >
                Lock Vault Now
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Data</h2>
                <p className="text-sm text-slate-500">{visibleLinkCount} visible links available</p>
              </div>
            </div>
            <div className="grid gap-2">
              <Button type="button" variant="outline" className="w-full justify-center" onClick={handleExport} disabled={isExporting}>
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </Button>
              <Button type="button" variant="outline" className="w-full justify-center" onClick={handleCopyBackup}>
                <Copy className="mr-2 h-4 w-4" />
                Copy JSON Backup
              </Button>
              <Button type="button" variant="outline" className="w-full justify-center" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Settings
              </Button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3ff] text-[#156fe6]">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Profile</h2>
                <p className="text-sm text-slate-500">{user?.email || 'Profile details'}</p>
              </div>
            </div>
            <Button type="button" className="w-full bg-[#156fe6] hover:bg-[#0f64d8]" onClick={() => navigate('/profile')}>
              Edit Profile
            </Button>
          </section>

          <p className="min-h-5 text-sm font-medium text-green-700">{status}</p>
        </div>
      </div>
    </AppShell>
  );
}

function SettingSwitch({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4 rounded-xl border border-slate-200 px-3 py-2">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
