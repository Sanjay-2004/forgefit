import { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { profile, preferences } = useAppStore();

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('coach_messages')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      setMessages(data.map((m) => ({ id: m.id, role: m.role, content: m.content })));
    }
  }

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('coach', {
        body: {
          message: userMsg.content,
          userId: profile?.id,
        },
      });

      if (data?.reply) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t process that. Try again.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-3 border-b border-bg-tertiary">
          <Text className="text-text-muted text-sm uppercase tracking-widest">
            🎓 AI Coach
          </Text>
          <Text className="text-text-primary text-xl font-bold mt-1">
            Your Mentor
          </Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          className="flex-1 px-5"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View className="items-center py-20">
              <Text className="text-4xl mb-4">🗡️</Text>
              <Text className="text-text-secondary text-center text-base">
                I&apos;m your AI coach.{'\n'}Ask me anything about your training.
              </Text>
              <View className="mt-6 gap-2">
                {[
                  'How should I warm up for legs?',
                  'Am I ready to increase weight on bench?',
                  'What should I eat post-workout?',
                ].map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    onPress={() => setInput(suggestion)}
                    className="bg-bg-card rounded-xl px-4 py-3 active:opacity-80"
                  >
                    <Text className="text-text-secondary text-sm">{suggestion}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`mb-3 max-w-[85%] ${
                msg.role === 'user' ? 'self-end' : 'self-start'
              }`}
            >
              <View
                className={`rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-accent-purple rounded-br-md'
                    : 'bg-bg-card rounded-bl-md'
                }`}
              >
                <Text
                  className={`text-sm leading-5 ${
                    msg.role === 'user' ? 'text-white' : 'text-text-primary'
                  }`}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {isLoading && (
            <View className="self-start mb-3">
              <View className="bg-bg-card rounded-2xl rounded-bl-md px-4 py-3">
                <Text className="text-text-muted text-sm">Thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="px-5 py-3 border-t border-bg-tertiary flex-row items-end gap-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach..."
            placeholderTextColor="#64748B"
            multiline
            maxLength={1000}
            className="flex-1 bg-bg-card text-text-primary rounded-2xl px-4 py-3 text-sm max-h-24"
            onSubmitEditing={sendMessage}
          />
          <Pressable
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
            className={`w-11 h-11 rounded-full items-center justify-center ${
              input.trim() ? 'bg-accent-purple' : 'bg-bg-tertiary'
            } active:opacity-80`}
          >
            <Ionicons name="send" size={18} color={input.trim() ? '#fff' : '#64748B'} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
