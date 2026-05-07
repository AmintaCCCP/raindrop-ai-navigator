import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { BookmarkGrid } from './components/BookmarkGrid';
import { SettingsModal } from './components/SettingsModal';
import { AppSettings } from './services/api';
import { Droplet, Menu, Search, Key, ArrowRight } from 'lucide-react';

export default function App() {
  const requiredKey = import.meta.env.VITE_LOGIN_KEY;
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // If no key is set in envelope, always authenticated
    if (!requiredKey) return true;
    return localStorage.getItem('app_auth_key') === requiredKey;
  });
  
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [activeCollectionId, setActiveCollectionId] = useState<number | null>(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load settings from local storage
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('app_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { raindropApiKey: '', baseUrl: '', apiKey: '', modelId: 'gpt-3.5-turbo', language: 'English' };
  });

  useEffect(() => {
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }, [settings]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput === requiredKey) {
      localStorage.setItem('app_auth_key', requiredKey);
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
       setLoginError(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[#0f172a] text-slate-200 font-sans relative select-none items-center justify-center">
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[10%] right-[20%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
        </div>
        
        <form onSubmit={handleLogin} className="z-10 bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-sm flex flex-col gap-6 shadow-2xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white">
              <Droplet size={24} fill="currentColor" strokeWidth={0} />
            </div>
            <h1 className="text-xl font-bold text-white">Unlock Raindrop AI Nav</h1>
            <p className="text-sm text-slate-400">Please enter your access key to continue.</p>
          </div>
          
          <div>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                 type="password" 
                 value={loginInput}
                 onChange={e => setLoginInput(e.target.value)}
                 placeholder="Access Key" 
                 className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white placeholder:text-slate-500"
              />
            </div>
            {loginError && <p className="text-rose-400 text-xs mt-2 ml-1">Incorrect access key</p>}
          </div>
          
          <button type="submit" className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors">
            Access <ArrowRight size={16} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0f172a] text-slate-200 font-sans relative select-none">
      {/* Animated Mesh Background Overlay */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-teal-500 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="h-16 backdrop-blur-md bg-white/5 border-b border-white/10 flex items-center justify-between px-4 md:px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu size={20} />
          </button>
          <div className="w-8 h-8 rounded-lg bg-blue-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white hidden sm:flex">
            <Droplet size={18} fill="currentColor" strokeWidth={0} />
          </div>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight text-white whitespace-nowrap">
            Raindrop AI Nav
          </h1>
        </div>
        
        <div className="flex-1 max-w-md mx-4 relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
             type="text" 
             placeholder="Search bookmarks..." 
             className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all shadow-inner text-white"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <SettingsModal settings={settings} onSave={setSettings} />
      </header>

      {/* Mobile Search Bar */}
      <div className="sm:hidden p-3 border-b border-white/10 bg-white/5 backdrop-blur-sm z-10 shrink-0 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
             type="text" 
             placeholder="Search bookmarks..." 
             className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500/50 transition-all text-white"
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
          />
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden z-10 relative">
        <Sidebar activeCollectionId={activeCollectionId} onSelectCollection={setActiveCollectionId} settings={settings} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <BookmarkGrid collectionId={activeCollectionId} settings={settings} searchQuery={searchQuery} />
      </div>
    </div>
  );
}

