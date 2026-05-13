import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatWithCoach } from '@/lib/ai/openai-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.length > 2000) {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
    }

    // Get conversation history
    const { data: history } = await supabase
      .from('coach_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Get user context
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: recentSessions } = await supabase
      .from('workout_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5);

    // Save user message
    await supabase.from('coach_messages').insert({
      user_id: user.id,
      role: 'user',
      content: message,
    });

    const messages = [
      ...(history ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const userContext = {
      preferences,
      recentSessions: recentSessions ?? [],
    };

    const reply = await chatWithCoach(messages, userContext);

    // Save assistant reply
    await supabase.from('coach_messages').insert({
      user_id: user.id,
      role: 'assistant',
      content: reply,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Coach chat error:', error);
    return NextResponse.json(
      { error: 'Failed to get response' },
      { status: 500 }
    );
  }
}
