'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import type { CoachMessage } from '@/types';
import { cn } from '@/lib/utils';

export default function CoachPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  async function loadMessages() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('coach_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(50);

    setMessages(data ?? []);
    setInitialLoading(false);
  }

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistic update
    const tempMsg: CoachMessage = {
      id: `temp-${Date.now()}`,
      user_id: '',
      role: 'user',
      content: userMessage,
      context: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const { reply } = await response.json();

      const assistantMsg: CoachMessage = {
        id: `temp-${Date.now()}-reply`,
        user_id: '',
        role: 'assistant',
        content: reply,
        context: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
    } finally {
      setIsLoading(false);
    }
  }

  const suggestions = [
    'How can I break through a bench press plateau?',
    'What should I eat before a workout?',
    'My lower back hurts after deadlifts',
    'Can you modify my program for 3 days?',
  ];

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Header */}
        <div className="px-4 pt-12 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forge-500 to-accent-purple flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">AI Coach</h1>
              <p className="text-xs text-text-tertiary">
                Powered by your workout data
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 space-y-3 pb-4"
        >
          {messages.length === 0 && !initialLoading && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <div className="w-16 h-16 rounded-full bg-forge-500/10 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-forge-400" />
              </div>
              <div className="text-center">
                <h2 className="font-semibold mb-1">Ask your AI coach</h2>
                <p className="text-sm text-text-tertiary max-w-xs">
                  Get personalized advice about training, recovery, and nutrition
                </p>
              </div>
              <div className="space-y-2 w-full max-w-sm">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(s);
                    }}
                    className="w-full text-left text-sm p-3 rounded-xl bg-surface-elevated border border-surface-border hover:border-forge-500/30 text-text-secondary transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex gap-2',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-forge-500/10 flex-shrink-0 flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-forge-400" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-forge-500 text-white rounded-br-md'
                    : 'bg-surface-elevated text-text-primary rounded-bl-md border border-surface-border'
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-surface-elevated flex-shrink-0 flex items-center justify-center mt-1">
                  <User className="w-4 h-4 text-text-tertiary" />
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2"
            >
              <div className="w-7 h-7 rounded-lg bg-forge-500/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-forge-400" />
              </div>
              <div className="bg-surface-elevated rounded-2xl rounded-bl-md px-4 py-3 border border-surface-border">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2 glass border-t border-surface-border">
          <div className="flex gap-2 items-end">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask your coach..."
              className="flex-1 bg-surface-elevated border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-forge-500/40"
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="!p-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
