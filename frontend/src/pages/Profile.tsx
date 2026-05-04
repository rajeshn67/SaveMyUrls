import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Camera, CirclePlus, FolderOpen, Sparkles, Lock } from 'lucide-react';
import { RootState } from '../store/store';
import { setUser, logout } from '../store/authSlice';
import { authAPI } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import AppShell from '../components/AppShell';

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [location, setLocation] = useState(user?.location || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess('');
    setErrorMessage('');

    try {
      const response = await authAPI.updateProfile(fullName, location);
      dispatch(setUser(response.data));
      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      const serverMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error || '';
      setErrorMessage(serverMessage || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const handleSelectAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setSuccess('');
    setErrorMessage('');
    setAvatarPreview(URL.createObjectURL(file));

    try {
      const response = await authAPI.uploadAvatar(file);
      dispatch(setUser(response.data));
      setSuccess('Profile photo updated successfully');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      const serverMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error || '';
      setErrorMessage(serverMessage || 'Could not upload profile image. Please try again.');
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    setSuccess('');
    setErrorMessage('');

    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to change password:', error);
      const serverMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error || '';
      setErrorMessage(serverMessage || 'Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AppShell
      title="Account Profile"
      subtitle="Manage your personal information and subscription preferences."
      showSearch={false}
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="relative mx-auto mb-4 h-28 w-28">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-slate-100 shadow-lg">
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || user?.avatar}
                    alt={user?.fullName || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-semibold text-slate-700">{user?.fullName?.charAt(0) || 'A'}</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSelectAvatar}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#156fe6] text-white shadow-md hover:bg-[#0f64d8]"
                aria-label="Upload profile image"
                disabled={isUploadingAvatar}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-center text-xl font-semibold tracking-tight text-slate-900">{user?.fullName || 'Alex Rivera'}</p>
            <p className="mt-1 text-center text-sm text-slate-500">{user?.location || 'Product Designer & Researcher'}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-[#dbe9ff] p-2.5 text-[#1b67da]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">Premium Plan</p>
                <p className="text-sm text-slate-500">Renews Dec 24, 2024</p>
              </div>
              <Button className="h-10 rounded-lg bg-[#156fe6] px-4 text-sm text-white hover:bg-[#0f64d8]">
                Upgrade
              </Button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold tracking-tight text-slate-900">Recent Activity</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="rounded-xl bg-[#e6efff] p-2.5 text-[#1b67da]">
                  <Bookmark className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">Saved UI Design Trends</p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="rounded-xl bg-[#e6efff] p-2.5 text-[#1b67da]">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">New Category: Research</p>
                  <p className="text-xs text-slate-500">5 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 border-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="h-10 border-slate-300 bg-slate-50 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location" className="text-sm">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  className="h-10 border-slate-300 text-sm"
                />
              </div>

              {success ? (
                <div className="rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div>
              ) : null}
              {errorMessage ? (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                <Button type="button" variant="outline" onClick={handleLogout} className="h-10 px-4 text-sm">
                  Logout
                </Button>
                <Button
                  type="submit"
                  className="h-10 rounded-xl bg-[#156fe6] px-4 text-sm text-white hover:bg-[#0f64d8]"
                  disabled={isLoading || isUploadingAvatar}
                >
                  {isLoading ? 'Saving...' : isUploadingAvatar ? 'Uploading...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>
            </div>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="profileCurrentPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-10 border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                  <Input
                    id="newPassword"
                    name="profileNewPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 border-slate-300 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="profileConfirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-10 border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (user?.email) {
                      authAPI.forgotPassword(user.email);
                      setSuccess('Password reset link sent to your email');
                    }
                  }}
                  className="text-sm text-[#156fe6] hover:underline"
                >
                  Forgot Password?
                </button>
                <Button
                  type="button"
                  onClick={handlePasswordChange}
                  className="h-10 rounded-xl bg-[#156fe6] px-4 text-sm text-white hover:bg-[#0f64d8]"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
