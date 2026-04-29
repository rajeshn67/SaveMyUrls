import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess('');

    try {
      const response = await authAPI.updateProfile(fullName, location);
      dispatch(setUser(response.data));
      setSuccess('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <AppShell
      title="Account Profile"
      subtitle="Manage your personal information and subscription preferences."
    >
      <div className="grid gap-8 xl:grid-cols-[280px,1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 text-center">
          <div className="mx-auto mb-4 flex h-40 w-40 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-5xl font-semibold text-white">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          <p className="text-4xl font-semibold">{user?.fullName || 'Alex Rivera'}</p>
          <p className="mt-1 text-slate-500">{user?.email || 'alex.rivera@design.studio'}</p>
        </div>

        <div className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6"
          >
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="h-12 border-slate-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., San Francisco, CA"
                  className="h-12 border-slate-300"
                />
              </div>

              {success ? <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{success}</div> : null}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={handleLogout}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#156fe6] hover:bg-[#0f64d8]" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </form>

          <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6">
            <div>
              <p className="text-3xl font-semibold text-slate-900">Subscription Plan</p>
              <p className="mt-1 text-slate-500">You are currently on the Premium plan.</p>
            </div>
            <Button className="h-12 bg-[#156fe6] px-6 hover:bg-[#0f64d8]">Upgrade Plan</Button>
          </div>
        </div>
      </div>
      <button onClick={handleLogout} className="mt-5 text-sm text-slate-500 underline">
        Logout
      </button>
    </AppShell>
  );
}
