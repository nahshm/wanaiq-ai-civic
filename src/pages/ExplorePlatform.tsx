import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Building2, TrendingUp, Users, Target, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ExplorePlatform() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "The Feed & Civic Hub",
      description: "Stay updated with verified civic content, news, and official announcements. Engage in meaningful discussions with your community.",
      icon: <Globe className="w-8 h-8 text-primary" />,
      action: "Go to Feed",
      path: "/",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Government Tracker",
      description: "Follow elected officials, view their profiles, track their performance, and hold them accountable for their promises.",
      icon: <Building2 className="w-8 h-8 text-primary" />,
      action: "Track Officials",
      path: "/officials",
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Accountability & Projects",
      description: "Monitor government projects in your area, track their progress, and report issues directly to the responsible authorities.",
      icon: <Target className="w-8 h-8 text-primary" />,
      action: "View Projects",
      path: "/projects",
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Communities",
      description: "Join local groups, participate in civic initiatives, and connect with people who share your vision for a better society.",
      icon: <Users className="w-8 h-8 text-primary" />,
      action: "Browse Communities",
      path: "/communities",
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      title: "Discovery Dashboard",
      description: "Analyze data on broken promises, delayed projects, and performance metrics of various government institutions and leaders.",
      icon: <TrendingUp className="w-8 h-8 text-primary" />,
      action: "Discover Data",
      path: "/discover",
      color: "bg-red-500/10 text-red-500",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground">
          Explore WANA Connect
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your centralized hub for civic engagement, government accountability, and community empowerment. Discover how to make the most of the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, index) => (
          <Card 
            key={index} 
            className="flex flex-col h-full hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm hover:-translate-y-1"
          >
            <CardHeader>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${section.color}`}>
                {section.icon}
              </div>
              <CardTitle className="text-2xl">{section.title}</CardTitle>
              <CardDescription className="text-base mt-2">
                {section.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-6">
              <Button 
                className="w-full group" 
                variant="outline"
                onClick={() => navigate(section.path)}
              >
                {section.action}
                <Search className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
