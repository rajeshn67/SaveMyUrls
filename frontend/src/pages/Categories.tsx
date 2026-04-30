import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import { urlsAPI } from '../services/api';
import { Folder, Palette, TerminalSquare, Sparkles, Wallet, Heart, Pencil } from 'lucide-react';
import LinkCard from '../components/LinkCard';
import AddLinkModal from '../components/AddLinkModal';
import { URL } from '../store/urlsSlice';
import EditLinkModal from '../components/EditLinkModal';

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
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [isRenamingCategory, setIsRenamingCategory] = useState(false);
  const [categoryLinks, setCategoryLinks] = useState<URL[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLink, setEditingLink] = useState<URL | null>(null);
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

  const handleRenameCategory = async (currentName: string, nextName: string) => {
    if (currentName === 'uncategorized' || !nextName.trim() || nextName === currentName) {
      setEditingCategory(null);
      return;
    }

    setError('');
    setIsRenamingCategory(true);
    try {
      await urlsAPI.renameCategory(currentName, nextName.trim());
      const trimmedName = nextName.trim();
      const updatedStats = categoryStats.map((category) =>
        category.name === currentName ? { ...category, name: trimmedName } : category
      );
      const updatedCache = new Map(cachedCategoryLinks);
      if (updatedCache.has(currentName)) {
        updatedCache.set(trimmedName, updatedCache.get(currentName) || []);
        updatedCache.delete(currentName);
      }
      cachedCategoryLinks.clear();
      updatedCache.forEach((value, key) => cachedCategoryLinks.set(key, value));
      cachedCategoryStats = updatedStats;

      setCategoryStats(updatedStats);
      setSelectedCategory(trimmedName);
      setEditingCategory(null);
      setEditedCategoryName('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to rename category');
    } finally {
      setIsRenamingCategory(false);
    }
  };

  const startRenameCategory = (categoryName: string) => {
    setEditingCategory(categoryName);
    setEditedCategoryName(categoryName);
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
                <div
                  key={category.name}
                  role="button"
                  tabIndex={0}
                  className={`w-full rounded-xl border p-3 text-left hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#156fe6] ${
                    isActive ? 'border-[#156fe6] bg-[#f3f8ff]' : 'border-slate-200 bg-white'
                  }`}
                  onClick={() => setSelectedCategory(category.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedCategory(category.name);
                    }
                  }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="rounded-lg bg-[#eef4ff] p-1.5 text-[#156fe6]">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {category.count} Links
                    </span>
                  </div>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    {editingCategory === category.name ? (
                      <div className="flex w-full items-center gap-2">
                        <input
                          value={editedCategoryName}
                          onChange={(e) => setEditedCategoryName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2 py-1 text-sm outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleRenameCategory(category.name, editedCategoryName);
                            }
                            if (e.key === 'Escape') {
                              setEditingCategory(null);
                              setEditedCategoryName('');
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="rounded-lg bg-[#156fe6] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#0f64d8] disabled:cursor-not-allowed disabled:opacity-70"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameCategory(category.name, editedCategoryName);
                          }}
                          disabled={isRenamingCategory}
                        >
                          {isRenamingCategory ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(null);
                            setEditedCategoryName('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900">{category.name}</h3>
                        {category.name !== 'uncategorized' ? (
                          <button
                            type="button"
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              startRenameCategory(category.name);
                            }}
                            aria-label={`Edit ${category.name} category`}
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                  <p className="line-clamp-2 text-[10px] leading-4 text-slate-500">
                    {category.count === 1 ? '1 saved link' : `${category.count} saved links`} in this category.
                  </p>
                </div>
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
                        onEdit={(selectedUrl) => {
                          setEditingLink(selectedUrl);
                          setShowEditModal(true);
                        }}
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
