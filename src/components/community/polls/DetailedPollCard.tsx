import React, { useState } from 'react';
import { BarChart2, CheckCircle2, Share2, MoreHorizontal, Bell, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface DetailedPollCardProps {
    poll: any;
    hasVoted: boolean;
    userChoice?: number;
    results: number[];
    totalVotes: number;
    onVote: (pollId: string, optionIndex: number) => void;
    bannerUrl?: string;
}

export const DetailedPollCard: React.FC<DetailedPollCardProps> = ({ 
    poll, 
    hasVoted, 
    userChoice, 
    results, 
    totalVotes, 
    onVote,
    bannerUrl 
}) => {
    const { toast } = useToast();
    const [interested, setInterested] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/communities?poll=${poll.id}`);
        toast({ title: 'Link copied', description: 'Poll link copied to clipboard.' });
    };

    const handleInterested = () => {
        setInterested(!interested);
        toast({ 
            title: !interested ? 'Subscribed to poll' : 'Unsubscribed', 
            description: !interested ? "We'll notify you when the poll ends." : "You will no longer receive notifications.",
            duration: 3000
        });
    };

    const optionsArray = Array.isArray(poll.options) ? poll.options : [];
    const maxVotes = Math.max(...(results.length > 0 ? results : [0]));
    
    // Default gradient if no banner
    const defaultBanner = "bg-gradient-to-r from-emerald-800 via-teal-900 to-cyan-600 bg-opacity-50";

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm mb-6 max-w-3xl mx-auto">
            {/* Banner Section */}
            <div className={`h-24 md:h-32 w-full relative ${!bannerUrl ? defaultBanner : ''}`}>
                {bannerUrl && (
                    <img src={bannerUrl} alt="Poll Banner" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-6">
                    <div className="flex items-center gap-2 text-white/80 font-medium mb-1 absolute top-4 left-6">
                        <BarChart2 className="w-5 h-5" />
                        <span>Community Poll</span>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 md:p-8">
                <h3 className="text-2xl md:text-3xl font-extrabold text-foreground mb-2 leading-tight">
                    {poll.question}
                </h3>
                <div className="text-muted-foreground text-sm mb-8 flex items-center gap-2">
                    <span>Asked {format(new Date(poll.created_at), 'MMM do, yyyy')}</span>
                    <span>•</span>
                    <span className="font-semibold">{totalVotes} votes cast</span>
                </div>

                {/* Voting Area */}
                <div className="mb-8 pl-1">
                    {!hasVoted ? (
                        <RadioGroup onValueChange={(val) => onVote(poll.id, parseInt(val))} className="space-y-4">
                            {optionsArray.map((option: string, idx: number) => (
                                <div key={idx} className="flex items-center space-x-3 p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer group">
                                    <RadioGroupItem value={idx.toString()} id={`poll-${poll.id}-${idx}`} className="w-5 h-5" />
                                    <Label htmlFor={`poll-${poll.id}-${idx}`} className="text-base cursor-pointer font-medium flex-1">
                                        {option}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    ) : (
                        <div className="space-y-5">
                            {optionsArray.map((option: string, idx: number) => {
                                const count = results[idx] || 0;
                                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                                const isWinner = totalVotes > 0 && count === maxVotes;
                                const isUserChoice = userChoice === idx;

                                return (
                                    <div key={idx} className="relative">
                                        <div className="flex justify-between items-end mb-2 px-1">
                                            <span className={`text-base flex items-center gap-2 ${isWinner ? 'font-bold text-foreground' : 'text-muted-foreground font-medium'}`}>
                                                {option}
                                                {isUserChoice && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                            </span>
                                            <span className={`text-sm font-bold ${isWinner ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {percentage}%
                                            </span>
                                        </div>
                                        <div className="h-4 w-full bg-secondary overflow-hidden rounded-full">
                                            <div 
                                                className={`h-full transition-all duration-1000 ease-out rounded-full ${isWinner ? 'bg-primary' : 'bg-primary/40'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="mt-1 text-xs text-right text-muted-foreground/70 font-medium">
                                            {count} {count === 1 ? 'vote' : 'votes'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-border/50 mt-6 pt-6">
                    <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        Poll is active
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Button variant="secondary" size="icon" className="h-9 w-9 bg-secondary hover:bg-secondary/80">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleCopyLink} className="h-9 font-semibold bg-secondary hover:bg-secondary/80">
                            <Copy className="w-4 h-4 mr-2" />
                            Share Poll
                        </Button>
                        <Button variant={interested ? "secondary" : "secondary"} size="sm" onClick={handleInterested} className={`h-9 font-semibold ${interested ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/80'}`}>
                            <Bell className={`w-4 h-4 mr-2 ${interested ? 'fill-current' : ''}`} />
                            {interested ? 'Following' : 'Follow Results'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
