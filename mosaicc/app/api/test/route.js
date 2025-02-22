import { Redis } from '@upstash/redis';

export async function GET() {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    await redis.set('test', 'OK');
    const value = await redis.get('test');
    return Response.json({ status: 'Connected!', value });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
