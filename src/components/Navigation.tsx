
import { Trophy, Users, Database } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Trophy className="w-6 h-6" />
            <span className="font-semibold text-lg">QuizVerse</span>
          </Link>
          
          <div className="flex items-center space-x-8">
            <Link 
              to="/teams" 
              className={`flex items-center space-x-1 transition-colors hover:text-primary ${
                isActive("/teams") ? "text-primary" : "text-gray-600"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Teams</span>
            </Link>
            <Link 
              to="/admin" 
              className={`flex items-center space-x-1 transition-colors hover:text-primary ${
                isActive("/admin") ? "text-primary" : "text-gray-600"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
