
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

const VoicePanel: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{text: string, type: 'user' | 'model'}[]>([]);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startSession = async () => {
    if (isActive || isConnecting) return;
    setIsConnecting(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are Aether Live, a high-performance voice assistant. Keep responses natural, brief, and helpful.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              const pcmData = {
                data: btoa(String.fromCharCode(...new Uint8Array(int16.buffer))),
                mimeType: 'audio/pcm;rate=16000'
              };
              
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmData }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setIsActive(true);
            setIsConnecting(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setTranscriptions(prev => [...prev, { text: message.serverContent!.inputTranscription!.text, type: 'user' }]);
            }
            if (message.serverContent?.outputTranscription) {
              setTranscriptions(prev => [...prev, { text: message.serverContent!.outputTranscription!.text, type: 'model' }]);
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && audioContextRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
              const buffer = await decodeAudioData(decode(audioData), audioContextRef.current, 24000, 1);
              const source = audioContextRef.current.createBufferSource();
              source.buffer = buffer;
              source.connect(audioContextRef.current.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Live API Error:', e),
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-microphone text-emerald-400"></i>
          <h2 className="font-semibold text-lg">Live Core</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-12">
          <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${
            isActive 
              ? 'bg-emerald-500/10 shadow-[0_0_80px_rgba(16,185,129,0.3)]' 
              : 'bg-gray-900 shadow-none'
          }`}>
            <div className={`absolute inset-0 rounded-full border-2 border-emerald-500/30 ${isActive ? 'animate-ping' : 'opacity-0'}`}></div>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
              isActive ? 'bg-emerald-500 scale-110' : 'bg-gray-800 scale-100'
            }`}>
              <i className={`fa-solid ${isActive ? 'fa-microphone' : 'fa-microphone-slash'} text-white text-4xl`}></i>
            </div>
          </div>
        </div>

        <div className="space-y-4 max-w-md">
          <h3 className="text-2xl font-bold">{isActive ? 'I\'m Listening...' : 'Enter Voice Mode'}</h3>
          <p className="text-gray-500">
            {isActive 
              ? 'Speak naturally. I will respond in real-time with ultra-low latency.' 
              : 'Start a high-performance audio conversation powered by Gemini Flash Native Audio.'}
          </p>
          
          <div className="pt-8">
            <button
              onClick={isActive ? stopSession : startSession}
              disabled={isConnecting}
              className={`px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl flex items-center gap-3 mx-auto ${
                isActive 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              }`}
            >
              {isConnecting ? (
                <><i className="fa-solid fa-spinner animate-spin"></i> Linking...</>
              ) : isActive ? (
                <><i className="fa-solid fa-phone-slash"></i> Terminate Call</>
              ) : (
                <><i className="fa-solid fa-phone"></i> Initialize Link</>
              )}
            </button>
          </div>
        </div>

        <div className="mt-12 w-full max-w-2xl bg-gray-900/50 border border-gray-800 rounded-2xl p-4 h-48 overflow-y-auto text-left">
          <p className="text-[10px] uppercase font-bold text-gray-600 mb-2 tracking-widest">Real-time Transcript</p>
          <div className="space-y-2">
            {transcriptions.length === 0 && <p className="text-gray-700 italic text-sm">Transcription will appear as you speak...</p>}
            {transcriptions.map((t, i) => (
              <div key={i} className="text-sm">
                <span className={`font-bold mr-2 uppercase text-[10px] ${t.type === 'user' ? 'text-blue-500' : 'text-emerald-500'}`}>
                  {t.type === 'user' ? 'You' : 'Aether'}
                </span>
                <span className="text-gray-400">{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoicePanel;
