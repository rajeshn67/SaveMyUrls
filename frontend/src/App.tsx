import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store/store';
import { setUser, setToken, setError, setLoading } from './store/authSlice';
import { resetUrls } from './store/urlsSlice';
import { lockVault } from './store/vaultSlice';
import { authAPI } from './services/api';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Categories from './pages/Categories';
import PrivateVault from './pages/PrivateVault';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

const getDefaultRoute = () => {
  if (typeof window === 'undefined') return '/dashboard';

  try {
    const settings = JSON.parse(localStorage.getItem('savemyurls.settings') || '{}');
    const defaultView = settings.defaultView;
    return ['dashboard', 'favorites', 'categories', 'vault'].includes(defaultView)
      ? `/${defaultView}`
      : '/dashboard';
  } catch {
    return '/dashboard';
  }
};

function App() {
  const dispatch = useDispatch();
  const { token, user, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        dispatch(setLoading(true));
        try {
          const response = await authAPI.getMe();
          dispatch(setUser(response.data));
        } catch (error) {
          dispatch(setToken(''));
          dispatch(resetUrls());
          dispatch(lockVault());
          dispatch(setError('Session expired'));
        } finally {
          dispatch(setLoading(false));
        }
      }
    };

    initializeAuth();
  }, [token, dispatch]);

  if (token && isLoading && !user) {
    return <div className="min-h-screen bg-[#f6f7fc]" />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Navigate to={getDefaultRoute()} /> : <Landing />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/analytics" element={token ? <Analytics /> : <Navigate to="/" />} />
        <Route path="/vault" element={token ? <PrivateVault /> : <Navigate to="/" />} />
        <Route path="/favorites" element={token ? <Favorites /> : <Navigate to="/" />} />
        <Route path="/profile" element={token ? <Profile /> : <Navigate to="/" />} />
        <Route path="/categories" element={token ? <Categories /> : <Navigate to="/" />} />
        <Route path="/settings" element={token ? <Settings /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
