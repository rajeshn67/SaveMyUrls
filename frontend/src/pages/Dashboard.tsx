import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setUrls, setLoading, setError } from '../store/urlsSlice';
import { urlsAPI } from '../services/api';
import AppShell from '../components/AppShell';
import AddLinkModal from '../components/AddLinkModal';
import LinkCard from '../components/LinkCard';

export default function Dashboard() {
  const dispatch = useDispatch() as AppDispatch;
  const { urls, isLoading, error, filter } = useSelector((state: RootState) => state.urls);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchUrls();
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

  const filteredUrls = urls.filter((url) => {
    const matchesCategory = filter.category === 'all' || url.category === filter.category;
    const matchesFavorite = !filter.showFavorites || url.isFavorite;

    return matchesCategory && matchesFavorite;
  });

  return (
    <AppShell
      title="My Library"
      subtitle={`Organizing ${urls.length} curated resources`}
      onAddLink={() => setShowAddModal(true)}
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="group flex min-h-[240px] w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-3 text-center transition hover:border-blue-400 hover:bg-slate-50"
          >
            <span className="mb-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm text-blue-600 transition group-hover:bg-blue-50">
              +
            </span>
            <span className="text-sm font-semibold text-slate-900">Add New</span>
          </button>

          {filteredUrls.map((url) => (
            <LinkCard key={url._id} url={url} onRefresh={fetchUrls} />
          ))}
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
    </AppShell>
  );
}
