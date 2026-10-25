const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate 3 bonus side quests via GPT-4o.
 * Returns array of { title, description, xpValue }.
 */
async function generateBonusChallenges(dayNumber, durationDays, targetNames) {
  const targetList = targetNames.join(', ');
  const prompt = `You are a motivational AI system from a Solo Leveling themed challenge app. The user is on day ${dayNumber} of a ${durationDays}-day mental and physical discipline program. Their daily targets include: ${targetList}. Generate 3 random bonus side quests for today that are healthy, productive, and achievable. Each should have a title, short description, and XP reward between 5 and 25. Return ONLY a valid JSON array in this format: [{"title":"...","description":"...","xpValue":10}]`;

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 400,
  });

  const raw = response.choices[0]?.message?.content ?? '[]';
  // Extract JSON array even if wrapped in markdown code blocks
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];

  const parsed = JSON.parse(match[0]);
  return parsed.map((c) => ({
    title: String(c.title ?? 'Side Quest').slice(0, 100),
    description: String(c.description ?? '').slice(0, 300),
    xpValue: Math.max(5, Math.min(25, Number(c.xpValue) || 10)),
    completed: false,
  }));
}

module.exports = { generateBonusChallenges };
