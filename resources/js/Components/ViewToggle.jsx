import { LayoutGrid, List } from 'lucide-react';

export function ViewToggle({ view, onViewChange }) {
  return (
    <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
      <button
        onClick={() => onViewChange('grid')}
        title="Grid View"
        className={`p-2 rounded-lg transition-all ${
          view === 'grid'
            ? 'bg-white text-indigo-600 shadow-sm border border-gray-100'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <LayoutGrid className="size-5" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        title="List View"
        className={`p-2 rounded-lg transition-all ${
          view === 'list'
            ? 'bg-white text-indigo-600 shadow-sm border border-gray-100'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <List className="size-5" />
      </button>
    </div>
  );
}
