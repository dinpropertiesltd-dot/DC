
import React, { useState } from 'react';
import { geminiService } from '../services/gemini';

const ImagePanel: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<{url: string, prompt: string}[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aspectRatio, setAspectRatio] = useState('1:1');

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const url = await geminiService.generateImage(prompt, aspectRatio);
      setImages(prev => [{ url, prompt }, ...prev]);
    } catch (err) {
      console.error(err);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-image text-purple-400"></i>
          <h2 className="font-semibold text-lg">Visionary Studio</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-medium mb-4">Prompt the Imaginative</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic city with neon lights, digital rain, cyberpunk aesthetic..."
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 h-32 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-100 transition-all mb-4 resize-none"
            />
            
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-2">
                {['1:1', '4:3', '16:9', '9:16'].map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      aspectRatio === ratio 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                        : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
              >
                {isGenerating ? (
                  <><i className="fa-solid fa-spinner animate-spin"></i> Rendering...</>
                ) : (
                  <><i className="fa-solid fa-wand-magic-sparkles"></i> Generate</>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img, idx) => (
              <div key={idx} className="group relative bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all">
                <img src={img.url} alt={img.prompt} className="w-full h-auto object-cover aspect-square bg-gray-800" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                  <p className="text-xs text-gray-200 line-clamp-2">{img.prompt}</p>
                  <button 
                    onClick={() => window.open(img.url, '_blank')}
                    className="mt-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-[10px] py-1 px-3 rounded-full w-fit uppercase font-bold tracking-wider"
                  >
                    View Original
                  </button>
                </div>
              </div>
            ))}
            {images.length === 0 && !isGenerating && (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center mx-auto">
                  <i className="fa-solid fa-image-polaroid text-gray-700 text-3xl"></i>
                </div>
                <p className="text-gray-500 font-medium italic">Your generated masterpieces will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImagePanel;
