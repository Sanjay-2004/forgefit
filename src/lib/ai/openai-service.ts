import OpenAI from 'openai';
import type { DayPlan, MuscleGroup, OnboardingData, TemplateExercise, WeeklyPlan } from '@/types';
import { weeklyPlanSchema } from '@/types/schemas';

const VALID_MUSCLES: MuscleGroup[] = [
  'chest',
  'front_delts',
  'side_delts',
  'rear_delts',
  'triceps',
  'biceps',
  'forearms',
  'upper_back',
  'lats',
  'lower_back',
  'traps',
  'abs',
  'obliques',
  'glutes',
  'quads',
  'hamstrings',
  'calves',
  'hip_flexors',
  'neck',
];
const VALID_MUSCLE_SET = new Set<MuscleGroup>(VALID_MUSCLES);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeExercise(raw: unknown): TemplateExercise {
  const exercise = (raw ?? {}) as Record<string, unknown>;
  const rawMuscles = Array.isArray(exercise.muscles) ? exercise.muscles : [];
  const muscles = rawMuscles
    .filter(
      (m): m is MuscleGroup =>
        typeof m === 'string' && VALID_MUSCLE_SET.has(m as MuscleGroup)
    )
    .slice(0, 4);

  return {
    name:
      typeof exercise.name === 'string' && exercise.name.trim().length > 0
        ? exercise.name.trim()
        : 'Exercise',
    muscles: muscles.length > 0 ? muscles : (['quads'] as MuscleGroup[]),
    sets: clamp(
      Number.isFinite(Number(exercise.sets))
        ? Math.round(Number(exercise.sets))
        : 3,
      1,
      10
    ),
    repRange:
      typeof exercise.repRange === 'string' && exercise.repRange.trim().length > 0
        ? exercise.repRange.trim()
        : '8-12',
    restSeconds: clamp(
      Number.isFinite(Number(exercise.restSeconds))
        ? Math.round(Number(exercise.restSeconds))
        : 90,
      15,
      600
    ),
    notes: typeof exercise.notes === 'string' ? exercise.notes : '',
  };
}

function sanitizeDayPlan(raw: unknown, index: number): DayPlan {
  const day = (raw ?? {}) as Record<string, unknown>;
  const rawExercises = Array.isArray(day.exercises) ? day.exercises : [];
  const exercises = rawExercises.map(sanitizeExercise);

  const warmup = Array.isArray(day.warmup)
    ? day.warmup.filter((w): w is string => typeof w === 'string')
    : [];
  const cooldown = Array.isArray(day.cooldown)
    ? day.cooldown.filter((c): c is string => typeof c === 'string')
    : [];

  return {
    day:
      typeof day.day === 'string' && day.day.trim().length > 0
        ? day.day.trim()
        : `Day ${index + 1}`,
    focus:
      typeof day.focus === 'string' && day.focus.trim().length > 0
        ? day.focus.trim()
        : 'Full Body',
    exercises:
      exercises.length > 0
        ? exercises
        : [
            {
              name: 'Bodyweight Squat',
              muscles: ['quads'],
              sets: 3,
              repRange: '10-15',
              restSeconds: 60,
              notes: '',
            },
          ],
    warmup,
    cooldown,
  };
}

function sanitizeWeeklyPlanPayload(
  raw: unknown,
  userData: Partial<OnboardingData>
): WeeklyPlan {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const targetDays = clamp(
    Number.isFinite(Number(userData.workout_days_per_week))
      ? Math.round(Number(userData.workout_days_per_week))
      : 4,
    1,
    7
  );

  const rawDays = Array.isArray(payload.weeklyPlan) ? payload.weeklyPlan : [];
  const sanitizedDays = rawDays
    .slice(0, targetDays)
    .map((day, index) => sanitizeDayPlan(day, index));

  return {
    programName:
      typeof payload.programName === 'string' && payload.programName.trim().length > 0
        ? payload.programName.trim()
        : 'ForgeFit Program',
    goal: typeof payload.goal === 'string' && payload.goal.trim().length > 0
      ? payload.goal.trim()
      : 'General Fitness',
    weeklyPlan: sanitizedDays.length > 0 ? sanitizedDays : [sanitizeDayPlan({}, 0)],
  };
}

function getOpenAI() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateWorkoutProgram(
  userData: Partial<OnboardingData>
): Promise<WeeklyPlan> {
  const prompt = buildProgramPrompt(userData);

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an elite certified personal trainer and exercise physiologist with 15+ years of experience programming for athletes and general population clients. You design detailed, periodized workout programs.

Rules you MUST follow:
1. Every workout session MUST have 7-10 exercises minimum — this is non-negotiable.
2. Structure each session: compound movements first, isolation work after, and cardio/conditioning ALWAYS at the very end of the session.
3. If the user selected cardio, running, or HIIT as a preferred style, add 10-20 min of cardio/treadmill/conditioning as the LAST exercise(s) of relevant sessions — never before weights.
4. Include proper warm-up drills (dynamic stretches, activation exercises) and cooldown stretches for each session.
5. Use progressive overload principles — heavier compounds get 3-5 sets, accessories get 3-4 sets.
6. Rest periods: 90-180s for heavy compounds, 60-90s for accessories, 30-60s for conditioning.
7. Always respond with valid JSON only. No markdown, no explanation, no extra text.
8. Follow the exact schema provided.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const parsed = JSON.parse(content);
  const sanitized = sanitizeWeeklyPlanPayload(parsed, userData);
  const validated = weeklyPlanSchema.parse(sanitized);
  return validated as unknown as WeeklyPlan;
}

export async function generateAdaptation(
  currentProgram: WeeklyPlan,
  performanceData: Record<string, unknown>
): Promise<{ recommendations: string[]; adjustments: Record<string, unknown> }> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an expert fitness coach analyzing workout performance data. Provide specific, actionable recommendations. Respond with JSON only.`,
      },
      {
        role: 'user',
        content: `Current program: ${JSON.stringify(currentProgram)}

Performance data: ${JSON.stringify(performanceData)}

Analyze the performance and return JSON with:
{
  "recommendations": ["string array of coaching insights"],
  "adjustments": {
    "exerciseName": {
      "action": "increase_weight|decrease_weight|increase_reps|decrease_volume|substitute|deload",
      "details": "specific adjustment details",
      "reason": "why this adjustment"
    }
  }
}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content);
}

export async function chatWithCoach(
  messages: { role: 'user' | 'assistant'; content: string }[],
  userContext: Record<string, unknown>
): Promise<string> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are ForgeFit AI Coach — an expert, encouraging fitness coach. You have access to the user's workout data and can provide personalized advice.

User context: ${JSON.stringify(userContext)}

Guidelines:
- Be concise and actionable
- Reference their specific exercises and progress
- Explain exercise science when relevant
- Be motivating but honest
- Suggest modifications when asked
- Never provide medical advice — recommend seeing a professional for injuries`,
      },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content ?? 'I couldn\'t generate a response. Please try again.';
}

function buildProgramPrompt(userData: Partial<OnboardingData>): string {
  const hasCardio = userData.preferred_styles?.some(s =>
    ['cardio', 'running', 'hiit', 'hybrid'].includes(s)
  );
  const daysPerWeek = userData.workout_days_per_week ?? 4;
  const duration = userData.session_duration_minutes ?? 60;

  // Calculate exercise count based on session duration
  const minExercises = duration <= 30 ? 5 : duration <= 45 ? 7 : 8;
  const maxExercises = duration <= 30 ? 7 : duration <= 45 ? 9 : 12;

  return `Design a complete, detailed ${daysPerWeek}-day workout program for this client:

=== CLIENT PROFILE ===
- Age: ${userData.age ?? 'Not specified'}
- Sex: ${userData.sex ?? 'Not specified'}
- Height: ${userData.height_cm ? `${userData.height_cm}cm` : 'Not specified'}
- Weight: ${userData.weight_kg ? `${userData.weight_kg}kg` : 'Not specified'}
- Fitness Goals: ${userData.fitness_goals?.join(', ') || 'General fitness'}
- Experience Level: ${userData.experience_level ?? 'intermediate'}
- Injuries/Limitations: ${userData.injuries || 'None reported'}
- Equipment Access: ${userData.equipment_access?.join(', ') || 'Full gym'}
- Preferred Training Styles: ${userData.preferred_styles?.join(', ') || 'Bodybuilding'}
- Workout Days/Week: ${daysPerWeek}
- Session Duration: ${duration} minutes
- Activity Level: ${userData.activity_level ?? 'moderately active'}
- Sleep Quality: ${userData.sleep_quality ?? 'good'}
- Stress Level: ${userData.stress_level ?? 'moderate'}
- Nutrition: ${userData.nutrition_preferences || 'No specific preference'}

=== PROGRAMMING REQUIREMENTS ===
1. Each session MUST have ${minExercises}-${maxExercises} exercises. Do NOT generate fewer than ${minExercises}.
2. Exercise order within each session MUST be:
   a) Compound barbell/dumbbell movements first (e.g., bench press, squat, deadlift, overhead press, rows)
   b) Secondary compound movements (e.g., incline press, leg press, pull-ups)
   c) Isolation/accessory work (e.g., lateral raises, curls, tricep extensions, leg curls)
   d) Core/abs work
   ${hasCardio ? 'e) Cardio/conditioning LAST (e.g., treadmill incline walk, rowing intervals, bike sprints) — ALWAYS after all weight training' : ''}
3. For compound lifts: 3-5 sets, 90-180s rest
4. For isolation work: 3-4 sets, 60-90s rest
5. ${hasCardio ? 'Add 10-20 minutes of cardio/treadmill as the FINAL exercise(s) of each session. Cardio should NEVER appear before weight exercises.' : 'No dedicated cardio blocks needed unless it helps the goal.'}
6. Use an intelligent split (Push/Pull/Legs, Upper/Lower, Bro split, etc.) appropriate for ${daysPerWeek} days and ${userData.experience_level ?? 'intermediate'} level.
7. Each exercise must target specific muscles from the valid list.
8. Include practical warm-up drills (3-5 items) and cooldown stretches (2-4 items) for each day.
9. Notes should include form cues, tempo, or technique tips.

=== VALID MUSCLE NAMES (use ONLY these) ===
chest, front_delts, side_delts, rear_delts, triceps, biceps, forearms, upper_back, lats, lower_back, traps, abs, obliques, glutes, quads, hamstrings, calves, hip_flexors, neck

=== REQUIRED JSON SCHEMA ===
{
  "programName": "Creative descriptive name",
  "goal": "Detailed description of the program goal integrating all selected goals",
  "weeklyPlan": [
    {
      "day": "Day 1",
      "focus": "e.g. Push — Chest, Shoulders & Triceps",
      "exercises": [
        {
          "name": "Flat Barbell Bench Press",
          "muscles": ["chest", "front_delts", "triceps"],
          "sets": 4,
          "repRange": "6-8",
          "restSeconds": 150,
          "notes": "Retract scapula, controlled 2s eccentric"
        },
        {
          "name": "Incline Dumbbell Press",
          "muscles": ["chest", "front_delts"],
          "sets": 3,
          "repRange": "8-12",
          "restSeconds": 90,
          "notes": "30-degree incline, full ROM"
        }
      ],
      "warmup": ["5 min incline treadmill walk", "arm circles 20 each direction", "band pull-aparts 15 reps", "light push-ups 10 reps"],
      "cooldown": ["doorway chest stretch 30s each side", "overhead tricep stretch 30s each arm", "cross-body shoulder stretch 30s each"]
    }
  ]
}

IMPORTANT:
- Return ONLY workout days (exactly ${daysPerWeek}). Do NOT include rest days.
- Each day MUST have at least ${minExercises} exercises. This is critical.
- The total exercises per session should realistically fill ${duration} minutes.
- Vary exercises across days — don't repeat the same exercise on multiple days.
- Consider any injuries and provide safe alternatives.`;
}
