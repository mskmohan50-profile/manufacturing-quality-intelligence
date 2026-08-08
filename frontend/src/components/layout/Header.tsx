import { Sun, Moon, LogOut, User } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between h-16 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">Manufacturing Quality Intelligence</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Monitor, analyze, and optimize production quality</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2 pl-2 ml-1 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight">{user?.email}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Engineer</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
