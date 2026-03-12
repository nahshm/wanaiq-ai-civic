import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Tag, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface CivicExperienceListProps {
    userId: string;
}

export const CivicExperienceList: React.FC<CivicExperienceListProps> = ({ userId }) => {
    const { data: actions, isLoading } = useQuery({
        queryKey: ['resume-civic-actions', userId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('civic_actions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(10); // Show recent 10 experiences

            if (error) throw error;
            return data;
        },
        enabled: !!userId,
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Civic Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex gap-4">
                            <div className="w-12 h-12 bg-muted rounded-full shrink-0" />
                            <div className="space-y-2 w-full">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!actions || actions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Civic Experience</CardTitle>
                    <CardDescription>No public civic actions have been recorded yet.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Civic Experience
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="relative border-l border-border ml-6 my-6 space-y-8">
                    {actions.map((action) => (
                        <div key={action.id} className="relative pl-6 pr-4">
                            {/* Timeline dot */}
                            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-background ${
                                action.status === 'resolved' ? 'bg-green-500' :
                                action.status === 'in_progress' ? 'bg-blue-500' :
                                'bg-orange-500'
                            }`} />
                            
                            <div className="group">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                                        <Link to={`/dashboard/actions/${action.id}`}>
                                            {action.title}
                                        </Link>
                                    </h4>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                        {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                    {action.description}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <Badge variant="secondary" className="bg-muted/50 font-normal">
                                        {action.action_type.replace('_', ' ')}
                                    </Badge>
                                    
                                    {action.category && (
                                        <Badge variant="outline" className="font-normal text-muted-foreground border-border/50 flex items-center gap-1">
                                            <Tag className="w-3 h-3" />
                                            {action.category}
                                        </Badge>
                                    )}

                                    {action.location_text && (
                                        <div className="flex items-center gap-1 text-muted-foreground max-w-[150px] truncate" title={action.location_text}>
                                            <MapPin className="w-3 h-3" />
                                            <span className="truncate">{action.location_text}</span>
                                        </div>
                                    )}
                                    
                                    {action.status === 'resolved' && (
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-500 font-medium ml-auto">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Resolved
                                        </div>
                                    )}
                                    
                                    {action.support_count > 0 && action.status !== 'resolved' && (
                                        <div className="text-muted-foreground ml-auto bg-muted/50 px-2 rounded-full">
                                            +{action.support_count} supporters
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
