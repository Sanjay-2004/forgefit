import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWorkoutProgram } from '@/lib/ai/openai-service';
import type { OnboardingData } from '@/types';

function extractErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    const parts = [err.code, err.message, err.details, err.hint]
      .filter((p): p is string => typeof p === 'string' && p.length > 0);

    if (parts.length > 0) {
      return parts.join(' | ');
    }

    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown server error';
    }
  }

  return 'Unknown server error';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: Partial<OnboardingData> = await request.json();

    // Generate program via OpenAI (this is the critical path)
    const weeklyPlan = await generateWorkoutProgram(body);

    // Try saving to database (non-blocking — tables may not exist yet)
    let program = null;
    try {
      // Ensure profile row exists
      await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email ?? null,
            full_name: user.user_metadata?.full_name ?? null,
            avatar_url: user.user_metadata?.avatar_url ?? null,
          },
          { onConflict: 'id' }
        );

      // Save program
      const { data: savedProgram } = await supabase
        .from('workout_programs')
        .insert({
          user_id: user.id,
          name: weeklyPlan.programName,
          goal: weeklyPlan.goal,
          description: `AI-generated ${weeklyPlan.goal} program`,
          weekly_plan: weeklyPlan,
          progression_strategy: 'linear',
          is_active: true,
          ai_generated: true,
        })
        .select()
        .single();

      program = savedProgram;

      if (program) {
        // Create workout templates for each day
        const templates = weeklyPlan.weeklyPlan.map((day, index) => ({
          program_id: program.id,
          user_id: user.id,
          day_of_week: index,
          name: `${day.day} — ${day.focus}`,
          focus: day.focus,
          exercises: day.exercises,
          warmup: day.warmup
            ? { exercises: day.warmup, duration_minutes: 5 }
            : null,
          cooldown: day.cooldown
            ? { exercises: day.cooldown, duration_minutes: 5 }
            : null,
          estimated_duration_minutes: body.session_duration_minutes ?? 60,
        }));

        await supabase.from('workout_templates').insert(templates);
      }
    } catch (dbError) {
      console.warn('DB save skipped (tables may not exist):', dbError);
    }

    return NextResponse.json({
      success: true,
      program,
      weeklyPlan,
    });
  } catch (error) {
    console.error('Program generation error:', error);
    const details = extractErrorDetails(error);
    return NextResponse.json(
      { error: 'Failed to generate program', details },
      { status: 500 }
    );
  }
}
