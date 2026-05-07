import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Trash2, ExternalLink } from 'lucide-react';
import { LocalBookmark } from '../services/api';

interface BrokenLinksModalProps {
  bookmarks: LocalBookmark[];
  isOpen: boolean;
  onClose: () => void;
  onDeleteBookmark: (id: number) => void;
}

export const BrokenLinksModal: React.FC<BrokenLinksModalProps> = ({
  bookmarks,
  isOpen,
  onClose,
  onDeleteBookmark
}) => {
  const brokenLinks = bookmarks.filter(b => b._status !== 'deleted' && b._isDead);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col font-sans overflow-hidden">
          
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800/50">
            <Dialog.Title className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Broken Links
              <span className="bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full border border-rose-500/20">
                {brokenLinks.length} links
              </span>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {brokenLinks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                <div className="bg-white/5 p-4 rounded-full mb-3">
                  <ExternalLink size={24} className="opacity-50" />
                </div>
                <p>No broken links found in the current view.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 border border-white/5 rounded-xl bg-slate-900/50 overflow-hidden">
                {brokenLinks.map((bk) => (
                  <div key={bk._id} className="p-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="min-w-0 flex-1">
                      <a href={bk.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-200 hover:text-blue-400 hover:underline truncate block">
                        {bk.title || bk.link}
                      </a>
                      <p className="text-xs text-rose-400/80 truncate mt-1">{bk.link}</p>
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
            )}
          </div>

          {brokenLinks.length > 0 && (
             <div className="p-4 border-t border-white/10 bg-slate-800/50 text-xs text-slate-400">
               Note: Deleting a bookmark here will mark it for deletion. You must click "Sync changes" to apply.
             </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
