import { useEffect, useState } from 'react';
import { urlsAPI } from '../services/api';
import type { URL } from '../store/urlsSlice';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface AddSecretLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdUrl: URL) => void;
}

const DEFAULT_CATEGORY = 'uncategorized';

export default function AddSecretLinkModal({ isOpen, onClose, onSuccess }: AddSecretLinkModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(DEFAULT_CATEGORY);
  const [categories, setCategories] = useState<string[]>([DEFAULT_CATEGORY]);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      if (!isOpen) return;

      try {
        const response = await urlsAPI.getCategories();
        const backendCategories = (response.data || []).map((item: { name: string }) => item.name);
        setCategories(Array.from(new Set([DEFAULT_CATEGORY, ...backendCategories])));
      } catch {
        setCategories([DEFAULT_CATEGORY]);
      }
    };

    fetchCategories();
  }, [isOpen]);

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setCategory(DEFAULT_CATEGORY);
    setPassword('');
    setShowPassword(false);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await urlsAPI.createSecretUrl({
        title: title.trim(),
        url: url.trim(),
        category,
        password,
      });
      onSuccess(response.data);
      resetForm();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save private link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? handleClose() : undefined)}>
      <DialogContent className="overflow-hidden rounded-3xl border-slate-200 p-7 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-3xl">
            <Lock className="h-6 w-6 text-[#156fe6]" />
            Save to Vault
          </DialogTitle>
          <DialogDescription>
            Store a hidden link behind your vault password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="secret-title">Title</Label>
            <Input
              id="secret-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Private resource"
              required
              className="h-12 border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret-url">URL</Label>
            <Input
              id="secret-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/private"
              required
              className="h-12 border-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secret-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="secret-category" className="h-12 border-slate-300">
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

          <div className="space-y-2">
            <Label htmlFor="secret-password">Vault Password</Label>
            <div className="relative">
              <Input
                id="secret-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Required"
                required
                className="h-12 border-slate-300 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={showPassword ? 'Hide vault password' : 'Show vault password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#156fe6] hover:bg-[#0f64d8]" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save to Vault'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
