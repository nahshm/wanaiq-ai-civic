import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TodaysLessonWidget = () => {
  // Placeholder widget for civic education
  // Will be fully implemented when education system is built
  
  return (
    <Card className="border-sidebar-border bg-sidebar-background bg-gradient-to-br from-purple-50/30 to-indigo-50/30 dark:from-purple-950/10 dark:to-indigo-950/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
          <span>📚 Today's Lesson</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-foreground">
            Understanding Your Local Government
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            Learn how county governance works and how you can participate in local decision-making.
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>5 min read</span>
          </div>
        </div>

        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-full justify-center text-xs sm:text-sm bg-purple-50/50 hover:bg-purple-100/50 dark:bg-purple-950/10 dark:hover:bg-purple-950/20 border-purple-400/20 text-purple-700 dark:text-purple-300"
        >
          <Link to="/education">
            View All Courses
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
