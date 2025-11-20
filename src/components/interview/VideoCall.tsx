import { useEffect, useRef, useState } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useWebRTCSignaling } from '@/hooks/useWebRTCSignaling';
import { useInterviewPresence } from '@/hooks/useInterviewPresence';
import { ConnectionState } from '@/types/webrtc';

interface VideoCallProps {
  sessionId: string;
  userId: string;
  role: 'interviewer' | 'candidate';
  onEndCall: () => void;
}

const VideoCall = ({ sessionId, userId, role, onEndCall }: VideoCallProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'idle',
  });
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const { participants, updateMediaState } = useInterviewPresence(sessionId, userId, role);

  useEffect(() => {
    const initMedia = async () => {
      try {
        setConnectionState({ status: 'connecting' });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.onloadedmetadata = () => {
            localVideoRef.current?.play().catch(e => 
              console.error('Error playing local video:', e)
            );
          };
        }
        setPermissionError(null);
      } catch (error: any) {
        console.error('Error accessing media devices:', error);
        setPermissionError(
          error.name === 'NotAllowedError'
            ? 'Camera and microphone access denied. Please enable permissions.'
            : 'Failed to access camera or microphone.'
        );
        setConnectionState({ status: 'failed', error: error.message });
      }
    };

    initMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleRemoteStream = (stream: MediaStream) => {
    console.log('Setting remote stream with', stream.getTracks().length, 'tracks');
    setRemoteStream(stream);
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.onloadedmetadata = () => {
        console.log('Remote video metadata loaded, attempting play');
        remoteVideoRef.current?.play().catch(e => 
          console.error('Error playing remote video:', e)
        );
      };
    }
  };

  const handleConnectionStateChange = (state: RTCPeerConnectionState) => {
    console.log('Connection state changed:', state);
    if (state === 'connected') {
      setConnectionState({ status: 'connected' });
    } else if (state === 'failed') {
      setConnectionState({ status: 'failed', error: 'Connection failed' });
    } else if (state === 'disconnected') {
      setConnectionState({ status: 'disconnected' });
    } else if (state === 'connecting') {
      setConnectionState({ status: 'connecting' });
    }
  };

  const { peerConnection } = useWebRTCSignaling({
    sessionId,
    userId,
    role,
    localStream,
    onRemoteStream: handleRemoteStream,
    onConnectionStateChange: handleConnectionStateChange,
  });

  const retryConnection = () => {
    console.log('Retrying connection...');
    window.location.reload();
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        updateMediaState(videoTrack.enabled, audioEnabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        updateMediaState(videoEnabled, audioTrack.enabled);
      }
    }
  };

  const getConnectionBadge = () => {
    const statusConfig = {
      idle: { label: 'Idle', variant: 'secondary' as const },
      connecting: { label: 'Connecting...', variant: 'secondary' as const },
      connected: { label: 'Connected', variant: 'default' as const },
      disconnected: { label: 'Disconnected', variant: 'destructive' as const },
      failed: { label: 'Failed', variant: 'destructive' as const },
    };

    const config = statusConfig[connectionState.status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const otherParticipant = participants.find(p => p.user_id !== userId);
  const waitingForParticipant = participants.length < 2 && !remoteStream;

  return (
    <Card className="h-full bg-background border-border flex flex-col">
      <div className="flex-1 relative bg-muted/30">
        {permissionError && (
          <div className="absolute top-4 left-4 right-4 z-10">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{permissionError}</AlertDescription>
            </Alert>
          </div>
        )}
        
        {connectionState.status === 'failed' && (
          <div className="absolute top-16 left-4 right-4 z-10">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Connection failed. Please try again.</span>
                <Button onClick={retryConnection} variant="outline" size="sm">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Connection Status */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {getConnectionBadge()}
          {participants.length > 0 && (
            <Badge variant="outline">{participants.length} participant{participants.length !== 1 ? 's' : ''}</Badge>
          )}
        </div>

        {/* Remote Video (Large) */}
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          {waitingForParticipant ? (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
                <Video className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Waiting for participant...</h3>
                <p className="text-sm text-muted-foreground">
                  The {role === 'interviewer' ? 'candidate' : 'interviewer'} will join shortly
                </p>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {otherParticipant && (
                <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md">
                  <p className="text-sm font-medium text-foreground">
                    {otherParticipant.role === 'interviewer' ? 'Interviewer' : 'Candidate'}
                    {!otherParticipant.video_enabled && ' (Camera Off)'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Local Video (Small Picture-in-Picture) */}
        {localStream && (
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-muted rounded-lg overflow-hidden border-2 border-border shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
              You
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant={videoEnabled ? 'default' : 'destructive'}
            size="icon"
            onClick={toggleVideo}
            className="rounded-full h-12 w-12"
          >
            {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>

          <Button
            variant={audioEnabled ? 'default' : 'destructive'}
            size="icon"
            onClick={toggleAudio}
            className="rounded-full h-12 w-12"
          >
            {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            onClick={onEndCall}
            className="rounded-full h-12 w-12"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VideoCall;
