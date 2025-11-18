import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface InterviewNotesProps {
  initialNotes?: string;
  onNotesChange?: (notes: string) => void;
}

const InterviewNotes = ({ initialNotes = "", onNotesChange }: InterviewNotesProps) => {
  const [notes, setNotes] = useState(initialNotes);

  const handleChange = (value: string) => {
    setNotes(value);
    onNotesChange?.(value);
  };

  return (
    <Card className="p-4 h-full flex flex-col bg-background border-border">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-primary" />
        <Label className="text-base font-semibold">Interview Notes</Label>
      </div>
      
      <Textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Take notes during the interview..."
        className="flex-1 resize-none bg-muted/30 border-border focus:bg-background transition-colors"
      />
      
      <p className="text-xs text-muted-foreground mt-2">
        {notes.length} characters
      </p>
    </Card>
  );
};

export default InterviewNotes;
