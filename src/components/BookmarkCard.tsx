import React, { useState } from 'react';
import { Trash2, Sparkles, Activity, ExternalLink, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { checkLink, enrichWithAi, AppSettings, LocalBookmark } from '../services/api';

interface BookmarkCardProps {
  bookmark: LocalBookmark;
  settings: AppSettings;
  onUpdate: (id: number, changes: Partial<LocalBookmark>) => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ bookmark, settings, onUpdate }) => {
  const [isCheckingLink, setIsCheckingLink] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);

  // Parse cover image URL
  const coverUrl = bookmark.cover?.startsWith('/') 
    ? `https://api.raindrop.io${bookmark.cover}` 
    : bookmark.cover || 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=400';

  const handleCheckLink = async () => {
    setIsCheckingLink(true);
    try {
      const res = await checkLink(bookmark.link);
      onUpdate(bookmark._id, { _isDead: !res.alive });
      if (!res.alive) {
        toast.error(`Dead link detected (${res.status})`);
      } else {
        toast.success('Link is active!');
      }
    } catch {
      onUpdate(bookmark._id, { _isDead: true });
      toast.error('Failed to check link');
    } finally {
      setIsCheckingLink(false);
    }
  };

  const handleEnrich = async () => {
    if (!settings.apiKey || !settings.modelId) {
      toast.error('Please configure AI settings first');
      return;
    }
    
    setIsEnriching(true);
    const loadingToast = toast.loading('Generating tags & description with AI...');
    try {
      const result = await enrichWithAi(bookmark.link, bookmark.title, bookmark.excerpt, settings);
      
      const mergedTags = Array.from(new Set([...(bookmark.tags || []), ...(result.tags || [])]));
      
      onUpdate(bookmark._id, {
        excerpt: result.description,
        tags: mergedTags,
        _status: 'modified'
      });
      
      toast.success('AI Enrichment complete! (Pending Sync)', { id: loadingToast });
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'AI enrichment failed', { id: loadingToast });
    } finally {
      setIsEnriching(false);
    }
  };

  const isDeleted = bookmark._status === 'deleted';
  const isModified = bookmark._status === 'modified';

  return (
    <div className={`group flex flex-col bg-white/5 rounded-2xl border ${bookmark._isDead ? 'border-red-500/30' : 'border-white/10'} ${isDeleted ? 'opacity-40 grayscale pointer-events-none' : 'hover:bg-white/10 backdrop-blur-sm'} overflow-hidden transition-all shadow-lg relative`}>
      {isModified && !isDeleted && (
        <div className="absolute top-2 right-2 z-20 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow text-xs">
          Modified
        </div>
      )}
      
      {isDeleted && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="bg-red-500/90 text-white font-bold px-4 py-2 rounded-lg backdrop-blur-md shadow-2xl flex items-center gap-2">
            <Trash2 size={16} /> Marked for Deletion
          </div>
        </div>
      )}

      <a href={bookmark.link} target="_blank" rel="noreferrer" className="block relative h-40 overflow-hidden bg-white/5 pointer-events-auto">
        <img 
          src={coverUrl} 
          alt={bookmark.title} 
          className={`w-full h-full object-cover transition-transform duration-500 ${!isDeleted && 'group-hover:scale-105'}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80&w=400';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between items-end p-4">
          {bookmark._isDead && (
            <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-lg shadow-red-500/20">
              Dead Link
            </div>
          )}
          {!bookmark._isDead && <div />}
          <span className="flex items-center gap-1 text-white text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
            <ExternalLink size={12} /> Open Link
          </span>
        </div>
      </a>

      <div className="flex-1 p-5 flex flex-col relative pointer-events-auto">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-medium text-white text-base leading-tight line-clamp-2">
            {bookmark.title}
          </h3>
          <div className="shrink-0 flex items-center bg-white/10 border border-white/5 rounded-full h-5 px-2 text-[10px] font-medium text-slate-300">
            {bookmark.domain}
          </div>
        </div>

        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 flex-1">
          {bookmark.excerpt || 'No description available.'}
        </p>

        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 mt-auto">
            {bookmark.tags.map(tag => (
              <span key={tag} className="inline-flex items-center text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-white/5">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/5 overflow-hidden">
          <div className="flex items-center gap-1">
            <button
              onClick={handleEnrich}
              disabled={isEnriching || isDeleted}
              title="Auto-enrich with AI"
              className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-white/10 rounded-md transition-all disabled:opacity-50"
            >
              <Sparkles size={16} className={isEnriching ? 'animate-pulse text-blue-400' : ''} />
            </button>
            <button
              onClick={handleCheckLink}
              disabled={isCheckingLink || isDeleted}
              title="Check dead link"
              className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-white/10 rounded-md transition-all disabled:opacity-50"
            >
              <Activity size={16} className={isCheckingLink ? 'animate-spin text-green-400' : ''} />
            </button>
            {isModified && (
              <button
                onClick={() => onUpdate(bookmark._id, { _status: 'unchanged' })}
                title="Undo changes"
                className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-white/10 rounded-md transition-all"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
          
          <button
            onClick={() => onUpdate(bookmark._id, { _status: 'deleted' })}
            disabled={isDeleted}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all disabled:opacity-50"
            title="Mark for deletion"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
