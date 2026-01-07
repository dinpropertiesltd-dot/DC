
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/gemini';

const VideoPanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [videos, setVideos] = useState<{id: string, url?: string, prompt: string, status: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    // Check for user-selected API key if needed for Veo
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const has = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(has);
      } else {
        setHasApiKey(true); // Assume process.env.API_KEY is available in other environments
      }
    };
    checkKey();
  }, []);

  const openKeySelection = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const pollOperation = async (id: string, operation: any) => {
    try {
      let op = operation;
      while (!op.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        op = await geminiService.getOperationStatus(op);
      }
      
      const downloadLink = op.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        setVideos(prev => prev.map(v => v.id === id ? { ...v, url, status: 'completed' } : v));
      }
    } catch (err) {
      console.error(err);
      setVideos(prev => prev.map(v => v.id === id ? { ...v, status: 'failed' } : v));
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    const videoId = Date.now().toString();
    
    setVideos(prev => [{ id: videoId, prompt, status: 'processing' }, ...prev]);
    
    try {
      const operation = await geminiService.generateVideo(prompt);
      pollOperation(videoId, operation);
    } catch (err) {
      console.error(err);
      setVideos(prev => prev.map(v => v.id === videoId ? { ...v, status: 'failed' } : v));
    } finally {
      setIsGenerating(false);
      setPrompt('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-video text-pink-400"></i>
          <h2 className="font-semibold text-lg">Motion Studio</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {!hasApiKey && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 text-center">
              <p className="text-yellow-400 mb-4">A paid API key is required for Veo Video Generation.</p>
              <button 
                onClick={openKeySelection}
                className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-xl font-bold transition-all"
              >
                Select API Key
              </button>
              <p className="mt-2 text-[10px] text-gray-500 underline cursor-pointer" onClick={() => window.open('https://ai.google.dev/gemini-api/docs/billing', '_blank')}>Learn more about billing</p>
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-medium mb-4">Direct the Scene</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A panoramic shot of a mountain range at sunset with clouds rolling over peaks..."
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 h-24 focus:outline-none focus:ring-2 focus:ring-pink-500/50 text-gray-100 transition-all mb-4 resize-none"
            />
            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || !hasApiKey}
                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-pink-500/20"
              >
                {isGenerating ? (
                  <><i className="fa-solid fa-spinner animate-spin"></i> Initializing...</>
                ) : (
                  <><i className="fa-solid fa-clapperboard"></i> Render Video</>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {videos.map((vid) => (
              <div key={vid.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-sm text-gray-300">Prompt:</h4>
                    <p className="text-sm text-gray-500 italic">"{vid.prompt}"</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    vid.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                    vid.status === 'processing' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {vid.status}
                  </div>
                </div>

                {vid.status === 'completed' && vid.url ? (
                  <video src={vid.url} controls className="w-full rounded-xl border border-gray-800 shadow-lg" />
                ) : vid.status === 'processing' ? (
                  <div className="aspect-video bg-gray-800/50 rounded-xl flex flex-col items-center justify-center border border-dashed border-gray-700">
                    <i className="fa-solid fa-film text-gray-700 text-4xl mb-4"></i>
                    <p className="text-gray-500 text-sm">Processing cinematic frame-by-frame...</p>
                    <p className="text-[10px] text-gray-600 mt-2">(This usually takes 2-3 minutes)</p>
                  </div>
                ) : vid.status === 'failed' ? (
                  <div className="aspect-video bg-red-900/10 rounded-xl flex flex-col items-center justify-center border border-red-900/20">
                    <i className="fa-solid fa-triangle-exclamation text-red-700 text-3xl mb-2"></i>
                    <p className="text-red-500 text-sm">Rendering failed. Please try a different prompt.</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPanel;
