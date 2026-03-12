import React from 'react';
import { GovernmentProject } from '@/types';
import { Button } from '@/components/ui/button';
import { Hammer, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjectCardWithErrorBoundary } from '@/components/projects/ProjectCard';

interface ProjectsGridProps {
    projects: GovernmentProject[];
    loading: boolean;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({ projects, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border h-[400px] animate-pulse">
                        <div className="h-48 bg-muted rounded-t-lg" />
                        <div className="p-4 space-y-4">
                            <div className="h-6 bg-muted rounded w-3/4" />
                            <div className="h-4 bg-muted rounded w-full" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground flex items-center">
                        <Hammer className="mr-3 h-8 w-8 text-orange-500" />
                        Community-Reported Projects
                    </h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Track development projects in your area
                    </p>
                </div>
                <Button
                    onClick={() => navigate('/projects/submit')}
                    className="bg-orange-600 hover:bg-orange-700"
                >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Report Project
                </Button>
            </div>

            {projects.length === 0 ? (
                <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Hammer className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                    <h3 className="text-lg font-semibold mb-2">No Projects Reported</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Be the first to report a development project in your area.
                    </p>
                    <Button onClick={() => navigate('/projects/submit')}>
                        Report First Project
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {projects.map((project) => (
                        <ProjectCardWithErrorBoundary
                            key={project.id}
                            project={project}
                            onClick={() => navigate(`/projects/${project.id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProjectsGrid;
