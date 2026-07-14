import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, User, UserCheck, Shield } from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string().min(2, 'Role description must be at least 2 characters'),
});

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name || '',
      role: profile?.role || 'Member',
    },
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await updateProfile({
        full_name: data.fullName,
        role: data.role,
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your public account details and roles.</p>
      </div>

      <div className="p-6 rounded-2xl glass-card space-y-6 border border-border/40">
        {/* Header avatar preview */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/25 text-primary flex items-center justify-center font-bold text-2xl uppercase border border-primary/20">
            {profile?.full_name ? profile.full_name[0] : user?.email[0]}
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">{profile?.full_name || 'Member'}</h3>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Full Name</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                {...register('fullName')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground text-sm"
              />
            </div>
            {errors.fullName && <p className="text-xs text-rose-500 mt-1">{errors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Role / Title</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Shield className="w-4 h-4" />
              </span>
              <input
                type="text"
                {...register('role')}
                placeholder="e.g. Lead Designer, Software Engineer"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground text-sm"
              />
            </div>
            {errors.role && <p className="text-xs text-rose-500 mt-1">{errors.role.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            <span>Save Changes</span>
          </button>
        </form>
      </div>
    </div>
  );
}
