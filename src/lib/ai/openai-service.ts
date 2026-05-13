import OpenAI from 'openai';
import type { OnboardingData, WeeklyPlan } from '@/types';
import { weeklyPlanSchema } from '@/types/schemas';

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
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert fitness coach and exercise scientist. Generate personalized workout programs based on user profiles. Always respond with valid JSON only, no markdown, no explanation. Follow the exact schema provided.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  const parsed = JSON.parse(content);
  const validated = weeklyPlanSchema.parse(parsed);
  return validated as unknown as WeeklyPlan;
}

export async function generateAdaptation(
  currentProgram: WeeklyPlan,
  performanceData: Record<string, unknown>
): Promise<{ recommendations: string[]; adjustments: Record<string, unknown> }> {
  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
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
    model: 'gpt-4o',
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
  return `Create a personalized workout program for this user:

Profile:
- Age: ${userData.age}
- Sex: ${userData.sex}
- Height: ${userData.height_cm}cm
- Weight: ${userData.weight_kg}kg
- Fitness Goal: ${userData.fitness_goal}
- Experience Level: ${userData.experience_level}
- Injuries/Limitations: ${userData.injuries || 'None'}
- Equipment Access: ${userData.equipment_access}
- Preferred Styles: ${userData.preferred_styles?.join(', ')}
- Workout Days/Week: ${userData.workout_days_per_week}
- Session Duration: ${userData.session_duration_minutes} minutes
- Activity Level: ${userData.activity_level}
- Sleep Quality: ${userData.sleep_quality}
- Stress Level: ${userData.stress_level}
- Nutrition: ${userData.nutrition_preferences || 'No preference'}

Return a JSON object with this exact structure:
{
  "programName": "descriptive name for the program",
  "goal": "primary goal description",
  "weeklyPlan": [
    {
      "day": "Monday",
      "focus": "Push / Chest & Shoulders",
      "exercises": [
        {
          "name": "Bench Press",
          "muscles": ["chest", "front_delts", "triceps"],
          "sets": 4,
          "repRange": "8-12",
          "restSeconds": 120,
          "notes": "Focus on controlled eccentric"
        }
      ],
      "warmup": ["5 min cardio", "arm circles", "band pull-aparts"],
      "cooldown": ["chest stretch", "shoulder stretch"]
    }
  ]
}

Valid muscle names: chest, front_delts, side_delts, rear_delts, triceps, biceps, forearms, upper_back, lats, lower_back, traps, abs, obliques, glutes, quads, hamstrings, calves, hip_flexors, neck.

Only include workout days (not rest days). Match the number of days to ${userData.workout_days_per_week}. Each session should fit within ${userData.session_duration_minutes} minutes. Consider any injuries/limitations and adjust accordingly.`;
}
