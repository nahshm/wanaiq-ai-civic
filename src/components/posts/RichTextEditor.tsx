import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Undo,
    Redo,
    Link2,
    Heading2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import './editor.css'

interface RichTextEditorProps {
    content: string
    onChange: (content: string) => void
    placeholder?: string
    disabled?: boolean
}

export const RichTextEditor = ({
    content,
    onChange,
    placeholder = 'Share your thoughts...',
    disabled
}: RichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3]
                },
                // Disable built-in link to avoid duplicate with standalone Link extension
                link: false,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            CharacterCount,
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        },
        editable: !disabled,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-4 prose-ul:list-disc prose-ol:list-decimal prose-li:ml-4'
            }
        }
    })

    if (!editor) {
        return null
    }

    const ToolbarButton = ({
        onClick,
        isActive,
        icon: Icon,
        title
    }: {
        onClick: () => void
        isActive?: boolean
        icon: React.ElementType
        title: string
    }) => (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'h-8 w-8 p-0',
                isActive && 'bg-accent'
            )}
            title={title}
        >
            <Icon className="h-4 w-4" />
        </Button>
    )

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        if (url === null) {
            return
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }

    return (
        <div className="space-y-2">
            <Label>Content (optional)</Label>

            {/* Toolbar */}
            <div className="border rounded-t-lg bg-muted p-2 flex flex-wrap gap-1">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    icon={Bold}
                    title="Bold"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    icon={Italic}
                    title="Italic"
                />

                <div className="w-px bg-border mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    icon={Heading2}
                    title="Heading"
                />

                <div className="w-px bg-border mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    icon={List}
                    title="Bullet List"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    icon={ListOrdered}
                    title="Numbered List"
                />

                <div className="w-px bg-border mx-1" />

                <ToolbarButton
                    onClick={() => setLink()}
                    isActive={editor.isActive('link')}
                    icon={Link2}
                    title="Add Link"
                />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    icon={Quote}
                    title="Quote"
                />

                <div className="flex-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    icon={Undo}
                    title="Undo"
                />
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    icon={Redo}
                    title="Redo"
                />
            </div>

            {/* Editor Content */}
            <div className={cn(
                'border rounded-b-lg bg-background',
                disabled && 'opacity-50'
            )}>
                <EditorContent editor={editor} />
            </div>

            {/* Character count */}
            <div className="text-xs text-muted-foreground text-right">
                {editor.storage.characterCount?.characters() || 0} characters
            </div>
        </div>
    )
}
