import { FormEvent, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import {
  addVaultLink,
  lockVault,
  setVaultError,
  setVaultLoading,
  unlockVault,
} from '../store/vaultSlice';
import { urlsAPI } from '../services/api';
import AppShell from '../components/AppShell';
import AddSecretLinkModal from '../components/AddSecretLinkModal';
import SecretLinkCard from '../components/SecretLinkCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Eye, EyeOff, Lock, Plus } from 'lucide-react';

export default function PrivateVault() {
  const dispatch = useDispatch<AppDispatch>();
  const { vaultLinks, isUnlocked, isLoading, error } = useSelector((state: RootState) => state.vault);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleUnlock = async (event: FormEvent) => {
    event.preventDefault();
    dispatch(setVaultLoading(true));
    dispatch(setVaultError(null));

    try {
      const response = await urlsAPI.unlockSecretUrls(password);
      dispatch(unlockVault(response.data));
    } catch (error: any) {
      const message = error.response?.status === 401
        ? 'Incorrect password'
        : error.response?.data?.error || 'Failed to unlock vault';
      dispatch(setVaultError(message));
    } finally {
      dispatch(setVaultLoading(false));
    }
  };

  const handleLock = () => {
    setPassword('');
    setShowPassword(false);
    dispatch(lockVault());
  };

  return (
    <AppShell
      title="Private Vault"
      subtitle={isUnlocked ? `${vaultLinks.length} hidden resources secured` : 'Unlock your hidden links'}
      onAddLink={isUnlocked ? () => setShowAddModal(true) : undefined}
      showSearch={false}
    >
      {!isUnlocked ? (
        <div className="flex min-h-[420px] items-center justify-center">
          <form
            onSubmit={handleUnlock}
            className="w-full max-w-[420px] rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition"
          >
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf3ff] text-[#156fe6]">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">Enter Vault Password</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              If this is your first time here, enter a password to open an empty vault and then save your first private link.
            </p>

            <div className="mt-6 space-y-2">
              <Label htmlFor="vault-password">Vault Password</Label>
              <div className="relative">
                <Input
                  id="vault-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>
            ) : null}

            <Button type="submit" className="mt-6 h-12 w-full bg-[#156fe6] hover:bg-[#0f64d8]" disabled={isLoading}>
              {isLoading ? 'Unlocking...' : 'Unlock Vault'}
            </Button>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">Private links stay out of the normal dashboard.</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button className="bg-[#156fe6] hover:bg-[#0f64d8]" onClick={() => setShowAddModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Save to Vault
              </Button>
              <Button variant="outline" onClick={handleLock}>
                Lock Vault
              </Button>
            </div>
          </div>

          {vaultLinks.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Lock className="mb-3 h-8 w-8 text-slate-400" />
              <h2 className="text-xl font-semibold text-slate-900">No secret links yet</h2>
              <p className="mt-1 text-sm text-slate-500">Save your first hidden resource in the vault.</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
              {vaultLinks.map((url) => (
                <SecretLinkCard key={url._id} url={url} />
              ))}
            </div>
          )}
        </>
      )}

      <AddSecretLinkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(createdUrl) => {
          setShowAddModal(false);
          dispatch(addVaultLink(createdUrl));
        }}
      />
    </AppShell>
  );
}
