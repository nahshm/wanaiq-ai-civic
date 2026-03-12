import { supabase } from '@/integrations/supabase/client';

export interface ModerationResult {
  verdict: 'APPROVED' | 'NEEDS_REVISION' | 'BLOCKED' | 'FLAGGED';
  reason: string;
  confidence: number;
  flags: string[];
  processing_time_ms: number;
}

export interface RoutingResult {
  institution_id: string | null;
  institution_name: string;
  institution_acronym: string | null;
  institution_type: string;
  institution_website: string | null;
  institution_email: string | null;
  institution_phone: string | null;
  institution_address: string | null;
  issue_type: string;
  department_slug: string;
  jurisdiction: string;
  severity: number;
  confidence: number;
  recommended_actions: string[];
  formal_letter: string;
  processing_time_ms: number;
  // Legacy compat fields used by ReportIssue.tsx
  department_name?: string;
  estimated_resolution_days?: number;
}

export interface Source {
  document_id?: string;
  title: string;
  url?: string;
  article?: string;
  similarity?: number;
  is_local?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  created_at: string;
}

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  
  if (error) {
    if (error instanceof Error && 'context' in error) {
      const context = (error as any).context;
      if (context && typeof context === 'object') {
        try {
          const contextError = (await context.json())?.error || JSON.stringify(context);
          console.error(`${name} detailed error:`, contextError);
          throw new Error(`${name} failed: ${contextError}`);
        } catch {
          // Fall through to default error handling
        }
      }
    }
    console.error(`${name} invocation failed:`, error);
    throw new Error(`${name} failed: ${error.message}`);
  }
  
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const aiClient = {
  /** Content moderation - checks posts/promises for hate speech, PII, quality */
  governance: (contentType: string, content: string) =>
    invokeFunction<ModerationResult>('civic-steward', { content_type: contentType, content }),

  /** Issue routing - classifies civic issues and determines responsible department */
  routing: (
    issueDescription: string, 
    location?: { 
      lat?: number; 
      lng?: number; 
      ward?: string; 
      constituency?: string; 
      county?: string;
      text?: string;
    },
    photos: string[] = []
  ) =>
    invokeFunction<RoutingResult>('civic-router', { 
      issue_description: issueDescription, 
      location, 
      photos 
    }),

  /** 
   * RAG Q&A with SSE streaming - civic knowledge assistant
   * Returns a ReadableStream for token-by-token rendering
   */
  ragStream: async (
    query: string,
    sessionId: string,
    language: string = 'en',
    onDelta: (text: string) => void,
    onDone: () => void,
    onError?: (error: Error) => void
  ): Promise<void> => {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      onError?.(new Error('Not authenticated'));
      return;
    }

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/civic-brain`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query, session_id: sessionId, language }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch {
            // Incomplete JSON, put back and wait for more
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      // Final flush
      if (buffer.trim()) {
        for (let raw of buffer.split('\n')) {
          if (!raw || raw.startsWith(':') || raw.trim() === '') continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) onDelta(content);
          } catch { /* ignore */ }
        }
      }

      onDone();
    } catch (error) {
      console.error('RAG stream error:', error);
      onError?.(error instanceof Error ? error : new Error('Stream failed'));
    }
  },

  /** Fetch chat history for a session */
  getHistory: async (sessionId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from('rag_chat_history')
      .select('id, role, content, sources, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    return (data || []).map((item) => ({
      id: item.id,
      role: item.role as 'user' | 'assistant',
      content: item.content,
      sources: item.sources as unknown as Source[] | undefined,
      created_at: item.created_at,
    }));
  },

  /** Delete a specific history item */
  deleteHistoryItem: async (id: string) => {
    const { error } = await supabase
      .from('rag_chat_history')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  /** Clear all history for a session */
  clearHistory: async (sessionId: string) => {
    const { error } = await supabase
      .from('rag_chat_history')
      .delete()
      .eq('session_id', sessionId);
    
    if (error) throw error;
  },

  /** Ingest document into knowledge base (admin only) */
  ingestDocument: (
    content: string,
    title: string,
    sourceType: string,
    metadata?: Record<string, unknown>
  ) =>
    invokeFunction<{
      success: boolean;
      message: string;
      total_chunks: number;
      inserted: number;
      failed: number;
      errors: string[];
    }>('civic-ingest', {
      content,
      title,
      source_type: sourceType,
      metadata,
    }),
};
