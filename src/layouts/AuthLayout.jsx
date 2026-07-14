import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HardDrive } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  // If user is already logged in, redirect straight to dashboard
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-background text-foreground overflow-hidden">
      {/* Left side: Form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-12 relative z-10">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 text-primary rounded-xl border border-primary/20">
              <HardDrive className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              SupaFlow
            </span>
          </div>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>

      {/* Right side: Aesthetic background panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-muted/30 border-l border-border relative overflow-hidden grid-bg">
        {/* Glow circles */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[80px] animate-pulse-slow" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-[100px] animate-pulse-slow" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground tracking-wider uppercase">SupaFlow Cloud Workspace</span>
          <span className="text-xs text-muted-foreground/60 border border-border/80 rounded-full px-3 py-1 bg-background/50 backdrop-blur-sm">v1.0.0</span>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground">
            The next-generation <br />
            <span className="text-primary bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Kanban workspace</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Organize projects, assign tasks, collaborate in PostgreSQL-powered real-time rooms, and store document attachments in an integrated workspace.
          </p>
        </div>

        <div className="relative z-10 text-xs text-muted-foreground/50">
          © {new Date().getFullYear()} SupaFlow Technologies Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
}
