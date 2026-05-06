import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { addUrl, setUrls, setLoading, setError } from '../store/urlsSlice';
import { urlsAPI } from '../services/api';
import AppShell from '../components/AppShell';
import AddLinkModal from '../components/AddLinkModal';
import LinkCard from '../components/LinkCard';
import EditLinkModal from '../components/EditLinkModal';
import { URL } from '../store/urlsSlice';

const readDashboardSettings = () => {
  if (typeof window === 'undefined') {
    return { defaultSort: 'newest', showPinnedFirst: true };
  }

  try {
    const settings = JSON.parse(localStorage.getItem('savemyurls.settings') || '{}');
    return {
      defaultSort: settings.defaultSort || 'newest',
      showPinnedFirst: settings.showPinnedFirst !== false,
    };
  } catch {
    return { defaultSort: 'newest', showPinnedFirst: true };
  }
};

export default function Dashboard() {
  const dispatch = useDispatch() as AppDispatch;
  const { urls, isLoading, error, filter } = useSelector((state: RootState) => state.urls);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLink, setEditingLink] = useState<URL | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [settingsVersion, setSettingsVersion] = useState(0);
  const dashboardSettings = readDashboardSettings();

  useEffect(() => {
    if (urls.length === 0) {
      fetchUrls();
    }
  }, [urls.length]);

  useEffect(() => {
    const handleSettingsChange = () => setSettingsVersion((version) => version + 1);
    window.addEventListener('savemyurls-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('savemyurls-settings-changed', handleSettingsChange);
  }, []);

  const fetchUrls = async () => {
    dispatch(setLoading(true));
    try {
      const response = await urlsAPI.getUrls();
      dispatch(setUrls(response.data));
    } catch (error) {
      console.error('Failed to fetch URLs:', error);
      dispatch(setError('Failed to load links'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const favoriteCount = urls.filter((url) => url.isFavorite).length;
  const pinnedCount = urls.filter((url) => url.isPinned).length;

  const filteredUrls = urls.filter((url) => {
    const matchesCategory = filter.category === 'all' || url.category === filter.category;
    const matchesFavorite = !filter.showFavorites || url.isFavorite;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      [url.title, url.description, url.domain, url.url, url.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));

    return matchesCategory && matchesFavorite && matchesSearch;
  }).sort((a, b) => {
    if (dashboardSettings.showPinnedFirst && a.isPinned && !b.isPinned) return -1;
    if (dashboardSettings.showPinnedFirst && !a.isPinned && b.isPinned) return 1;
    if (dashboardSettings.showPinnedFirst && a.isPinned && b.isPinned) {
      const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      return bTime - aTime;
    }

    switch (dashboardSettings.defaultSort) {
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'title':
        return a.title.localeCompare(b.title);
      case 'domain':
        return (a.domain || '').localeCompare(b.domain || '');
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <AppShell
      title="My Library"
      subtitle={`Organizing ${urls.length} curated resources`}
      onAddLink={() => setShowAddModal(true)}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search by title or domain..."
    >
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Library</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{urls.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Favorites</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{favoriteCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Pinned</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{pinnedCount}</p>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-red-500">{error}</p> : null}
      {isLoading ? (
        <p className="text-slate-500">Loading your links...</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="group flex min-h-[256px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-lg"
          >
            <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-2xl text-blue-600 transition group-hover:bg-blue-100">
              +
            </span>
            <span className="text-base font-semibold text-slate-900">Add New Link</span>
            <span className="mt-1 max-w-[170px] text-sm leading-6 text-slate-500">Save a useful resource into your library.</span>
          </button>

          {filteredUrls.map((url) => (
            <LinkCard
              key={`${url._id}-${settingsVersion}`}
              url={url}
              onEdit={(selectedUrl) => {
                setEditingLink(selectedUrl);
                setShowEditModal(true);
              }}
            />
          ))}
        </div>
      )}

      <AddLinkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(createdUrl) => {
          setShowAddModal(false);
          if (createdUrl) {
            dispatch(addUrl(createdUrl));
          } else {
            fetchUrls();
          }
        }}
      />
      <EditLinkModal
        isOpen={showEditModal}
        link={editingLink}
        onClose={() => {
          setShowEditModal(false);
          setEditingLink(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setEditingLink(null);
          fetchUrls();
        }}
      />
    </AppShell>
  );
}
