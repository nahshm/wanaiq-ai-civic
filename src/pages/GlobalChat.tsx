import React from 'react';
import { MessageCircle, Settings, Edit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GlobalChat = () => {
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] md:flex-row bg-background">
            {/* Sidebar / Conversaton List */}
            <div className="w-full md:w-80 border-r border-border bg-card flex flex-col flex-shrink-0">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h1 className="text-xl font-bold">Messages</h1>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search messages" 
                            className="pl-9 bg-muted/50 border-none rounded-full"
                        />
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                        <MessageCircle className="h-12 w-12 mb-4 opacity-20" />
                        <h3 className="font-semibold text-foreground mb-1">Welcome to your inbox!</h3>
                        <p className="text-sm">Drop a line, share posts and more with private conversations between you and others on WanaIQ.</p>
                        <Button className="mt-6 rounded-full font-bold">
                            Write a message
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-background/50 text-center p-8">
                <div className="max-w-md">
                    <h2 className="text-2xl font-bold mb-2">Select a message</h2>
                    <p className="text-muted-foreground mb-6">
                        Choose from your existing conversations, start a new one, or just keep swimming.
                    </p>
                    <Button size="lg" className="rounded-full font-bold px-8">
                        New message
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default GlobalChat;
