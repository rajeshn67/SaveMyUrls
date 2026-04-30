import { useEffect, useState } from 'react';
import { urlsAPI } from '../services/api';
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
  onSuccess: () => void;
}

const DEFAULT_CATEGORY = 'uncategorized';

export default function AddLinkModal({ isOpen, onClose, onSuccess }: AddLinkModalProps) {
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
      try {
        const response = await urlsAPI.getCategories();
        const backendCategories = (response.data || []).map((item: { name: string }) => item.name);
        const merged = Array.from(new Set([DEFAULT_CATEGORY, ...backendCategories]));
        setCategories(merged);
        if (!merged.includes(category)) {
          setCategory(DEFAULT_CATEGORY);
        }
      } catch {
        setCategories([DEFAULT_CATEGORY]);
      }
    };

    fetchCategories();
  }, [isOpen]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await urlsAPI.createUrl({
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        category,
      });
      onSuccess();
      resetForm();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to save link';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setCategory(DEFAULT_CATEGORY);
    setNewCategoryName('');
    setCategoryError('');
  };

  const handleClose = () => {
    resetForm();
    setError('');
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
      const merged = Array.from(new Set([DEFAULT_CATEGORY, ...backendCategories]));
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
      <DialogContent className="sm:max-w-[520px] rounded-3xl border-slate-200 p-7">
        <DialogHeader>
          <DialogTitle className="text-3xl">Add New Link</DialogTitle>
          <DialogDescription>
            Curate a new resource for your library
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Collection / Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="h-12 border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-52">
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">Add a new category</p>
              <span className="text-xs text-slate-500">Optional</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="New category"
                className="h-11 border-slate-300"
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
