import { Button } from '@/components/ui/button';
import { ImagePlus, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProfileImageUploadProps {
    userId: string;
    imageUrl: string;
    imageType: 'avatar' | 'banner';
    onChange: (url: string) => void;
}

export const ProfileImageUpload = ({ userId, imageUrl, imageType, onChange }: ProfileImageUploadProps) => {
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (file: File) => {
        setUploading(true);

        try {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('File size must be less than 5MB');
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                throw new Error('File must be an image');
            }

            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/${imageType}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('user-profiles')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('user-profiles')
                .getPublicUrl(filePath);

            onChange(publicUrl);

            toast({
                title: "Success",
                description: `${imageType === 'banner' ? 'Banner' : 'Avatar'} uploaded successfully`
            });
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload image",
                variant: "destructive"
            });
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        onChange('');
    };

    const isAvatar = imageType === 'avatar';

    return (
        <div className="space-y-3">
            <h3 className="font-medium text-sm">
                {isAvatar ? 'Avatar' : 'Banner'}
            </h3>
            <div className="flex items-center gap-3">
                {imageUrl ? (
                    <div className={isAvatar ? "w-20 h-20" : "flex-1"}>
                        <div
                            className={
                                isAvatar
                                    ? "w-20 h-20 rounded-full bg-cover bg-center border-4 border-border"
                                    : "h-24 rounded-lg bg-cover bg-center border-2 border-border"
                            }
                            style={{ backgroundImage: `url(${imageUrl})` }}
                        />
                        {!isAvatar && (
                            <p className="text-xs text-muted-foreground mt-1">Banner uploaded</p>
                        )}
                    </div>
                ) : (
                    <div className={
                        isAvatar
                            ? "w-20 h-20 rounded-full border-4 border-dashed border-border flex items-center justify-center bg-muted/30"
                            : "flex-1 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30"
                    }>
                        <div className="text-center">
                            <ImagePlus className={`${isAvatar ? 'w-6 h-6' : 'w-8 h-8'} mx-auto text-muted-foreground mb-1`} />
                            <p className="text-xs text-muted-foreground">
                                No {isAvatar ? 'avatar' : 'banner'} yet
                            </p>
                        </div>
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`${imageType}-upload`)?.click()}
                        disabled={uploading}
                        className="gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        {uploading ? 'Uploading...' : imageUrl ? 'Change' : 'Add'}
                    </Button>
                    {imageUrl && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemove}
                        >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                        </Button>
                    )}
                </div>
            </div>
            <input
                id={`${imageType}-upload`}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            />
            <p className="text-xs text-muted-foreground">
                Recommended: {isAvatar ? '256x256px' : '1920x384px'}. Max 5MB. JPG, PNG, or GIF.
            </p>
        </div>
    );
};
