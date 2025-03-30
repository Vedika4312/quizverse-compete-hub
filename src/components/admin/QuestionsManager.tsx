
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
import { Question } from "@/types/quiz";
import { Trash2, Plus } from "lucide-react";

const QuestionsManager = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Question interface
      const transformedData: Question[] = (data || []).map(item => ({
        id: item.id.toString(), // Convert to string if it's a number
        question_text: item.question_text,
        created_at: item.created_at,
        quiz_id: item.quiz_id
      }));
      
      setQuestions(transformedData);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!questionText.trim()) {
        toast({
          title: "Error",
          description: "Please enter a question",
          variant: "destructive",
        });
        return;
      }

      // Get the default quiz ID (1 if not specified)
      const defaultQuizId = 1;
      
      const { data, error } = await supabase
        .from('questions')
        .insert({
          question_text: questionText.trim(),
          quiz_id: defaultQuizId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question has been added",
      });

      setQuestionText("");
      fetchQuestions();
    } catch (error: any) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add question",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      // Convert id to number since our database is expecting a number
      const numericId = parseInt(id, 10);
      
      if (isNaN(numericId)) {
        throw new Error("Invalid question ID");
      }
      
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', numericId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question has been deleted",
      });

      fetchQuestions();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Questions Manager</h2>
      
      <form onSubmit={handleAddQuestion} className="mb-8">
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
          <Button type="submit" disabled={isSubmitting} className="self-start">
            <Plus className="w-4 h-4 mr-2" />
            {isSubmitting ? "Adding..." : "Add Question"}
          </Button>
        </div>
      </form>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Question List</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length > 0 ? (
              questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium">{question.question_text}</TableCell>
                  <TableCell>
                    {new Date(question.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                  No questions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};

export default QuestionsManager;
