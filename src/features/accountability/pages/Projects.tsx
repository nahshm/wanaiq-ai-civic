import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Plus, Filter, AlertTriangle, Loader2 } from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCardWithErrorBoundary } from '@/components/projects/ProjectCard';
import { PROJECT_CATEGORIES_2026 } from '@/constants/projectConstants';

const Projects = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCounty, setSelectedCounty] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch projects with React Query
  const { data: projects = [], isLoading, error, refetch } = useProjects({
    status: selectedStatus,
    county: selectedCounty,
    category: selectedCategory,
    search: searchQuery
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-20 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="h-64 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Failed to load projects.{' '}
            <Button variant="link" className="p-0 h-auto" onClick={() => refetch()}>
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Extract unique counties from projects for filter
  const uniqueCounties = Array.from(
    new Set(projects.map(p => p.county).filter(Boolean))
  ).sort();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Government Projects Monitor</h1>
            <p className="text-muted-foreground">
              Track government projects, budgets, and accountability across Kenya
            </p>
          </div>
          <Button onClick={() => navigate('/projects/submit')} className="gap-2">
            <Plus className="w-4 h-4" />
            Post Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {PROJECT_CATEGORIES_2026.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="stalled">Stalled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Counties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  {uniqueCounties.map(county => (
                    <SelectItem key={county} value={county!}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(selectedCategory !== 'all' || selectedStatus !== 'all' || selectedCounty !== 'all' || searchQuery) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedStatus('all');
                    setSelectedCounty('all');
                    setSearchQuery('');
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {projects.length} project{projects.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or search query
            </p>
            <Button variant="outline" onClick={() => {
              setSelectedCategory('all');
              setSelectedStatus('all');
              setSelectedCounty('all');
              setSearchQuery('');
            }}>
              Clear all filters
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCardWithErrorBoundary key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Load More (if implementing pagination) */}
      {projects.length >= 50 && (
        <div className="mt-8 text-center">
          <Button variant="outline" className="gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Load More Projects
          </Button>
        </div>
      )}
    </div>
  );
};

export default Projects;
