import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import AppShell from '../components/AppShell';
import { Palette, TerminalSquare, Sparkles, Wallet, Heart } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  { name: 'Design', icon: Palette, description: 'UI kits, motion inspiration, and typography archives.' },
  { name: 'Development', icon: TerminalSquare, description: 'API docs, GitHub repos, and performance tools.' },
  { name: 'Research', icon: Sparkles, description: 'Whitepapers, case studies, and industry trends.' },
  { name: 'Finance', icon: Wallet, description: 'Market analysis, investment trackers, and crypto news.' },
  { name: 'Personal', icon: Heart, description: 'Recipes, travel plans, and interesting reads for later.' },
];

export default function Categories() {
  const { urls } = useSelector((state: RootState) => state.urls);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const getCategoryCount = (categoryName: string) => {
    return urls.filter((url) => url.category === categoryName).length;
  };

  return (
    <AppShell title="Categories" subtitle="Organize your digital library with folder-based curation.">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <button className="flex min-h-[240px] items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white text-lg font-medium text-[#156fe6]">
          New Category
        </button>

        {DEFAULT_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.name}
              className="min-h-[240px] rounded-3xl border border-slate-200 bg-white p-6 text-left hover:shadow-sm"
              onClick={() => setSelectedCategory(category.name)}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="rounded-xl bg-[#eef4ff] p-2 text-[#156fe6]">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-slate-500">
                  {getCategoryCount(category.name)} Links
                </span>
              </div>
              <h3 className="mb-3 text-4xl font-semibold text-slate-900">{category.name}</h3>
              <p className="text-sm leading-6 text-slate-500">{category.description}</p>
            </button>
          );
        })}
      </div>

      {selectedCategory ? (
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
          <p className="text-xl font-semibold text-slate-900">{selectedCategory}</p>
          <p className="mt-1 text-slate-500">
            Recently organized links from this category are listed in your dashboard.
          </p>
        </div>
      ) : null}
    </AppShell>
  );
}
