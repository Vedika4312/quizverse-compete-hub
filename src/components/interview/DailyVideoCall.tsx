import { useEffect, useState, useRef } from "react";
import { DailyProvider, useDaily, useParticipantIds, useParticipant } from "@daily-co/daily-react";
import DailyIframe from "@daily-co/daily-js";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

interface DailyVideoCallProps {
  sessionId: string;
  userId: string;
  role: "interviewer" | "candidate";
  onEndCall: () => void;
}

const DailyVideoCall = ({ sessionId, userId, role, onEndCall }: DailyVideoCallProps) => {
  const [callObject, setCallObject] = useState<any>(null);
  const [roomUrl, setRoomUrl] = useState<string | null>(null);

  useEffect(() => {
    // Create room URL using Daily's demo domain
    // For production, replace with your Daily subdomain
    const room = `https://lovable.daily.co/interview-${sessionId}`;
    setRoomUrl(room);

    // Create Daily call object
    const daily = DailyIframe.createCallObject();
    setCallObject(daily);

    return () => {
      if (daily) {
        daily.destroy();
      }
    };
  }, [sessionId]);

  if (!callObject || !roomUrl) {
    return (
      <Card className="h-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <DailyProvider callObject={callObject}>
      <VideoCallUI
        roomUrl={roomUrl}
        onEndCall={onEndCall}
        role={role}
      />
    </DailyProvider>
  );
};

interface VideoCallUIProps {
  roomUrl: string;
  onEndCall: () => void;
  role: "interviewer" | "candidate";
}

const VideoCallUI = ({ roomUrl, onEndCall, role }: VideoCallUIProps) => {
  const callObject = useDaily();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const participantIds = useParticipantIds();

  useEffect(() => {
    if (!callObject || !roomUrl) return;

    const joinCall = async () => {
      try {
        await callObject.join({
          url: roomUrl,
          userName: role === "interviewer" ? "Interviewer" : "Candidate",
        });
        setLoading(false);
      } catch (err: any) {
        console.error("[Daily] Join error:", err);
        setError(err?.message || "Failed to join call");
        setLoading(false);
      }
    };

    joinCall();

    // Listen for call events
    const handleLeftMeeting = () => {
      console.log("[Daily] Left meeting");
      onEndCall();
    };

    const handleError = (e: any) => {
      console.error("[Daily] Call error:", e);
      setError("Call error occurred");
    };

    callObject.on("left-meeting", handleLeftMeeting);
    callObject.on("error", handleError);

    return () => {
      callObject.off("left-meeting", handleLeftMeeting);
      callObject.off("error", handleError);
      if (callObject) {
        callObject.leave().catch(console.error);
      }
    };
  }, [callObject, roomUrl, role, onEndCall]);

  if (loading) {
    return (
      <Card className="h-full flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Connecting to interview...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-black relative overflow-hidden">
      <div className="grid grid-cols-2 gap-2 h-full p-4">
        {participantIds.length === 0 && (
          <div className="col-span-2 flex items-center justify-center text-white">
            <p>Waiting for participants to join...</p>
          </div>
        )}
        {participantIds.map((id) => (
          <ParticipantTile key={id} participantId={id} />
        ))}
      </div>
    </Card>
  );
};

interface ParticipantTileProps {
  participantId: string;
}

const ParticipantTile = ({ participantId }: ParticipantTileProps) => {
  const participant = useParticipant(participantId);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (participant?.videoTrack && videoRef.current) {
      const stream = new MediaStream([participant.videoTrack]);
      videoRef.current.srcObject = stream;
    }
  }, [participant?.videoTrack]);

  if (!participant) return null;

  return (
    <div className="relative bg-gray-900 rounded overflow-hidden aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.local}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-sm">
        {participant.user_name || "Participant"}
        {participant.local && " (You)"}
      </div>
      {!participant.video && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-white text-2xl">
            {participant.user_name?.[0]?.toUpperCase() || "?"}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyVideoCall;
