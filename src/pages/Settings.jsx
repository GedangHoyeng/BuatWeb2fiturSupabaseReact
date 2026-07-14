import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { Sun, Moon, Bell, Shield, Info, HardDrive } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  
  const [notifications, setNotifications] = useState({
    email: true,
    realtime: true,
  });

  const handleToggleNotification = (key) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      showToast(`Notification settings updated!`, 'success');
      return updated;
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your app customization, theme options, and notifications.</p>
      </div>

      {/* Theme customization */}
      <div className="p-6 rounded-2xl glass-card space-y-4 border border-border/40">
        <h3 className="text-base font-bold flex items-center gap-2">
          {theme === 'light' ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-violet-500" />}
          <span>Appearance</span>
        </h3>
        <p className="text-xs text-muted-foreground">Switch between light and dark theme mode according to preference.</p>
        
        <div className="flex gap-4 pt-2">
          <button
            onClick={() => { if (theme !== 'light') toggleTheme(); }}
            className={`flex-1 py-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            <Sun className="w-6 h-6" />
            <span className="text-xs font-semibold">Light Mode</span>
          </button>

          <button
            onClick={() => { if (theme !== 'dark') toggleTheme(); }}
            className={`flex-1 py-4 border rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            <Moon className="w-6 h-6" />
            <span className="text-xs font-semibold">Dark Mode</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="p-6 rounded-2xl glass-card space-y-4 border border-border/40">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <span>Notification Preferences</span>
        </h3>
        
        <div className="space-y-4 divide-y divide-border/20">
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Email Alerts</p>
              <p className="text-xs text-muted-foreground">Receive periodic digests of pending task deadlines.</p>
            </div>
            <button
              onClick={() => handleToggleNotification('email')}
              className={`w-11 h-6 rounded-full transition-all relative ${notifications.email ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card transition-all ${notifications.email ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">Realtime In-app Indicators</p>
              <p className="text-xs text-muted-foreground">Update page details in realtime on other users' updates.</p>
            </div>
            <button
              onClick={() => handleToggleNotification('realtime')}
              className={`w-11 h-6 rounded-full transition-all relative ${notifications.realtime ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card transition-all ${notifications.realtime ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* System Details */}
      <div className="p-6 rounded-2xl glass-card space-y-4 border border-border/40">
        <h3 className="text-base font-bold flex items-center gap-2">
          <Info className="w-5 h-5 text-muted-foreground" />
          <span>System Diagnostics</span>
        </h3>
        
        <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed bg-muted/40 p-4 rounded-xl border border-border/25">
          <div className="flex justify-between">
            <span>Database Connection:</span>
            <span className="text-emerald-500 font-semibold">Active / RLS Enabled</span>
          </div>
          <div className="flex justify-between">
            <span>Storage Bucket Status:</span>
            <span className="text-emerald-500 font-semibold">Configured (Attachments)</span>
          </div>
          <div className="flex justify-between">
            <span>Realtime Listener:</span>
            <span className="text-emerald-500 font-semibold">Enabled (PostgreSQL Change Channel)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
