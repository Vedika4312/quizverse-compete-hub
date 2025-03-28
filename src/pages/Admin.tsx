
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Clock, AlarmClock } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CodeCompiler from "@/components/CodeCompiler";
import type { QuestionType } from "@/types/quiz";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DatabaseQuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];

interface QuizQuestion extends Omit<DatabaseQuizQuestion, 'options'> {
  options: string[];
  question_type: QuestionType;
  has_compiler: boolean | null;
  compiler_language: string | null;
}

interface QuizSettings {
  overall_time_limit: number | null;
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
  const [hasCompiler, setHasCompiler] = useState(false);
  const [compilerLanguage, setCompilerLanguage] = useState("javascript");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [overallTimeLimit, setOverallTimeLimit] = useState<number | null>(null);
  const [quizSettings, setQuizSettings] = useState<QuizSettings>({ overall_time_limit: null });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
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
        fetchQuizSettings();
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
          question_type: (q.question_type || 'multiple_choice') as QuestionType,
          time_limit: q.time_limit || 30,
          has_compiler: q.has_compiler as boolean || false,
          compiler_language: q.compiler_language as string || 'javascript'
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

  const fetchQuizSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setQuizSettings(data);
        setOverallTimeLimit(data.overall_time_limit);
      }
    } catch (error) {
      console.error('Error fetching quiz settings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch quiz settings",
        variant: "destructive",
      });
    }
  };

  const updateQuizSettings = async () => {
    try {
      setIsUpdatingSettings(true);
      
      const { data, error } = await supabase
        .from('quiz_settings')
        .upsert({
          id: quizSettings.id || 1,
          overall_time_limit: overallTimeLimit
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quiz settings updated successfully",
      });
      
      fetchQuizSettings();
    } catch (error) {
      console.error('Error updating quiz settings:', error);
      toast({
        title: "Error",
        description: "Failed to update quiz settings",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const confirmDelete = (questionId: string) => {
    setQuestionToDelete(questionId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!questionToDelete) return;
    
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
      
      fetchQuestions();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setQuestionToDelete(null);
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
        created_by: user?.id ?? '',
        time_limit: timeLimit,
        has_compiler: hasCompiler,
        compiler_language: hasCompiler ? compilerLanguage : null
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
      setHasCompiler(false);
      setCompilerLanguage("javascript");
      
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
    } catch (error) {
      console.error('Error updating time limit:', error);
      toast({
        title: "Error",
        description: "Failed to update time limit",
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
          {/* Global Quiz Settings Card */}
          <Card className="p-6 animate-slideIn">
            <h2 className="text-2xl font-semibold mb-6">Quiz Settings</h2>
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="overallTimeLimit" className="flex items-center">
                  <AlarmClock className="h-5 w-5 mr-2 text-primary" />
                  Overall Quiz Time Limit (minutes)
                </Label>
                <div className="flex items-center space-x-4">
                  <Input
                    id="overallTimeLimit"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Enter time in minutes"
                    value={overallTimeLimit || ''}
                    onChange={(e) => setOverallTimeLimit(e.target.value ? Number(e.target.value) : null)}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">
                    {overallTimeLimit ? `${overallTimeLimit} minutes for the entire quiz` : 'No overall time limit (per-question limits apply)'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Set an overall time limit for the entire quiz. Leave empty to use only per-question time limits.
                </p>
              </div>
              <Button 
                onClick={updateQuizSettings} 
                disabled={isUpdatingSettings}
                className="mt-2"
              >
                {isUpdatingSettings ? "Updating..." : "Update Quiz Settings"}
              </Button>
            </div>
          </Card>

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
                  className="min-h-[100px] whitespace-pre-wrap"
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
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasCompiler"
                  checked={hasCompiler}
                  onCheckedChange={setHasCompiler}
                />
                <Label htmlFor="hasCompiler">Enable Code Compiler</Label>
              </div>
              
              {hasCompiler && (
                <div className="space-y-2">
                  <Label htmlFor="compilerLanguage">Default Compiler Language</Label>
                  <Select value={compilerLanguage} onValueChange={setCompilerLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="csharp">C#</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                        onChange={(e) => {
                          const newOptions = [...options];
                          newOptions[index] = e.target.value;
                          setOptions(newOptions);
                        }}
                        placeholder={`Enter option ${index + 1}`}
                      />
                    </div>
                  ))}
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="writtenAnswer">Correct Answer</Label>
                  <Textarea
                    id="writtenAnswer"
                    value={writtenAnswer}
                    onChange={(e) => setWrittenAnswer(e.target.value)}
                    placeholder="Enter the correct answer"
                    className="min-h-[150px] resize-y whitespace-pre-wrap"
                  />
                </div>
              )}
              
              {hasCompiler && (
                <div className="pt-4">
                  <Label className="mb-2 block">Code Compiler Preview</Label>
                  <CodeCompiler
                    language={compilerLanguage}
                    defaultLanguage={compilerLanguage}
                    onLanguageChange={setCompilerLanguage}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Question</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-center">Time Limit</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingQuestions.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium truncate max-w-xs">
                        {q.question}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {q.question_type}
                        </span>
                        {q.has_compiler && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {q.compiler_language}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            min="5"
                            max="300"
                            className="w-20 text-center"
                            value={q.time_limit}
                            onChange={(e) => {
                              const newTimeLimit = Number(e.target.value);
                              if (newTimeLimit >= 5 && newTimeLimit <= 300) {
                                updateQuestionTimeLimit(q.id, newTimeLimit);
                              }
                            }}
                          />
                          <span className="text-xs text-gray-500">sec</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => confirmDelete(q.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {existingQuestions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                        No questions added yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
