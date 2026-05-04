import { useEffect, useMemo, useState } from 'react';
import AppShell from '../components/AppShell';
import { urlsAPI } from '../services/api';
import { Folder, Palette, TerminalSquare, Sparkles, Wallet, Heart, Pencil, Plus, Search, Link2, Layers3 } from 'lucide-react';
import LinkCard from '../components/LinkCard';
import AddLinkModal from '../components/AddLinkModal';
import { URL } from '../store/urlsSlice';
import EditLinkModal from '../components/EditLinkModal';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);


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
      setShowAddCategoryModal(false);
      cachedCategoryStats = [];
      cachedCategoryLinks.clear();
      await fetchCategories(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add category');
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleCloseAddCategoryModal = () => {
    setShowAddCategoryModal(false);
    setNewCategoryName('');
    setError('');
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

  const filteredCategoryStats = useMemo(() => {
    const normalizedSearch = categorySearchTerm.trim().toLowerCase();
    if (!normalizedSearch) return categoryStats;
    return categoryStats.filter((category) =>
      category.name.toLowerCase().includes(normalizedSearch)
    );
  }, [categoryStats, categorySearchTerm]);

  const totalCategoryLinks = useMemo(
    () => categoryStats.reduce((total, category) => total + category.count, 0),
    [categoryStats]
  );
  const topCategory = useMemo(
    () => [...categoryStats].sort((a, b) => b.count - a.count)[0] || null,
    [categoryStats]
  );

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
      <div className="grid max-w-full grid-cols-1 gap-6 overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#156fe6] shadow-sm">
                  <Layers3 className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">Collections</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {categoryStats.length} folders, {totalCategoryLinks} saved links
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#156fe6] text-white shadow-sm transition hover:bg-[#0f64d8]"
                aria-label="Add new category"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#156fe6] focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className={`space-y-2 overflow-y-auto p-3 ${visibleCategoryLinks.length > 0 ? 'xl:max-h-[820px]' : 'xl:max-h-[520px]'}`}>
            {filteredCategoryStats.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
                {categorySearchTerm ? 'No categories found' : 'No categories yet'}
              </div>
            ) : (
              filteredCategoryStats.map((category) => {
                const Icon = getCategoryIcon(category.name);
                const isActive = selectedCategory === category.name;
                const percent = totalCategoryLinks ? Math.max(6, Math.round((category.count / totalCategoryLinks) * 100)) : 0;
                return (
                  <div
                    key={category.name}
                    role="button"
                    tabIndex={0}
                    className={`relative w-full overflow-hidden rounded-xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#156fe6] ${
                      isActive ? 'border-[#156fe6] bg-[#f4f8ff] shadow-sm' : 'border-transparent bg-white hover:border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedCategory(category.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCategory(category.name);
                      }
                    }}
                  >
                    {isActive ? <div className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[#156fe6]" /> : null}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#eef4ff] text-[#156fe6]">
                          <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          {editingCategory === category.name ? (
                            <div className="flex w-full items-center gap-2">
                              <input
                                value={editedCategoryName}
                                onChange={(e) => setEditedCategoryName(e.target.value)}
                                className="h-8 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-[#156fe6]"
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
                                className="h-8 rounded-lg bg-[#156fe6] px-2 text-[10px] font-semibold text-white hover:bg-[#0f64d8] disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameCategory(category.name, editedCategoryName);
                                }}
                                disabled={isRenamingCategory}
                              >
                                {isRenamingCategory ? 'Saving' : 'Save'}
                              </button>
                            </div>
                          ) : (
                            <h3 className="line-clamp-1 text-sm font-semibold text-slate-950">{category.name}</h3>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-500">
                            {category.count} link{category.count === 1 ? '' : 's'}
                          </span>
                          <div className="h-1.5 min-w-[56px] flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-[#156fe6]" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      </div>
                      {category.name !== 'uncategorized' && editingCategory !== category.name ? (
                        <button
                          type="button"
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-[#156fe6]"
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenameCategory(category.name);
                          }}
                          aria-label={`Edit ${category.name} category`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                    </div>
                    {editingCategory === category.name ? (
                      <button
                        type="button"
                        className="ml-[52px] mt-2 h-8 rounded-lg border border-slate-300 bg-white px-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(null);
                          setEditedCategoryName('');
                        }}
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section className="w-full min-w-0 max-w-full">
          {selectedCategory && selectedCategoryStat ? (
            <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                      {(() => {
                        const Icon = getCategoryIcon(selectedCategory);
                        return <Icon className="h-5 w-5" />;
                      })()}
                    </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Selected collection</p>
                        <h2 className="truncate text-3xl font-semibold tracking-tight">{selectedCategory}</h2>
                      </div>
                    </div>
                    <p className="max-w-2xl text-sm leading-6 text-white/70">
                      {selectedCategoryStat.count} link{selectedCategoryStat.count === 1 ? '' : 's'} currently in this category.
                      {searchTerm.trim() ? ` Showing ${visibleCategoryLinks.length} matching result${visibleCategoryLinks.length === 1 ? '' : 's'}.` : ''}
                    </p>
                  </div>
                  <Button className="h-11 rounded-xl bg-white px-4 font-semibold text-slate-950 hover:bg-blue-50" onClick={() => setShowAddModal(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                  </Button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs font-medium text-white/55">All Categories</p>
                    <p className="mt-1 text-2xl font-semibold">{categoryStats.length}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs font-medium text-white/55">Organized Links</p>
                    <p className="mt-1 text-2xl font-semibold">{totalCategoryLinks}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-3 ring-1 ring-white/10">
                    <p className="text-xs font-medium text-white/55">Top Category</p>
                    <p className="mt-1 truncate text-2xl font-semibold">{topCategory?.name || 'None'}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-b border-slate-100 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#edf3ff] px-3 py-1.5 text-xs font-semibold text-[#156fe6]">
                    <Folder className="h-3.5 w-3.5" />
                    {selectedCategory}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                    <Link2 className="h-3.5 w-3.5" />
                    {visibleCategoryLinks.length} visible
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {searchTerm.trim() ? `Filtered by "${searchTerm.trim()}"` : 'Latest saved links appear first'}
                </p>
              </div>

              {isLoadingLinks ? (
                <div className="m-5 flex min-h-[260px] items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">Loading links...</div>
              ) : visibleCategoryLinks.length === 0 ? (
                <div className="m-5 flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <Folder className="mb-3 h-8 w-8 text-slate-400" />
                  <p className="text-base font-semibold text-slate-900">No links found</p>
                  <p className="mt-1 text-sm text-slate-500">Add a link or adjust your search for this category.</p>
                </div>
              ) : (
                <div className="min-h-[820px] max-h-[820px] overflow-y-auto p-5">
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
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
        </section>
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

      <Dialog open={showAddCategoryModal} onOpenChange={(open) => (!open ? handleCloseAddCategoryModal() : undefined)}>
        <DialogContent className="overflow-hidden rounded-3xl border-slate-200 p-7 sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your links
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCategory} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Design, Development, Research"
                className="h-12 border-slate-300"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseAddCategoryModal}
                disabled={isAddingCategory}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#156fe6] hover:bg-[#0f64d8]"
                disabled={isAddingCategory || !newCategoryName.trim()}
              >
                {isAddingCategory ? 'Adding...' : 'Add Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
