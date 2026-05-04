import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { BarChart3, Grid3X3, Star, Folder, UserRound, Settings, LogOut, Bell, Search, Bookmark, Link2, Lock } from 'lucide-react';
import { RootState } from '../store/store';
import { logout } from '../store/authSlice';
import { resetUrls } from '../store/urlsSlice';
import { lockVault } from '../store/vaultSlice';
import { Button } from './ui/button';

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onAddLink?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Grid3X3 },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/categories', label: 'Categories', icon: Folder },
  { to: '/vault', label: 'Private Vault', icon: Lock },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export default function AppShell({
  title,
  subtitle,
  children,
  onAddLink,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search your saved links...',
  showSearch = true,
}: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [localSearchValue, setLocalSearchValue] = useState('');

  const inputValue = searchValue ?? localSearchValue;

  const handleSearchChange = (value: string) => {
    if (typeof onSearchChange === 'function') {
      onSearchChange(value);
      return;
    }
    setLocalSearchValue(value);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f6f7fc] text-slate-900">
      <aside className="fixed left-0 top-0 flex h-screen w-[220px] flex-col border-r border-slate-200 bg-[#f5f6fb] px-4 py-5">
        <div className="mb-8 flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#156fe6] to-[#0f5cc2] text-white shadow-lg shadow-blue-500/30">
            <Bookmark className="h-6 w-6" strokeWidth={2.5} />
            <div className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-lg bg-white shadow-md">
              <Link2 className="h-3 w-3 text-[#156fe6]" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <p className="text-xl font-bold leading-tight tracking-tight text-[#0f5cc2]">
              <span className="text-[#156fe6]">Save</span>My<span className="text-[#156fe6]">URLs</span>
            </p>
            <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Link Manager</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active ? 'bg-white text-[#125fd5] shadow-sm' : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {onAddLink ? (
          <Button
            onClick={onAddLink}
            className="mt-auto mb-6 h-12 rounded-xl bg-[#156fe6] text-base hover:bg-[#1062cd]"
          >
            + Add New Link
          </Button>
        ) : (
          <div className="mt-auto mb-6" />
        )}

        <div className="space-y-1 text-sm">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-600 hover:bg-white">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={() => {
              dispatch(logout());
              dispatch(resetUrls());
              dispatch(lockVault());
              navigate('/');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-600 hover:bg-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-[220px] h-screen overflow-hidden">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-[#f6f7fc]/95 px-7 backdrop-blur">
          {showSearch ? (
            <div className="flex w-full max-w-[460px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="savedLinksSearch"
                autoComplete="off"
                aria-label="Search saved links"
                placeholder={searchPlaceholder}
                value={inputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          ) : (
            <div className="w-full max-w-[460px]" />
          )}

          <div className="ml-6 flex items-center gap-5">
            <Bell className="h-5 w-5 text-slate-500" />
            <div className="flex items-center gap-2">
              <div className="text-right text-sm">
                <p className="font-medium leading-none">{user?.fullName || 'Alex Morgan'}</p>
                <p className="text-xs text-slate-500">Pro Member</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white shadow">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-slate-500">
                    {user?.fullName?.charAt(0) || 'A'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="no-scrollbar h-[calc(100vh-80px)] overflow-y-auto px-7 py-7">
          <div className="mb-6">
            <h1 className="text-5xl font-semibold leading-tight tracking-tight text-slate-900">{title}</h1>
            {subtitle ? <p className="mt-1 text-lg text-slate-500">{subtitle}</p> : null}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
