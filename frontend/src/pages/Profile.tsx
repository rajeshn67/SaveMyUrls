import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AtSign,
  Bookmark,
  Camera,
  CalendarDays,
  ExternalLink,
  Globe2,
  KeyRound,
  Link2,
  Lock,
  MapPin,
  Phone,
  Pin,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import AppShell from '../components/AppShell';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { authAPI, urlsAPI } from '../services/api';
import { setUser, logout } from '../store/authSlice';
import { resetUrls } from '../store/urlsSlice';
import { lockVault } from '../store/vaultSlice';
import { RootState } from '../store/store';

const timezones = [
  'Asia/Calcutta',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
];

type ProfileStats = {
  visibleLinks: number;
  favorites: number;
  pinned: number;
  privateLinks: number;
};

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { urls } = useSelector((state: RootState) => state.urls);
  const { vaultLinks } = useSelector((state: RootState) => state.vault);

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    role: user?.role || '',
    bio: user?.bio || '',
    email: user?.email || '',
    phone: user?.phone || '',
    website: user?.website || '',
    socialHandle: user?.socialHandle || '',
    location: user?.location || '',
    timezone: user?.timezone || 'Asia/Calcutta',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState<ProfileStats>({
    visibleLinks: urls.length,
    favorites: urls.filter((url) => url.isFavorite).length,
    pinned: urls.filter((url) => url.isPinned).length,
    privateLinks: vaultLinks.length,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      role: user?.role || '',
      bio: user?.bio || '',
      email: user?.email || '',
      phone: user?.phone || '',
      website: user?.website || '',
      socialHandle: user?.socialHandle || '',
      location: user?.location || '',
      timezone: user?.timezone || 'Asia/Calcutta',
    });
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        const response = await urlsAPI.getAnalytics();
        setStats({
          visibleLinks: response.data.totals.publicLinks,
          favorites: response.data.totals.favoriteLinks,
          pinned: response.data.totals.pinnedLinks,
          privateLinks: response.data.totals.secretLinks,
        });
      } catch {
        setStats({
          visibleLinks: urls.length,
          favorites: urls.filter((url) => url.isFavorite).length,
          pinned: urls.filter((url) => url.isPinned).length,
          privateLinks: vaultLinks.length,
        });
      }
    };

    fetchProfileStats();
  }, [urls, vaultLinks.length]);

  const profileCompletion = useMemo(() => {
    const fields = [
      user?.avatar,
      form.fullName,
      form.role,
      form.bio,
      form.phone,
      form.website,
      form.socialHandle,
      form.location,
      form.timezone,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form, user?.avatar]);

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const clearMessages = () => {
    setSuccess('');
    setErrorMessage('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearMessages();
    setIsSaving(true);

    try {
      const response = await authAPI.updateProfile({
        fullName: form.fullName.trim(),
        role: form.role.trim(),
        bio: form.bio.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        socialHandle: form.socialHandle.trim(),
        location: form.location.trim(),
        timezone: form.timezone,
      });
      dispatch(setUser(response.data));
      setSuccess('Profile updated successfully');
    } catch (error) {
      const serverMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error || '';
      setErrorMessage(serverMessage || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearMessages();
    setIsUploadingAvatar(true);
    setAvatarPreview(URL.createObjectURL(file));

    try {
      const response = await authAPI.uploadAvatar(file);
      dispatch(setUser(response.data));
      setSuccess('Profile photo updated successfully');
    } catch (error) {
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
    clearMessages();

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
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const serverMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error || '';
      setErrorMessage(serverMessage || 'Failed to change password. Please check your current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(resetUrls());
    dispatch(lockVault());
    navigate('/');
  };

  return (
    <AppShell
      title="Profile"
      subtitle="Your identity, contact details, account health, and security."
      showSearch={false}
    >
      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="relative mx-auto h-32 w-32">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg">
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || user?.avatar}
                    alt={user?.fullName || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-semibold text-slate-700">{form.fullName.charAt(0) || 'U'}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-[#156fe6] text-white shadow-md hover:bg-[#0f64d8]"
                aria-label="Upload profile image"
                disabled={isUploadingAvatar}
              >
                <Camera className="h-4 w-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-2xl font-semibold text-slate-900">{form.fullName || 'User'}</h2>
              <p className="mt-1 text-sm text-slate-500">{form.role || 'Add your role or title'}</p>
              <p className="mt-1 text-sm text-slate-500">{form.location || 'No location added'}</p>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Profile completion</span>
                <span className="font-semibold text-slate-900">{profileCompletion}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-[#156fe6]" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-900">Account Snapshot</h3>
            <div className="grid gap-3">
              <ProfileStat icon={Link2} label="Visible Links" value={stats.visibleLinks} />
              <ProfileStat icon={Bookmark} label="Favorites" value={stats.favorites} />
              <ProfileStat icon={Pin} label="Pinned" value={stats.pinned} />
              <ProfileStat icon={Lock} label="Private Links" value={stats.privateLinks} />
              <ProfileStat icon={Sparkles} label="Plan" value={user?.subscription || 'free'} />
              <ProfileStat icon={CalendarDays} label="Joined" value={joinedDate} />
            </div>
          </section>
        </aside>

        <div className="space-y-5">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3ff] text-[#156fe6]">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Personal Details</h2>
                  <p className="text-sm text-slate-500">This is the profile information attached to your account.</p>
                </div>
              </div>
              <Button type="submit" className="h-10 bg-[#156fe6] hover:bg-[#0f64d8]" disabled={isSaving || isUploadingAvatar}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ProfileField icon={UserRound} label="Full Name" id="profileFullName">
                <Input id="profileFullName" value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} className="h-10 border-slate-300" />
              </ProfileField>
              <ProfileField icon={Sparkles} label="Role / Title" id="profileRole">
                <Input id="profileRole" value={form.role} onChange={(event) => updateField('role', event.target.value)} placeholder="e.g., Product Designer" className="h-10 border-slate-300" />
              </ProfileField>
              <ProfileField icon={AtSign} label="Email Address" id="profileEmail">
                <Input id="profileEmail" value={form.email} disabled className="h-10 border-slate-300 bg-slate-50" />
              </ProfileField>
              <ProfileField icon={Phone} label="Phone" id="profilePhone">
                <Input id="profilePhone" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} placeholder="+91 98765 43210" className="h-10 border-slate-300" />
              </ProfileField>
              <ProfileField icon={Globe2} label="Website" id="profileWebsite">
                <Input id="profileWebsite" value={form.website} onChange={(event) => updateField('website', event.target.value)} placeholder="https://yourdomain.com" className="h-10 border-slate-300" />
              </ProfileField>
              <ProfileField icon={AtSign} label="Social Handle" id="profileSocial">
                <Input id="profileSocial" value={form.socialHandle} onChange={(event) => updateField('socialHandle', event.target.value)} placeholder="@yourname" className="h-10 border-slate-300" />
              </ProfileField>
              <ProfileField icon={MapPin} label="Location" id="profileLocation">
                <Input id="profileLocation" value={form.location} onChange={(event) => updateField('location', event.target.value)} placeholder="Mumbai, India" className="h-10 border-slate-300" />
              </ProfileField>
              <ProfileField icon={Globe2} label="Timezone" id="profileTimezone">
                <Select value={form.timezone} onValueChange={(value) => updateField('timezone', value)}>
                  <SelectTrigger id="profileTimezone" className="h-10 w-full border-slate-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((timezone) => (
                      <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </ProfileField>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label htmlFor="profileBio">Bio</Label>
              <Textarea
                id="profileBio"
                value={form.bio}
                onChange={(event) => updateField('bio', event.target.value.slice(0, 220))}
                placeholder="A short note about how you use your saved resources."
                className="min-h-24 resize-none border-slate-300"
              />
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Max 220 characters</span>
                <span>{form.bio.length}/220</span>
              </div>
            </div>

            {success ? <div className="mt-4 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700">{success}</div> : null}
            {errorMessage ? <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</div> : null}
          </form>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4df] text-[#a96800]">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Security</h2>
                  <p className="text-sm text-slate-500">Change your password for this account.</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Input type="password" autoComplete="current-password" placeholder="Current password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="h-10 border-slate-300" />
                <Input type="password" autoComplete="new-password" placeholder="New password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="h-10 border-slate-300" />
                <Input type="password" autoComplete="new-password" placeholder="Confirm password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-10 border-slate-300" />
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <Button type="button" onClick={handlePasswordChange} className="h-10 bg-[#156fe6] hover:bg-[#0f64d8]" disabled={isChangingPassword}>
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ecfdf3] text-[#198754]">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Quick Actions</h2>
                  <p className="text-sm text-slate-500">Account shortcuts</p>
                </div>
              </div>
              <div className="grid gap-2">
                {form.website ? (
                  <Button type="button" variant="outline" className="justify-center" onClick={() => window.open(form.website, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Website
                  </Button>
                ) : null}
                <Button type="button" variant="outline" className="justify-center" onClick={() => navigate('/settings')}>
                  Settings
                </Button>
                <Button type="button" variant="outline" className="justify-center text-red-600 hover:text-red-700" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ProfileField({
  icon: Icon,
  label,
  id,
  children,
}: {
  icon: typeof UserRound;
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
        {label}
      </Label>
      {children}
    </div>
  );
}

function ProfileStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Link2;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 text-[#156fe6]" />
        <span className="truncate text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-semibold capitalize text-slate-900">{value}</span>
    </div>
  );
}
