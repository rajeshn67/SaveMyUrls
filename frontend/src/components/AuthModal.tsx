import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setToken, setUser, setError } from '../store/authSlice';
import { resetUrls } from '../store/urlsSlice';
import { lockVault } from '../store/vaultSlice';
import { authAPI } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  open: boolean;
  initialMode: AuthMode;
  onOpenChange: (open: boolean) => void;
}

export default function AuthModal({ open, initialMode, onOpenChange }: AuthModalProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorMsg] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setErrorMsg('');
  }, [initialMode, open]);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response =
        mode === 'login'
          ? await authAPI.login(email, password)
          : await authAPI.register(fullName, email, password);

      dispatch(resetUrls());
      dispatch(lockVault());
      dispatch(setToken(response.data.token));
      dispatch(setUser(response.data.user));
      onOpenChange(false);
      navigate('/dashboard');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        (mode === 'login' ? 'Login failed' : 'Registration failed');
      setErrorMsg(errorMessage);
      dispatch(setError(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(openState) => !openState && handleClose()}>
      <DialogContent className="sm:max-w-[540px] rounded-3xl border-slate-200 p-7">
        <DialogHeader>
          <div className="mb-5 flex items-center gap-2 rounded-2xl bg-[#eef0f6] p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 rounded-xl px-4 py-3 transition ${
                mode === 'login'
                  ? 'bg-white text-[#155dc8] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 rounded-xl px-4 py-3 transition ${
                mode === 'register'
                  ? 'bg-white text-[#155dc8] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Create Account
            </button>
          </div>

          <DialogTitle className="text-4xl font-semibold tracking-[-0.03em] text-slate-900">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </DialogTitle>
          <DialogDescription className="text-base text-slate-500">
            {mode === 'login'
              ? 'Continue your research journey.'
              : 'Start organizing your digital resources.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                className="h-[52px] rounded-full border-slate-300 text-base"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-[52px] rounded-full border-slate-300 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-[52px] rounded-full border-slate-300 text-base"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="h-[52px] rounded-full border-slate-300 text-base"
              />
            </div>
          )}

          {error && <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-500">{error}</div>}

          <Button
            type="submit"
            className="h-[54px] w-full rounded-full bg-[#156fe6] text-xl font-medium hover:bg-[#0f64d8]"
            disabled={isLoading}
          >
            {isLoading
              ? mode === 'login'
                ? 'Signing in...'
                : 'Creating account...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
