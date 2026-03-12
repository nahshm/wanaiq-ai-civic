import { CreatePostForm } from '@/components/posts/CreatePostForm';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SELECT_FIELDS } from '@/lib/select-fields'; // Bandwidth optimization
import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const EditPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const authModal = useAuthModal();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [communities, setCommunities] = useState<any[]>([]);
  const [postData, setPostData] = useState<any>(null);

  // Fetch communities on component mount
  useEffect(() => {
    const fetchCommunities = async () => {
      const { data } = await supabase
        .from('communities')
        .select(SELECT_FIELDS.COMMUNITY_CARD) // Bandwidth optimization -60%
        .order('member_count', { ascending: false });
      setCommunities(data || []);
    };
    fetchCommunities();
  }, []);

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
      if (!id || !user) return;

      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`
            *,
            communities!posts_community_id_fkey (
              id,
              name,
              description
            ),
            post_media!post_media_post_id_fkey (
              id,
              file_path,
              filename,
              file_type,
              file_size
            )
          `)
          .eq('id', id)
          .eq('author_id', user.id)
          .single();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Post not found",
            description: "The post you're trying to edit doesn't exist or you don't have permission to edit it.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        setPostData(data);
      } catch (error) {
        console.error('Error fetching post:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load post data.",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, user, navigate, toast]);

  const handleUpdatePost = async (formData: any) => {
    if (!user || !postData) {
      authModal.open('login');
      return;
    }

    setUpdating(true);

    try {
      const updatePayload = {
        title: formData.title,
        content: formData.content,
        community_id: formData.communityId || null,
        tags: formData.tags || [],
      };

      const { error } = await supabase
        .from('posts')
        .update(updatePayload)
        .eq('id', postData.id)
        .eq('author_id', user.id);

      if (error) throw error;

      // Handle file uploads if any new evidence files are provided
      if (formData.evidenceFiles && formData.evidenceFiles.length > 0) {
        try {
          // Upload each file to Supabase Storage
          const uploadPromises = formData.evidenceFiles.map(async (file: File, index: number) => {
            const fileExt = file.name.split('.').pop();
            const fileName = `${postData.id}/evidence_${Date.now()}_${index + 1}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
              .from('media')
              .upload(fileName, file);

            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              throw new Error(`Failed to upload ${file.name}`);
            }

            return {
              post_id: postData.id,
              file_path: fileName,
              filename: fileName.split('/').pop() || '',
              file_type: file.type,
              file_size: file.size,
            };
          });

          const evidenceRecords = await Promise.all(uploadPromises);

          // Insert evidence records into database
          const { error: evidenceError } = await supabase
            .from('post_media')
            .insert(evidenceRecords);

          if (evidenceError) {
            console.error('Error saving evidence records:', evidenceError);
            toast({
              title: "File Upload Issue",
              description: "Your post was updated but there was an issue saving file metadata. Files may not display correctly.",
              variant: "default",
            });
          } else {
            toast({
              title: "Files Uploaded Successfully",
              description: `${formData.evidenceFiles.length} file(s) have been uploaded with your post.`,
              variant: "default",
            });
          }
        } catch (uploadError) {
          console.error('File upload process failed:', uploadError);
          toast({
            title: "File Upload Failed",
            description: "Your post was updated successfully, but file uploads failed. You can try again later.",
            variant: "default",
          });
        }
      }

      toast({
        title: "Success!",
        description: "Your post has been updated successfully",
      });

      navigate(`/post/${postData.id}`);
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-6 max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex-1 max-w-4xl">
          <div className="mb-6">
            <Skeleton className="h-10 w-32 mb-4" />
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="bg-sidebar-background border border-sidebar-border rounded-lg p-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!postData) {
    return (
      <div className="flex gap-6 max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex-1 max-w-4xl text-center py-8">
          <h1 className="text-2xl font-bold mb-2 text-sidebar-foreground">Post Not Found</h1>
          <p className="text-sidebar-muted-foreground mb-4">
            The post you're trying to edit doesn't exist or you don't have permission to edit it.
          </p>
          <Button asChild>
            <Link to="/">Return to Feed</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Prepare initial values for the form
  const initialValues: {
    title: string;
    content: string;
    communityId?: string;
    tags?: string[];
    isAnonymous?: boolean;
    contentSensitivity?: 'public' | 'sensitive' | 'crisis';
    evidenceFiles?: any[];
  } = {
    title: postData.title,
    content: postData.content,
    communityId: postData.community_id,
    tags: postData.tags || [],
    isAnonymous: false,
    contentSensitivity: 'public',
    evidenceFiles: [],
  };

  return (
    <div className="flex gap-6 max-w-screen-xl mx-auto px-4 py-6">
      {/* Main Content */}
      <div className="flex-1 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4 text-sidebar-muted-foreground hover:text-sidebar-foreground">
            <Link to={`/post/${postData.id}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Post
            </Link>
          </Button>

          <div className="mb-2">
            <h1 className="text-3xl font-bold text-sidebar-foreground">Edit Post</h1>
            <p className="text-sidebar-muted-foreground">
              Make changes to your post
            </p>
          </div>
        </div>

        {/* Edit Post Form */}
        <div className="bg-sidebar-background border border-sidebar-border rounded-lg">
          <CreatePostForm
            communities={communities}
            onSubmit={handleUpdatePost}
            initialValues={initialValues}
            isEditing={true}
          />
        </div>
      </div>
    </div>
  );
};

export default EditPost;
