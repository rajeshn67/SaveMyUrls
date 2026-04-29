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
      {error ? <p className="mb-4 text-sm text-red-500">{error}</p> : null}
      {isLoading ? (
        <p className="text-slate-500">Loading your links...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
