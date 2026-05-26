const Groq = require('groq-sdk');

const modelName = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

const getClient = () => {
  if (!process.env.GROQ_API_KEY) return null;
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};

const complete = async (messages, options = {}) => {
  const client = getClient();
  if (!client) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const response = await client.chat.completions.create({
    model: modelName,
    messages,
    temperature: options.temperature ?? 0.4,
    max_tokens: options.max_tokens ?? 1200
  });

  return response.choices?.[0]?.message?.content?.trim() || '';
};

const extractJson = (text) => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const firstArray = cleaned.match(/\[[\s\S]*\]/);
  return JSON.parse(firstArray ? firstArray[0] : cleaned);
};

async function generateDescription(bullets) {
  return complete([
    {
      role: 'system',
      content: 'You are an expert event copywriter. Write polished, specific, professional copy.'
    },
    {
      role: 'user',
      content: `Turn these bullet points into an engaging 3-paragraph event description. Make it exciting and professional. Bullets: ${bullets}`
    }
  ]);
}

async function streamDescription(bullets) {
  const client = getClient();
  if (!client) throw new Error('GROQ_API_KEY is not configured');

  return client.chat.completions.create({
    model: modelName,
    stream: true,
    temperature: 0.45,
    messages: [
      {
        role: 'system',
        content: 'You are an expert event copywriter. Write polished, specific, professional copy.'
      },
      {
        role: 'user',
        content: `Turn these bullet points into an engaging 3-paragraph event description. Make it exciting and professional. Bullets: ${bullets}`
      }
    ]
  });
}

async function buildSchedule(sessions) {
  const text = await complete([
    {
      role: 'system',
      content: 'Return only strict JSON. No markdown, no commentary.'
    },
    {
      role: 'user',
      content: `You are an event planner. Given these sessions, arrange them in the optimal order for audience engagement. Rules: put heavy/complex topics in the morning, networking breaks after long sessions, inspiring keynote last. Sessions: ${JSON.stringify(sessions)}. Return ONLY a valid JSON array of the sessions in the new order, with no explanation.`
    }
  ], { temperature: 0.2 });

  return extractJson(text);
}

async function getRecommendations(userCategories, availableEvents) {
  const text = await complete([
    {
      role: 'system',
      content: 'Return only strict JSON. No markdown, no commentary.'
    },
    {
      role: 'user',
      content: `A user has attended events in these categories: ${userCategories.join(', ') || 'none yet'}. From the following events, pick the top 5 most relevant ones and return ONLY a valid JSON array of their _id values in order of relevance: ${JSON.stringify(availableEvents)}`
    }
  ], { temperature: 0.2, max_tokens: 600 });

  return extractJson(text);
}

module.exports = {
  generateDescription,
  streamDescription,
  buildSchedule,
  getRecommendations
};

