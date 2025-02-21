
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type QuestionType = 'multiple_choice' | 'written';

type DatabaseQuizQuestion = Database["public"]["Tables"]["quiz_questions"]["Row"];

interface QuizQuestion extends Omit<DatabaseQuizQuestion, 'options'> {
  options: string[];
  question_type: QuestionType;
}

const Quiz = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
          question_type: (q.question_type || 'multiple_choice') as QuestionType,
          time_limit: q.time_limit || 30,
          correct_answer: q.correct_answer
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

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleStartQuiz = () => {
    if (questions.length === 0) {
      toast({
        title: "No Questions",
        description: "There are no quiz questions available yet.",
        variant: "destructive",
      });
      return;
    }
    setQuizStarted(true);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      toast({
        title: "Select an Answer",
        description: "Please select an answer before proceeding",
        variant: "destructive",
      });
      return;
    }

    const currentQ = questions[currentQuestion];
    if (currentQ.question_type === 'multiple_choice') {
      if (selectedAnswer === currentQ.correct_answer) {
        setScore(score + 1);
      }
    } else {
      // For written questions, do a case-insensitive comparison
      if (selectedAnswer.toLowerCase() === currentQ.correct_answer.toLowerCase()) {
        setScore(score + 1);
      }
    }

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      // Quiz completed
      toast({
        title: "Quiz Completed!",
        description: `Your score: ${score}/${questions.length}`,
      });
      setQuizStarted(false);
    }
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
          <Card className="p-6">
            {!quizStarted ? (
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-semibold">Welcome to the Quiz!</h2>
                <p className="text-gray-600">Test your knowledge with our quiz questions.</p>
                <Button onClick={handleStartQuiz} className="w-full">
                  Start Quiz
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    Question {currentQuestion + 1} of {questions.length}
                  </h3>
                  <span className="text-sm text-gray-600">
                    Score: {score}/{currentQuestion}
                  </span>
                </div>

                <div className="space-y-4">
                  <p className="text-lg">{questions[currentQuestion].question}</p>
                  
                  <div className="space-y-2">
                    {questions[currentQuestion].question_type === 'multiple_choice' ? (
                      questions[currentQuestion].options.map((option, index) => (
                        <Button
                          key={index}
                          variant={selectedAnswer === index.toString() ? "default" : "outline"}
                          className="w-full justify-start text-left"
                          onClick={() => setSelectedAnswer(index.toString())}
                        >
                          {option}
                        </Button>
                      ))
                    ) : (
                      <input
                        type="text"
                        value={selectedAnswer || ''}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        placeholder="Type your answer"
                        className="w-full p-2 border rounded-md"
                      />
                    )}
                  </div>
                </div>

                <Button 
                  onClick={handleNextQuestion}
                  className="w-full"
                >
                  {currentQuestion + 1 === questions.length ? "Finish Quiz" : "Next Question"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
