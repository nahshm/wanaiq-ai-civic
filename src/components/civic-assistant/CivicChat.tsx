import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { aiClient, Source, ChatMessage } from '@/services/aiClient';
import { v4 as uuidv4 } from 'uuid';
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  X,
  Send,
  Loader2,
  User,
  Bot,
  Plus,
  Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const RECOMMENDED_QUESTIONS = [
  { text: "How do I report a pothole?", icon: "🛣️" },
  { text: "What are the requirements for a business permit?", icon: "💼" },
  { text: "Where is the nearest huduma center?", icon: "📍" },
  { text: "Who is my MCA?", icon: "👤" },
  { text: "How is the county budget allocated?", icon: "💰" },
  { text: "Report illegal dumping procedure", icon: "🗑️" },
];

interface RecentSession {
  id: string;
  firstQuery: string;
  timestamp: number;
}

interface UserContext {
  name: string;
  county: string;
  role: string;
  interests: string[];
}

const RECENT_SESSIONS_KEY = 'wana_brain_recent_sessions';
const CURRENT_SESSION_KEY = 'wana_brain_session';

function getRecentSessions(): RecentSession[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SESSIONS_KEY) || '[]');
  } catch { return []; }
}

function saveRecentSession(session: RecentSession) {
  const sessions = getRecentSessions().filter(s => s.id !== session.id);
  sessions.unshift(session);
  localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(sessions.slice(0, 10)));
}

function removeRecentSession(id: string) {
  const sessions = getRecentSessions().filter(s => s.id !== id);
  localStorage.setItem(RECENT_SESSIONS_KEY, JSON.stringify(sessions));
}

// Extracted outside component to prevent remount on every render
function LanguageToggle({ language, setLanguage }: { language: 'en' | 'sw'; setLanguage: (l: 'en' | 'sw') => void }) {
  return (
    <div className="flex gap-1 bg-muted p-0.5 rounded-full">
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
          language === 'en' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('sw')}
        className={cn(
          "px-2.5 py-1 rounded-full text-xs font-medium transition-all",
          language === 'sw' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        SW
      </button>
    </div>
  );
}

export function CivicChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem(CURRENT_SESSION_KEY) || uuidv4());
  const [language, setLanguage] = useState<'en' | 'sw'>('en');
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>(getRecentSessions());
  const [view, setView] = useState<'welcome' | 'chat'>('welcome');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    const fetchUserContext = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, county, persona')
        .eq('id', user.id)
        .single();

      const { data: interests } = await supabase
        .from('user_interests')
        .select('civic_interests(display_name)')
        .eq('user_id', user.id);

      if (profile) {
        setUserContext({
          name: profile.display_name || 'Citizen',
          county: profile.county || 'Kenya',
          role: profile.persona || 'citizen',
          interests: (interests || [])
            .map((i: any) => i.civic_interests?.display_name)
            .filter(Boolean),
        });
      }
    };
    fetchUserContext();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewSession = useCallback(() => {
    const newId = uuidv4();
    setSessionId(newId);
    setMessages([]);
    setView('welcome');
    setInput('');
    localStorage.setItem(CURRENT_SESSION_KEY, newId);
  }, []);

  const loadSession = useCallback(async (sid: string) => {
    setSessionId(sid);
    localStorage.setItem(CURRENT_SESSION_KEY, sid);
    setView('chat');
    try {
      const history = await aiClient.getHistory(sid);
      setMessages(history.length > 0 ? history : []);
    } catch {
      setMessages([]);
    }
  }, []);

  const deleteSession = useCallback((sid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecentSession(sid);
    setRecentSessions(getRecentSessions());
    if (sid === sessionId) {
      startNewSession();
    }
  }, [sessionId, startNewSession]);

  const handleSend = async (text?: string) => {
    const query = text || input.trim();
    if (!query || isStreaming) return;

    setInput('');
    setIsStreaming(true);
    setView('chat');

    saveRecentSession({ id: sessionId, firstQuery: query, timestamp: Date.now() });
    setRecentSessions(getRecentSessions());

    const userMessage: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: query,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    const assistantId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    }]);

    try {
      await aiClient.ragStream(
        query,
        sessionId,
        language,
        (delta) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: msg.content + delta }
                : msg
            )
          );
        },
        () => {
          setIsStreaming(false);
          inputRef.current?.focus();
        },
        (error) => {
          console.error('Stream error:', error);
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantId
                ? { ...msg, content: `Error: ${error.message}. Please try again.` }
                : msg
            )
          );
          setIsStreaming(false);
        }
      );
    } catch (error) {
      console.error('RAG error:', error);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Welcome View ──
  if (view === 'welcome') {
    return (
      <div className="h-full min-h-0 flex flex-col overflow-hidden bg-background">
        <div className="flex-shrink-0 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 z-30">
          <div className="mx-auto w-full max-w-2xl flex items-center justify-between px-4 py-3">
            <LanguageToggle language={language} setLanguage={setLanguage} />
            <Button variant="outline" size="sm" onClick={startNewSession} className="rounded-full gap-1.5 text-xs h-8">
              <Plus className="w-3.5 h-3.5" />
              New question
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="flex flex-col items-center pt-8 md:pt-10 px-4 pb-8">

          {/* Hero */}
          <div className="flex flex-col items-center mb-8 space-y-3 text-center">
            <div className="bg-primary/10 p-3 rounded-2xl">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              WanaIQ Answers
            </h1>
            <p className="text-muted-foreground text-base max-w-md">
              Real answers from Kenya's constitution, laws, and community data.
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full max-w-2xl mb-8">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={language === 'sw' ? 'Uliza swali lolote...' : 'Ask a civic question...'}
                className="w-full rounded-xl h-14 pl-5 pr-14 text-base border-border/50 shadow-sm bg-card focus-visible:ring-primary/30"
                autoFocus
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim()}
                className="absolute right-2 top-2 h-10 w-10 rounded-lg"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>

          {/* Personalization */}
          {userContext && (
            <div className="mb-6 bg-primary/5 border border-primary/10 px-4 py-2 rounded-full flex items-center gap-2 text-xs text-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              🎯 <strong>{userContext.name}</strong> • {userContext.county}
            </div>
          )}

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <div className="w-full max-w-2xl mb-8">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Recent
              </h3>
              <div className="flex flex-wrap gap-2">
                {recentSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadSession(session.id)}
                    className="group flex items-center gap-1.5 bg-muted hover:bg-accent text-foreground text-xs px-3 py-1.5 rounded-full transition-colors max-w-[250px]"
                  >
                    <span className="truncate">{session.firstQuery}</span>
                    <span
                      role="button"
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Questions */}
          <div className="w-full max-w-2xl">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              Trending Questions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {RECOMMENDED_QUESTIONS.map((item, i) => (
                <Card
                  key={i}
                  onClick={() => handleSend(item.text)}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm text-foreground group-hover:text-primary">{item.text}</span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  }

  // ── Chat View ──
  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden bg-background">
      {/* Top bar - always visible */}
      <header className="sticky top-0 z-30 flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <Button variant="ghost" size="sm" onClick={() => setView('welcome')} className="gap-1.5 text-xs h-8 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Button>
        <div className="flex items-center gap-2">
          <LanguageToggle language={language} setLanguage={setLanguage} />
          <Button variant="outline" size="sm" onClick={startNewSession} className="rounded-full gap-1.5 text-xs h-8">
            <Plus className="w-3.5 h-3.5" />
            New
          </Button>
        </div>
      </header>

      {/* Messages - scrollable */}
      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "flex gap-3 max-w-2xl mx-auto",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}

              <div className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm",
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              )}>
                {message.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        a: ({ href, children }) => (
                          <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {message.content || (isStreaming ? '...' : '')}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>{message.content}</p>
                )}

                {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex flex-wrap gap-1.5">
                      {message.sources.slice(0, 3).map((source, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-background/50 px-2 py-0.5 rounded-full text-muted-foreground"
                        >
                          {source.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-3.5 h-3.5 text-primary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isStreaming && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs max-w-2xl mx-auto pl-10">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input bar - always visible */}
      <footer className="flex-shrink-0 border-t border-border/50 bg-background p-3">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2 max-w-2xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={language === 'sw' ? 'Uliza swali lingine...' : 'Ask a follow-up...'}
            disabled={isStreaming}
            className="flex-1 h-10 rounded-full px-4 text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isStreaming}
            className="h-10 w-10 rounded-full"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </footer>
    </div>
  );
}
