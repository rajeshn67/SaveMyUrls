import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setUrls, setLoading, setError } from '../store/urlsSlice';
import { urlsAPI } from '../services/api';
import AppShell from '../components/AppShell';
import AddLinkModal from '../components/AddLinkModal';
import LinkCard from '../components/LinkCard';

export default function Favorites() {
  const dispatch = useDispatch<AppDispatch>();
  const { urls, isLoading } = useSelector((state: RootState) => state.urls);
  const [showAddModal, setShowAddModal] = useState(false);

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
    fetchUrls();
  }, []);

  const favorites = useMemo(() => urls.filter((item) => item.isFavorite), [urls]);

  return (
    <AppShell
      title="Favorites"
      subtitle="Your most valued digital resources, curated for clarity."
      onAddLink={() => setShowAddModal(true)}
    >
      {isLoading ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(156px,156px))] gap-3">
          {favorites.map((url) => (
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
