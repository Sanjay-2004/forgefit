import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.76.0";

const VALID_MUSCLES = [
  "chest", "front_delts", "side_delts", "rear_delts", "triceps", "biceps",
  "forearms", "upper_back", "lats", "lower_back", "traps", "abs", "obliques",
  "glutes", "quads", "hamstrings", "calves", "hip_flexors", "neck",
];
const VALID_MUSCLE_SET = new Set(VALID_MUSCLES);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeExercise(raw: any) {
  const exercise = raw ?? {};
  const rawMuscles = Array.isArray(exercise.muscles) ? exercise.muscles : [];
  const muscles = rawMuscles
    .filter((m: string) => typeof m === "string" && VALID_MUSCLE_SET.has(m))
    .slice(0, 4);

  return {
    name: typeof exercise.name === "string" && exercise.name.trim().length > 0
      ? exercise.name.trim() : "Exercise",
    muscles: muscles.length > 0 ? muscles : ["quads"],
    sets: clamp(Number.isFinite(Number(exercise.sets)) ? Math.round(Number(exercise.sets)) : 3, 1, 10),
    repRange: typeof exercise.repRange === "string" && exercise.repRange.trim().length > 0
      ? exercise.repRange.trim() : "8-12",
    restSeconds: clamp(Number.isFinite(Number(exercise.restSeconds)) ? Math.round(Number(exercise.restSeconds)) : 90, 15, 600),
    notes: typeof exercise.notes === "string" ? exercise.notes : "",
  };
}

function sanitizeDayPlan(raw: any, index: number) {
  const day = raw ?? {};
  const rawExercises = Array.isArray(day.exercises) ? day.exercises : [];
  const exercises = rawExercises.map(sanitizeExercise);
  const warmup = Array.isArray(day.warmup) ? day.warmup.filter((w: any) => typeof w === "string") : [];
  const cooldown = Array.isArray(day.cooldown) ? day.cooldown.filter((c: any) => typeof c === "string") : [];

  return {
    day: typeof day.day === "string" && day.day.trim().length > 0 ? day.day.trim() : `Day ${index + 1}`,
    focus: typeof day.focus === "string" && day.focus.trim().length > 0 ? day.focus.trim() : "Full Body",
    exercises: exercises.length > 0 ? exercises : [{ name: "Bodyweight Squat", muscles: ["quads"], sets: 3, repRange: "10-15", restSeconds: 60, notes: "" }],
    warmup,
    cooldown,
  };
}

function sanitizeWeeklyPlan(raw: any, userData: any) {
  const payload = raw ?? {};
  const targetDays = clamp(Number(userData.workout_days_per_week) || 4, 1, 7);
  const rawDays = Array.isArray(payload.weeklyPlan) ? payload.weeklyPlan : [];
  const sanitizedDays = rawDays.slice(0, targetDays).map((day: any, i: number) => sanitizeDayPlan(day, i));

  return {
    programName: typeof payload.programName === "string" && payload.programName.trim().length > 0
      ? payload.programName.trim() : "ForgeFit Program",
    goal: typeof payload.goal === "string" && payload.goal.trim().length > 0
      ? payload.goal.trim() : "General Fitness",
    weeklyPlan: sanitizedDays.length > 0 ? sanitizedDays : [sanitizeDayPlan({}, 0)],
  };
}

function buildPrompt(userData: any) {
  const hasCardio = userData.preferred_styles?.some((s: string) =>
    ["cardio", "running", "hiit", "hybrid"].includes(s)
  );
  const days = userData.workout_days_per_week ?? 4;
  const duration = userData.session_duration_minutes ?? 60;
  const minEx = duration <= 30 ? 5 : duration <= 45 ? 7 : 8;
  const maxEx = duration <= 30 ? 7 : duration <= 45 ? 9 : 12;

  return `Design a ${days}-day workout program:

CLIENT: Age ${userData.age ?? "?"}, ${userData.sex ?? "?"}, ${userData.height_cm ?? "?"}cm, ${userData.weight_kg ?? "?"}kg
Goals: ${userData.fitness_goals?.join(", ") || "General fitness"}
Experience: ${userData.experience_level ?? "intermediate"}
Injuries: ${userData.injuries || "None"}
Equipment: ${userData.equipment_access?.join(", ") || "Full gym"}
Location: ${userData.training_location ?? "gym"}
Styles: ${userData.preferred_styles?.join(", ") || "Bodybuilding"}
Duration: ${duration}min, ${days} days/week
Activity: ${userData.activity_level ?? "moderate"}, Sleep: ${userData.sleep_quality ?? "good"}, Stress: ${userData.stress_level ?? "moderate"}

RULES:
- ${minEx}-${maxEx} exercises per session
- Order: compounds → secondary compounds → isolation → core${hasCardio ? " → cardio LAST" : ""}
- Compounds: 3-5 sets, 90-180s rest. Isolation: 3-4 sets, 60-90s rest
${hasCardio ? "- Add 10-20min cardio as FINAL exercise(s)" : ""}
- Include warmup (3-5 items) and cooldown (2-4 items)
- Use ONLY these muscles: ${VALID_MUSCLES.join(", ")}

JSON SCHEMA:
{"programName":"string","goal":"string","weeklyPlan":[{"day":"Day 1","focus":"string","exercises":[{"name":"string","muscles":["string"],"sets":3,"repRange":"8-12","restSeconds":90,"notes":"string"}],"warmup":["string"],"cooldown":["string"]}]}

Return ONLY valid JSON. Exactly ${days} workout days, no rest days.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const { userData, userId } = await req.json();

    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an elite personal trainer designing periodized programs. Rules: 7-10 exercises per session, compounds first then isolation then cardio. Always respond with valid JSON only.`,
        },
        { role: "user", content: buildPrompt(userData) },
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from OpenAI");

    const parsed = JSON.parse(content);
    const plan = sanitizeWeeklyPlan(parsed, userData);

    // Save to database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: program } = await supabase
      .from("workout_programs")
      .insert({
        user_id: userId,
        name: plan.programName,
        goal: plan.goal,
        weekly_plan: plan,
        is_active: true,
        ai_generated: true,
      })
      .select()
      .single();

    // Create workout templates for each day
    if (program) {
      const templates = plan.weeklyPlan.map((day: any, i: number) => ({
        program_id: program.id,
        user_id: userId,
        day_of_week: i,
        name: day.day,
        focus: day.focus,
        exercises: day.exercises,
        warmup: day.warmup ? { exercises: day.warmup, duration_minutes: 5 } : null,
        cooldown: day.cooldown ? { exercises: day.cooldown, duration_minutes: 5 } : null,
        estimated_duration_minutes: userData.session_duration_minutes ?? 60,
      }));

      await supabase.from("workout_templates").insert(templates);
    }

    return new Response(JSON.stringify({ plan, programId: program?.id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
