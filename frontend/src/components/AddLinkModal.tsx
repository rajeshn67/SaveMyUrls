import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { urlsAPI } from '../services/api';
import type { URL } from '../store/urlsSlice';
import type { RootState } from '../store/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdUrl?: URL) => void;
}

const DEFAULT_CATEGORY = 'uncategorized';
const SETTINGS_STORAGE_KEY = 'savemyurls.settings';

const normalizeDefaultCategory = (value: unknown) => {
  const normalized = String(value || '').trim();
  return !normalized || normalized.toLowerCase() === 'general' ? DEFAULT_CATEGORY : normalized;
};

const formatCategoryLabel = (value: string) =>
  value === DEFAULT_CATEGORY ? 'Uncategorized' : value;

const mergeCategoryOptions = (...groups: Array<Array<string | undefined>>) => {
  const categoryMap = new Map<string, string>();

  groups.flat().forEach((category) => {
    const normalized = normalizeDefaultCategory(category);
    categoryMap.set(normalized.toLowerCase(), normalized);
  });

  categoryMap.set(DEFAULT_CATEGORY, DEFAULT_CATEGORY);
  return Array.from(categoryMap.values()).sort((a, b) => {
    if (a === DEFAULT_CATEGORY) return -1;
    if (b === DEFAULT_CATEGORY) return 1;
    return a.localeCompare(b);
  });
};

const getUserSettingsKey = (userId?: string, email?: string) =>
  userId || email ? `${SETTINGS_STORAGE_KEY}.${userId || email}` : SETTINGS_STORAGE_KEY;

const readLinkSettings = (settingsKey = SETTINGS_STORAGE_KEY) => {
  if (typeof window === 'undefined') {
    return {
      autoFavoriteNewLinks: false,
      defaultCategory: DEFAULT_CATEGORY,
      requireDescription: false,
    };
  }

  try {
    const settings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
    return {
      autoFavoriteNewLinks: Boolean(settings.autoFavoriteNewLinks),
      defaultCategory: normalizeDefaultCategory(settings.defaultCategory),
      requireDescription: Boolean(settings.requireDescription),
    };
  } catch {
    return {
      autoFavoriteNewLinks: false,
      defaultCategory: DEFAULT_CATEGORY,
      requireDescription: false,
    };
  }
};

export default function AddLinkModal({ isOpen, onClose, onSuccess }: AddLinkModalProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const settingsKey = getUserSettingsKey((user as any)?._id || (user as any)?.id, user?.email);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [categories, setCategories] = useState<string[]>([DEFAULT_CATEGORY]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isOpen) return;
      const settings = readLinkSettings(settingsKey);
      const initialCategories = mergeCategoryOptions([DEFAULT_CATEGORY, settings.defaultCategory]);
      setCategories(initialCategories);
      setCategory(settings.defaultCategory);

      try {
        const response = await urlsAPI.getCategories();
        const backendCategories = (response.data || []).map((item: { name: string }) => item.name);
        const merged = mergeCategoryOptions([DEFAULT_CATEGORY, settings.defaultCategory], backendCategories);
        setCategories(merged);
        const matchingDefault = merged.find(
          (item) => item.toLowerCase() === settings.defaultCategory.toLowerCase()
        );
        setCategory(matchingDefault || DEFAULT_CATEGORY);
      } catch {
        setCategories(initialCategories);
        setCategory(settings.defaultCategory || DEFAULT_CATEGORY);
      }
    };

    fetchCategories();
  }, [isOpen, settingsKey]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDescriptionError('');
    
    const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
    const charCount = description.trim().length;
    if (wordCount > 10) {
      setDescriptionError('Description must be 10 words or less');
      return;
    }
    if (charCount > 70) {
      setDescriptionError('Description must be 70 characters or less');
      return;
    }
    const settings = readLinkSettings(settingsKey);
    if (settings.requireDescription && charCount === 0) {
      setDescriptionError('Description is required by your settings');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await urlsAPI.createUrl({
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        category,
      });
      let createdUrl = response.data;
      if (settings.autoFavoriteNewLinks) {
        await urlsAPI.toggleFavorite(createdUrl._id);
        createdUrl = { ...createdUrl, isFavorite: true };
      }
      onSuccess(createdUrl);
      resetForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to save link';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    const settings = readLinkSettings(settingsKey);
    setTitle('');
    setUrl('');
    setDescription('');
    setCategory(settings.defaultCategory || DEFAULT_CATEGORY);
    setNewCategoryName('');
    setCategoryError('');
    setDescriptionError('');
  };

  const handleClose = () => {
    resetForm();
    setError('');
    setDescriptionError('');
    onClose();
  };

  const handleCreateCategory = async () => {
    const trimmedName = newCategoryName.trim().toLowerCase();
    if (!trimmedName) return;

    setCategoryError('');
    setIsCreatingCategory(true);
    try {
      await urlsAPI.createCategory(trimmedName);
      const response = await urlsAPI.getCategories();
      const backendCategories = (response.data || []).map((item: { name: string }) => item.name);
      const merged = mergeCategoryOptions([DEFAULT_CATEGORY], backendCategories, [trimmedName]);
      setCategories(merged);
      setCategory(trimmedName);
      setNewCategoryName('');
    } catch (error: any) {
      setCategoryError(error.response?.data?.error || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : undefined)}>
      <DialogContent className="overflow-hidden rounded-3xl border-slate-200 p-7 sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-3xl">Add New Link</DialogTitle>
          <DialogDescription>
            Curate a new resource for your library
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="min-w-0 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Resource Title</Label>
            <Input
              id="title"
              placeholder="e.g. Modern UI Design Principles"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-12 border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Destination URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="h-12 border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional: Add notes about this resource..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                const wordCount = e.target.value.trim().split(/\s+/).filter(word => word.length > 0).length;
                const charCount = e.target.value.trim().length;
                if (wordCount > 10) {
                  setDescriptionError('Description must be 10 words or less');
                } else if (charCount > 70) {
                  setDescriptionError('Description must be 70 characters or less');
                } else {
                  setDescriptionError('');
                }
              }}
              className="max-h-24 resize-none overflow-y-auto break-words"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Max 10 words</span>
              <span className={`text-xs ${description.trim().split(/\s+/).filter(word => word.length > 0).length > 10 ? 'text-red-500' : 'text-slate-500'}`}>
                {description.trim().split(/\s+/).filter(word => word.length > 0).length}/10 words
              </span>
            </div>
            {descriptionError && (
              <p className="text-sm text-red-500">{descriptionError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Collection / Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="h-12 w-full border-slate-300">
                <SelectValue placeholder={formatCategoryLabel(category || DEFAULT_CATEGORY)} />
              </SelectTrigger>
              <SelectContent
                className="max-h-[220px]"
                viewportClassName="overflow-y-auto"
                viewportStyle={{ maxHeight: '180px' }}
              >
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {formatCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Add a new category</p>
              <span className="text-xs text-slate-500">Optional</span>
            </div>
            <div className="flex min-w-0 gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category"
                className="h-11 min-w-0 border-slate-300"
              />
              <Button
                type="button"
                className="h-11 bg-[#156fe6] hover:bg-[#0f64d8]"
                onClick={handleCreateCategory}
                disabled={isCreatingCategory || !newCategoryName.trim()}
              >
                {isCreatingCategory ? 'Adding...' : 'Add'}
              </Button>
            </div>
            {categoryError ? (
              <p className="mt-2 text-sm text-red-500">{categoryError}</p>
            ) : null}
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#156fe6] hover:bg-[#0f64d8]" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
