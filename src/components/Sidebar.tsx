import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Folder, Layers, AlertCircle } from 'lucide-react';
import { getCollections, AppSettings } from '../services/api';

interface SidebarProps {
  activeCollectionId: number | null;
  onSelectCollection: (id: number | null) => void;
  settings: AppSettings;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeCollectionId, onSelectCollection, settings, isOpen, setIsOpen }) => {
  const { data: collections, isLoading, isError } = useQuery({
    queryKey: ['collections', settings.raindropApiKey],
    queryFn: () => getCollections(settings),
    retry: false,
    enabled: !!settings.raindropApiKey,
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative w-64 h-[calc(100vh-4rem)] overflow-y-auto backdrop-blur-xl bg-slate-900/90 md:bg-white/5 border-r border-white/10 flex flex-col p-4 z-30 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="mb-2">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">My Collections</h2>
          
          <button
            onClick={() => {
              onSelectCollection(0);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              activeCollectionId === 0 || activeCollectionId === null
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
          <div className="flex items-center gap-3">
            <Layers size={18} className="text-blue-400" />
            <span className="font-medium">All Bookmarks</span>
          </div>
        </button>
      </div>

      <div className="space-y-1">
        {isLoading && (
          <div className="px-3 py-2 text-sm text-slate-400 animate-pulse">Loading collections...</div>
        )}
        
        {isError && (
          <div className="px-3 py-2 text-sm text-red-400 flex items-center gap-2">
            <AlertCircle size={14} />
            Failed to load (Check Key)
          </div>
        )}

        {collections?.filter(c => c.title !== 'Favorites Bar').map((collection) => (
          <button
            key={collection._id}
            onClick={() => {
              onSelectCollection(collection._id);
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              activeCollectionId === collection._id
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <Folder size={18} className="text-teal-400" />
              <span className="font-medium truncate">{collection.title}</span>
            </div>
            <span className="text-xs text-secondary-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/5">{collection.count}</span>
          </button>
        ))}
      </div>
    </aside>
    </>
  );
};
