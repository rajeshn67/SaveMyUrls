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

export default function Dashboard() {
  const dispatch = useDispatch() as AppDispatch;
  const { urls, isLoading, error, filter } = useSelector((state: RootState) => state.urls);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLink, setEditingLink] = useState<URL | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (urls.length === 0) {
      fetchUrls();
    }
  }, [urls.length]);

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

  const filteredUrls = urls.filter((url) => {
    const matchesCategory = filter.category === 'all' || url.category === filter.category;
    const matchesFavorite = !filter.showFavorites || url.isFavorite;
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      [url.title, url.description, url.domain, url.url, ...(url.tags || []), url.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));

    return matchesCategory && matchesFavorite && matchesSearch;
  }).sort((a, b) => {
    // Pinned items first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // If both pinned, sort by pinnedAt (most recent first)
    if (a.isPinned && b.isPinned) {
      const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      return bTime - aTime;
    }
    // If neither pinned, sort by createdAt (most recent first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <AppShell
      title="My Library"
      subtitle={`Organizing ${urls.length} curated resources`}
      onAddLink={() => setShowAddModal(true)}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search by title, domain, tag..."
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Your saved bookmarks are organized in a modern workspace.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
            Filter
          </button>
          <button className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
            Sort
          </button>
        </div>
      </div>

      {error ? <p className="mb-4 text-sm text-red-500">{error}</p> : null}
      {isLoading ? (
        <p className="text-slate-500">Loading your links...</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="group flex min-h-[170px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-3 text-center transition hover:border-blue-400 hover:bg-slate-50"
          >
            <span className="mb-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm text-blue-600 transition group-hover:bg-blue-50">
              +
            </span>
            <span className="text-sm font-semibold text-slate-900">Add New</span>
          </button>

          {filteredUrls.map((url) => (
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
