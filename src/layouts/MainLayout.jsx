import { useState, useMemo } from 'react';
import { Link, Outlet, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { useProjects, useCreateProject } from '../hooks/useTasks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Dialog from '../components/ui/Dialog';
import {
  HardDrive,
  Folder,
  User,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  Loader2,
  FolderOpen
} from 'lucide-react';

const projectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
});

export default function MainLayout() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const createProjectMutation = useCreateProject();

  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const currentProject = useMemo(
    () => projects?.find((p) => p.id === projectId),
    [projects, projectId]
  );

  const breadcrumbLabel = useMemo(() => {
    if (location.pathname === '/') return 'All Projects';
    if (location.pathname.startsWith('/project')) return currentProject?.name || 'Project Dashboard';
    if (location.pathname === '/profile') return 'Profile';
    if (location.pathname === '/settings') return 'Settings';
    return '';
  }, [location.pathname, currentProject]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(projectSchema),
  });

  const handleCreateProject = (data) => {
    createProjectMutation.mutate(
      {
        name: data.name,
        description: data.description,
        ownerId: user.id,
      },
      {
        onSuccess: (newProj) => {
          setIsNewProjectOpen(false);
          reset();
          navigate(`/project/${newProj.id}`);
        },
      }
    );
  };

  const activeLinkClass = (path) =>
    location.pathname === path
      ? 'bg-primary/10 text-primary border-l-4 border-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-4 border-transparent';

  const activeProjectClass = (id) =>
    projectId === id
      ? 'bg-primary/10 text-primary border-l-4 border-primary'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground border-l-4 border-transparent';

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-md">
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <HardDrive className="w-5 h-5 text-primary" />
            <span>SupaFlow</span>
          </Link>
        </div>

          {/* Sidebar Navigation */}
        <nav className="flex-1 py-6 px-4 space-y-7 overflow-y-auto">
          {/* Main Pages */}
          <div className="space-y-1">
            <span className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Workspace</span>
            <Link to="/" className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeLinkClass('/')}`}>
              <FolderOpen className="w-4 h-4" />
              <span>All Projects</span>
            </Link>
          </div>

          {/* Projects List */}
          <div className="space-y-2">
            <span className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Projects</span>

            {projectsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : projects && projects.length > 0 ? (
              <div className="space-y-1">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeProjectClass(project.id)}`}
                  >
                    <Folder className="w-4 h-4" />
                    <span className="truncate">{project.name}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground/60 px-3 py-2">
                No projects yet.
              </div>
            )}
          </div>
        </nav>

        {/* User settings footer */}
        <div className="p-4 border-t border-border bg-muted/20">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm text-primary uppercase">
              {profile?.full_name ? profile.full_name[0] : user?.email[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-foreground">{profile?.full_name || 'Member'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-4">
            <Link to="/profile" className="flex justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title="Profile">
              <User className="w-4 h-4" />
            </Link>
            <Link to="/settings" className="flex justify-center p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" title="Settings">
              <Settings className="w-4 h-4" />
            </Link>
            <button onClick={signOut} className="flex justify-center p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          {/* Backdrop */}
          <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
          
          <aside className="relative flex flex-col w-64 bg-card border-r border-border h-full z-50">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <Link to="/" className="flex items-center gap-2 font-bold text-lg" onClick={() => setIsSidebarOpen(false)}>
                <HardDrive className="w-5 h-5 text-primary" />
                <span>SupaFlow</span>
              </Link>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-7 overflow-y-auto">
              <div className="space-y-1">
                <span className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Workspace</span>
                <Link
                  to="/"
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeLinkClass('/')}`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>All Projects</span>
                </Link>
              </div>

              <div className="space-y-2">
                <span className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Projects</span>

                {projectsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : projects && projects.length > 0 ? (
                  <div className="space-y-1">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/project/${project.id}`}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeProjectClass(project.id)}`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Folder className="w-4 h-4" />
                    <span className="truncate">{project.name}</span>
                  </Link>
                ))}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground/60 px-3 py-2">
                    No projects yet.
                  </div>
                )}
              </div>
            </nav>

            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex items-center gap-3 px-2 py-1.5">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center font-bold text-sm text-primary uppercase">
                  {profile?.full_name ? profile.full_name[0] : user?.email[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{profile?.full_name || 'Member'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-4">
                <Link to="/profile" className="flex justify-center p-2 hover:bg-muted rounded-lg" onClick={() => setIsSidebarOpen(false)}>
                  <User className="w-4 h-4" />
                </Link>
                <Link to="/settings" className="flex justify-center p-2 hover:bg-muted rounded-lg" onClick={() => setIsSidebarOpen(false)}>
                  <Settings className="w-4 h-4" />
                </Link>
                <button onClick={() => { signOut(); setIsSidebarOpen(false); }} className="flex justify-center p-2 text-rose-500 rounded-lg">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground rounded-lg md:hidden transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Location info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>SupaFlow</span>
              <ChevronRight className="w-4 h-4 text-border" />
              <span className="text-foreground font-medium">{breadcrumbLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl border border-border/80 transition-all duration-300"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Profile Dropdown (Desktop header) */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm uppercase hover:ring-2 hover:ring-primary/45 transition-all"
              >
                {profile?.full_name ? profile.full_name[0] : user?.email[0]}
              </button>

              {isProfileDropdownOpen && (
                <>
                  <div onClick={() => setIsProfileDropdownOpen(false)} className="fixed inset-0 z-40" />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border glass-panel shadow-lg z-50 p-2 space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setIsProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
          <Outlet />
        </main>
      </div>

      {/* New Project Dialog */}
      <Dialog isOpen={isNewProjectOpen} onClose={() => setIsNewProjectOpen(false)} title="Create New Project">
        <form onSubmit={handleSubmit(handleCreateProject)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Project Name</label>
            <input
              type="text"
              placeholder="e.g. Acme Website, Mobile App"
              {...register('name')}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground"
            />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-muted-foreground">Description</label>
            <textarea
              placeholder="Explain the purpose of this project..."
              {...register('description')}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-foreground resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsNewProjectOpen(false)}
              className="px-4 py-2 text-sm font-medium hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-xl transition-opacity disabled:opacity-55"
            >
              {createProjectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
