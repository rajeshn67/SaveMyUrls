import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Camera, CirclePlus, FolderOpen, Sparkles } from 'lucide-react';
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

  return (
    <AppShell
      title="Account Profile"
      subtitle="Manage your personal information and subscription preferences."
    >
      <div className="grid gap-8 xl:grid-cols-[280px,1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="relative mx-auto mb-6 h-40 w-40">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-slate-100 shadow-lg">
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || user?.avatar}
                    alt={user?.fullName || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-semibold text-slate-700">{user?.fullName?.charAt(0) || 'A'}</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleSelectAvatar}
                className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border border-white bg-[#156fe6] text-white shadow-md hover:bg-[#0f64d8]"
                aria-label="Upload profile image"
                disabled={isUploadingAvatar}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>

            <p className="text-2xl font-semibold tracking-tight text-slate-900">{user?.fullName || 'Alex Rivera'}</p>
            <p className="mt-2 text-sm text-slate-500">{user?.location || 'Product Designer & Researcher'}</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[#dbe9ff] p-3 text-[#1b67da]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Subscription Plan</p>
                  <p className="mt-1 text-sm text-slate-500">You are currently on the Premium Plan.</p>
                  <p className="text-sm text-slate-500">Renewal on Dec 24, 2024.</p>
                </div>
              </div>
              <Button className="h-11 rounded-xl bg-[#156fe6] px-5 text-sm text-white hover:bg-[#0f64d8]">
                Upgrade Plan
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-11 border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="h-11 border-slate-300 bg-slate-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  className="h-11 border-slate-300"
                />
              </div>

              {success ? (
                <div className="rounded-2xl bg-green-50 p-3 text-sm text-green-700">{success}</div>
              ) : null}
              {errorMessage ? (
                <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <Button type="button" variant="outline" onClick={handleLogout}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 rounded-xl bg-[#156fe6] px-5 text-sm text-white hover:bg-[#0f64d8]"
                  disabled={isLoading || isUploadingAvatar}
                >
                  {isLoading ? 'Saving...' : isUploadingAvatar ? 'Uploading...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">Recent Activity</h3>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="rounded-2xl bg-[#e6efff] p-3 text-[#1b67da]">
                  <Bookmark className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Saved UI Design Trends</p>
                  <p className="text-xs text-slate-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="rounded-2xl bg-[#e6efff] p-3 text-[#1b67da]">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">New Category: Research</p>
                  <p className="text-xs text-slate-500">5 hours ago</p>
                </div>
              </div>
              <button
                type="button"
                className="flex min-h-[112px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-slate-500"
              >
                <CirclePlus className="h-5 w-5" />
                <span className="text-sm font-semibold">View All Activity</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
