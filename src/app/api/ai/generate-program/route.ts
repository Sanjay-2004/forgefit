import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWorkoutProgram } from '@/lib/ai/openai-service';
import type { OnboardingData } from '@/types';

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

    // Generate program via OpenAI
    const weeklyPlan = await generateWorkoutProgram(body);

    // Save program to database
    const { data: program, error: programError } = await supabase
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

    if (programError) {
      throw programError;
    }

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

    const { error: templateError } = await supabase
      .from('workout_templates')
      .insert(templates);

    if (templateError) {
      throw templateError;
    }

    return NextResponse.json({
      success: true,
      program,
      weeklyPlan,
    });
  } catch (error) {
    console.error('Program generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate program' },
      { status: 500 }
    );
  }
}
