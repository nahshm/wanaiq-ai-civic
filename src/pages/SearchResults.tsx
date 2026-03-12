import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useSearch } from '@/hooks/useSearch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PostCard } from '@/components/posts/PostCard'
import { Loader2, User, Users, Briefcase, Target, FolderKanban, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { buildProfileLink } from '@/lib/profile-links'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SafeContentRenderer } from '@/components/posts/SafeContentRenderer'

export const SearchResults = () => {
    const [searchParams] = useSearchParams()
    const query = searchParams.get('q') || ''
    const [activeTab, setActiveTab] = useState('all')
    const [sort, setSort] = useState<'relevance' | 'date' | 'votes'>('relevance')

    const { data, isLoading } = useSearch({
        query,
        type: activeTab as any,
        sort,
        limit: 20
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    const totalResults = data ? Object.values(data).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0) : 0

    return (
        <div className="container max-w-6xl mx-auto p-4">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">
                    Search results for "{query}"
                </h1>
                <p className="text-muted-foreground">
                    {totalResults} results found
                </p>
            </div>

            <div className="flex justify-between items-center mb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex justify-between items-center mb-4">
                        <TabsList className="flex-wrap h-auto">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="posts">Posts</TabsTrigger>
                            <TabsTrigger value="comments">Comments</TabsTrigger>
                            <TabsTrigger value="users">Users</TabsTrigger>
                            <TabsTrigger value="communities">Communities</TabsTrigger>
                            <TabsTrigger value="officials">Officials</TabsTrigger>
                            <TabsTrigger value="promises">Promises</TabsTrigger>
                            <TabsTrigger value="projects">Projects</TabsTrigger>
                        </TabsList>

                        <Select value={sort} onValueChange={(v) => setSort(v as any)}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="relevance">Relevance</SelectItem>
                                <SelectItem value="date">Most Recent</SelectItem>
                                <SelectItem value="votes">Most Voted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <TabsContent value="all" className="space-y-4">
                        {/* Posts */}
                        {data?.posts && data.posts.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Posts</h3>
                                {data.posts.map((post: any) => (
                                    <PostCard key={post.id} post={post} onVote={() => { }} viewMode="card" />
                                ))}
                            </div>
                        )}

                        {/* Users */}
                        {data?.users && data.users.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Users
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.users.map((user: any) => (
                                        <Card key={user.id}>
                                            <CardContent className="p-4">
                                                <Link to={buildProfileLink({ username: user.username, is_verified: user.is_verified, official_position: user.official_position })} className="flex items-center gap-3">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={user.avatar} />
                                                        <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="font-medium">u/{user.username}</div>
                                                        {user.bio && <div className="text-sm text-muted-foreground line-clamp-1">{user.bio}</div>}
                                                        <div className="text-xs text-muted-foreground">{user.karma || 0} karma</div>
                                                    </div>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Communities */}
                        {data?.communities && data.communities.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Communities
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.communities.map((community: any) => (
                                        <Card key={community.id}>
                                            <CardContent className="p-4">
                                                <Link to={`/c/${community.name}`}>
                                                    <div className="font-medium">c/{community.name}</div>
                                                    {community.description && (
                                                        <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                            {community.description}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-muted-foreground mt-2">
                                                        {community.member_count || 0} members
                                                    </div>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Officials */}
                        {data?.officials && data.officials.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    Officials
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {data.officials.map((official: any) => (
                                        <Card key={official.id}>
                                            <CardContent className="p-4">
                                                <Link to={`/g/${official.id}`}>
                                                    <div className="font-medium">{official.name}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {official.position} - {official.constituency || official.county}
                                                    </div>
                                                </Link>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="posts" className="space-y-4">
                        {data?.posts && data.posts.length > 0 ? (
                            data.posts.map((post: any) => (
                                <PostCard key={post.id} post={post} onVote={() => { }} viewMode="card" />
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No posts found for "{query}"
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="comments" className="space-y-4">
                        {data?.comments && data.comments.length > 0 ? (
                            data.comments.map((comment: any) => (
                                <Card key={comment.id}>
                                    <CardContent className="p-4">
                                        <Link to={`/posts/${comment.post?.id}#comment-${comment.id}`}>
                                            <div className="flex items-start gap-2">
                                                <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                                                <div className="flex-1">
                                                    <SafeContentRenderer
                                                        content={comment.content || ''}
                                                        className="text-sm"
                                                        truncate={true}
                                                        maxLength={100}
                                                    />
                                                    <div className="text-xs text-muted-foreground mt-2">
                                                        by {comment.author?.username} on {comment.post?.title}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No comments found for "{query}"
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="users" className="space-y-4">
                        {data?.users && data.users.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.users.map((user: any) => (
                                    <Card key={user.id}>
                                        <CardContent className="p-4">
                                            <Link to={buildProfileLink({ username: user.username, is_verified: user.is_verified, official_position: user.official_position })} className="flex items-center gap-3">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={user.avatar} />
                                                    <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="font-medium">u/{user.username}</div>
                                                    {user.bio && <div className="text-sm text-muted-foreground line-clamp-1">{user.bio}</div>}
                                                    <div className="text-xs text-muted-foreground">{user.karma || 0} karma</div>
                                                </div>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No users found for "{query}"
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="communities" className="space-y-4">
                        {data?.communities && data.communities.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.communities.map((community: any) => (
                                    <Card key={community.id}>
                                        <CardContent className="p-4">
                                            <Link to={`/c/${community.name}`}>
                                                <div className="font-medium">c/{community.name}</div>
                                                {community.description && (
                                                    <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                        {community.description}
                                                    </div>
                                                )}
                                                <div className="text-xs text-muted-foreground mt-2">
                                                    {community.member_count || 0} members
                                                </div>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No communities found for "{query}"
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="officials" className="space-y-4">
                        {data?.officials && data.officials.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {data.officials.map((official: any) => (
                                    <Card key={official.id}>
                                        <CardContent className="p-4">
                                            <Link to={`/g/${official.id}`}>
                                                <div className="font-medium">{official.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {official.position} - {official.constituency || official.county}
                                                </div>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No officials found for "{query}"
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="promises" className="space-y-4">
                        {data?.promises && data.promises.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {data.promises.map((promise: any) => (
                                    <Card key={promise.id}>
                                        <CardContent className="p-4">
                                            <Link to={`/pr/${promise.id}`}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="font-medium">{promise.title}</div>
                                                        {promise.description && (
                                                            <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                                {promise.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge variant="outline">{promise.status}</Badge>
                                                        {promise.progress_percentage !== undefined && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {promise.progress_percentage}% complete
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No promises found for "{query}"
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-4">
                        {data?.projects && data.projects.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {data.projects.map((project: any) => (
                                    <Card key={project.id}>
                                        <CardContent className="p-4">
                                            <Link to={`/p/${project.id}`}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="font-medium">{project.title}</div>
                                                        {project.description && (
                                                            <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                                {project.description}
                                                            </div>
                                                        )}
                                                        {project.county && (
                                                            <div className="text-xs text-muted-foreground mt-2">
                                                                {project.county}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <Badge variant="outline">{project.status}</Badge>
                                                        {project.progress_percentage !== undefined && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {project.progress_percentage}% complete
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                No projects found for "{query}"
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
