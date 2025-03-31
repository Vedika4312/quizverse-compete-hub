
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
import { Trash2, Plus, Clock, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const QuestionsManager = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our Question interface
      const transformedData: Question[] = (data || []).map(item => ({
        id: item.id.toString(),
        question_text: item.question,
        created_at: item.created_at || new Date().toISOString(),
        time_limit: item.time_limit,
        quiz_id: item.quiz_id || 1
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
        .from('quiz_questions')
        .insert({
          question: questionText.trim(),
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
        .from('quiz_questions')
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

  const toggleQuestionTimeLimit = async (questionId: string) => {
    try {
      // Find the current question's time limit
      const question = questions.find(q => q.id === questionId);
      if (!question) return;
      
      // If the current time limit is 0, set it to default 30 seconds
      // If it has a value > 0, set it to 0 (removing the time limit)
      const newTimeLimit = question.time_limit === 0 ? 30 : 0;
      
      const { error } = await supabase
        .from('quiz_questions')
        .update({ time_limit: newTimeLimit })
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: newTimeLimit === 0 
          ? "Time limit has been removed from the question" 
          : "Default time limit has been set for the question",
      });

      // Refresh the questions list
      fetchQuestions();
    } catch (error: any) {
      console.error('Error toggling question time limit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update question time limit",
        variant: "destructive",
      });
    }
  };

  const updateQuestionTimeLimit = async (questionId: string, newTimeLimit: number) => {
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .update({ time_limit: newTimeLimit })
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Time limit updated successfully",
      });
      
      fetchQuestions();
    } catch (error: any) {
      console.error('Error updating time limit:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update time limit",
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
              <TableHead className="text-center">Time Limit</TableHead>
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
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleQuestionTimeLimit(question.id)}
                            >
                              {question.time_limit === 0 ? (
                                <X className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-blue-500" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {question.time_limit === 0 
                              ? "Set default time limit" 
                              : "Remove time limit"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {question.time_limit > 0 && (
                        <input
                          type="number"
                          min="0"
                          max="300"
                          className="w-20 text-center p-1 border rounded"
                          value={question.time_limit}
                          onChange={(e) => {
                            const newTimeLimit = parseInt(e.target.value);
                            if ((newTimeLimit === 0) || (newTimeLimit >= 5 && newTimeLimit <= 300)) {
                              updateQuestionTimeLimit(question.id, newTimeLimit);
                            }
                          }}
                        />
                      )}
                      
                      {question.time_limit > 0 && (
                        <span className="text-xs text-gray-500">sec</span>
                      )}
                      
                      {question.time_limit === 0 && (
                        <span className="text-xs text-gray-500">No limit</span>
                      )}
                    </div>
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
                <TableCell colSpan={4} className="text-center py-4 text-gray-500">
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
