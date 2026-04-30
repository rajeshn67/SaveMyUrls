import { useEffect, useState } from 'react';
import { urlsAPI } from '../services/api';
import type { URL } from '../store/urlsSlice';
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

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  link: URL | null;
}

const DEFAULT_CATEGORY = 'uncategorized';

export default function EditLinkModal({ isOpen, onClose, onSuccess, link }: EditLinkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [categories, setCategories] = useState<string[]>([DEFAULT_CATEGORY]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !link) return;
    setTitle(link.title || '');
    setUrl(link.url || '');
    setDescription(link.description || '');
    setCategory(link.category || DEFAULT_CATEGORY);
    setError('');
  }, [isOpen, link]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!isOpen) return;
      try {
        const response = await urlsAPI.getCategories();
        const backendCategories = (response.data || []).map((item: { name: string }) => item.name);
        const merged = Array.from(new Set([DEFAULT_CATEGORY, ...backendCategories]));
        setCategories(merged);
      } catch {
        setCategories([DEFAULT_CATEGORY]);
      }
    };
    fetchCategories();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!link) return;
    setError('');
    setIsLoading(true);
    try {
      await urlsAPI.updateUrl(link._id, {
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        category,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="sm:max-w-[520px] rounded-3xl border-slate-200 p-7">
        <DialogHeader>
          <DialogTitle className="text-3xl">Edit Link</DialogTitle>
          <DialogDescription>Update your saved resource details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Resource Title</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-12 border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-url">Destination URL</Label>
            <Input
              id="edit-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="h-12 border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Collection / Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="edit-category" className="h-12 border-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? <div className="rounded bg-red-50 p-3 text-sm text-red-500">{error}</div> : null}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#156fe6] hover:bg-[#0f64d8]" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
