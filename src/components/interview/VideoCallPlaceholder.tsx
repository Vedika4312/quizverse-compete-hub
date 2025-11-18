import { Video, VideoOff, Mic, MicOff, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const VideoCallPlaceholder = () => {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  return (
    <Card className="h-full bg-muted/30 border-border flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted via-background to-muted">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <Video className="w-12 h-12 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Video Call</h3>
            <p className="text-sm text-muted-foreground">Camera feed will appear here</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-3">
          <Button
            variant={videoEnabled ? "default" : "destructive"}
            size="icon"
            onClick={() => setVideoEnabled(!videoEnabled)}
            className="rounded-full"
          >
            {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
          
          <Button
            variant={audioEnabled ? "default" : "destructive"}
            size="icon"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="rounded-full"
          >
            {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="destructive"
            size="icon"
            className="rounded-full"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default VideoCallPlaceholder;
