import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import { urlsAPI } from '../services/api';
import { Folder, Palette, TerminalSquare, Sparkles, Wallet, Heart } from 'lucide-react';
import LinkCard from '../components/LinkCard';
import AddLinkModal from '../components/AddLinkModal';
import { URL } from '../store/urlsSlice';

interface CategoryStat {
  name: string;
  count: number;
}

let cachedCategoryStats: CategoryStat[] = [];
const cachedCategoryLinks = new Map<string, URL[]>();

export default function Categories() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryLinks, setCategoryLinks] = useState<URL[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategories = async (force = false) => {
    if (!force && cachedCategoryStats.length > 0) {
      setCategoryStats(cachedCategoryStats);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await urlsAPI.getCategories();
      const data = response.data || [];
      cachedCategoryStats = data;
      setCategoryStats(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory && categoryStats.length > 0) {
      setSelectedCategory(categoryStats[0].name);
    }
  }, [categoryStats, selectedCategory]);

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
      cachedCategoryStats = [];
      cachedCategoryLinks.clear();
      await fetchCategories(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add category');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const fetchLinksByCategory = async (categoryName: string, force = false) => {
    if (!force && cachedCategoryLinks.has(categoryName)) {
      setCategoryLinks(cachedCategoryLinks.get(categoryName) || []);
      setIsLoadingLinks(false);
      return;
    }

    setIsLoadingLinks(true);
    setError('');
    try {
      const response = await urlsAPI.getUrls({ category: categoryName });
      const data = response.data || [];
      cachedCategoryLinks.set(categoryName, data);
      setCategoryLinks(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load links for this category');
      setCategoryLinks([]);
    } finally {
      setIsLoadingLinks(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) {
      fetchLinksByCategory(selectedCategory);
    } else {
      setCategoryLinks([]);
    }
  }, [selectedCategory]);

  const visibleCategoryLinks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return categoryLinks;
    return categoryLinks.filter((item) =>
      [item.title, item.description, item.domain, item.url, ...(item.tags || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch))
    );
  }, [categoryLinks, searchTerm]);

  return (
    <AppShell
      title="Categories"
      subtitle="Organize your digital library with folder-based curation."
      onAddLink={() => setShowAddModal(true)}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search links in selected category..."
    >
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
      <div className="flex max-w-full flex-col gap-6 overflow-hidden xl:h-[calc(100vh-230px)] xl:flex-row">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 xl:h-[calc(100vh-220px)] xl:w-[340px] xl:flex-shrink-0 xl:overflow-hidden">
          <form onSubmit={handleAddCategory} className="mb-4 flex flex-col gap-2">
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Add new category"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#156fe6]"
            />
            <button
              type="submit"
              disabled={isAddingCategory || !newCategoryName.trim()}
              className="h-10 rounded-xl bg-[#156fe6] px-4 text-sm font-medium text-white transition hover:bg-[#0f64d8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAddingCategory ? 'Adding...' : 'Add Category'}
            </button>
          </form>

          <div className="space-y-2 xl:max-h-[calc(100vh-340px)] xl:overflow-y-auto xl:pr-1">
            {categoryStats.map((category) => {
              const Icon = getCategoryIcon(category.name);
              const isActive = selectedCategory === category.name;
              return (
                <button
                  key={category.name}
                  className={`w-full rounded-xl border p-3 text-left hover:shadow-sm ${
                    isActive ? 'border-[#156fe6] bg-[#f3f8ff]' : 'border-slate-200 bg-white'
                  }`}
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
                  <p className="line-clamp-2 text-[10px] leading-4 text-slate-500">
                    {category.count === 1 ? '1 saved link' : `${category.count} saved links`} in this category.
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full min-w-0 max-w-full xl:h-[calc(100vh-220px)]">
          {selectedCategory && selectedCategoryStat ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 xl:flex xl:h-full xl:min-w-0 xl:flex-col xl:overflow-hidden">
              <p className="text-xl font-semibold text-slate-900">{selectedCategory}</p>
              <p className="mt-1 text-slate-500">
                {selectedCategoryStat.count} link{selectedCategoryStat.count === 1 ? '' : 's'} currently in this category.
              </p>
              {isLoadingLinks ? (
                <p className="mt-5 text-sm text-slate-500">Loading links...</p>
              ) : visibleCategoryLinks.length === 0 ? (
                <p className="mt-5 text-sm text-slate-500">No links found in this category.</p>
              ) : (
                <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
                    {visibleCategoryLinks.map((link) => (
                      <LinkCard
                        key={link._id}
                        url={link}
                        onRefresh={() => {
                          cachedCategoryStats = [];
                          cachedCategoryLinks.delete(selectedCategory || '');
                          fetchCategories(true);
                          if (selectedCategory) {
                            fetchLinksByCategory(selectedCategory, true);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      </>
      )}

      {!isLoading && categoryStats.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 text-slate-500">
          No categories yet. Add links from Dashboard to generate categories automatically.
        </div>
      ) : null}

      <AddLinkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          cachedCategoryStats = [];
          cachedCategoryLinks.clear();
          fetchCategories(true);
          if (selectedCategory) {
            fetchLinksByCategory(selectedCategory, true);
          }
        }}
      />
    </AppShell>
  );
}
