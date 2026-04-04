import { useState, useRef, useEffect, useCallback } from 'react';
import { isAIConfigured, chatCompletion, chatCompletionStream, type AIChatMessage } from '@/lib/ai-client';
import { useBuildingsStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  Send, Bot, User, Settings, Sparkles, BarChart3, Mail,
  Target, AlertCircle, Loader2, Zap, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatMsg {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const QUICK_ACTIONS = [
  { label: 'Pipeline Summary', icon: BarChart3, prompt: 'Give me a summary of our current pipeline status. How many buildings are in each stage?' },
  { label: 'Top Leads', icon: Target, prompt: 'What are our top 5 leads right now? Consider score, violations, and pipeline stage.' },
  { label: 'Draft Email', icon: Mail, prompt: 'Draft a cold outreach email for our highest-scored building that hasn\'t been contacted yet.' },
  { label: 'Untouched Leads', icon: AlertCircle, prompt: 'Which leads have been in the "discovered" stage for more than 7 days without any contact?' },
  { label: 'Competitive Analysis', icon: Zap, prompt: 'What can you tell me about the current competitive landscape for property management in NYC? What are common pain points buildings have with their current management?' },
];

export default function ChatInterface() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const buildings = useBuildingsStore((s) => s.buildings);
  const aiConfigured = isAIConfigured();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const buildContext = useCallback(() => {
    // Build context about current state for the AI
    const active = buildings.filter((b) => b.status === 'active');
    const byStage: Record<string, number> = {};
    active.forEach((b) => {
      byStage[b.pipeline_stage] = (byStage[b.pipeline_stage] || 0) + 1;
    });

    const top5 = [...active].sort((a, b) => b.score - a.score).slice(0, 5);

    return `Current Scout Database Context:
- Total active buildings: ${active.length}
- Pipeline: ${Object.entries(byStage).map(([k, v]) => `${k}: ${v}`).join(', ')}
- Top 5 by score: ${top5.map((b) => `${b.name || b.address} (score: ${b.score}, grade: ${b.grade}, stage: ${b.pipeline_stage})`).join('; ')}
- Average score: ${active.length ? Math.round(active.reduce((s, b) => s + b.score, 0) / active.length) : 0}
- Buildings with contacts: ${active.filter((b) => b.contacts?.length > 0).length}
- Self-managed buildings: ${active.filter((b) => b.current_management?.toLowerCase().includes('self') || b.current_management?.toLowerCase() === 'unknown').length}`;
  }, [buildings]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: ChatMsg = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build the messages array for the API
    const contextMsg: AIChatMessage = { role: 'user', content: buildContext() };
    const historyMsgs: AIChatMessage[] = messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const assistantMsgId = crypto.randomUUID();

    try {
      // Try streaming first
      let fullText = '';
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true },
      ]);

      try {
        fullText = await chatCompletionStream(
          [contextMsg, ...historyMsgs, { role: 'user', content: content.trim() }],
          (chunk) => {
            fullText += ''; // Track is handled in the stream fn
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m
              )
            );
          }
        );
      } catch (streamErr: any) {
        // If streaming fails, try non-streaming
        if (streamErr.message !== 'AI_NOT_CONFIGURED') {
          fullText = await chatCompletion([
            contextMsg,
            ...historyMsgs,
            { role: 'user', content: content.trim() },
          ]);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: fullText, isStreaming: false } : m
            )
          );
        } else {
          throw streamErr;
        }
      }

      // Finalize
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isStreaming: false, content: m.content || fullText } : m
        )
      );
    } catch (err: any) {
      // Remove the streaming placeholder
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));

      let errorContent = 'Sorry, I encountered an error. Please try again.';
      if (err.message === 'AI_NOT_CONFIGURED') {
        errorContent = '⚠️ AI backend is not configured. Go to **Settings** to set up your AI API endpoint (any OpenAI-compatible API works — OpenAI, OpenRouter, local LLMs, etc.)';
      } else if (err.message === 'AI_AUTH_FAILED') {
        errorContent = '⚠️ AI authentication failed. Please check your API key in **Settings**.';
      } else if (err.message === 'AI_RATE_LIMITED') {
        errorContent = '⚠️ AI rate limit reached. Please wait a moment and try again.';
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: errorContent, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  if (!aiConfigured) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-camelot-gold/20 rounded-xl flex items-center justify-center">
              <Bot size={20} className="text-camelot-gold" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Scout AI</h2>
              <p className="text-xs text-gray-500">Intelligent property analysis assistant</p>
            </div>
          </div>
        </div>

        {/* Not Configured State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Settings size={32} className="text-amber-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Configure AI Backend</h3>
            <p className="text-gray-500 mb-4">
              Scout AI needs an OpenAI-compatible API endpoint to work. This can be OpenAI, OpenRouter, Anthropic (via proxy), a local LLM, or any other compatible provider.
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-left text-sm mb-4">
              <p className="font-medium mb-2">Required environment variables:</p>
              <code className="text-xs block bg-white p-3 rounded-lg border">
                VITE_AI_API_URL=https://api.openai.com/v1/chat/completions<br />
                VITE_AI_API_KEY=sk-...<br />
                VITE_AI_MODEL=gpt-4o
              </code>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              All other Scout features (NYC data, scoring, pipeline, outreach) work without AI configured.
            </p>
            <button
              onClick={() => navigate('/settings')}
              className="bg-camelot-gold text-white px-6 py-2.5 rounded-lg font-medium hover:bg-camelot-gold-dark transition-colors"
            >
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-camelot-gold/20 rounded-xl flex items-center justify-center">
              <Bot size={20} className="text-camelot-gold" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Scout AI</h2>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Connected
              </p>
            </div>
          </div>
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw size={13} /> Clear Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-messages">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-camelot-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles size={32} className="text-camelot-gold" />
            </div>
            <h3 className="text-lg font-bold mb-2">How can I help?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Ask me about your pipeline, leads, buildings, or let me draft emails.
            </p>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 max-w-2xl mx-auto">
              {QUICK_ACTIONS.map(({ label, icon: Icon, prompt }) => (
                <button
                  key={label}
                  onClick={() => sendMessage(prompt)}
                  className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-camelot-gold/50 hover:shadow-sm transition-all text-left"
                >
                  <Icon size={16} className="text-camelot-gold flex-shrink-0" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 max-w-3xl',
              msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
              msg.role === 'user'
                ? 'bg-camelot-navy text-white'
                : 'bg-camelot-gold/20 text-camelot-gold'
            )}>
              {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={cn(
              'rounded-xl px-4 py-3 max-w-[80%]',
              msg.role === 'user'
                ? 'bg-camelot-navy text-white'
                : 'bg-white border border-gray-200'
            )}>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
                {msg.isStreaming && (
                  <span className="inline-block w-1.5 h-4 bg-camelot-gold ml-0.5 animate-pulse" />
                )}
              </div>
              <p className={cn(
                'text-[10px] mt-2',
                msg.role === 'user' ? 'text-gray-400' : 'text-gray-400'
              )}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-camelot-gold/20 flex items-center justify-center">
              <Bot size={14} className="text-camelot-gold" />
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
              <Loader2 size={16} className="animate-spin text-camelot-gold" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Scout AI anything..."
                rows={1}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-camelot-gold/50 focus:border-camelot-gold"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="bg-camelot-gold text-white p-3 rounded-xl hover:bg-camelot-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Scout AI has access to your building database for contextual answers
          </p>
        </div>
      </div>
    </div>
  );
}
