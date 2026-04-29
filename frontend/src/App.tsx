import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store/store';
import { setUser, setToken, setError } from './store/authSlice';
import { authAPI } from './services/api';

import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import Categories from './pages/Categories';

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await authAPI.getMe();
          dispatch(setUser(response.data));
        } catch (error) {
          dispatch(setToken(''));
          dispatch(setError('Session expired'));
        }
      }
    };

    initializeAuth();
  }, [token, dispatch]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/" />} />
        <Route path="/favorites" element={token ? <Favorites /> : <Navigate to="/" />} />
        <Route path="/profile" element={token ? <Profile /> : <Navigate to="/" />} />
        <Route path="/categories" element={token ? <Categories /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
