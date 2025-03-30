
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface QAItem {
  id: number;
  question_text: string;
  answer_text: string;
  created_at: string;
  quiz_id?: number;
}

const QAManager = () => {
  const [qaItems, setQAItems] = useState<QAItem[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const fetchQAItems = async () => {
    try {
      const { data, error } = await supabase
        .from('qa_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setQAItems(data || []);
    } catch (error) {
      console.error('Error fetching QA items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch QA items",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchQAItems();
  }, []);

  const handleAddQAItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!questionText.trim() || !answerText.trim()) {
        toast({
          title: "Error",
          description: "Please enter both question and answer",
          variant: "destructive",
        });
        return;
      }

      // Get the default quiz ID (1 if not specified)
      const defaultQuizId = 1;
      
      const { error } = await supabase
        .from('qa_items')
        .insert({
          question_text: questionText.trim(),
          answer_text: answerText.trim(),
          quiz_id: defaultQuizId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "QA item has been added",
      });

      setQuestionText("");
      setAnswerText("");
      fetchQAItems();
    } catch (error: any) {
      console.error('Error adding QA item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add QA item",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteQAItem = async () => {
    if (!itemToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('qa_items')
        .delete()
        .eq('id', itemToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "QA item has been deleted",
      });

      fetchQAItems();
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting QA item:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete QA item",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">QA Manager</h2>
      
      <form onSubmit={handleAddQAItem} className="mb-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="questionText">New Question</Label>
            <Textarea
              id="questionText"
              placeholder="Enter question text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              className="resize-y"
            />
          </div>
          <div>
            <Label htmlFor="answerText">Answer</Label>
            <Textarea
              id="answerText"
              placeholder="Enter answer text"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={4}
              className="resize-y"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="self-start">
            <Plus className="w-4 h-4 mr-2" />
            {isSubmitting ? "Adding..." : "Add QA Item"}
          </Button>
        </div>
      </form>
      
      <div>
        <h3 className="text-lg font-medium mb-4">QA Items List</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Answer</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qaItems.length > 0 ? (
              qaItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.question_text}</TableCell>
                  <TableCell className="max-w-md whitespace-normal break-words">
                    {item.answer_text}
                  </TableCell>
                  <TableCell>
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                  No QA items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this QA item? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteQAItem} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default QAManager;
