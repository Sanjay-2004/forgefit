import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@4.76.0";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  try {
    const { message, userId } = await req.json();
    if (!message || !userId) {
      return new Response(JSON.stringify({ error: "Missing message or userId" }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get conversation history
    const { data: history } = await supabase
      .from("coach_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Get user context
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: recentSessions } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(5);

    const { data: gamification } = await supabase
      .from("user_gamification")
      .select("*")
      .eq("user_id", userId)
      .single();

    const userContext = {
      preferences: prefs,
      recentSessions,
      gamification: gamification ? {
        rank: gamification.current_rank,
        xp: gamification.xp_total,
        streak: gamification.streak_count,
      } : null,
    };

    // Determine coach personality from dopamine type
    const dopamineType = prefs?.dopamine_type ?? "leveling";
    const personalityMap: Record<string, string> = {
      competition: "You are an intense, competitive coach like from Blue Lock. Push the user to be the best. Use rivalry and competition as motivation. Be direct and challenging.",
      leveling: "You are a wise mentor from a world where hunters level up through training. Reference their rank, XP, and power growth. Use game-like language naturally.",
      streaks: "You are a habit-focused coach. Emphasize consistency, daily discipline, and the power of showing up. Celebrate streaks and warn about breaks.",
      social: "You are an encouraging, supportive coach. Celebrate their wins, suggest sharing progress, and build community feeling.",
      rewards: "You are a reward-focused coach. Highlight achievements they're close to, badges they can unlock, and milestones ahead.",
    };

    const personality = personalityMap[dopamineType] ?? personalityMap.leveling;

    const messages: Array<{ role: string; content: string }> = [
      ...(history ?? []).map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are ForgeFit AI Coach — an expert fitness coach. ${personality}

User context: ${JSON.stringify(userContext)}

Guidelines:
- Be concise and actionable
- Reference their specific exercises and progress
- Explain exercise science when relevant
- Be motivating but honest
- Never provide medical advice — recommend seeing a professional for injuries
- Keep responses under 200 words unless explaining something complex`,
        },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = response.choices[0]?.message?.content ?? "I couldn't generate a response. Try again.";

    // Save messages
    await supabase.from("coach_messages").insert([
      { user_id: userId, role: "user", content: message },
      { user_id: userId, role: "assistant", content: reply },
    ]);

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
