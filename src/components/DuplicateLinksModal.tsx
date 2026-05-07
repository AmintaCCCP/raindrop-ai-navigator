import React, { useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Trash2, ExternalLink } from 'lucide-react';
import { LocalBookmark } from '../services/api';

interface DuplicateLinksModalProps {
  bookmarks: LocalBookmark[];
  isOpen: boolean;
  onClose: () => void;
  onDeleteBookmark: (id: number) => void;
}

export const DuplicateLinksModal: React.FC<DuplicateLinksModalProps> = ({
  bookmarks,
  isOpen,
  onClose,
  onDeleteBookmark
}) => {
  const duplicates = useMemo(() => {
    const groups: Record<string, LocalBookmark[]> = {};
    bookmarks.forEach(b => {
      if (b._status === 'deleted') return;
      if (!groups[b.link]) {
        groups[b.link] = [];
      }
      groups[b.link].push(b);
    });
    
    return Object.entries(groups)
      .filter(([_, items]) => items.length > 1)
      .map(([link, items]) => ({ link, items }));
  }, [bookmarks]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col font-sans overflow-hidden">
          
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/50">
            <Dialog.Title className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Duplicate Links Detected
              <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full border border-rose-500/20">
                {duplicates.length} groups
              </span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {duplicates.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                <div className="bg-white/5 p-4 rounded-full mb-3">
                  <ExternalLink size={24} className="opacity-50" />
                </div>
                <p>No duplicate links found in the current view.</p>
              </div>
            ) : (
              duplicates.map((group, index) => (
                <div key={index} className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
                  <div className="bg-black/20 p-3 px-4 border-b border-white/5 flex items-center justify-between gap-4">
                    <a href={group.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-400 hover:underline truncate hover:text-blue-300">
                      {group.link}
                    </a>
                    <span className="shrink-0 text-xs text-slate-500 font-medium">
                      {group.items.length} copies
                    </span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {group.items.map((bk) => (
                      <div key={bk._id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-slate-200 truncate pr-4">{bk.title}</h4>
                          {bk.excerpt && <p className="text-xs text-slate-500 truncate mt-1">{bk.excerpt}</p>}
                        </div>
                        <button
                          onClick={() => onDeleteBookmark(bk._id)}
                          className="shrink-0 flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 rounded-lg transition-colors border border-rose-400/20"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {duplicates.length > 0 && (
             <div className="p-4 border-t border-white/10 bg-slate-800/50 text-xs text-slate-400">
               Note: Deleting a bookmark here will mark it for deletion. You must click "Sync changes" in the main view to apply it.
             </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
