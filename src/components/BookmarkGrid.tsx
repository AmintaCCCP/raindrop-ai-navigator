import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkCard } from './BookmarkCard';
import { DuplicateLinksModal } from './DuplicateLinksModal';
import { BrokenLinksModal } from './BrokenLinksModal';
import { getBookmarks, AppSettings, LocalBookmark, updateBookmark, deleteBookmark, checkLink, enrichWithAi } from '../services/api';
import { LayoutGrid, AlertCircle, CloudUpload, RefreshCw, Zap, Link as LinkIcon, Copy, XOctagon, Link2Off } from 'lucide-react';
import { toast } from 'sonner';

interface BookmarkGridProps {
  collectionId: number | null;
  settings: AppSettings;
  searchQuery?: string;
}

export const BookmarkGrid: React.FC<BookmarkGridProps> = ({ collectionId, settings, searchQuery = '' }) => {
  const queryClient = useQueryClient();
  const targetId = collectionId === null ? 0 : collectionId;
  
  const { data: remoteBookmarks, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['bookmarks', targetId, settings.raindropApiKey],
    queryFn: () => getBookmarks(targetId, settings),
    retry: 1,
    enabled: !!settings.raindropApiKey && targetId !== null,
  });

  const [localBookmarks, setLocalBookmarks] = useState<LocalBookmark[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isBrokenLinksModalOpen, setIsBrokenLinksModalOpen] = useState(false);
  const cancelProcessingRef = React.useRef(false);

  useEffect(() => {
    if (remoteBookmarks) {
      setLocalBookmarks(remoteBookmarks.map(b => ({ ...b, _status: 'unchanged' })));
    }
  }, [remoteBookmarks]);

  const updateLocalBookmark = (id: number, changes: Partial<LocalBookmark>) => {
    setLocalBookmarks(prev => prev.map(b => b._id === id ? { ...b, ...changes } : b));
  };

  const handleSyncToRaindrop = async () => {
    const dirtyBookmarks = localBookmarks.filter(b => b._status === 'modified' || b._status === 'deleted');
    if (dirtyBookmarks.length === 0) {
      toast.info('Everything is up to date.');
      return;
    }

    setIsSyncing(true);
    let successCount = 0;
    try {
      for (const b of dirtyBookmarks) {
        if (b._status === 'deleted') {
          await deleteBookmark(b._id, settings);
        } else if (b._status === 'modified') {
          await updateBookmark(b._id, { excerpt: b.excerpt, tags: b.tags }, settings);
        }
        successCount++;
      }
      toast.success(`Successfully synced ${successCount} changes!`);
      // Refetch to cleanly reset everything
      refetch();
    } catch (error) {
      toast.error(`Sync failed after ${successCount} items.`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBatchEnrich = async () => {
    const targets = localBookmarks.filter(b => b._status !== 'deleted' && !b.excerpt); // enrich ones w/o desc
    if (targets.length === 0) {
      toast.info('No bookmarks to enrich (all have descriptions or are deleted).');
      return;
    }
    
    if (!settings.apiKey) {
      toast.error('AI API Key is missing.');
      return;
    }
    
    setIsBatchProcessing(true);
    cancelProcessingRef.current = false;
    let enrichedCount = 0;
    const toastId = toast.loading(`Enriching 0 of ${targets.length}...`);
    
    try {
      for (let i = 0; i < targets.length; i++) {
        if (cancelProcessingRef.current) {
          toast.info('AI Analysis stopped.', { id: toastId });
          break;
        }
        const b = targets[i];
        try {
          toast.loading(`Enriching ${i+1} of ${targets.length}...`, { id: toastId });
          const result = await enrichWithAi(b.link, b.title, b.excerpt, settings);
          const mergedTags = Array.from(new Set([...(b.tags || []), ...(result.tags || [])]));
          updateLocalBookmark(b._id, {
            excerpt: result.description,
            tags: mergedTags,
            _status: 'modified'
          });
          enrichedCount++;
        } catch (e) {
          console.error(`Failed to enrich ${b.title}`, e);
        }
      }
      if (!cancelProcessingRef.current) {
        toast.success(`Enriched ${enrichedCount} bookmarks! Click 'Sync' to save them.`, { id: toastId });
      }
    } finally {
      setIsBatchProcessing(false);
      cancelProcessingRef.current = false;
    }
  };

  const handleBatchCheckLinks = async () => {
    const targets = localBookmarks.filter(b => b._status !== 'deleted');
    if (targets.length === 0) return;

    setIsBatchProcessing(true);
    cancelProcessingRef.current = false;
    let deadCount = 0;
    const toastId = toast.loading(`Checking links (0 / ${targets.length})...`);
    
    try {
      for (let i = 0; i < targets.length; i++) {
        if (cancelProcessingRef.current) {
          toast.info('Link check stopped.', { id: toastId });
          break;
        }
        const b = targets[i];
        toast.loading(`Checking links (${i+1} / ${targets.length})...`, { id: toastId });
        try {
          const res = await checkLink(b.link);
          if (!res.alive) deadCount++;
          updateLocalBookmark(b._id, { _isDead: !res.alive });
        } catch {
          deadCount++;
          updateLocalBookmark(b._id, { _isDead: true });
        }
      }
      if (!cancelProcessingRef.current) {
        toast.success(`Link check complete. Found ${deadCount} dead links.`, { id: toastId });
      }
      if (deadCount > 0) {
        setIsBrokenLinksModalOpen(true);
      }
    } finally {
      setIsBatchProcessing(false);
      cancelProcessingRef.current = false;
    }
  };

  if (!settings.raindropApiKey) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 h-[calc(100vh-4rem)]">
        <div className="bg-yellow-500/10 text-yellow-400 p-4 rounded-xl border border-yellow-500/20 flex flex-col items-center gap-3 backdrop-blur-md max-w-sm text-center">
          <AlertCircle size={24} />
          <div>
            <h3 className="font-bold mb-1">Configuration Required</h3>
            <p className="text-sm opacity-80">Please open Settings (top right) and provide your Raindrop Test Token to view your bookmarks.</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 z-10 w-full h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center text-slate-400">
          <LayoutGrid size={32} className="mb-4 animate-pulse text-white/30" />
          <p className="text-sm font-medium text-slate-300">Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 h-[calc(100vh-4rem)]">
        <div className="bg-red-500/10 text-red-400 p-4 rounded-xl border border-red-500/20 flex items-center gap-3 backdrop-blur-md">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">Failed to load bookmarks. Invalid key or network error.</span>
        </div>
      </div>
    );
  }

  const dirtyCount = localBookmarks.filter(b => b._status === 'modified' || b._status === 'deleted').length;

  const filteredBookmarks = localBookmarks.filter(b => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    return b.title?.toLowerCase().includes(lowerQ) 
        || b.excerpt?.toLowerCase().includes(lowerQ)
        || b.tags?.some(tag => tag.toLowerCase().includes(lowerQ));
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] z-10 overflow-hidden">
      
      {/* Batch Operations Header */}
      <div className="shrink-0 border-b border-white/5 bg-slate-900/40 backdrop-blur-sm p-4 flex flex-col md:flex-row md:flex-wrap items-center justify-between gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
           <button 
             onClick={() => {
               const promise = Promise.all([
                 refetch(),
                 queryClient.invalidateQueries({ queryKey: ['collections'] })
               ]).then(([res]) => {
                 if (res.isError) throw new Error('Failed to pull');
                 if (res.data) setLocalBookmarks(res.data.map(b => ({ ...b, _status: 'unchanged' })));
                 return res.data;
               });
               toast.promise(promise, {
                 loading: 'Pulling from Raindrop...',
                 success: (data) => `Loaded ${data?.length || 0} bookmarks`,
                 error: 'Failed to pull from Raindrop'
               });
             }}
             disabled={isFetching}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 rounded-lg transition disabled:opacity-50"
           >
             <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Pull
           </button>
           <button
             onClick={handleSyncToRaindrop} 
             disabled={dirtyCount === 0 || isSyncing}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white rounded-lg transition relative overflow-hidden"
           >
             <CloudUpload size={14} />
             Sync changes {dirtyCount > 0 && <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] ml-1 leading-none">{dirtyCount}</span>}
           </button>
        </div>

        <div className="flex items-center justify-between w-full md:w-auto gap-2">
            {!isBatchProcessing ? (
              <>
               <button 
                 onClick={handleBatchEnrich}
                 disabled={isBatchProcessing}
                 className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 disabled:opacity-50 border border-amber-400/20 rounded-lg transition whitespace-nowrap"
                 title="Enrich all bookmarks missing descriptions"
               >
                 <Zap size={14} /> Batch Enrich
               </button>
               <button 
                 onClick={handleBatchCheckLinks}
                 disabled={isBatchProcessing}
                 className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 disabled:opacity-50 border border-emerald-400/20 rounded-lg transition whitespace-nowrap"
               >
                 <LinkIcon size={14} /> Batch Check
               </button>
              </>
            ) : (
                <button 
                   onClick={() => { cancelProcessingRef.current = true; }}
                   className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 border border-rose-400/20 rounded-lg transition whitespace-nowrap"
                >
                  <XOctagon size={14} className="animate-pulse" /> Stop Processing
                </button>
            )}
           <button 
             onClick={() => setIsDuplicateModalOpen(true)}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-purple-400 bg-purple-400/10 hover:bg-purple-400/20 disabled:opacity-50 border border-purple-400/20 rounded-lg transition whitespace-nowrap"
           >
             <Copy size={14} /> Duplicates
           </button>
           <button 
             onClick={() => setIsBrokenLinksModalOpen(true)}
             className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 disabled:opacity-50 border border-rose-400/20 rounded-lg transition whitespace-nowrap"
           >
             <Link2Off size={14} /> Broken
           </button>
        </div>
      </div>

      {filteredBookmarks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <LayoutGrid size={48} className="mb-4 opacity-20 text-white" />
          <p className="text-base font-medium text-slate-300">No bookmarks found.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredBookmarks.map((bookmark) => (
              <BookmarkCard 
                key={bookmark._id} 
                bookmark={bookmark} 
                settings={settings} 
                onUpdate={updateLocalBookmark}
              />
            ))}
          </div>
        </div>
      )}

      <DuplicateLinksModal
        bookmarks={localBookmarks}
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        onDeleteBookmark={(id) => updateLocalBookmark(id, { _status: 'deleted' })}
      />
      <BrokenLinksModal
        bookmarks={localBookmarks}
        isOpen={isBrokenLinksModalOpen}
        onClose={() => setIsBrokenLinksModalOpen(false)}
        onDeleteBookmark={(id) => updateLocalBookmark(id, { _status: 'deleted' })}
      />
    </div>
  );
};
