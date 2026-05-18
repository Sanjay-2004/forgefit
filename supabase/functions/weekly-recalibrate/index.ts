import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.76.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get current active program
    const { data: program } = await supabase
      .from("workout_programs")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!program) {
      return new Response(JSON.stringify({ error: "No active program" }), { status: 404 });
    }

    // Get past week's workout sessions
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: sessions } = await supabase
      .from("workout_sessions")
      .select("*, exercise_logs(*)")
      .eq("user_id", userId)
      .gte("started_at", oneWeekAgo)
      .order("started_at", { ascending: false });

    // Get user preferences
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get gamification data
    const { data: gamification } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get personal records from last week
    const { data: prs } = await supabase
      .from("personal_records")
      .select("*")
      .eq("user_id", userId)
      .gte("achieved_at", oneWeekAgo);

    // Build analysis context
    const completedSessions = sessions?.filter((s: any) => s.status === "completed") ?? [];
    const skippedSessions = sessions?.filter((s: any) => s.status === "skipped") ?? [];
    const avgRPE = completedSessions.length > 0
      ? completedSessions.reduce((sum: number, s: any) => sum + (s.overall_rpe ?? 0), 0) / completedSessions.length
      : 0;

    const weekSummary = {
      completedCount: completedSessions.length,
      skippedCount: skippedSessions.length,
      targetDays: prefs?.workout_days_per_week ?? 4,
      avgRPE: Math.round(avgRPE * 10) / 10,
      prsHit: prs?.length ?? 0,
      currentRank: gamification?.current_rank ?? "E",
      streak: gamification?.streak_count ?? 0,
      exerciseLogs: completedSessions.flatMap((s: any) => s.exercise_logs ?? []),
    };

    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

    // Determine which days are left this week (Mon=0…Sun=6)
    const now = new Date();
    const jsDay = now.getDay();
    const todayIndex = jsDay === 0 ? 6 : jsDay - 1; // Mon=0
    const remainingDayNames = [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    ].slice(todayIndex);

    // Figure out which muscles were already trained this week
    const musclesTrained = new Set<string>();
    for (const s of completedSessions) {
      for (const log of (s.exercise_logs ?? [])) {
        for (const m of (log.muscles_worked ?? [])) {
          musclesTrained.add(m);
        }
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an elite personal trainer re-planning the REMAINING days of this week after some days were missed. Respond with valid JSON only.

CRITICAL rules:
- The user missed some workout days. You must redistribute exercises across the REMAINING days so every major muscle group is trained at least 2 times this week.
- Muscles already trained this week: ${JSON.stringify([...musclesTrained])}. Prioritise muscles NOT yet trained.
- Remaining days this week: ${remainingDayNames.join(', ')}
- If completion rate < 70%, reduce volume slightly
- If avg RPE > 8.5, consider a deload (reduce weights by 10-15%)
- If avg RPE < 6, increase intensity
- If PRs were hit, progress those exercises
- Always include warmup and cooldown
- Keep exercises practical for the user's equipment and location`,
        },
        {
          role: "user",
          content: `Current program: ${JSON.stringify(program.weekly_plan)}
          
Week summary: ${JSON.stringify(weekSummary)}
User preferences: ${JSON.stringify(prefs)}

Re-plan the FULL week (Mon-Sun). Keep completed days as-is and re-optimise the remaining days (${remainingDayNames.join(', ')}) to cover missed muscle groups.

Return JSON matching the exact same schema as the current program:
{"programName":"string","goal":"string","weeklyPlan":[{"day":"string","focus":"string","exercises":[{"name":"string","muscles":["string"],"sets":3,"repRange":"8-12","restSeconds":90,"notes":"string"}],"warmup":["string"],"cooldown":["string"]}]}

Also include a top-level "reasoning" field explaining what you changed and why.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No response from OpenAI");

    const parsed = JSON.parse(content);
    const reasoning = parsed.reasoning ?? "Weekly optimization based on performance data.";

    // Remove reasoning from plan before saving
    delete parsed.reasoning;

    // Save as weekly plan
    const weekStart = getNextMonday();
    await supabase.from("weekly_plans").insert({
      user_id: userId,
      week_start: weekStart,
      plan_json: parsed,
      ai_reasoning: reasoning,
    });

    // Also update the active program so the train screen reflects changes immediately
    await supabase
      .from("workout_programs")
      .update({ weekly_plan: parsed, updated_at: new Date().toISOString() })
      .eq("id", program.id);

    return new Response(JSON.stringify({ plan: parsed, reasoning, weekStart }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});

function getNextMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 1 : 8 - day; // days until next Monday
  const nextMon = new Date(now);
  nextMon.setDate(now.getDate() + diff);
  return nextMon.toISOString().split("T")[0];
}
