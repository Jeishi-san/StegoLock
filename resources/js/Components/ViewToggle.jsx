import { LayoutGrid, List } from 'lucide-react';

export function ViewToggle({ view, onViewChange }) {
  return (
    <div className="flex bg-slate-100 dark:bg-cyber-surface/50 p-1.5 rounded-2xl border border-slate-200 dark:border-cyber-border/50 shadow-inner">
      <button
        onClick={() => onViewChange('grid')}
        title="Grid Manifest"
        className={`p-2.5 rounded-xl transition-all duration-300 ${
          view === 'grid'
            ? 'bg-cyber-accent text-white dark:text-cyber-void dark:shadow-glow-cyan'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <LayoutGrid className="size-5" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        title="Sequential List"
        className={`p-2.5 rounded-xl transition-all duration-300 ${
          view === 'list'
            ? 'bg-cyber-accent text-white dark:text-cyber-void dark:shadow-glow-cyan'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <List className="size-5" />
      </button>
    </div>
  );
}
