import { Link } from 'react-router-dom'
import { FileText, MessageSquare, User, Users, Briefcase, Target, FolderKanban } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { SearchResults } from '@/hooks/useSearch'
import { SafeContentRenderer } from '@/components/posts/SafeContentRenderer'
import { buildProfileLink } from '@/lib/profile-links'

interface SearchQuickResultsProps {
    results?: SearchResults
    query: string
    onClose: () => void
}

export const SearchQuickResults = ({ results, query, onClose }: SearchQuickResultsProps) => {
    if (!results) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Start typing to search...
            </div>
        )
    }

    const hasResults = Object.values(results).some((arr: any) => arr?.length > 0)

    if (!hasResults) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                No results found for "{query}"
            </div>
        )
    }

    return (
        <div className="p-2">
            {/* Posts */}
            {results.posts && results.posts.length > 0 && (
                <div className="mb-4">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Posts
                    </div>
                    {results.posts.map((post: any) => (
                        <Link
                            key={post.id}
                            to={`/posts/${post.id}`}
                            onClick={onClose}
                            className="block px-3 py-2 hover:bg-accent rounded-md"
                        >
                            <div className="font-medium text-sm line-clamp-1">{post.title}</div>
                            <div className="text-xs text-muted-foreground">
                                by {post.author?.username || 'Unknown'}
                                {post.community && ` in c/${post.community.name}`}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Comments */}
            {results.comments && results.comments.length > 0 && (
                <div className="mb-4">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        Comments
                    </div>
                    {results.comments.map((comment: any) => (
                        <Link
                            key={comment.id}
                            to={`/posts/${comment.post?.id}#comment-${comment.id}`}
                            onClick={onClose}
                            className="block px-3 py-2 hover:bg-accent rounded-md"
                        >
                            <SafeContentRenderer
                                content={comment.content || ''}
                                className="text-sm"
                                truncate={true}
                                maxLength={80}
                            />
                            <div className="text-xs text-muted-foreground">
                                by {comment.author?.username || 'Unknown'} on {comment.post?.title}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Users */}
            {results.users && results.users.length > 0 && (
                <div className="mb-4">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Users
                    </div>
                    {results.users.map((user: any) => (
                        <Link
                            key={user.id}
                            to={buildProfileLink({ username: user.username, is_verified: user.is_verified, official_position: user.official_position })}
                            onClick={onClose}
                            className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md"
                        >
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-medium text-sm">u/{user.username}</div>
                                {user.karma !== undefined && (
                                    <div className="text-xs text-muted-foreground">{user.karma} karma</div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Communities */}
            {results.communities && results.communities.length > 0 && (
                <div className="mb-4">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        Communities
                    </div>
                    {results.communities.map((community: any) => (
                        <Link
                            key={community.id}
                            to={`/c/${community.name}`}
                            onClick={onClose}
                            className="block px-3 py-2 hover:bg-accent rounded-md"
                        >
                            <div className="font-medium text-sm">c/{community.name}</div>
                            <div className="text-xs text-muted-foreground">
                                {community.member_count || 0} members
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Officials */}
            {results.officials && results.officials.length > 0 && (
                <div className="mb-4">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <Briefcase className="h-3 w-3" />
                        Officials
                    </div>
                    {results.officials.map((official: any) => (
                        <Link
                            key={official.id}
                            to={`/g/${official.id}`}
                            onClick={onClose}
                            className="block px-3 py-2 hover:bg-accent rounded-md"
                        >
                            <div className="font-medium text-sm">{official.name}</div>
                            <div className="text-xs text-muted-foreground">
                                {official.position} - {official.constituency || official.county}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Promises */}
            {results.promises && results.promises.length > 0 && (
                <div className="mb-4">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <Target className="h-3 w-3" />
                        Promises
                    </div>
                    {results.promises.map((promise: any) => (
                        <Link
                            key={promise.id}
                            to={`/pr/${promise.id}`}
                            onClick={onClose}
                            className="block px-3 py-2 hover:bg-accent rounded-md"
                        >
                            <div className="font-medium text-sm line-clamp-1">{promise.title}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                    {promise.status}
                                </Badge>
                                {promise.progress_percentage !== undefined && (
                                    <span>{promise.progress_percentage}% complete</span>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Projects */}
            {results.projects && results.projects.length > 0 && (
                <div className="mb-4">
                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <FolderKanban className="h-3 w-3" />
                        Projects
                    </div>
                    {results.projects.map((project: any) => (
                        <Link
                            key={project.id}
                            to={`/p/${project.id}`}
                            onClick={onClose}
                            className="block px-3 py-2 hover:bg-accent rounded-md"
                        >
                            <div className="font-medium text-sm line-clamp-1">{project.title}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                    {project.status}
                                </Badge>
                                {project.county && <span>{project.county}</span>}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <Link
                to={`/search?q=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="block px-3 py-2 text-center text-sm text-primary hover:underline"
            >
                See all results →
            </Link>
        </div>
    )
}
