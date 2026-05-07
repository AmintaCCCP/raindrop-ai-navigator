import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Settings, X } from 'lucide-react';
import { AppSettings } from '../services/api';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave }) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<AppSettings>(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
          <Settings size={16} />
          <span>AI Settings</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-6 focus:outline-none">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold text-white">
              AI Provider Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>
          
          <Dialog.Description className="text-sm text-slate-400 mb-6">
            Configure an OpenAI-compatible API to generate tags and rich descriptions for your bookmarks.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Raindrop Test Token</label>
              <input
                type="password"
                placeholder="Required for fetching bookmarks..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-600 transition-colors"
                value={formData.raindropApiKey || ''}
                onChange={(e) => setFormData({ ...formData, raindropApiKey: e.target.value })}
                required
              />
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                Get this from <a href="https://app.raindrop.io/settings/integrations" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Raindrop Integrations</a> (Create new app -&gt; Test Token).
              </p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3">AI Auto-Enrichment</h4>
              <label className="block text-sm font-medium text-slate-300 mb-1">Base URL</label>
              <input
                type="text"
                placeholder="https://api.openai.com/v1"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-600 transition-colors"
                value={formData.baseUrl || ''}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              />
              <p className="text-[10px] text-slate-500 mt-1.5 uppercase tracking-wider">Leave empty for default OpenAI URL.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">API Key</label>
              <input
                type="password"
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-600 transition-colors"
                value={formData.apiKey || ''}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Model ID</label>
              <input
                type="text"
                placeholder="gpt-3.5-turbo"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-600 transition-colors"
                value={formData.modelId || ''}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Target Language</label>
              <input
                type="text"
                placeholder="e.g. English, 中文, 日本語"
                className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-lg focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-600 transition-colors"
                value={formData.language || ''}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className="px-4 py-2 text-sm font-medium text-slate-300 border border-white/10 hover:bg-white/5 rounded-lg transition-colors">
                  Cancel
                </button>
              </Dialog.Close>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-600/20 transition-all">
                Save Changes
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
