
export enum AppView {
  CHAT = 'CHAT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  VOICE = 'VOICE',
  SPEECH = 'SPEECH'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  status: 'processing' | 'completed' | 'failed';
  timestamp: Date;
}
