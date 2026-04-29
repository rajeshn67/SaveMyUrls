import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Grid3X3, Star, Folder, UserRound, Settings, LogOut, Bell, Search } from 'lucide-react';
import { RootState } from '../store/store';
import { logout } from '../store/authSlice';
import { Button } from './ui/button';

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onAddLink?: () => void;
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: Grid3X3 },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/categories', label: 'Categories', icon: Folder },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

export default function AppShell({ title, subtitle, children, onAddLink }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <div className="min-h-screen bg-[#f6f7fc] text-slate-900">
      <aside className="fixed left-0 top-0 flex h-screen w-[220px] flex-col border-r border-slate-200 bg-[#f5f6fb] px-4 py-5">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1971e9] text-white">
            ⛓
          </div>
          <div>
            <p className="text-[26px] font-semibold leading-none text-[#0f5cc2]">SaveMyURLs</p>
            <p className="text-xs text-slate-500">RESEARCHER PRO</p>
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

        <Button
          onClick={onAddLink}
          className="mt-auto mb-6 h-12 rounded-xl bg-[#156fe6] text-base hover:bg-[#1062cd]"
        >
          + Add New Link
        </Button>

        <div className="space-y-1 text-sm">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-600 hover:bg-white">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={() => {
              dispatch(logout());
              navigate('/');
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-slate-600 hover:bg-white"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-[220px] min-h-screen">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-[#f6f7fc]/95 px-7 backdrop-blur">
          <div className="flex w-full max-w-[460px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search your saved links..."
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="ml-6 flex items-center gap-5">
            <Bell className="h-5 w-5 text-slate-500" />
            <div className="flex items-center gap-2">
              <div className="text-right text-sm">
                <p className="font-medium leading-none">{user?.fullName || 'Alex Morgan'}</p>
                <p className="text-xs text-slate-500">Pro Member</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-white shadow" />
            </div>
          </div>
        </header>

        <div className="px-7 py-7">
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
