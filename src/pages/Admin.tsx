
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2 } from "lucide-react";

type QuestionType = 'multiple_choice' | 'written';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  question_type: QuestionType;
  created_at: string;
  created_by: string;
  time_limit: number;
}

const Admin = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState<number>(0);
  const [questionType, setQuestionType] = useState<QuestionType>("multiple_choice");
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [existingQuestions, setExistingQuestions] = useState<QuizQuestion[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: adminCheck } = await supabase
          .rpc('is_admin', { user_id: user.id });

        if (!adminCheck) {
          toast({
            title: "Access Denied",
            description: "You need admin privileges to access this page",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setIsAdmin(true);
        fetchQuestions();
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate, toast]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const transformedQuestions: QuizQuestion[] = data.map(q => ({
          ...q,
          options: q.options as string[],
          question_type: (q.question_type as QuestionType) || 'multiple_choice',
          time_limit: q.time_limit || 30,
          correct_answer: q.correct_answer.toString()
        }));
        setExistingQuestions(transformedQuestions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch existing questions",
        variant: "destructive",
      });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleDelete = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question) {
      toast({
        title: "Error",
        description: "Please fill in the question",
        variant: "destructive",
      });
      return;
    }

    if (questionType === 'multiple_choice' && options.some(option => !option)) {
      toast({
        title: "Error",
        description: "Please fill in all options for multiple choice question",
        variant: "destructive",
      });
      return;
    }

    if (questionType === 'written' && !writtenAnswer) {
      toast({
        title: "Error",
        description: "Please provide the correct answer for written question",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const user = (await supabase.auth.getUser()).data.user;
      const newQuestion = {
        question,
        options: questionType === 'multiple_choice' ? options : [],
        correct_answer: questionType === 'multiple_choice' ? correctAnswer.toString() : writtenAnswer,
        question_type: questionType,
        created_by: user?.id,
        time_limit: timeLimit
      };

      const { error } = await supabase
        .from('quiz_questions')
        .insert(newQuestion);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Question added successfully",
      });
      
      // Reset form
      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectAnswer(0);
      setWrittenAnswer("");
      setTimeLimit(30);
      
      // Refresh questions list
      fetchQuestions();
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Failed to add question. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="p-6 animate-slideIn">
            <h2 className="text-2xl font-semibold mb-6">Add Quiz Question</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="questionType">Question Type</Label>
                <select
                  id="questionType"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="written">Written Answer</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your question"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time Limit (seconds)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min="5"
                  max="300"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(Number(e.target.value))}
                />
              </div>

              {questionType === 'multiple_choice' ? (
                <>
                  {options.map((option, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`option${index}`}>Option {index + 1}</Label>
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={correctAnswer === index}
                          onChange={() => setCorrectAnswer(index)}
                          className="ml-2"
                        />
                        <span className="text-sm text-gray-500">Correct answer</span>
                      </div>
                      <Input
                        id={`option${index}`}
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Enter option ${index + 1}`}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="writtenAnswer">Correct Answer</Label>
                  <Input
                    id="writtenAnswer"
                    value={writtenAnswer}
                    onChange={(e) => setWrittenAnswer(e.target.value)}
                    placeholder="Enter the correct answer"
                  />
                </div>
              )}

              <Button type="submit" className="w-full">
                Add Question
              </Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Existing Questions</h2>
            <div className="space-y-4">
              {existingQuestions.map((q, index) => (
                <Card key={q.id} className="p-4 border">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Question {index + 1}: {q.question}</p>
                        <span className="text-sm text-gray-500">({q.question_type})</span>
                      </div>
                      <div className="pl-4 space-y-1">
                        {q.question_type === 'multiple_choice' ? (
                          q.options.map((option, optIndex) => (
                            <p key={optIndex} className={optIndex.toString() === q.correct_answer ? "text-green-600 font-medium" : "text-gray-600"}>
                              {optIndex + 1}. {option} {optIndex.toString() === q.correct_answer && " (Correct)"}
                            </p>
                          ))
                        ) : (
                          <p className="text-green-600 font-medium">
                            Correct Answer: {q.correct_answer}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">Time Limit: {q.time_limit} seconds</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(q.id)}
                      className="ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              
              {existingQuestions.length === 0 && (
                <p className="text-gray-500 text-center">No questions added yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
