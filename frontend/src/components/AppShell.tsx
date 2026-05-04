import { ReactNode, useEffect, useId, useState } from 'react';
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
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/categories', label: 'Categories', icon: Folder },
  { to: '/vault', label: 'Private Vault', icon: Lock },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
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
  const { isUnlocked } = useSelector((state: RootState) => state.vault);
  const [localSearchValue, setLocalSearchValue] = useState('');
  const [settingsVersion, setSettingsVersion] = useState(0);
  const searchInputId = useId();

  const inputValue = searchValue ?? localSearchValue;

  const handleSearchChange = (value: string) => {
    if (user?.email && value.trim().toLowerCase() === user.email.toLowerCase()) {
      value = '';
    }

    if (typeof onSearchChange === 'function') {
      onSearchChange(value);
      return;
    }
    setLocalSearchValue(value);
  };

  useEffect(() => {
    if (!isUnlocked || typeof window === 'undefined') return;

    let timeoutId: number | undefined;
    const readAutoLockMinutes = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('savemyurls.settings') || '{}');
        return settings.autoLockMinutes || '15';
      } catch {
        return '15';
      }
    };

    const autoLockMinutes = readAutoLockMinutes();
    if (autoLockMinutes === 'never') return;

    const resetTimer = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        dispatch(lockVault());
      }, Number(autoLockMinutes) * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      events.forEach((eventName) => window.removeEventListener(eventName, resetTimer));
    };
  }, [dispatch, isUnlocked, settingsVersion]);

  useEffect(() => {
    const handleSettingsChange = () => setSettingsVersion((version) => version + 1);
    window.addEventListener('savemyurls-settings-changed', handleSettingsChange);
    return () => window.removeEventListener('savemyurls-settings-changed', handleSettingsChange);
  }, []);

  useEffect(() => {
    if (!user?.email || inputValue.trim().toLowerCase() !== user.email.toLowerCase()) return;
    handleSearchChange('');
  }, [inputValue, user?.email]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f6f7fc] text-slate-900 lg:h-screen lg:overflow-hidden">
      <aside className="relative z-20 flex w-full flex-col border-b border-slate-200 bg-[#f5f6fb] px-4 py-4 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-[220px] lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
        <div className="mb-4 flex items-center gap-3 lg:mb-8">
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

        <nav className="no-scrollbar flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition lg:w-full lg:gap-3 ${
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
            className="mt-4 h-11 rounded-xl bg-[#156fe6] text-sm hover:bg-[#1062cd] lg:mt-auto lg:mb-6 lg:h-12 lg:text-base"
          >
            + Add New Link
          </Button>
        ) : (
          <div className="hidden lg:mt-auto lg:mb-6 lg:block" />
        )}

        <div className="mt-3 flex gap-2 text-sm lg:mt-0 lg:block lg:space-y-1">
          <Link
            to="/settings"
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 transition lg:w-full lg:justify-start lg:gap-3 ${
              location.pathname === '/settings' ? 'bg-white text-[#125fd5] shadow-sm' : 'text-slate-600 hover:bg-white'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={() => {
              dispatch(logout());
              dispatch(resetUrls());
              dispatch(lockVault());
              navigate('/');
            }}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-slate-600 hover:bg-white lg:w-full lg:justify-start lg:gap-3"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="min-h-screen overflow-visible lg:ml-[220px] lg:h-screen lg:overflow-hidden">
        <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-slate-200 bg-[#f6f7fc]/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-5 lg:h-20 lg:px-7 lg:py-0">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
            {subtitle ? <p className="mt-0.5 truncate text-sm text-slate-500">{subtitle}</p> : null}
          </div>

          <div className="flex w-full min-w-0 items-center gap-3 sm:ml-auto sm:w-auto sm:gap-5">
            {showSearch ? (
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 sm:w-[320px] sm:flex-none lg:w-[360px] lg:max-w-[34vw]">
                <Search className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <input
                  id={searchInputId}
                  type="search"
                  name={`library-search-${location.pathname.replace(/\W+/g, '-')}`}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-label="Search saved links"
                  placeholder={searchPlaceholder}
                  value={inputValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="app-search-input h-10 min-w-0 w-full bg-transparent text-sm text-slate-900 outline-none"
                />
              </div>
            ) : null}
            <Bell className="hidden h-5 w-5 flex-shrink-0 text-slate-500 sm:block" />
            <div className="flex flex-shrink-0 items-center gap-2">
              <div className="hidden text-right text-sm sm:block">
                <p className="font-medium leading-none">{user?.fullName || 'User'}</p>
                <p className="text-xs text-slate-500">Pro Member</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white shadow">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-slate-500">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="no-scrollbar px-4 py-4 lg:h-[calc(100vh-80px)] lg:overflow-y-auto lg:px-7 lg:py-7">
          {children}
        </div>
      </main>
    </div>
  );
}
