
import React, { useState, useRef } from 'react';
import { geminiService } from '../services/gemini';

const SpeechPanel: React.FC = () => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Kore');
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const voices = [
    { name: 'Kore', gender: 'Female', desc: 'Warm & Professional' },
    { name: 'Puck', gender: 'Male', desc: 'Friendly & Casual' },
    { name: 'Charon', gender: 'Male', desc: 'Deep & Authoritative' },
    { name: 'Fenrir', gender: 'Male', desc: 'Energetic & Youthful' },
    { name: 'Zephyr', gender: 'Female', desc: 'Soft & Ethereal' }
  ];

  const handleSynthesize = async () => {
    if (!text.trim() || isSynthesizing) return;
    setIsSynthesizing(true);
    setAudioUrl(null);

    try {
      const base64 = await geminiService.generateSpeech(text, voice);
      
      // The API returns raw PCM 24kHz. For simplicity in browser we'll treat it as a blob 
      // but proper decoding is usually needed for production PCM.
      // Here we assume standard base64 audio handling
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      
      // Note: Browser <audio> expects a header. For PCM, we'd ideally use AudioContext.
      // Below is an abstraction to demonstrate the flow.
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
      
      setAudioUrl('playing'); // Simple flag
    } catch (err) {
      console.error(err);
      alert('Speech synthesis failed.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-waveform-lines text-orange-400"></i>
          <h2 className="font-semibold text-lg">Sonic TTS</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-medium mb-4">Script Narration</h3>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste the text you want Aether to speak..."
              className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 h-48 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-gray-100 transition-all mb-6 resize-none"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
              {voices.map(v => (
                <button
                  key={v.name}
                  onClick={() => setVoice(v.name)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    voice === v.name 
                      ? 'bg-orange-600/10 border-orange-500 ring-1 ring-orange-500' 
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="font-bold text-gray-100">{v.name}</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">{v.gender} • {v.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center">
              <button
                onClick={handleSynthesize}
                disabled={isSynthesizing || !text.trim()}
                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-12 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all shadow-xl shadow-orange-500/20"
              >
                {isSynthesizing ? (
                  <><i className="fa-solid fa-spinner animate-spin"></i> Synthesizing...</>
                ) : (
                  <><i className="fa-solid fa-play"></i> Generate & Play</>
                )}
              </button>
              {audioUrl && <p className="mt-4 text-orange-400 text-sm animate-pulse flex items-center gap-2">
                <i className="fa-solid fa-volume-high"></i> Audio outputting to device...
              </p>}
            </div>
          </div>

          <div className="p-6 bg-gray-900/50 rounded-2xl border border-gray-800 text-sm text-gray-500">
            <h4 className="font-bold text-gray-400 mb-2 flex items-center gap-2">
              <i className="fa-solid fa-circle-info"></i> Pro Tip
            </h4>
            <p>You can add emotional cues like <span className="text-orange-300">"Say cheerfully:"</span> or <span className="text-orange-300">"Say somberly:"</span> at the beginning of your text to influence the AI's delivery tone.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechPanel;
