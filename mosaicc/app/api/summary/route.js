// app/api/summarize/route.js
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export async function POST(request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const completion = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: `Summarize this text well under 20 words: ${text}`
      }],
      model: "mixtral-8x7b-32768"
    });

    return new Response(JSON.stringify({
      summary: completion.choices[0]?.message?.content || 'No summary generated'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Groq API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate summary' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}