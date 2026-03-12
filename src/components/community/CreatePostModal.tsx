import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { CreatePostForm } from '@/components/posts/CreatePostForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
    communityName: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
    isOpen,
    onClose,
    communityId,
    communityName,
}) => {
    const { user } = useAuth();
    const authModal = useAuthModal();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [communities, setCommunities] = useState<any[]>([]);

    // Fetch communities for the form dropdown
    useEffect(() => {
        if (isOpen) {
            const fetchCommunities = async () => {
                const { data } = await supabase
                    .from('communities')
                    .select('*')
                    .order('member_count', { ascending: false });
                setCommunities(data || []);
            };
            fetchCommunities();
        }
    }, [isOpen]);

    const handleCreatePost = async (postData: any) => {
        if (!user) {
            authModal.open('login');
            onClose(); // Close the modal so auth modal shows
            return;
        }

        setLoading(true);

        try {
            // Determine content type
            let contentType: 'text' | 'video' | 'image' = 'text';
            let hasVideo = false;
            let hasImage = false;

            if (postData.postType === 'link') {
                contentType = 'text';
            } else if (postData.evidenceFiles && postData.evidenceFiles.length > 0) {
                hasVideo = postData.evidenceFiles.some((file: File) => file.type.startsWith('video/'));
                hasImage = postData.evidenceFiles.some((file: File) => file.type.startsWith('image/'));
                if (hasVideo) contentType = 'video';
                else if (hasImage) contentType = 'image';
            }

            const postPayload = {
                title: postData.title,
                content: postData.content,
                author_id: user.id,
                community_id: postData.communityId || communityId, // Use passed communityId as default
                tags: postData.tags || [],
                content_type: contentType,
                content_sensitivity: postData.contentSensitivity || 'public',
            };

            const { data, error } = await supabase
                .from('posts')
                .insert([postPayload])
                .select()
                .single();

            if (error) throw error;

            const postId = data.id;

            // Handle file uploads (same logic as CreatePost.tsx)
            if (postData.evidenceFiles && postData.evidenceFiles.length > 0) {
                const uploadPromises = postData.evidenceFiles.map(async (file: File, index: number) => {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${postId}/evidence_${index + 1}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('media')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    return {
                        post_id: postId,
                        file_path: fileName,
                        filename: fileName.split('/').pop() || '',
                        file_type: file.type,
                        file_size: file.size,
                    };
                });

                const evidenceRecords = await Promise.all(uploadPromises);
                await supabase.from('post_media').insert(evidenceRecords);
            }

            toast({
                title: "Success!",
                description: "Your post has been created successfully",
            });

            // Invalidate queries to refresh feeds
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['channel-content'] });

            onClose();
        } catch (error) {
            console.error('Error creating post:', error);
            toast({
                title: "Error",
                description: "Failed to create post. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                <DialogHeader className="px-6 pt-6 pb-0">
                    <DialogTitle>
                        Create a Post in c/{communityName}
                    </DialogTitle>
                </DialogHeader>
                <div className="px-6 pb-6">
                    <CreatePostForm
                        communities={communities}
                        onSubmit={handleCreatePost}
                        defaultCommunityId={communityId}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};
