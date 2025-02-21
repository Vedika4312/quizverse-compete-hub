
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to QuizVerse
          </h1>
          
          <p className="text-xl text-gray-600">
            Join the ultimate quiz competition platform where knowledge meets excitement.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg" className="animate-slideIn" style={{ animationDelay: "0.2s" }}>
              <Link to="/teams">Register Team</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-16">
          <Card className="p-6 animate-slideIn" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Team Competition</h3>
                <p className="text-gray-600">
                  Form your team and compete against others in exciting quiz rounds.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 animate-slideIn" style={{ animationDelay: "0.6s" }}>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Win Prizes</h3>
                <p className="text-gray-600">
                  Showcase your knowledge and win amazing prizes in our competitions.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
