
import React from 'react';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: AppView.CHAT, label: 'IntelliChat', icon: 'fa-message', color: 'text-blue-400' },
    { id: AppView.IMAGE, label: 'Visionary', icon: 'fa-image', color: 'text-purple-400' },
    { id: AppView.VIDEO, label: 'Motion', icon: 'fa-video', color: 'text-pink-400' },
    { id: AppView.VOICE, label: 'Live Core', icon: 'fa-microphone', color: 'text-emerald-400' },
    { id: AppView.SPEECH, label: 'Sonic TTS', icon: 'fa-waveform-lines', color: 'text-orange-400' },
  ];

  return (
    <div className="w-20 md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <i className="fa-solid fa-bolt text-white text-xl"></i>
        </div>
        <h1 className="hidden md:block text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          Aether
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentView === item.id 
                ? 'bg-gray-800 text-white shadow-inner' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
            }`}
          >
            <i className={`fa-solid ${item.icon} text-xl w-6 text-center ${currentView === item.id ? item.color : 'group-hover:text-gray-200'}`}></i>
            <span className="hidden md:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="hidden md:block p-4 bg-gray-800/50 rounded-2xl border border-gray-700/50 text-xs text-gray-500">
          <p className="mb-2">Powered by Gemini 3</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span>API Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
