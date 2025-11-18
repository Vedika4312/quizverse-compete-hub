import { useParams } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import CodeCompiler from "@/components/CodeCompiler";
import VideoCallPlaceholder from "@/components/interview/VideoCallPlaceholder";
import InterviewControls from "@/components/interview/InterviewControls";
import InterviewNotes from "@/components/interview/InterviewNotes";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";

const InterviewRoom = () => {
  const { sessionId } = useParams();
  const { toast } = useToast();

  const handleEndInterview = () => {
    toast({
      title: "Interview Ended",
      description: "The interview session has been completed.",
    });
  };

  const handleSaveProgress = () => {
    toast({
      title: "Progress Saved",
      description: "Your interview progress has been saved.",
    });
  };

  const handleNotesChange = (notes: string) => {
    // Auto-save notes to database
    console.log("Notes updated:", notes);
  };

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
                  <VideoCallPlaceholder />
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
