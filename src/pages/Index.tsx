
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, Users, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Team {
  id: string;
  name: string;
  created_at: string;
}

const Index = () => {
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserTeam = async () => {
      try {
        // First check if user is a company captain
        const { data: captainCompany } = await supabase
          .from('companies')
          .select('*')
          .eq('captain_id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        if (captainCompany) {
          setUserTeam(captainCompany);
          setLoading(false);
          return;
        }

        // If not a captain, check if user is a company member
        const { data: companyMember } = await supabase
          .from('company_members')
          .select('company:companies(*)')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .maybeSingle();

        if (companyMember) {
          setUserTeam(companyMember.company as Team);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserTeam();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome to TechInterview Pro
          </h1>
          
          {userTeam ? (
            <div className="space-y-6">
              <div className="p-6 bg-primary/5 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">Your Company</h2>
                <p className="text-lg text-primary">{userTeam.name}</p>
              </div>
              <Button asChild size="lg" className="animate-pulse hover:animate-none" variant="default">
                <Link to="/quiz" className="inline-flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Start Assessment
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xl text-gray-600">
                Professional programming interview platform for assessments and coding challenges.
              </p>
              <div className="flex items-center justify-center gap-4">
                {!loading && (
                  <Button asChild size="lg" className="animate-slideIn" style={{ animationDelay: "0.2s" }}>
                    <Link to="/teams">Register Company</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-16">
          <Card className="p-6 animate-slideIn" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Company Registration</h3>
                <p className="text-gray-600">
                  Register your company and conduct professional programming interviews.
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
                <h3 className="text-lg font-semibold mb-2">Assess Candidates</h3>
                <p className="text-gray-600">
                  Evaluate candidates with comprehensive coding challenges and technical assessments.
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
