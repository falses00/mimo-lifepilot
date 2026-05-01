import { FastifyInstance } from 'fastify';

const startTime = Date.now();

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/api/health', async () => {
    const requestStart = Date.now();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        launchguard: 'available',
        repolens: 'available',
        dataforge: 'available',
        specpilot: 'available',
        incidentlab: 'available',
        knowledgebase: 'available',
      },
      meta: {
        durationMs: Date.now() - requestStart,
        mode: process.env.SUPABASE_URL ? 'supabase' : 'local',
      },
    };
  });
}