import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

export const RelatedCommunities = () => {
    const [relatedCommunities, setRelatedCommunities] = useState<any[]>([]);

    useEffect(() => {
        const fetchRelated = async () => {
            // Simple fetch for now, can be improved with category matching
            const { data } = await supabase
                .from('communities')
                .select('id, name, avatar_url')
                .limit(3);

            if (data) setRelatedCommunities(data);
        };

        fetchRelated();
    }, []);

    if (relatedCommunities.length === 0) return null;

    return (
        <Card className="bg-sidebar-background border-sidebar-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase text-sidebar-muted-foreground">
                    Related Communities
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="space-y-3">
                    {relatedCommunities.map((relComm) => (
                        <div key={relComm.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={relComm.avatar_url} />
                                    <AvatarFallback>{relComm.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium hover:underline cursor-pointer" onClick={() => window.location.href = `/c/${relComm.name}`}>
                                        r/{relComm.name}
                                    </span>
                                    {/* Mock member count for now as it's not in the simple select */}
                                    <span className="text-xs text-sidebar-muted-foreground">
                                        {new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(Math.floor(Math.random() * 10000))} members
                                    </span>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 text-xs rounded-full">Join</Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
