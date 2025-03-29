
import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import type { PostgrestError } from "@supabase/supabase-js";
import { Textarea } from "@/components/ui/textarea";
import CodeCompiler from "@/components/CodeCompiler";
import type { QuizQuestion, QuizResult, QuizSettings } from "@/types/quiz";
import { AlertTriangle, AlarmClock, ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";

const MAX_VISIBILITY_WARNINGS = 3;

const Quiz = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [overallTimeRemaining, setOverallTimeRemaining] = useState<number | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allResults, setAllResults] = useState<QuizResult[]>([]);
  const [visibilityWarnings, setVisibilityWarnings] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [quizSettings, setQuizSettings] = useState<QuizSettings | null>(null);
  const [quizStartTimeReached, setQuizStartTimeReached] = useState(true);
  const [timeUntilStart, setTimeUntilStart] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
      if (!error && data) {
        setIsAdmin(true);
        const { data: results, error: resultsError } = await supabase
          .from('quiz_results')
          .select('*')
          .order('completed_at', { ascending: false });

        if (!resultsError && results) {
          setAllResults(results);
        }
      }
    };

    checkUserRole();
  }, [navigate]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*');

      if (error) throw error;

      if (data) {
        const transformedQuestions: QuizQuestion[] = data.map(q => ({
          ...q,
          options: q.options as string[],
          question_type: (q.question_type || 'multiple_choice') as QuizQuestion['question_type'],
          time_limit: q.time_limit || 30,
          correct_answer: q.correct_answer,
          has_compiler: q.has_compiler as boolean || false,
          compiler_language: q.compiler_language as string || 'javascript'
        }));
        setQuestions(transformedQuestions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to load quiz questions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizSettings = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_quiz_settings');

      if (error) throw error;

      if (data && data.length > 0) {
        const settings = data[0];
        setQuizSettings({
          id: settings.id,
          overall_time_limit: settings.overall_time_limit,
          quiz_start_time: settings.quiz_start_time
        });
        
        if (settings.overall_time_limit) {
          setOverallTimeRemaining(settings.overall_time_limit * 60);
        }
        
        // Check if quiz start time has been reached
        if (settings.quiz_start_time) {
          const startTime = new Date(settings.quiz_start_time);
          const currentTime = new Date();
          
          if (currentTime < startTime) {
            setQuizStartTimeReached(false);
            
            // Calculate time until quiz starts
            const timeUntil = getTimeUntilStart(startTime);
            setTimeUntilStart(timeUntil);
            
            // Start a countdown to update the time remaining
            const timer = setInterval(() => {
              const newTimeUntil = getTimeUntilStart(startTime);
              setTimeUntilStart(newTimeUntil);
              
              // Check if the time has been reached
              if (new Date() >= startTime) {
                setQuizStartTimeReached(true);
                clearInterval(timer);
              }
            }, 1000);
            
            return () => clearInterval(timer);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching quiz settings:', error);
    }
  };
  
  const getTimeUntilStart = (startTime: Date): string => {
    const now = new Date();
    const diffMs = startTime.getTime() - now.getTime();
    
    if (diffMs <= 0) return "0:00:00";
    
    const diffSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(diffSecs / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;
    
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    fetchQuestions();
    fetchQuizSettings();
  }, []);

  useEffect(() => {
    if (!quizStarted || timeRemaining === null) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          handleNextQuestion();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeRemaining]);

  useEffect(() => {
    if (!quizStarted || overallTimeRemaining === null || quizCompleted) return;

    const timer = setInterval(() => {
      setOverallTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          setQuizCompleted(true);
          clearInterval(timer);
          toast({
            title: "Time's up!",
            description: "The quiz time limit has been reached.",
            variant: "destructive",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, overallTimeRemaining, quizCompleted, toast]);

  useEffect(() => {
    if (!quizStarted || quizCompleted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsHidden(true);
        setVisibilityWarnings(prev => prev + 1);
        
        toast({
          title: "Warning!",
          description: `Do not leave the quiz tab! Warning ${visibilityWarnings + 1}/${MAX_VISIBILITY_WARNINGS}`,
          variant: "destructive",
        });
        
        if (visibilityWarnings + 1 >= MAX_VISIBILITY_WARNINGS) {
          toast({
            title: "Quiz Terminated",
            description: "You have exceeded the maximum number of tab switches. Your quiz has been submitted.",
            variant: "destructive",
          });
          setQuizCompleted(true);
        }
      } else {
        setIsHidden(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [quizStarted, quizCompleted, visibilityWarnings, toast]);

  const handleStartQuiz = () => {
    if (!quizStartTimeReached) {
      toast({
        title: "Quiz Not Available",
        description: `The quiz will be available in ${timeUntilStart}`,
        variant: "destructive",
      });
      return;
    }
    
    if (questions.length === 0) {
      toast({
        title: "No Questions",
        description: "There are no quiz questions available yet.",
        variant: "destructive",
      });
      return;
    }
    
    setVisibilityWarnings(0);
    setIsHidden(false);
    
    setQuizStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setUserAnswers(new Array(questions.length).fill(null));
    setTimeRemaining(questions[0].time_limit);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      const updatedUserAnswers = [...userAnswers];
      updatedUserAnswers[currentQuestion] = selectedAnswer;
      setUserAnswers(updatedUserAnswers);
      
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(userAnswers[currentQuestion - 1]);
      setTimeRemaining(questions[currentQuestion - 1].time_limit);
    }
  };

  const handleNextQuestion = useCallback(() => {
    const updatedUserAnswers = [...userAnswers];
    updatedUserAnswers[currentQuestion] = selectedAnswer;
    setUserAnswers(updatedUserAnswers);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(userAnswers[currentQuestion + 1]);
      setTimeRemaining(questions[currentQuestion + 1].time_limit);
    } else {
      let newScore = 0;
      const finalAnswers: string[] = [];
      
      for (let i = 0; i < questions.length; i++) {
        const answer = updatedUserAnswers[i];
        const currentQ = questions[i];
        
        if (!answer) {
          finalAnswers.push("skipped");
        } else {
          finalAnswers.push(answer);
          
          if (currentQ.question_type === 'multiple_choice') {
            if (answer === currentQ.correct_answer) {
              newScore += 1;
            }
          } else {
            if (answer.toLowerCase() === currentQ.correct_answer.toLowerCase()) {
              newScore += 1;
            }
          }
        }
      }
      
      setScore(newScore);
      setAnswers(finalAnswers);
      setQuizCompleted(true);
    }
  }, [currentQuestion, questions, selectedAnswer, userAnswers]);
  
  const handleSkipQuestion = () => {
    const updatedUserAnswers = [...userAnswers];
    updatedUserAnswers[currentQuestion] = null;
    setUserAnswers(updatedUserAnswers);
    
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(userAnswers[currentQuestion + 1]);
      setTimeRemaining(questions[currentQuestion + 1].time_limit);
    } else {
      const finalAnswers = updatedUserAnswers.map(answer => answer || "skipped");
      setAnswers(finalAnswers);
      setQuizCompleted(true);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error("You must be logged in to submit the quiz");
      }

      const { error: insertError } = await supabase
        .from('quiz_results')
        .insert([{
          user_id: user.id,
          score: score,
          total_questions: questions.length
        }]);

      if (insertError) throw insertError;

      if (isAdmin) {
        const { data: results, error: resultsError } = await supabase
          .from('quiz_results')
          .select('*')
          .order('completed_at', { ascending: false });

        if (!resultsError && results) {
          setAllResults(results);
        }
      }

      toast({
        title: "Quiz Submitted",
        description: "Your responses have been recorded successfully",
      });

      setQuizStarted(false);
      setQuizCompleted(false);
      setScore(0);
      setAnswers([]);
      
      navigate('/');
    } catch (error) {
      const e = error as Error | PostgrestError;
      console.error('Error submitting quiz:', e);
      toast({
        title: "Error",
        description: e.message || "Failed to submit quiz results",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <p className="text-lg">Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {isAdmin && !quizStarted && (
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-semibold mb-4">Quiz Results (Admin View)</h2>
              <div className="space-y-4">
                {allResults.map((result) => (
                  <div key={result.id} className="p-4 border rounded-lg bg-white">
                    <p className="font-medium">Score: {result.score}/{result.total_questions}</p>
                    <p className="text-sm text-gray-600">
                      Completed: {new Date(result.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
          
          <Card className="p-6">
            {!quizStarted ? (
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold">Welcome to the Quiz!</h2>
                <p className="text-gray-600">Test your knowledge with our quiz questions.</p>
                
                {!quizStartTimeReached && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                    <div className="flex items-start">
                      <Calendar className="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">Quiz Not Yet Available</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          The quiz will be available in: <span className="font-semibold">{timeUntilStart}</span>
                        </p>
                        {quizSettings?.quiz_start_time && (
                          <p className="text-sm text-blue-700 mt-1">
                            Scheduled start: {new Date(quizSettings.quiz_start_time).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-amber-800">Important Notice</h3>
                      <p className="text-sm text-amber-700 mt-1">
                        Please do not leave this tab or window during the quiz. Switching to another tab 
                        {MAX_VISIBILITY_WARNINGS} times will result in automatic submission of your quiz.
                      </p>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleStartQuiz} 
                  className="w-full"
                  disabled={!quizStartTimeReached}
                >
                  {!quizStartTimeReached ? `Quiz Available in ${timeUntilStart}` : "Start Quiz"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {!quizCompleted ? (
                  <>
                    {isHidden && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 animate-pulse">
                        <p className="text-red-600 font-medium">
                          Warning: Please return to the quiz tab! ({visibilityWarnings}/{MAX_VISIBILITY_WARNINGS})
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">
                        Question {currentQuestion + 1} of {questions.length}
                      </h3>
                      <div className="flex items-center gap-2">
                        {timeRemaining !== null && (
                          <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                            timeRemaining <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-primary/10'
                          }`}>
                            Question: {timeRemaining}s
                          </span>
                        )}
                        
                        {overallTimeRemaining !== null && (
                          <span className={`text-sm font-medium px-3 py-1 rounded-full flex items-center ${
                            overallTimeRemaining <= 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-100 text-blue-600'
                          }`}>
                            <AlarmClock className="w-4 h-4 mr-1" />
                            Quiz: {formatTime(overallTimeRemaining)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-lg whitespace-pre-wrap">{questions[currentQuestion].question}</p>
                      </div>
                      
                      {questions[currentQuestion].has_compiler && (
                        <div className="mb-4">
                          <CodeCompiler 
                            language={questions[currentQuestion].compiler_language || "javascript"}
                            readOnly={false}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {questions[currentQuestion].question_type === 'multiple_choice' ? (
                          questions[currentQuestion].options.map((option, index) => (
                            <Button
                              key={index}
                              variant={selectedAnswer === index.toString() ? "default" : "outline"}
                              className="w-full justify-start text-left min-h-[44px] whitespace-pre-wrap"
                              onClick={() => setSelectedAnswer(index.toString())}
                            >
                              <span className="inline-block">{option}</span>
                            </Button>
                          ))
                        ) : (
                          <Textarea
                            value={selectedAnswer || ''}
                            onChange={(e) => setSelectedAnswer(e.target.value)}
                            placeholder="Type your answer here..."
                            className="min-h-[200px] resize-y text-base p-4"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={handlePreviousQuestion}
                        className="w-1/3"
                        variant="secondary"
                        disabled={currentQuestion === 0}
                      >
                        <ArrowLeft className="mr-1" />
                        Previous
                      </Button>

                      <Button 
                        onClick={handleNextQuestion}
                        className="w-full"
                        variant="default"
                      >
                        {currentQuestion + 1 === questions.length ? "Finish Quiz" : "Next"}
                        {currentQuestion + 1 !== questions.length && <ArrowRight className="ml-1" />}
                      </Button>
                      
                      <Button 
                        onClick={handleSkipQuestion}
                        className="w-1/3"
                        variant="secondary"
                      >
                        Skip
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-medium">Quiz Completed!</h3>
                    <p className="text-gray-600">
                      You've answered all the questions. Click submit to record your responses.
                    </p>
                    <Button 
                      onClick={handleSubmitQuiz}
                      className="w-full"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Quiz"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
