import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock, User } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLoginForm,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegisterForm,
  } = useForm({
    resolver: zodResolver(signUpSchema),
  });

  const onLogin = async (data) => {
    try {
      setLoading(true);
      const { error } = await signIn(data.email, data.password);
      if (error) throw error;
      showToast('Logged in successfully!', 'success');
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        showToast('Email atau password salah', 'error');
      } else if (msg.includes('Email not confirmed')) {
        showToast('Email belum dikonfirmasi. Cek inbox/spam email Anda', 'error');
      } else if (msg.includes('Invalid API key')) {
        showToast('Koneksi ke server gagal. Cek konfigurasi Supabase', 'error');
      } else {
        showToast(msg || 'Gagal masuk. Coba lagi', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (data) => {
    try {
      setLoading(true);
      const { error } = await signUp(data.email, data.password, data.fullName);
      if (error) throw error;
      showToast('Akun berhasil dibuat! Cek email Anda untuk konfirmasi', 'success');
      setIsSignUp(false);
      resetLoginForm();
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('already registered')) {
        showToast('Email sudah terdaftar. Gunakan email lain atau masuk', 'error');
      } else if (msg.includes('Invalid API key')) {
        showToast('Koneksi ke server gagal. Cek konfigurasi Supabase', 'error');
      } else {
        showToast(msg || 'Gagal daftar. Coba lagi', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSignUp ? 'Enter your details below to get started.' : 'Enter your email to access your workspace.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 rounded-xl bg-muted/40 border border-border">
        <button
          onClick={() => { setIsSignUp(false); resetRegisterForm(); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isSignUp ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Sign In
        </button>
        <button
          onClick={() => { setIsSignUp(true); resetLoginForm(); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isSignUp ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Sign Up
        </button>
      </div>

      {/* Forms */}
      {!isSignUp ? (
        <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Email</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                {...loginRegister('email')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              />
            </div>
            {loginErrors.email && <p className="text-xs text-rose-500 mt-1">{loginErrors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                {...loginRegister('password')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              />
            </div>
            {loginErrors.password && <p className="text-xs text-rose-500 mt-1">{loginErrors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Sign In</span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegisterSubmit(onSignUp)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Full Name</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                {...registerRegister('fullName')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              />
            </div>
            {registerErrors.fullName && <p className="text-xs text-rose-500 mt-1">{registerErrors.fullName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Email</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                {...registerRegister('email')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              />
            </div>
            {registerErrors.email && <p className="text-xs text-rose-500 mt-1">{registerErrors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Password</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="•••••••• (Min. 6 chars)"
                {...registerRegister('password')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
              />
            </div>
            {registerErrors.password && <p className="text-xs text-rose-500 mt-1">{registerErrors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 mt-6"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Sign Up</span>
          </button>
        </form>
      )}
    </div>
  );
}
