import { useState, useEffect } from 'react'
import { FileText, Image, Link2, AlertCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CommunitySelector } from './CommunitySelector'
import { FlairSelector } from './FlairSelector'
import { ContentSensitivitySelector, ContentSensitivity } from './ContentSensitivitySelector'
import { RichTextEditor } from './RichTextEditor'
import { MediaUploadZone } from './MediaUploadZone'
import { LinkPostInput, LinkPreviewData } from './LinkPostInput'
import { cn } from '@/lib/utils'
import { aiClient, ModerationResult } from '@/services/aiClient'
import { useToast } from '@/hooks/use-toast'

interface Community {
  id: string
  name: string
  display_name: string
  member_count: number
}

interface CreatePostFormProps {
  communities: Community[]
  onSubmit: (data: PostFormData) => void
  disabled?: boolean
  initialValues?: Partial<PostFormData & { title?: string; content?: string }>
  isEditing?: boolean
  defaultCommunityId?: string
}

export interface PostFormData {
  title: string
  content: string
  communityId?: string
  tags: string[]
  contentSensitivity: ContentSensitivity
  evidenceFiles: File[]
  postType: 'text' | 'media' | 'link'
  linkUrl?: string
  linkTitle?: string
  linkDescription?: string
  linkImage?: string
  flairIds?: string[]
  governance_verdict?: string
  governance_confidence?: number
}

const POST_TYPES = [
  {
    id: 'text' as const,
    label: 'Text',
    icon: FileText,
    description: 'Create a discussion post with rich text formatting'
  },
  {
    id: 'media' as const,
    label: 'Image & Video',
    icon: Image,
    description: 'Share images, videos, or documents'
  },
  {
    id: 'link' as const,
    label: 'Link',
    icon: Link2,
    description: 'Share a link to an article or website'
  }
]

const DRAFT_STORAGE_KEY = 'wana_post_draft'

export const CreatePostForm = ({ communities, onSubmit, disabled, initialValues, isEditing, defaultCommunityId }: CreatePostFormProps) => {
  const { toast } = useToast()
  // Form state
  const [postType, setPostType] = useState<'text' | 'media' | 'link'>(initialValues?.postType || 'text')
  const [title, setTitle] = useState(initialValues?.title || '')
  const [content, setContent] = useState(initialValues?.content || '')
  const [communityId, setCommunityId] = useState<string | undefined>(initialValues?.communityId || defaultCommunityId)
  const [flairIds, setFlairIds] = useState<string[]>(initialValues?.flairIds || [])
  const [contentSensitivity, setContentSensitivity] = useState<ContentSensitivity>(initialValues?.contentSensitivity || 'public')
  const [files, setFiles] = useState<File[]>([])
  const [linkUrl, setLinkUrl] = useState('')
  const [linkPreview, setLinkPreview] = useState<LinkPreviewData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // AI State
  const [governanceResult, setGovernanceResult] = useState<ModerationResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load draft from localStorage on mount (skip if defaultCommunityId is provided for modal usage)
  useEffect(() => {
    // Don't load draft when opened from community sidebar (defaultCommunityId set)
    if (defaultCommunityId) return;

    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        setPostType(draft.postType || 'text')
        setTitle(draft.title || '')
        setContent(draft.content || '')
        setCommunityId(draft.communityId)
        setFlairIds(draft.flairIds || [])
        setContentSensitivity(draft.contentSensitivity || 'public')
        setLinkUrl(draft.linkUrl || '')
      } catch (error) {
        console.error('Failed to load draft:', error)
      }
    }
  }, [defaultCommunityId])

  // Auto-save draft to localStorage
  useEffect(() => {
    const draft = {
      postType,
      title,
      content,
      communityId,
      flairIds,
      contentSensitivity,
      linkUrl,
      timestamp: Date.now()
    }
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }, [postType, title, content, communityId, flairIds, contentSensitivity, linkUrl])

  const handleSaveDraft = () => {
    // Draft is auto-saved, just notify user
    toast({
      title: "Draft Saved",
      description: "Your post will be restored when you return."
    })
  }

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY)
    setTitle('')
    setContent('')
    setCommunityId(undefined)
    setFlairIds([])
    setContentSensitivity('public')
    setFiles([])
    setLinkUrl('')
  }

  const validateForm = (): string | null => {
    if (!title.trim()) {
      return 'Please enter a title for your post'
    }

    if (title.length > 300) {
      return 'Title must be 300 characters or less'
    }

    if (postType === 'link' && !linkUrl.trim()) {
      return 'Please enter a URL for your link post'
    }

    if (postType === 'link') {
      try {
        new URL(linkUrl)
      } catch {
        return 'Please enter a valid URL'
      }
    }

    if (postType === 'media' && files.length === 0) {
      return 'Please upload at least one file for your media post'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const validationError = validateForm()
    if (validationError) {
      toast({
        title: "Missing Information",
        description: validationError,
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    setGovernanceResult(null)

    try {
      // STEP 1: AI Governance Check
      const governance = await aiClient.governance(
        'post',
        JSON.stringify({
          title: title.trim(),
          description: content.trim(),
          metadata: { tags: flairIds }
        })
      );
      
      setGovernanceResult(governance);

      // STEP 2: Handle Verdict
      if (governance.verdict === 'BLOCKED') {
        setIsSubmitting(false)
        return; // UI will show the block message
      }

      if (governance.verdict === 'NEEDS_REVISION') {
        setShowSuggestions(true);
        setIsSubmitting(false)
        return;
      }

      if (governance.verdict === 'FLAGGED') {
        const confirmed = confirm(
          `Your post was flagged: ${governance.reason}\n\nDo you still want to post?`
        );
        if (!confirmed) {
            setIsSubmitting(false)
            return;
        }
      }

      const formData: PostFormData = {
        title: title.trim(),
        content: content.trim(),
        communityId,
        tags: flairIds,
        contentSensitivity,
        evidenceFiles: files,
        postType,
        linkUrl: postType === 'link' ? linkUrl.trim() : undefined,
        linkTitle: postType === 'link' ? (linkPreview?.title || undefined) : undefined,
        linkDescription: postType === 'link' ? (linkPreview?.description || undefined) : undefined,
        linkImage: postType === 'link' ? (linkPreview?.image || undefined) : undefined,
        flairIds,
        governance_verdict: governance.verdict,
        governance_confidence: governance.confidence
      }

      await onSubmit(formData)

      // Clear form and draft on successful submission
      clearDraft()
      setGovernanceResult(null)
    } catch (error) {
      console.error('Form submission error:', error)
      toast({
        title: "Error",
        description: "Failed to process post. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 max-w-3xl mx-auto">
      {/* Community Selection */}
      <CommunitySelector
        communities={communities}
        selectedCommunityId={communityId}
        onSelectCommunity={setCommunityId}
        disabled={disabled || isSubmitting}
      />

      {/* Post Type Tabs */}
      <Tabs value={postType} onValueChange={(v) => setPostType(v as typeof postType)}>
        <TabsList className="flex w-full justify-start h-auto p-0 bg-transparent mb-4 border-b">
          {POST_TYPES.map(type => {
            const Icon = type.icon
            return (
              <TabsTrigger
                key={type.id}
                value={type.id}
                disabled={disabled || isSubmitting}
                className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 font-semibold text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent shadow-none"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Options Row (Above Title, Reddit Style) */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <ContentSensitivitySelector
            value={contentSensitivity}
            onValueChange={setContentSensitivity}
            disabled={disabled || isSubmitting}
          />
          <FlairSelector
            selectedFlairIds={flairIds}
            onSelectFlairs={setFlairIds}
            disabled={disabled || isSubmitting}
          />
        </div>

        {/* Title Input (shown for all types) */}
        <div className="space-y-1">
          <Input
            placeholder="Title*"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            disabled={disabled || isSubmitting}
            required
            className="text-base font-semibold border-input bg-background h-11"
          />
          <div className="flex justify-end text-xs text-muted-foreground">
            <span>{title.length}/300</span>
          </div>
        </div>

        {/* Text Post Content */}
        <TabsContent value="text" className="space-y-4 mt-4">
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Body text (optional)"
            disabled={disabled || isSubmitting}
          />

          {/* Optional file attachments for text posts */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Add supporting files (optional)
            </summary>
            <div className="mt-4">
              <MediaUploadZone
                files={files}
                onFilesChange={setFiles}
                disabled={disabled || isSubmitting}
                maxFiles={5}
                maxSizeMB={40}
              />
            </div>
          </details>
        </TabsContent>

        {/* Media Post Content */}
        <TabsContent value="media" className="space-y-4 mt-4">
          <MediaUploadZone
            files={files}
            onFilesChange={setFiles}
            disabled={disabled || isSubmitting}
            maxFiles={10}
            maxSizeMB={100}
          />

          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Body text (optional) add context for your media..."
            disabled={disabled || isSubmitting}
          />
        </TabsContent>

        {/* Link Post Content */}
        <TabsContent value="link" className="space-y-4 mt-4">
          <LinkPostInput
            url={linkUrl}
            onUrlChange={setLinkUrl}
            onPreviewChange={setLinkPreview}
            disabled={disabled || isSubmitting}
          />

          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Body text (optional) add your commentary..."
            disabled={disabled || isSubmitting}
          />
        </TabsContent>
      </Tabs>

      {/* AI Blocked Message */}
      {governanceResult?.verdict === 'BLOCKED' && (
        <div className="rounded-lg border-2 border-red-400 bg-red-50 p-4 mb-4">
            <h3 className="font-semibold text-red-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Post Blocked by Governance AI
            </h3>
            <p className="mt-2 text-sm text-red-700">
                {governanceResult.reason}
            </p>
            <p className="mt-1 text-xs text-red-600">
                Please revise your content to adhere to community guidelines.
            </p>
        </div>
      )}

      {/* AI Suggestions Modal (Inline) */}
      {showSuggestions && governanceResult?.verdict === 'NEEDS_REVISION' && (
        <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-4 mb-4">
          <h3 className="font-semibold text-yellow-800">
            💡 AI Suggestions to Improve Your Post
          </h3>
          <p className="mt-2 text-sm text-yellow-700">
            {governanceResult.reason}
          </p>
          <button
            type="button"
            onClick={() => setShowSuggestions(false)}
            className="mt-3 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
          >
            Edit and try again
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 mt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                   <AlertCircle className="h-4 w-4 mr-1.5" />
                   Guidelines
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm" align="start">
              <h4 className="font-semibold mb-2">Posting Guidelines</h4>
              <ul className="space-y-1.5 text-muted-foreground">
                <li>• Ensure your title is clear and descriptive</li>
                <li>• Provide evidence for corruption claims</li>
                <li>• Be respectful and avoid personal attacks</li>
                <li>• Max limits: Videos (100MB), Images (40MB)</li>
              </ul>
            </PopoverContent>
          </Popover>
          <div className="hidden sm:flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-full">
            <Lock className="h-3 w-3" />
            <span>
              {contentSensitivity === 'crisis'
                ? 'Crisis reports are immediately escalated'
                : contentSensitivity === 'sensitive'
                  ? 'Sensitive posts undergo additional verification'
                  : 'Your post will be reviewed by moderators'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full px-6"
            onClick={handleSaveDraft}
            disabled={disabled || isSubmitting}
          >
            Save Draft
          </Button>
          <Button
            type="submit"
            className="rounded-full px-8 font-semibold"
            disabled={disabled || isSubmitting || !title.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </form>
  )
}
