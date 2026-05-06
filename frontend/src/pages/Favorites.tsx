import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setUrls, setLoading, setError } from '../store/urlsSlice';
import { urlsAPI } from '../services/api';
import AppShell from '../components/AppShell';
import AddLinkModal from '../components/AddLinkModal';
import LinkCard from '../components/LinkCard';
import EditLinkModal from '../components/EditLinkModal';
import { URL } from '../store/urlsSlice';
import { Button } from '../components/ui/button';
import { CalendarDays, ExternalLink, Folder, Pin, Plus, Star } from 'lucide-react';

const normalizeUrl = (value: string) => /^https?:\/\//i.test(value) ? value : `https://${value}`;

const getDisplayDate = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
};

export default function Favorites() {
  const dispatch = useDispatch<AppDispatch>();
  const { urls, isLoading } = useSelector((state: RootState) => state.urls);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLink, setEditingLink] = useState<URL | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUrls = async () => {
    dispatch(setLoading(true));
    try {
      const response = await urlsAPI.getUrls();
      dispatch(setUrls(response.data));
    } catch {
      dispatch(setError('Failed to load favorites'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    if (urls.length === 0) {
      fetchUrls();
    }
  }, [urls.length]);

  const favorites = useMemo(() => urls.filter((item) => item.isFavorite), [urls]);
  const pinnedFavorites = useMemo(() => favorites.filter((item) => item.isPinned), [favorites]);
  const favoriteCategories = useMemo(
    () => new Set(favorites.map((item) => item.category || 'Uncategorized')).size,
    [favorites]
  );
  const spotlightFavorite = useMemo(
    () => [...favorites].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0],
    [favorites]
  );
  const filteredFavorites = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return favorites;

    return favorites.filter((item) =>
      [item.title, item.description, item.domain, item.url, item.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [favorites, searchTerm]);

  const spotlightUrl = spotlightFavorite ? normalizeUrl(spotlightFavorite.url) : '';
  const spotlightDomain = spotlightFavorite
    ? (() => {
        try {
          return new globalThis.URL(spotlightUrl).hostname.replace(/^www\./, '');
        } catch {
          return spotlightFavorite.domain || 'Saved link';
        }
      })()
    : '';

  return (
    <AppShell
      title="Favorites"
      subtitle="Your most valued digital resources, curated for clarity."
      onAddLink={() => setShowAddModal(true)}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search favorites..."
    >
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading favorites...
        </div>
      ) : (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="grid min-h-[220px] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="flex flex-col justify-between gap-6 p-6">
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                    <Star className="h-6 w-6 fill-current" />
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Favorite Shelf</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Keep priority links close, grouped, and easy to scan without mixing them into the full library.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Star className="h-4 w-4 text-amber-500" />
                      Saved
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{favorites.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Pin className="h-4 w-4 text-[#156fe6]" />
                      Pinned
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{pinnedFavorites.length}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Folder className="h-4 w-4 text-emerald-600" />
                      Categories
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{favoriteCategories}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-slate-950 p-5 text-white xl:border-l xl:border-t-0">
                {spotlightFavorite ? (
                  <div className="flex h-full flex-col justify-between overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/10">
                    <div className="relative h-36 overflow-hidden bg-slate-800">
                      <img
                        src={spotlightFavorite.thumbnail || `https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(spotlightDomain)}`}
                        alt={`${spotlightFavorite.title} preview`}
                        className="h-full w-full object-cover opacity-75"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Latest favorite</p>
                        <h3 className="mt-1 truncate text-xl font-semibold">{spotlightFavorite.title}</h3>
                      </div>
                    </div>
                    <div className="space-y-4 p-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
                          <Folder className="h-3.5 w-3.5" />
                          {spotlightFavorite.category || 'Uncategorized'}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {getDisplayDate(spotlightFavorite.createdAt)}
                        </span>
                      </div>
                      <Button
                        className="h-10 w-full rounded-xl bg-white font-semibold text-slate-950 hover:bg-blue-50"
                        onClick={() => window.open(spotlightUrl, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open Favorite
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-white/20 text-center">
                    <Star className="mb-3 h-8 w-8 text-white/35" />
                    <p className="text-sm font-medium text-white">No favorites yet</p>
                    <p className="mt-1 max-w-[220px] text-xs leading-5 text-white/50">Mark links with a star to build this view.</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Favorite Links</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {searchTerm.trim()
                    ? `${filteredFavorites.length} result${filteredFavorites.length === 1 ? '' : 's'} for "${searchTerm.trim()}"`
                    : `${favorites.length} starred resource${favorites.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <Button className="h-10 rounded-xl bg-[#156fe6] px-4 font-semibold hover:bg-[#0f64d8]" onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Link
              </Button>
            </div>

            {filteredFavorites.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Star className="mb-3 h-8 w-8 text-slate-400" />
                <p className="text-base font-semibold text-slate-900">No favorites found</p>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  {searchTerm.trim() ? 'Try a different search term.' : 'Star links from your library to collect them here.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 2xl:grid-cols-4">
                {filteredFavorites.map((url) => (
                  <LinkCard
                    key={url._id}
                    url={url}
                    onEdit={(selectedUrl) => {
                      setEditingLink(selectedUrl);
                      setShowEditModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <AddLinkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchUrls();
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
