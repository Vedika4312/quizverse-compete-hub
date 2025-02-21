
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate, toast]);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || options.some(option => !option)) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Submit question to database
    toast({
      title: "Success!",
      description: "Question added successfully",
    });
    
    // Reset form
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectAnswer(0);
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
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 animate-slideIn">
            <h2 className="text-2xl font-semibold mb-6">Add Quiz Question</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <Button type="submit" className="w-full">
                Add Question
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;
