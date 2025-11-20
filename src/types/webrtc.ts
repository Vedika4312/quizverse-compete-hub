export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left' | 'user-ready';
  payload: any;
  from: string;
  role: 'interviewer' | 'candidate';
}

export interface InterviewParticipant {
  user_id: string;
  role: 'interviewer' | 'candidate';
  joined_at: string;
  video_enabled: boolean;
  audio_enabled: boolean;
}

export interface ConnectionState {
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'failed';
  error?: string;
}

export interface MediaState {
  videoEnabled: boolean;
  audioEnabled: boolean;
  hasPermission: boolean;
}
