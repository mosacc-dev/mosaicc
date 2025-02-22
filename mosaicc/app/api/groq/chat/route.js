// app/api/groq/chat/route.js
import { Groq } from "groq-sdk";
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Emotional tone analyzer function
const analyzeTone = (messages) => {
  const latestMessage = messages[messages.length - 1]?.content || '';
  const negativeWords = ['angry', 'sad', 'anxious', 'stress', 'fear'];
  const positiveWords = ['happy', 'excited', 'good', 'great', 'relieved'];
  
  const toneIndicators = {
    angry: ['angry', 'mad', 'furious', 'pissed'],
    sad: ['sad', 'depressed', 'lonely', 'hopeless'],
    anxious: ['anxious', 'nervous', 'stressed', 'panic'],
    crisis: ['suicide', 'self-harm', 'end it all']
  };

  for (const [tone, keywords] of Object.entries(toneIndicators)) {
    if (keywords.some(word => latestMessage.toLowerCase().includes(word))) {
      return tone;
    }
  }

  const score = positiveWords.filter(w => latestMessage.includes(w)).length -
               negativeWords.filter(w => latestMessage.includes(w)).length;

  return score >= 0 ? 'neutral/positive' : 'negative';
};

// System prompt with dynamic tone adaptation
const BASE_PROMPT = (tone) => `
You are CompanionAI - an emotional support assistant. Current user tone: ${tone}.

**Response Rules**
1. FIRST validate ("This sounds...")
2. THEN normalize ("Many feel...")
3. FINALLY empower ("What would help...")

**Safety Protocols**
${tone === 'crisis' ? '!! RED FLAG - DIRECT TO CRISIS RESOURCES !!' : ''}
- Crisis: "Please contact 988 immediately"
- Medical: "I can't replace doctors"
- Abuse: "Let's find professional support"

**Style Guide**
- Use ${tone === 'angry' ? 'calming' : 'supportive'} metaphors
- Max 2 questions per response
- Avoid advice, only suggest options
`;

const SAFETY_FILTERS = {
  patterns: [
    /suicid(e|al)/i,
    /self[\s-]?harm/i,
    /cutting|burning/i,
    /overdose/i,
    /kill\s(my)?self/i,
    /(end\s?it\s?all)/i
  ],
  response: "I'm deeply concerned. Please contact the 24/7 Suicide & Crisis Lifeline at 988 or visit 988lifeline.org immediately."
};

export async function POST(req) {
  try {
    // Rate limiting
    const identifier = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success } = await ratelimit.limit(identifier);
    
    if (!success) {
      return new Response(JSON.stringify({
        error: "Rate limit exceeded. Please wait a minute."
      }), { 
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    const { messages } = await req.json();
    
    // Analyze emotional tone
    const tone = analyzeTone(messages);
    const systemPrompt = BASE_PROMPT(tone);

    // Build message chain
    const fullMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-4) // Keep last 4 messages for context
    ];

    // Generate response
    const completion = await groq.chat.completions.create({
      messages: fullMessages,
      model: "llama3-70b-8192",
      temperature: tone === 'crisis' ? 0.3 : 0.7,
      max_tokens: tone === 'crisis' ? 150 : 256,
      top_p: 0.85,
      frequency_penalty: 0.4
    });

    let responseText = completion.choices[0].message.content;

    // Apply safety filters
    const isUnsafe = SAFETY_FILTERS.patterns.some(pattern => 
      pattern.test(responseText) || pattern.test(messages[messages.length-1]?.content)
    );

    if (isUnsafe) {
      responseText = SAFETY_FILTERS.response;
    }

    // Calculate typing simulation
    const wordCount = responseText.split(/\s+/).length;
    const typingDelay = Math.min(3000, Math.max(800, wordCount * 60));

    return new Response(JSON.stringify({
      result: responseText,
      meta: {
        tone,
        safety_triggered: isUnsafe,
        typing_delay: typingDelay,
        model: "llama3-70b-8192"
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST'
      }
    });

  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({
      error: "Connection error. Please try again.",
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
