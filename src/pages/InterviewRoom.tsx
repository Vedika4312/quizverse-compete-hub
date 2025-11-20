import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import CodeCompiler from "@/components/CodeCompiler";
import VideoCall from "@/components/interview/VideoCall";
import InterviewControls from "@/components/interview/InterviewControls";
import InterviewNotes from "@/components/interview/InterviewNotes";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { validateInterviewAccess } from "@/utils/interviewRoomAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";

const InterviewRoom = () => {
  const { sessionId } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'interviewer' | 'candidate' | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    const validateAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user || !sessionId) {
          setAccessError('Authentication required');
          setIsValidating(false);
          return;
        }

        setUserId(user.id);

        const validation = await validateInterviewAccess(sessionId, user.id);
        
        if (!validation.hasAccess) {
          setAccessError(validation.error || 'Access denied');
          setIsValidating(false);
          return;
        }

        setUserRole(validation.role || null);
        
        // Update interview status to in_progress
        await supabase
          .from('interview_sessions')
          .update({ status: 'in_progress' })
          .eq('id', sessionId);

        setIsValidating(false);
      } catch (error) {
        console.error('Error validating access:', error);
        setAccessError('Failed to validate access');
        setIsValidating(false);
      }
    };

    validateAccess();
  }, [sessionId]);

  const handleEndInterview = async () => {
    if (!sessionId) return;

    try {
      // Update interview status to completed
      await supabase
        .from('interview_sessions')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      toast({
        title: "Interview Ended",
        description: "The interview session has been completed.",
      });

      navigate('/interviews');
    } catch (error) {
      console.error('Error ending interview:', error);
      toast({
        title: "Error",
        description: "Failed to end interview session.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProgress = () => {
    toast({
      title: "Progress Saved",
      description: "Your interview progress has been saved.",
    });
  };

  const handleNotesChange = async (notes: string) => {
    if (!sessionId) return;
    
    try {
      await supabase
        .from('interview_sessions')
        .update({ notes })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error saving notes:', error);
    }
  };

  if (isValidating) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Validating access...</p>
        </div>
      </div>
    );
  }

  if (accessError || !userId || !userRole) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            {accessError || 'Access denied'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <InterviewControls
        duration={60}
        onEnd={handleEndInterview}
        onSave={handleSaveProgress}
      />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Left Panel - Code Editor */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <div className="h-full flex flex-col p-4 bg-background">
              <Card className="mb-4 p-4 border-border bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Code2 className="w-5 h-5 text-primary" />
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Coding Challenge</h2>
                      <p className="text-sm text-muted-foreground">
                        Session ID: {sessionId || "demo-session"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    Medium
                  </Badge>
                </div>
              </Card>

              <div className="flex-1 overflow-auto">
                <CodeCompiler
                  language="javascript"
                  defaultLanguage="javascript"
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Video & Notes */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              {/* Video Call */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full p-4 bg-background">
                  <VideoCall
                    sessionId={sessionId!}
                    userId={userId}
                    role={userRole}
                    onEndCall={handleEndInterview}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle />

              {/* Notes */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full p-4 bg-background">
                  <InterviewNotes onNotesChange={handleNotesChange} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default InterviewRoom;
