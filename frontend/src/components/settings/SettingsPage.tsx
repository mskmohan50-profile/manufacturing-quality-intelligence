import { Keyboard, Info, Shield, Zap } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function SettingsPage() {
  const shortcuts = [
    { keys: ['D'], description: 'Go to Dashboard' },
    { keys: ['U'], description: 'Go to Upload' },
    { keys: ['R'], description: 'Go to Records' },
    { keys: ['E'], description: 'Go to Reports' },
    { keys: ['A'], description: 'Go to Audit Logs' },
    { keys: ['/'], description: 'Focus global search' },
    { keys: ['Ctrl', 'K'], description: 'Quick navigate (command palette)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Settings</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Configure your workspace and view application information.</p>
      </div>

      <Card>
        <CardHeader title="Keyboard Shortcuts" subtitle="Speed up your workflow" action={<Keyboard className="w-4 h-4 text-slate-400" />} />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shortcuts.map((s) => (
              <div key={s.description} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-slate-600 dark:text-slate-300">{s.description}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k, i) => (
                    <kbd key={i} className="px-2 py-1 text-xs font-medium rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 shadow-sm">
                      {k}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mb-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Security</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Row-level security enabled. All data is isolated per user account.</p>
        </Card>
        <Card className="p-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Performance</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Indexed queries and paginated loading for fast response on large datasets.</p>
        </Card>
        <Card className="p-5">
          <div className="w-10 h-10 rounded-lg bg-violet-50 dark:bg-violet-950/50 flex items-center justify-center mb-3">
            <Info className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Multi-Tenant Ready</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Architecture supports organization-level isolation and RBAC. See ARCHITECTURE.md.</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="About" subtitle="Application information" />
        <CardBody>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Application</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">Manufacturing Quality Intelligence</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Version</span>
              <Badge variant="info">1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Tech Stack</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">React + TypeScript + Tailwind + Express + MongoDB</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
