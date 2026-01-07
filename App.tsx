
import React, { useState } from 'react';
import { AppView } from './types';
import Sidebar from './components/Sidebar';
import ChatPanel from './components/ChatPanel';
import ImagePanel from './components/ImagePanel';
import VideoPanel from './components/VideoPanel';
import VoicePanel from './components/VoicePanel';
import SpeechPanel from './components/SpeechPanel';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CHAT);

  const renderView = () => {
    switch (currentView) {
      case AppView.CHAT:
        return <ChatPanel />;
      case AppView.IMAGE:
        return <ImagePanel />;
      case AppView.VIDEO:
        return <VideoPanel />;
      case AppView.VOICE:
        return <VoicePanel />;
      case AppView.SPEECH:
        return <SpeechPanel />;
      default:
        return <ChatPanel />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-950 overflow-hidden text-gray-100">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 relative flex flex-col h-full overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
