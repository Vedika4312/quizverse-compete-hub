import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

interface JitsiVideoCallProps {
  sessionId: string;
  userId: string;
  role: "interviewer" | "candidate";
  onEndCall: () => void;
}

const JitsiVideoCall = ({ sessionId, role, onEndCall }: JitsiVideoCallProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to load external Jitsi script once
  const loadJitsiScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        console.log("[Jitsi] external_api already loaded");
        resolve();
        return;
      }

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-jitsi="external_api"]'
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve());
        existingScript.addEventListener("error", () => reject(new Error("Failed to load Jitsi script")));
        return;
      }

      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.dataset.jitsi = "external_api";

      script.onload = () => {
        console.log("[Jitsi] external_api loaded");
        resolve();
      };
      script.onerror = () => {
        reject(new Error("Failed to load Jitsi external_api.js"));
      };

      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    let isMounted = true;

    const initJitsi = async () => {
      try {
        if (!sessionId || !containerRef.current) {
          setError("Invalid interview session.");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        await loadJitsiScript();

        if (!window.JitsiMeetExternalAPI) {
          throw new Error("JitsiMeetExternalAPI not available on window.");
        }

        const domain = "meet.jit.si";
        const roomName = `interview-${sessionId}`;

        const options = {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: {
            displayName: role === "interviewer" ? "Interviewer" : "Candidate",
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
          },
        };

        console.log("[Jitsi] Creating meeting", { domain, roomName });

        const api = new window.JitsiMeetExternalAPI(domain, options);
        apiRef.current = api;

        api.addListener("videoConferenceJoined", () => {
          console.log("[Jitsi] Joined conference", roomName);
          if (isMounted) setLoading(false);
        });

        api.addListener("videoConferenceLeft", () => {
          console.log("[Jitsi] Left conference", roomName);
          onEndCall();
        });

        api.addListener("errorOccurred", (e: any) => {
          console.error("[Jitsi] Error", e);
          if (isMounted) {
            setError("An error occurred in the video meeting.");
            setLoading(false);
          }
        });
      } catch (err: any) {
        console.error("[Jitsi] init error", err);
        if (isMounted) {
          setError(err?.message || "Failed to start video meeting.");
          setLoading(false);
        }
      }
    };

    initJitsi();

    return () => {
      isMounted = false;
      if (apiRef.current) {
        console.log("[Jitsi] Disposing meeting");
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [sessionId, role, onEndCall]);

  return (
    <Card className="h-full bg-background border-border relative overflow-hidden">
      {loading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Connecting to video meeting…</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 p-4">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Jitsi will mount its iframe here */}
      <div ref={containerRef} className="w-full h-full" />
    </Card>
  );
};

export default JitsiVideoCall;
