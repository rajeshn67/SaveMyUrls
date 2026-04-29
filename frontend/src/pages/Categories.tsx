import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import { urlsAPI } from '../services/api';
import { Folder, Palette, TerminalSquare, Sparkles, Wallet, Heart } from 'lucide-react';

interface CategoryStat {
  name: string;
  count: number;
}

export default function Categories() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await urlsAPI.getCategories();
      setCategoryStats(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const selectedCategoryStat = useMemo(
    () => categoryStats.find((category) => category.name === selectedCategory) || null,
    [categoryStats, selectedCategory]
  );

  const getCategoryIcon = (categoryName: string) => {
    const normalized = categoryName.toLowerCase();
    if (normalized.includes('design')) return Palette;
    if (normalized.includes('dev')) return TerminalSquare;
    if (normalized.includes('research')) return Sparkles;
    if (normalized.includes('finance')) return Wallet;
    if (normalized.includes('personal')) return Heart;
    return Folder;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    setError('');
    setIsAddingCategory(true);
    try {
      await urlsAPI.createCategory(trimmedName);
      setNewCategoryName('');
      await fetchCategories();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add category');
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <AppShell title="Categories" subtitle="Organize your digital library with folder-based curation.">
      {error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">
          Loading categories...
        </div>
      ) : (
      <>
      <form onSubmit={handleAddCategory} className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Add new category"
          className="h-10 w-full max-w-[260px] rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#156fe6]"
        />
        <button
          type="submit"
          disabled={isAddingCategory || !newCategoryName.trim()}
          className="h-10 rounded-xl bg-[#156fe6] px-4 text-sm font-medium text-white transition hover:bg-[#0f64d8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAddingCategory ? 'Adding...' : 'Add Category'}
        </button>
      </form>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(156px,156px))] gap-3">
        {categoryStats.map((category) => {
          const Icon = getCategoryIcon(category.name);
          return (
            <button
              key={category.name}
              className="h-[164px] w-[156px] rounded-xl border border-slate-200 bg-white p-3 text-left hover:shadow-sm"
              onClick={() => setSelectedCategory(category.name)}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="rounded-lg bg-[#eef4ff] p-1.5 text-[#156fe6]">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-semibold text-slate-500">
                  {category.count} Links
                </span>
              </div>
              <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-slate-900">{category.name}</h3>
              <p className="line-clamp-3 text-[10px] leading-4 text-slate-500">
                {category.count === 1 ? '1 saved link' : `${category.count} saved links`} in this category.
              </p>
            </button>
          );
        })}
      </div>
      </>
      )}

      {!isLoading && categoryStats.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">
          No categories yet. Add links from Dashboard to generate categories automatically.
        </div>
      ) : null}

      {selectedCategory && selectedCategoryStat ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-xl font-semibold text-slate-900">{selectedCategory}</p>
          <p className="mt-1 text-slate-500">
            {selectedCategoryStat.count} link{selectedCategoryStat.count === 1 ? '' : 's'} currently in this category.
          </p>
        </div>
      ) : null}
    </AppShell>
  );
}
